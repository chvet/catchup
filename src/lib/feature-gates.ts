// Feature Gates — Définition des plans et vérification des accès
// Les quotas sont vérifiés en temps réel via usageStructure

// ═══ FEATURES ═══

export type Feature =
  | 'chat_ia'
  | 'file_active'
  | 'qr_code'
  | 'quiz'
  | 'prise_en_charge'
  | 'messagerie'
  | 'visio'
  | 'calendrier'
  | 'campagnes'
  | 'assistant_ia'
  | 'export'
  | 'api_externe'
  | 'prompt_personnalise'
  | 'branding_logo'
  | 'multi_structure'

export type PlanId = 'free' | 'starter' | 'pro' | 'premium'

// ═══ QUOTAS ═══

export type QuotaKey =
  | 'beneficiaires'
  | 'conseillers'
  | 'conversations_ia'
  | 'sms'
  | 'file_active'
  | 'campagnes'

// ═══ DÉFINITION DES PLANS ═══

export interface PlanDefinition {
  id: PlanId
  label: string
  prixMensuel: number | null  // null = gratuit
  features: Feature[]
  quotas: Record<QuotaKey, number>  // -1 = illimité
}

// Toutes les features sont disponibles dans tous les plans
// Seuls les quotas différencient les plans
const ALL_FEATURES: Feature[] = [
  'chat_ia', 'file_active', 'qr_code', 'quiz', 'prise_en_charge',
  'messagerie', 'visio', 'calendrier', 'campagnes',
  'assistant_ia', 'export', 'prompt_personnalise', 'branding_logo',
  'api_externe', 'multi_structure',
]

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    label: 'Gratuit',
    prixMensuel: null,
    features: ALL_FEATURES,
    quotas: {
      beneficiaires: 5,
      conseillers: 1,
      conversations_ia: 50,
      sms: 20,
      file_active: 10,
      campagnes: 1,
    },
  },
  starter: {
    id: 'starter',
    label: 'Starter',
    prixMensuel: 29,
    features: ALL_FEATURES,
    quotas: {
      beneficiaires: 30,
      conseillers: 5,
      conversations_ia: 500,
      sms: 200,
      file_active: 50,
      campagnes: 3,
    },
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    prixMensuel: 79,
    features: ALL_FEATURES,
    quotas: {
      beneficiaires: -1,
      conseillers: 15,
      conversations_ia: -1,
      sms: 1000,
      file_active: -1,
      campagnes: 10,
    },
  },
  premium: {
    id: 'premium',
    label: 'Premium',
    prixMensuel: 199,
    features: ALL_FEATURES,
    quotas: {
      beneficiaires: -1,
      conseillers: -1,
      conversations_ia: -1,
      sms: -1,
      file_active: -1,
      campagnes: -1,
    },
  },
}

// ═══ HELPERS ═══

/** Vérifie si un plan a accès à une feature */
export function planHasFeature(plan: PlanId, feature: Feature): boolean {
  return PLANS[plan]?.features.includes(feature) ?? false
}

/** Récupère la limite d'un quota pour un plan (-1 = illimité) */
export function getPlanQuota(plan: PlanId, quota: QuotaKey): number {
  return PLANS[plan]?.quotas[quota] ?? 0
}

/** Vérifie si un quota est dépassé */
export function isQuotaExceeded(plan: PlanId, quota: QuotaKey, currentUsage: number): boolean {
  const limit = getPlanQuota(plan, quota)
  if (limit === -1) return false  // illimité
  return currentUsage >= limit
}

/** Retourne le % d'utilisation d'un quota (0-100, cap à 100) */
export function getQuotaUsagePercent(plan: PlanId, quota: QuotaKey, currentUsage: number): number {
  const limit = getPlanQuota(plan, quota)
  if (limit === -1) return 0
  if (limit === 0) return 100
  return Math.min(100, Math.round((currentUsage / limit) * 100))
}

/** Retourne le plan minimum requis pour une feature */
export function getMinimumPlanForFeature(feature: Feature): PlanId {
  const order: PlanId[] = ['free', 'starter', 'pro', 'premium']
  for (const plan of order) {
    if (PLANS[plan].features.includes(feature)) return plan
  }
  return 'premium'
}

/** Liste des plans dans l'ordre croissant */
export const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'premium']

/** Vérifie si plan A est supérieur ou égal à plan B */
export function isPlanAtLeast(current: PlanId, required: PlanId): boolean {
  return PLAN_ORDER.indexOf(current) >= PLAN_ORDER.indexOf(required)
}
