// Quota & Feature Check — Middleware pour les routes API
// Vérifie les droits d'accès en fonction du plan de la structure

import { db } from '@/data/db'
import { abonnement, usageStructure, priseEnCharge, conseiller, campagne } from '@/data/schema'
import { eq, and, sql } from 'drizzle-orm'
import {
  type Feature, type QuotaKey, type PlanId,
  planHasFeature, getPlanQuota, isQuotaExceeded, getMinimumPlanForFeature,
  PLANS,
} from './feature-gates'

// ═══ PLAN RESOLUTION ═══

/** Cache en mémoire pour éviter un SELECT à chaque requête (TTL 60s) */
const planCache = new Map<string, { plan: PlanId; fetchedAt: number }>()
const CACHE_TTL = 60_000

/** Récupère le plan actif d'une structure */
export async function getStructurePlan(structureId: string): Promise<PlanId> {
  const cached = planCache.get(structureId)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached.plan

  try {
    const rows = await db
      .select({ plan: abonnement.plan })
      .from(abonnement)
      .where(and(
        eq(abonnement.structureId, structureId),
        sql`${abonnement.statut} IN ('actif', 'trial')`
      ))
      .limit(1)

    const plan = (rows[0]?.plan as PlanId) || 'free'
    planCache.set(structureId, { plan, fetchedAt: Date.now() })
    return plan
  } catch {
    return 'free'
  }
}

/** Invalide le cache pour une structure (après changement de plan) */
export function invalidatePlanCache(structureId?: string): void {
  if (structureId) {
    planCache.delete(structureId)
  } else {
    planCache.clear()
  }
}

// ═══ FEATURE CHECK ═══

export interface FeatureCheckResult {
  allowed: boolean
  plan: PlanId
  requiredPlan?: PlanId
  message?: string
}

/** Vérifie si la structure a accès à une feature */
export async function checkFeature(structureId: string, feature: Feature): Promise<FeatureCheckResult> {
  const plan = await getStructurePlan(structureId)

  if (planHasFeature(plan, feature)) {
    return { allowed: true, plan }
  }

  const requiredPlan = getMinimumPlanForFeature(feature)
  return {
    allowed: false,
    plan,
    requiredPlan,
    message: `Cette fonctionnalite est reservee au plan ${PLANS[requiredPlan].label}. Votre plan actuel : ${PLANS[plan].label}.`,
  }
}

// ═══ QUOTA CHECK ═══

export interface QuotaCheckResult {
  allowed: boolean
  plan: PlanId
  quota: QuotaKey
  current: number
  limit: number
  percent: number
  message?: string
}

/** Récupère l'usage courant d'un quota pour une structure */
async function getCurrentUsage(structureId: string, quota: QuotaKey): Promise<number> {
  const mois = new Date().toISOString().slice(0, 7) // YYYY-MM

  try {
    switch (quota) {
      case 'conversations_ia': {
        const rows = await db.select({ v: usageStructure.conversationsIa }).from(usageStructure)
          .where(and(eq(usageStructure.structureId, structureId), eq(usageStructure.mois, mois)))
        return rows[0]?.v ?? 0
      }
      case 'sms': {
        const rows = await db.select({ v: usageStructure.smsEnvoyes }).from(usageStructure)
          .where(and(eq(usageStructure.structureId, structureId), eq(usageStructure.mois, mois)))
        return rows[0]?.v ?? 0
      }
      case 'beneficiaires': {
        const rows = await db.select({ v: usageStructure.beneficiairesActifs }).from(usageStructure)
          .where(and(eq(usageStructure.structureId, structureId), eq(usageStructure.mois, mois)))
        return rows[0]?.v ?? 0
      }
      case 'conseillers': {
        const rows = await db.select({ count: sql<number>`COUNT(*)` }).from(conseiller)
          .where(and(eq(conseiller.structureId, structureId), eq(conseiller.actif, 1)))
        return rows[0]?.count ?? 0
      }
      case 'file_active': {
        const rows = await db.select({ count: sql<number>`COUNT(*)` }).from(priseEnCharge)
          .where(and(
            eq(priseEnCharge.structureId, structureId),
            sql`${priseEnCharge.statut} NOT IN ('terminee', 'annulee', 'abandonnee')`
          ))
        return rows[0]?.count ?? 0
      }
      case 'campagnes': {
        const rows = await db.select({ count: sql<number>`COUNT(*)` }).from(campagne)
          .where(and(
            eq(campagne.structureId, structureId),
            sql`${campagne.statut} != 'archivee'`
          ))
        return rows[0]?.count ?? 0
      }
      default:
        return 0
    }
  } catch {
    return 0
  }
}

/** Vérifie si un quota est dépassé pour une structure */
export async function checkQuota(structureId: string, quota: QuotaKey): Promise<QuotaCheckResult> {
  const plan = await getStructurePlan(structureId)
  const current = await getCurrentUsage(structureId, quota)
  const limit = getPlanQuota(plan, quota)
  const percent = limit === -1 ? 0 : limit === 0 ? 100 : Math.min(100, Math.round((current / limit) * 100))
  const exceeded = isQuotaExceeded(plan, quota, current)

  return {
    allowed: !exceeded,
    plan,
    quota,
    current,
    limit,
    percent,
    message: exceeded
      ? `Limite atteinte : ${current}/${limit === -1 ? '∞' : limit}. Passez au plan superieur pour continuer.`
      : undefined,
  }
}

/** Récupère tous les quotas d'une structure d'un coup (pour la page paramètres) */
export async function getAllQuotas(structureId: string): Promise<Record<QuotaKey, { current: number; limit: number; percent: number }>> {
  const plan = await getStructurePlan(structureId)
  const quotaKeys: QuotaKey[] = ['beneficiaires', 'conseillers', 'conversations_ia', 'sms', 'file_active', 'campagnes']

  const result: Record<string, { current: number; limit: number; percent: number }> = {}
  for (const key of quotaKeys) {
    const current = await getCurrentUsage(structureId, key)
    const limit = getPlanQuota(plan, key)
    result[key] = {
      current,
      limit,
      percent: limit === -1 ? 0 : limit === 0 ? 100 : Math.min(100, Math.round((current / limit) * 100)),
    }
  }
  return result as Record<QuotaKey, { current: number; limit: number; percent: number }>
}
