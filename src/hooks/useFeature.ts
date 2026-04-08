// Hook frontend pour le feature gating
// Lit le plan de la structure depuis le contexte conseiller

import { useConseiller } from '@/components/conseiller/ConseillerProvider'
import { planHasFeature, getPlanQuota, getMinimumPlanForFeature, PLANS, type Feature, type PlanId, type QuotaKey } from '@/lib/feature-gates'

/** Vérifie si la structure du conseiller a accès à une feature */
export function useFeature(feature: Feature): {
  allowed: boolean
  plan: PlanId
  requiredPlan: PlanId
  requiredPlanLabel: string
} {
  const conseiller = useConseiller()
  const plan = (conseiller?.plan as PlanId) || 'free'
  const allowed = planHasFeature(plan, feature)
  const requiredPlan = getMinimumPlanForFeature(feature)

  return {
    allowed,
    plan,
    requiredPlan,
    requiredPlanLabel: PLANS[requiredPlan].label,
  }
}

/** Récupère la limite d'un quota pour le plan actuel */
export function useQuotaLimit(quota: QuotaKey): number {
  const conseiller = useConseiller()
  const plan = (conseiller?.plan as PlanId) || 'free'
  return getPlanQuota(plan, quota)
}

/** Récupère le plan actuel */
export function usePlan(): { plan: PlanId; label: string; prixMensuel: number | null } {
  const conseiller = useConseiller()
  const planId = (conseiller?.plan as PlanId) || 'free'
  const planDef = PLANS[planId]
  return { plan: planId, label: planDef.label, prixMensuel: planDef.prixMensuel }
}
