// POST + GET /api/conseiller/file-active/[id]/tiers
// Gestion des tiers intervenants pour un accompagnement

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logJournal } from '@/lib/journal'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { tiersIntervenant, demandeConsentement, priseEnCharge } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await getConseillerFromHeaders()
    const body = await request.json()
    const { nom, prenom, telephone, role } = body

    // Validation des champs
    if (!nom || !prenom || !telephone || !role) {
      return jsonError('Tous les champs sont requis (nom, prenom, telephone, role)', 400)
    }

    // Vérifier que la prise en charge existe et est active
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(and(
        eq(priseEnCharge.referralId, id),
        eq(priseEnCharge.statut, 'prise_en_charge')
      ))

    if (pecs.length === 0) {
      return jsonError('Prise en charge introuvable ou non active', 404)
    }

    const pec = pecs[0]
    const now = new Date().toISOString()
    const tiersId = uuidv4()
    const consentementId = uuidv4()

    // Créer le tiers intervenant
    await db.insert(tiersIntervenant).values({
      id: tiersId,
      priseEnChargeId: pec.id,
      nom: nom.trim(),
      prenom: prenom.trim(),
      telephone: telephone.trim(),
      role,
      inviteParId: ctx.id,
      statut: 'en_attente',
      creeLe: now,
      misAJourLe: now,
    })

    // Créer la demande de consentement (conseiller auto-approuve car c'est lui qui invite)
    await db.insert(demandeConsentement).values({
      id: consentementId,
      priseEnChargeId: pec.id,
      tiersId,
      demandeurId: ctx.id,
      statut: 'en_attente',
      conseillerApprouve: 1,
      conseillerApproveLe: now,
      beneficiaireApprouve: 0,
      creeLe: now,
      misAJourLe: now,
    })

    // Journal
    await logJournal(
      pec.id,
      'tiers_invite',
      'conseiller',
      ctx.id,
      `Invitation de ${prenom} ${nom} (${role})`,
      { cibleType: 'tiers', cibleId: tiersId, details: { role, telephone } }
    )

    // Audit
    await logAudit(ctx.id, 'invite_tiers', 'tiers', tiersId, { role, referralId: id })

    return jsonSuccess({ tiersId, consentementId }, 201)
  } catch (error) {
    console.error('[Tiers POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    await getConseillerFromHeaders()

    // Trouver la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))

    if (pecs.length === 0) {
      return jsonSuccess({ tiers: [] })
    }

    const pec = pecs[0]

    // Récupérer tous les tiers
    const tiersList = await db
      .select()
      .from(tiersIntervenant)
      .where(eq(tiersIntervenant.priseEnChargeId, pec.id))

    // Pour chaque tiers en attente, ajouter la demande de consentement
    const tiersAvecConsentement = await Promise.all(
      tiersList.map(async (t) => {
        if (t.statut === 'en_attente') {
          const consentements = await db
            .select()
            .from(demandeConsentement)
            .where(and(
              eq(demandeConsentement.tiersId, t.id),
              eq(demandeConsentement.statut, 'en_attente')
            ))

          return {
            ...t,
            consentement: consentements.length > 0 ? consentements[0] : null,
          }
        }
        return { ...t, consentement: null }
      })
    )

    return jsonSuccess({ tiers: tiersAvecConsentement })
  } catch (error) {
    console.error('[Tiers GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}
