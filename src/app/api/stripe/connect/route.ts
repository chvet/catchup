// POST + GET /api/stripe/connect
// Onboarding Stripe Connect pour les structures privées

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { stripeCompteStructure, structure } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { createConnectAccount, getConnectAccountStatus } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'admin_structure')) return jsonError('Acces refuse', 403)
    if (!ctx.structureId) return jsonError('Structure manquante', 400)

    // Vérifier que la structure est privée
    const structures = await db.select().from(structure).where(eq(structure.id, ctx.structureId))
    if (structures.length === 0) return jsonError('Structure non trouvee', 404)
    if (structures[0].visibilite !== 'privee') {
      return jsonError('Stripe Connect est reserve aux structures privees', 400)
    }

    // Vérifier si un compte existe déjà
    const existing = await db.select().from(stripeCompteStructure)
      .where(eq(stripeCompteStructure.structureId, ctx.structureId))
    if (existing.length > 0) {
      return jsonError('Un compte Stripe est deja associe a cette structure', 409)
    }

    const { origin } = new URL(request.url)
    const returnUrl = `${origin}/conseiller/structures/${ctx.structureId}?stripe=success`
    const refreshUrl = `${origin}/conseiller/structures/${ctx.structureId}?stripe=refresh`

    const { accountId, onboardingUrl } = await createConnectAccount(
      ctx.structureId,
      structures[0].nom,
      returnUrl,
      refreshUrl,
    )

    const now = new Date().toISOString()
    await db.insert(stripeCompteStructure).values({
      id: uuidv4(),
      structureId: ctx.structureId,
      stripeAccountId: accountId,
      statut: 'en_cours',
      chargesActives: 0,
      detailsComplets: 0,
      creeLe: now,
      misAJourLe: now,
    })

    await logAudit(ctx.id, 'create_stripe_connect', 'stripe_compte_structure', ctx.structureId)

    return jsonSuccess({ onboardingUrl })
  } catch (error) {
    console.error('[Stripe Connect POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function GET(_request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.structureId) return jsonError('Structure manquante', 400)

    const comptes = await db.select().from(stripeCompteStructure)
      .where(eq(stripeCompteStructure.structureId, ctx.structureId))

    if (comptes.length === 0) {
      return jsonSuccess({ connected: false })
    }

    const compte = comptes[0]

    // Vérifier le statut en temps réel chez Stripe
    try {
      const status = await getConnectAccountStatus(compte.stripeAccountId)
      const now = new Date().toISOString()
      const newStatut = status.chargesEnabled ? 'actif' : 'en_cours'

      if (newStatut !== compte.statut || status.chargesEnabled !== !!compte.chargesActives) {
        await db.update(stripeCompteStructure).set({
          statut: newStatut,
          chargesActives: status.chargesEnabled ? 1 : 0,
          detailsComplets: status.detailsSubmitted ? 1 : 0,
          misAJourLe: now,
        }).where(eq(stripeCompteStructure.id, compte.id))
      }

      return jsonSuccess({
        connected: true,
        statut: newStatut,
        chargesEnabled: status.chargesEnabled,
        detailsSubmitted: status.detailsSubmitted,
        payoutsEnabled: status.payoutsEnabled,
      })
    } catch {
      return jsonSuccess({
        connected: true,
        statut: compte.statut,
        chargesEnabled: !!compte.chargesActives,
        detailsSubmitted: !!compte.detailsComplets,
      })
    }
  } catch (error) {
    console.error('[Stripe Connect GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}
