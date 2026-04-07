// GET + PATCH + DELETE /api/conseiller/admin/abonnements/[id]
// Detail, modification et resiliation d'un abonnement

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { abonnement } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { cancelBillingSubscription } from '@/lib/stripe'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'super_admin')) return jsonError('Acces refuse', 403)
    const { id } = await params

    const rows = await db.select().from(abonnement).where(eq(abonnement.id, id))
    if (rows.length === 0) return jsonError('Abonnement non trouve', 404)

    return jsonSuccess({ abonnement: rows[0] })
  } catch (error) {
    console.error('[Abonnement GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'super_admin')) return jsonError('Acces refuse', 403)
    const { id } = await params

    const existing = await db.select().from(abonnement).where(eq(abonnement.id, id))
    if (existing.length === 0) return jsonError('Abonnement non trouve', 404)

    const body = await request.json()
    const allowedFields = [
      'plan', 'montantMensuelHtCentimes', 'limiteConseillers', 'limiteBeneficiaires',
      'limiteConversations', 'limiteSms', 'prixDepassementConversation', 'prixDepassementSms',
      'statut', 'periodeEssai',
    ]
    const updateData: Record<string, unknown> = { misAJourLe: new Date().toISOString() }
    for (const f of allowedFields) {
      if (body[f] !== undefined) updateData[f] = body[f]
    }

    await db.update(abonnement).set(updateData).where(eq(abonnement.id, id))
    await logAudit(ctx.id, 'update_abonnement', 'abonnement', id)

    const updated = await db.select().from(abonnement).where(eq(abonnement.id, id))
    return jsonSuccess({ abonnement: updated[0] })
  } catch (error) {
    console.error('[Abonnement PATCH]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'super_admin')) return jsonError('Acces refuse', 403)
    const { id } = await params

    const existing = await db.select().from(abonnement).where(eq(abonnement.id, id))
    if (existing.length === 0) return jsonError('Abonnement non trouve', 404)

    // Annuler sur Stripe si actif
    if (existing[0].stripeSubscriptionId) {
      try { await cancelBillingSubscription(existing[0].stripeSubscriptionId) } catch { /* ignore */ }
    }

    const now = new Date().toISOString()
    await db.update(abonnement).set({ statut: 'resiliee', dateFin: now, misAJourLe: now }).where(eq(abonnement.id, id))
    await logAudit(ctx.id, 'cancel_abonnement', 'abonnement', id)

    return jsonSuccess({ message: 'Abonnement resilie' })
  } catch (error) {
    console.error('[Abonnement DELETE]', error)
    return jsonError('Erreur serveur', 500)
  }
}
