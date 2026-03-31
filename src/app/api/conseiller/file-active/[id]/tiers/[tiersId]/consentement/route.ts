// PATCH /api/conseiller/file-active/[id]/tiers/[tiersId]/consentement
// Approbation/refus du consentement par le conseiller (edge case / usage futur)

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logJournal } from '@/lib/journal'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { demandeConsentement, tiersIntervenant, participantConversation, priseEnCharge, codeVerification } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; tiersId: string }> }
) {
  try {
    const { id, tiersId } = await params
    const ctx = await getConseillerFromHeaders()
    const body = await request.json()
    const { action } = body

    if (!action || !['approuver', 'refuser'].includes(action)) {
      return jsonError('Action invalide (approuver | refuser)', 400)
    }

    // Trouver la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))

    if (pecs.length === 0) {
      return jsonError('Prise en charge introuvable', 404)
    }

    const pec = pecs[0]

    // Trouver la demande de consentement en attente pour ce tiers
    const consentements = await db
      .select()
      .from(demandeConsentement)
      .where(and(
        eq(demandeConsentement.tiersId, tiersId),
        eq(demandeConsentement.priseEnChargeId, pec.id),
        eq(demandeConsentement.statut, 'en_attente')
      ))

    if (consentements.length === 0) {
      return jsonError('Demande de consentement introuvable', 404)
    }

    const consent = consentements[0]
    const now = new Date().toISOString()

    if (action === 'refuser') {
      // Refuser
      await db.update(demandeConsentement)
        .set({ conseillerApprouve: 0, conseillerApproveLe: now, statut: 'refusee', misAJourLe: now })
        .where(eq(demandeConsentement.id, consent.id))

      await db.update(tiersIntervenant)
        .set({ statut: 'refuse', misAJourLe: now })
        .where(eq(tiersIntervenant.id, tiersId))

      await logJournal(pec.id, 'consentement_refuse', 'conseiller', ctx.id, `Consentement refusé par le conseiller`, {
        cibleType: 'tiers', cibleId: tiersId,
      })

      return jsonSuccess({ approved: false })
    }

    // Approuver
    await db.update(demandeConsentement)
      .set({ conseillerApprouve: 1, conseillerApproveLe: now, misAJourLe: now })
      .where(eq(demandeConsentement.id, consent.id))

    // Vérifier si les deux parties ont approuvé
    if (consent.beneficiaireApprouve === 1) {
      // Les deux ont approuvé → activer le tiers
      await db.update(demandeConsentement)
        .set({ statut: 'approuvee', misAJourLe: now })
        .where(eq(demandeConsentement.id, consent.id))

      await db.update(tiersIntervenant)
        .set({ statut: 'approuve', misAJourLe: now })
        .where(eq(tiersIntervenant.id, tiersId))

      // Créer le participant conversation
      await db.insert(participantConversation).values({
        id: uuidv4(),
        priseEnChargeId: pec.id,
        participantType: 'tiers',
        participantId: tiersId,
        actif: 1,
        rejoindLe: now,
      })

      // Générer un code PIN pour le tiers
      const randomBytes = new Uint32Array(1)
      crypto.getRandomValues(randomBytes)
      const pin = String(100000 + (randomBytes[0] % 900000))
      const expireLe = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 jours

      await db.insert(codeVerification).values({
        id: uuidv4(),
        referralId: pec.referralId,
        utilisateurId: tiersId,
        code: pin,
        expireLe,
        creeLe: now,
      })

      await logJournal(pec.id, 'consentement_accepte', 'conseiller', ctx.id, `Consentement mutuel validé — tiers activé`, {
        cibleType: 'tiers', cibleId: tiersId,
      })

      // Récupérer le téléphone du tiers
      const tiersRows = await db.select().from(tiersIntervenant).where(eq(tiersIntervenant.id, tiersId))
      const telephone = tiersRows.length > 0 ? tiersRows[0].telephone : null

      return jsonSuccess({ approved: true, code: pin, telephone })
    }

    // Seulement le conseiller a approuvé pour l'instant
    await logAudit(ctx.id, 'approve_consent', 'tiers', tiersId)

    return jsonSuccess({ approved: false, waitingFor: 'beneficiaire' })
  } catch (error) {
    console.error('[Consentement Conseiller PATCH]', error)
    return jsonError('Erreur serveur', 500)
  }
}
