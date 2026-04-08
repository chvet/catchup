'use client'

import { useFeature } from '@/hooks/useFeature'
import { type Feature } from '@/lib/feature-gates'
import Link from 'next/link'

interface FeatureGateProps {
  feature: Feature
  children: React.ReactNode
  fallback?: React.ReactNode  // custom fallback (si null, affiche l'upsell par défaut)
  hideCompletely?: boolean    // si true, ne rend rien quand bloqué (pas d'upsell)
}

/**
 * Wrapper conditionnel : affiche les children si la feature est autorisée,
 * sinon affiche un message d'upsell.
 */
export default function FeatureGate({ feature, children, fallback, hideCompletely }: FeatureGateProps) {
  const { allowed, requiredPlanLabel } = useFeature(feature)

  if (allowed) return <>{children}</>

  if (hideCompletely) return null

  if (fallback) return <>{fallback}</>

  return (
    <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
      <p className="text-3xl mb-3">🔒</p>
      <p className="text-sm text-gray-600 font-medium">
        Fonctionnalite reservee au plan {requiredPlanLabel}
      </p>
      <p className="text-xs text-gray-400 mt-1 mb-4">
        Passez au plan superieur pour debloquer cette fonctionnalite.
      </p>
      <Link
        href="/conseiller/abonnement"
        className="inline-flex px-4 py-2 bg-catchup-primary text-white text-sm font-medium rounded-lg hover:bg-catchup-primary/90 transition-colors"
      >
        Voir les plans
      </Link>
    </div>
  )
}

/**
 * Badge plan pour la sidebar — affiche le plan actuel
 */
export function PlanBadge() {
  const { plan, label } = usePlanInfo()

  const colors: Record<string, string> = {
    free: 'bg-gray-100 text-gray-600',
    starter: 'bg-blue-100 text-blue-700',
    pro: 'bg-purple-100 text-purple-700',
    premium: 'bg-amber-100 text-amber-700',
  }

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${colors[plan] || colors.free}`}>
      {label}
    </span>
  )
}

function usePlanInfo() {
  const { plan, requiredPlanLabel } = useFeature('chat_ia') // chat_ia is in all plans, just to get current plan
  const labels: Record<string, string> = { free: 'Gratuit', starter: 'Starter', pro: 'Pro', premium: 'Premium' }
  return { plan, label: labels[plan] || 'Gratuit' }
}
