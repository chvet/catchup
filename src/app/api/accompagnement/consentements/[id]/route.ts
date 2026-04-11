// PATCH /api/accompagnement/consentements/[id]
// Approbation/refus du consentement par le bénéficiaire

import { getBeneficiaireFromToken } from '@/lib/accompagnement-helpers'
import { logJournal } from '@/lib/journal'
import { db } from '@/data/db'
import { demandeConsentement, tiersIntervenant, participantConversation, codeVerification } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { sendPinCode } from '@/lib/sms'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await getBeneficiaireFromToken(request)
    if (!auth) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (!action || !['approuver', 'refuser'].includes(action)) {
      return Response.json({ error: 'Action invalide (approuver | refuser)' }, { status: 400 })
    }

    // Trouver la demande de consentement
    const consentements = await db
      .select()
      .from(demandeConsentement)
      .where(eq(demandeConsentement.id, id))

    if (consentements.length === 0) {
      return Response.json({ error: 'Demande de consentement introuvable' }, { status: 404 })
    }

    const consent = consentements[0]

    // Vérifier que cette demande appartient bien à la prise en charge du bénéficiaire
    if (consent.priseEnChargeId !== auth.priseEnChargeId) {
      return Response.json({ error: 'Non autorisé' }, { status: 403 })
    }

    if (consent.statut !== 'en_attente') {
      return Response.json({ error: 'Cette demande a déjà été traitée' }, { status: 409 })
    }

    const now = new Date().toISOString()

    if (action === 'refuser') {
      // Refuser
      await db.update(demandeConsentement)
        .set({
          beneficiaireApprouve: 0,
          beneficiaireApproveLe: now,
          statut: 'refusee',
          misAJourLe: now,
        })
        .where(eq(demandeConsentement.id, id))

      await db.update(tiersIntervenant)
        .set({ statut: 'refuse', misAJourLe: now })
        .where(eq(tiersIntervenant.id, consent.tiersId))

      await logJournal(
        auth.priseEnChargeId,
        'consentement_refuse',
        'beneficiaire',
        auth.utilisateurId,
        `Consentement refusé par le bénéficiaire`,
        { cibleType: 'tiers', cibleId: consent.tiersId }
      )

      return Response.json({ approved: false })
    }

    // Approuver
    await db.update(demandeConsentement)
      .set({
        beneficiaireApprouve: 1,
        beneficiaireApproveLe: now,
        misAJourLe: now,
      })
      .where(eq(demandeConsentement.id, id))

    // Vérifier si les deux parties ont approuvé
    if (consent.conseillerApprouve === 1) {
      // Double approbation → activer le tiers
      await db.update(demandeConsentement)
        .set({ statut: 'approuvee', misAJourLe: now })
        .where(eq(demandeConsentement.id, id))

      await db.update(tiersIntervenant)
        .set({ statut: 'approuve', misAJourLe: now })
        .where(eq(tiersIntervenant.id, consent.tiersId))

      // Créer le participant conversation
      await db.insert(participantConversation).values({
        id: uuidv4(),
        priseEnChargeId: auth.priseEnChargeId,
        participantType: 'tiers',
        participantId: consent.tiersId,
        actif: 1,
        rejoindLe: now,
      })

      // Générer un code PIN 6 chiffres pour le tiers
      const randomBytes = new Uint32Array(1)
      crypto.getRandomValues(randomBytes)
      const pin = String(100000 + (randomBytes[0] % 900000))
      const expireLe = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 jours

      await db.insert(codeVerification).values({
        id: uuidv4(),
        referralId: auth.referralId,
        utilisateurId: consent.tiersId,
        code: pin,
        expireLe,
        creeLe: now,
      })

      // Récupérer le téléphone du tiers
      const tiersRows = await db
        .select()
        .from(tiersIntervenant)
        .where(eq(tiersIntervenant.id, consent.tiersId))

      const telephone = tiersRows.length > 0 ? tiersRows[0].telephone : null

      // Envoyer le code par SMS/email au tiers
      if (telephone) {
        const notifResult = await sendPinCode(telephone, pin, { type: 'tiers' })
        console.log(`[PIN Tiers] Code envoyé à ${telephone} via ${notifResult.channel}`)
      }

      await logJournal(
        auth.priseEnChargeId,
        'consentement_accepte',
        'beneficiaire',
        auth.utilisateurId,
        `Consentement mutuel validé — tiers activé`,
        { cibleType: 'tiers', cibleId: consent.tiersId }
      )

      return Response.json({ approved: true, code: pin, telephone })
    }

    // Seulement le bénéficiaire a approuvé pour l'instant
    return Response.json({ approved: false, waitingFor: 'conseiller' })
  } catch (error) {
    console.error('[Consentement Beneficiaire PATCH]', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
