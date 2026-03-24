// GET /api/conseiller/dashboard/riasec
// Distribution RIASEC agrégée des bénéficiaires

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { profilRiasec, referral } from '@/data/schema'
import { eq, and, gte, sql, or } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    const url = new URL(request.url)

    const periodeJours = parseInt(url.searchParams.get('periode') || '30')
    const depuis = new Date(Date.now() - periodeJours * 24 * 60 * 60 * 1000).toISOString()

    const structureFilter = hasRole(ctx, 'super_admin')
      ? undefined
      : ctx.structureId
        ? or(
            eq(referral.structureSuggereId, ctx.structureId),
            sql`${referral.structureSuggereId} IS NULL`
          )
        : undefined

    const result = await db
      .select({
        moyR: sql<number>`COALESCE(AVG(${profilRiasec.r}), 0)`,
        moyI: sql<number>`COALESCE(AVG(${profilRiasec.i}), 0)`,
        moyA: sql<number>`COALESCE(AVG(${profilRiasec.a}), 0)`,
        moyS: sql<number>`COALESCE(AVG(${profilRiasec.s}), 0)`,
        moyE: sql<number>`COALESCE(AVG(${profilRiasec.e}), 0)`,
        moyC: sql<number>`COALESCE(AVG(${profilRiasec.c}), 0)`,
        total: sql<number>`COUNT(*)`,
      })
      .from(profilRiasec)
      .innerJoin(referral, eq(profilRiasec.utilisateurId, referral.utilisateurId))
      .where(and(
        gte(referral.creeLe, depuis),
        structureFilter
      ))

    const data = result[0]

    return jsonSuccess({
      distribution: [
        { dimension: 'R', label: 'Réaliste', score: Math.round(data?.moyR || 0) },
        { dimension: 'I', label: 'Investigateur', score: Math.round(data?.moyI || 0) },
        { dimension: 'A', label: 'Artiste', score: Math.round(data?.moyA || 0) },
        { dimension: 'S', label: 'Social', score: Math.round(data?.moyS || 0) },
        { dimension: 'E', label: 'Entreprenant', score: Math.round(data?.moyE || 0) },
        { dimension: 'C', label: 'Conventionnel', score: Math.round(data?.moyC || 0) },
      ],
      total: data?.total || 0,
    })
  } catch (error) {
    console.error('[Dashboard RIASEC]', error)
    return jsonError('Erreur serveur', 500)
  }
}
