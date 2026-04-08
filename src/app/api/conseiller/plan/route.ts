// GET  /api/conseiller/plan — Retourne le plan actif + quotas de la structure
// PUT  /api/conseiller/plan — Change le plan d'une structure (super_admin only)

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { getStructurePlan, getAllQuotas, invalidatePlanCache } from '@/lib/quota-check'
import { PLANS, type PlanId, getPlanQuota } from '@/lib/feature-gates'
import { db } from '@/data/db'
import { abonnement } from '@/data/schema'
import { eq, and, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.structureId) return jsonSuccess({ plan: 'free', quotas: {}, features: PLANS.free.features })

    const plan = await getStructurePlan(ctx.structureId)
    const quotas = await getAllQuotas(ctx.structureId)
    const planDef = PLANS[plan]

    return jsonSuccess({
      plan,
      label: planDef.label,
      prixMensuel: planDef.prixMensuel,
      features: planDef.features,
      quotas,
    })
  } catch (error) {
    console.error('[Plan GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function PUT(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'super_admin')) return jsonError('Acces reserve aux super administrateurs', 403)

    const body = await request.json()
    const { structureId, plan } = body

    if (!structureId || !plan) return jsonError('structureId et plan requis', 400)
    if (!PLANS[plan as PlanId]) return jsonError('Plan invalide', 400)

    const now = new Date().toISOString()

    // Chercher un abonnement existant
    const existing = await db.select({ id: abonnement.id }).from(abonnement)
      .where(and(eq(abonnement.structureId, structureId), sql`${abonnement.statut} IN ('actif', 'trial')`))

    const planDef = PLANS[plan as PlanId]
    const planValues = {
      plan,
      montantMensuelHtCentimes: planDef.prixMensuel ? planDef.prixMensuel * 100 : 0,
      limiteConseillers: getPlanQuota(plan as PlanId, 'conseillers') === -1 ? null : getPlanQuota(plan as PlanId, 'conseillers'),
      limiteBeneficiaires: getPlanQuota(plan as PlanId, 'beneficiaires'),
      limiteConversations: getPlanQuota(plan as PlanId, 'conversations_ia'),
      limiteSms: getPlanQuota(plan as PlanId, 'sms'),
      misAJourLe: now,
    }

    if (existing.length > 0) {
      await db.update(abonnement)
        .set(planValues)
        .where(eq(abonnement.id, existing[0].id))
    } else {
      await db.insert(abonnement).values({
        id: uuidv4(),
        structureId,
        ...planValues,
        dateDebut: now,
        statut: 'active',
        creeLe: now,
      })
    }

    invalidatePlanCache(structureId)

    return jsonSuccess({ plan, structureId })
  } catch (error) {
    console.error('[Plan PUT]', error)
    return jsonError('Erreur serveur', 500)
  }
}
