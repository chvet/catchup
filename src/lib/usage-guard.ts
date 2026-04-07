// Usage Guard — quotas par structure basés sur leur plan d'abonnement
// Cache in-memory avec lazy-load depuis la base

import { db } from '@/data/db'
import { abonnement, usageStructure } from '@/data/schema'
import { eq, and } from 'drizzle-orm'

// === TYPES ===

interface QuotaResult {
  allowed: boolean
  remaining: number
  limit: number
  used: number
  overageRate?: number // centimes par unité de dépassement
  message?: string
}

interface AbonnementCache {
  plan: string
  limiteConseillers: number | null
  limiteBeneficiaires: number
  limiteConversations: number
  limiteSms: number
  prixDepassementConversation: number
  prixDepassementSms: number
  statut: string
  fetchedAt: number
}

interface UsageCache {
  conversationsIa: number
  smsEnvoyes: number
  beneficiairesActifs: number
  conseillersActifs: number
  fetchedAt: number
}

// === CACHE ===

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const abonnementCache = new Map<string, AbonnementCache>()
const usageCache = new Map<string, UsageCache>() // key: structureId:YYYY-MM

// Compteurs in-memory pour les increments rapides
const conversationCounters = new Map<string, number>() // key: structureId:YYYY-MM
const smsCounters = new Map<string, number>()

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

function cacheKey(structureId: string): string {
  return `${structureId}:${getCurrentMonth()}`
}

// === LOOKUP ABONNEMENT ===

async function getAbonnement(structureId: string): Promise<AbonnementCache | null> {
  const cached = abonnementCache.get(structureId)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached

  const rows = await db.select().from(abonnement)
    .where(and(eq(abonnement.structureId, structureId), eq(abonnement.statut, 'active')))
    .limit(1)

  if (rows.length === 0) {
    abonnementCache.delete(structureId)
    return null
  }

  const a = rows[0]
  const entry: AbonnementCache = {
    plan: a.plan,
    limiteConseillers: a.limiteConseillers,
    limiteBeneficiaires: a.limiteBeneficiaires,
    limiteConversations: a.limiteConversations,
    limiteSms: a.limiteSms,
    prixDepassementConversation: a.prixDepassementConversation ?? 2,
    prixDepassementSms: a.prixDepassementSms ?? 8,
    statut: a.statut ?? 'active',
    fetchedAt: Date.now(),
  }
  abonnementCache.set(structureId, entry)
  return entry
}

// === LOOKUP USAGE ===

async function getUsage(structureId: string): Promise<UsageCache> {
  const key = cacheKey(structureId)
  const cached = usageCache.get(key)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) return cached

  const mois = getCurrentMonth()
  const rows = await db.select().from(usageStructure)
    .where(and(eq(usageStructure.structureId, structureId), eq(usageStructure.mois, mois)))
    .limit(1)

  const entry: UsageCache = {
    conversationsIa: rows[0]?.conversationsIa ?? 0,
    smsEnvoyes: rows[0]?.smsEnvoyes ?? 0,
    beneficiairesActifs: rows[0]?.beneficiairesActifs ?? 0,
    conseillersActifs: rows[0]?.conseillersActifs ?? 0,
    fetchedAt: Date.now(),
  }
  usageCache.set(key, entry)

  // Initialiser les compteurs in-memory si pas encore fait
  if (!conversationCounters.has(key)) conversationCounters.set(key, entry.conversationsIa)
  if (!smsCounters.has(key)) smsCounters.set(key, entry.smsEnvoyes)

  return entry
}

function getConversationCount(structureId: string): number {
  return conversationCounters.get(cacheKey(structureId)) ?? 0
}

function getSmsCount(structureId: string): number {
  return smsCounters.get(cacheKey(structureId)) ?? 0
}

// === QUOTA CHECKS ===

export async function checkConversationQuota(structureId: string): Promise<QuotaResult> {
  const abo = await getAbonnement(structureId)
  if (!abo) return { allowed: true, remaining: 999999, limit: 999999, used: 0 } // Pas d'abonnement = pas de limite

  if (abo.statut !== 'active') {
    return { allowed: false, remaining: 0, limit: 0, used: 0, message: 'Abonnement suspendu ou resilié' }
  }

  await getUsage(structureId) // initialise les compteurs
  const used = getConversationCount(structureId)
  const limit = abo.limiteConversations
  const remaining = Math.max(0, limit - used)

  // Autoriser avec dépassement facturé
  return {
    allowed: true,
    remaining,
    limit,
    used,
    overageRate: remaining <= 0 ? abo.prixDepassementConversation : undefined,
  }
}

export async function checkSmsQuota(structureId: string): Promise<QuotaResult> {
  const abo = await getAbonnement(structureId)
  if (!abo) return { allowed: true, remaining: 999999, limit: 999999, used: 0 }

  if (abo.statut !== 'active') {
    return { allowed: false, remaining: 0, limit: 0, used: 0, message: 'Abonnement suspendu' }
  }

  await getUsage(structureId)
  const used = getSmsCount(structureId)
  const limit = abo.limiteSms
  const remaining = Math.max(0, limit - used)

  return {
    allowed: true,
    remaining,
    limit,
    used,
    overageRate: remaining <= 0 ? abo.prixDepassementSms : undefined,
  }
}

// === INCREMENTS ===

export function incrementConversation(structureId: string): void {
  const key = cacheKey(structureId)
  conversationCounters.set(key, (conversationCounters.get(key) ?? 0) + 1)
}

export function incrementSms(structureId: string): void {
  const key = cacheKey(structureId)
  smsCounters.set(key, (smsCounters.get(key) ?? 0) + 1)
}

// === EXPORTS POUR DASHBOARD ===

export async function getStructureUsageSummary(structureId: string) {
  const abo = await getAbonnement(structureId)
  if (!abo) return null

  await getUsage(structureId)

  return {
    plan: abo.plan,
    statut: abo.statut,
    conversations: { used: getConversationCount(structureId), limit: abo.limiteConversations },
    sms: { used: getSmsCount(structureId), limit: abo.limiteSms },
    beneficiaires: { used: (await getUsage(structureId)).beneficiairesActifs, limit: abo.limiteBeneficiaires },
    conseillers: { used: (await getUsage(structureId)).conseillersActifs, limit: abo.limiteConseillers },
  }
}

// === PLAN LIMITS REFERENCE ===

export const PLAN_LIMITS = {
  starter: { conseillers: 3, beneficiaires: 100, conversations: 500, sms: 200, prixMensuelHt: 29000 },
  pro: { conseillers: 10, beneficiaires: 500, conversations: 3000, sms: 1500, prixMensuelHt: 69000 },
  premium: { conseillers: null, beneficiaires: 2000, conversations: 15000, sms: 8000, prixMensuelHt: 149000 },
  pay_per_outcome: { conseillers: 3, beneficiaires: 200, conversations: 1000, sms: 500, prixMensuelHt: 15000 },
} as const
