// GET /api/conseiller/file-active/[id]/activites/semaine — Résumé hebdomadaire

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { declarationActivite, objectifHebdomadaire, priseEnCharge } from '@/data/schema'
import { eq, and } from 'drizzle-orm'

function getMondayISO(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: referralId } = await params
    await getConseillerFromHeaders()

    const pecs = await db.select().from(priseEnCharge).where(eq(priseEnCharge.referralId, referralId))
    if (pecs.length === 0) return jsonError('Prise en charge non trouvée', 404)

    const { searchParams } = new URL(request.url)
    const semaine = searchParams.get('semaine') || getMondayISO(new Date())

    // Déclarations de la semaine
    const declarations = await db
      .select()
      .from(declarationActivite)
      .where(
        and(
          eq(declarationActivite.priseEnChargeId, pecs[0].id),
          eq(declarationActivite.dateSemaine, semaine)
        )
      )

    // Objectif de la semaine
    const objectifs = await db
      .select()
      .from(objectifHebdomadaire)
      .where(
        and(
          eq(objectifHebdomadaire.priseEnChargeId, pecs[0].id),
          eq(objectifHebdomadaire.semaine, semaine)
        )
      )

    const objectif = objectifs[0] || null

    // Agrégation par catégorie
    const parCategorie: Record<string, { totalMinutes: number; count: number; validees: number }> = {}
    let totalMinutes = 0
    let totalValidees = 0

    for (const d of declarations) {
      const cat = d.categorieCode
      if (!parCategorie[cat]) parCategorie[cat] = { totalMinutes: 0, count: 0, validees: 0 }
      parCategorie[cat].totalMinutes += d.dureeMinutes
      parCategorie[cat].count += 1
      totalMinutes += d.dureeMinutes
      if (d.statut === 'validee') {
        parCategorie[cat].validees += 1
        totalValidees += d.dureeMinutes
      }
    }

    return jsonSuccess({
      semaine,
      totalMinutes,
      totalHeures: Math.round(totalMinutes / 6) / 10, // arrondi 1 décimale
      totalValideesMinutes: totalValidees,
      totalValideesHeures: Math.round(totalValidees / 6) / 10,
      objectifHeures: objectif?.cibleHeures ?? 5,
      objectif,
      parCategorie,
      nbDeclarations: declarations.length,
    })
  } catch (error) {
    console.error('[Activites Semaine]', error)
    return jsonError('Erreur serveur', 500)
  }
}
