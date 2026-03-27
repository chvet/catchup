// GET /api/conseiller/satisfaction
// Liste les resultats de satisfaction pour les cas du conseiller
// Query params: ?from=, ?to=, ?structureId= (super_admin)

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { enqueteSatisfaction, priseEnCharge } from '@/data/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.id) return jsonError('Non autorise', 401)

    const url = new URL(request.url)
    const from = url.searchParams.get('from')
    const to = url.searchParams.get('to')
    const structureIdParam = url.searchParams.get('structureId')

    // Construire les conditions de filtre
    const conditions = []

    // Filtre par structure pour super_admin, sinon par conseiller
    if (hasRole(ctx, 'super_admin') && structureIdParam) {
      conditions.push(eq(priseEnCharge.structureId, structureIdParam))
    } else if (!hasRole(ctx, 'super_admin')) {
      conditions.push(eq(priseEnCharge.conseillerId, ctx.id))
    }

    if (from) {
      conditions.push(gte(enqueteSatisfaction.creeLe, from))
    }
    if (to) {
      conditions.push(lte(enqueteSatisfaction.creeLe, to))
    }

    // Joindre enquete_satisfaction avec prise_en_charge
    const results = await db
      .select({
        id: enqueteSatisfaction.id,
        priseEnChargeId: enqueteSatisfaction.priseEnChargeId,
        noteGlobale: enqueteSatisfaction.noteGlobale,
        noteEcoute: enqueteSatisfaction.noteEcoute,
        noteUtilite: enqueteSatisfaction.noteUtilite,
        noteConseiller: enqueteSatisfaction.noteConseiller,
        noteRecommandation: enqueteSatisfaction.noteRecommandation,
        pointsForts: enqueteSatisfaction.pointsForts,
        ameliorations: enqueteSatisfaction.ameliorations,
        completee: enqueteSatisfaction.completee,
        creeLe: enqueteSatisfaction.creeLe,
      })
      .from(enqueteSatisfaction)
      .innerJoin(priseEnCharge, eq(enqueteSatisfaction.priseEnChargeId, priseEnCharge.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`${enqueteSatisfaction.creeLe} DESC`)

    // Calculer les moyennes
    const completed = results.filter(r => r.completee === 1)
    const count = completed.length

    const avg = (arr: (number | null)[]): number | null => {
      const valid = arr.filter((v): v is number => v !== null && v !== undefined)
      if (valid.length === 0) return null
      return Math.round((valid.reduce((a, b) => a + b, 0) / valid.length) * 10) / 10
    }

    const moyennes = {
      noteGlobale: avg(completed.map(r => r.noteGlobale)),
      noteEcoute: avg(completed.map(r => r.noteEcoute)),
      noteUtilite: avg(completed.map(r => r.noteUtilite)),
      noteConseiller: avg(completed.map(r => r.noteConseiller)),
      nps: avg(completed.map(r => r.noteRecommandation)),
      totalReponses: count,
    }

    // NPS score calculation: % promoters (9-10) - % detractors (0-6)
    const npsScores = completed
      .map(r => r.noteRecommandation)
      .filter((v): v is number => v !== null && v !== undefined)

    let npsScore: number | null = null
    if (npsScores.length > 0) {
      const promoters = npsScores.filter(v => v >= 9).length
      const detractors = npsScores.filter(v => v <= 6).length
      npsScore = Math.round(((promoters - detractors) / npsScores.length) * 100)
    }

    return jsonSuccess({
      resultats: results,
      moyennes,
      npsScore,
    })
  } catch (error) {
    console.error('[Satisfaction conseiller GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}
