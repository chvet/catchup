// GET /api/conseiller/dashboard/usage — Stats de consommation tokens/coûts IA
// (visible uniquement par super_admin et admin_structure)

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { getUsageStats } from '@/lib/token-guard'

export async function GET() {
  try {
    const ctx = await getConseillerFromHeaders()

    // Seuls les admins peuvent voir les stats de consommation
    if (!hasRole(ctx, 'admin_structure')) {
      return jsonError('Accès non autorisé', 403)
    }

    const stats = getUsageStats()

    return jsonSuccess({
      ...stats,
      // Formater pour le dashboard
      todayCostFormatted: `$${stats.today.totalCostUsd.toFixed(4)}`,
      budgetRemainingFormatted: `$${stats.budgetRemainingUsd.toFixed(2)}`,
      alertLevel: stats.budgetUsedPercent >= 90
        ? 'critical'
        : stats.budgetUsedPercent >= 70
          ? 'warning'
          : 'ok',
    })
  } catch (error) {
    console.error('[Usage Stats]', error)
    return jsonError('Erreur serveur', 500)
  }
}
