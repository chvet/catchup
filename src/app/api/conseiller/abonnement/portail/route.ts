// POST /api/conseiller/abonnement/portail
// Retourne l'URL du portail Stripe Customer Portal

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { abonnement } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { getCustomerPortalUrl } from '@/lib/stripe'

export async function POST(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.structureId) return jsonError('Structure manquante', 400)

    const abos = await db.select().from(abonnement)
      .where(and(eq(abonnement.structureId, ctx.structureId), eq(abonnement.statut, 'active')))
      .limit(1)

    if (abos.length === 0 || !abos[0].stripeCustomerId) {
      return jsonError('Pas d\'abonnement Stripe actif', 400)
    }

    const { origin } = new URL(request.url)
    const returnUrl = `${origin}/conseiller/abonnement`

    const portalUrl = await getCustomerPortalUrl(abos[0].stripeCustomerId, returnUrl)

    return jsonSuccess({ url: portalUrl })
  } catch (error) {
    console.error('[Portail POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
