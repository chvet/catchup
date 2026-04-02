// GET/POST /api/conseiller/file-active/[id]/objectifs — Objectifs hebdomadaires

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { objectifHebdomadaire, priseEnCharge } from '@/data/schema'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

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

    const objectifs = await db
      .select()
      .from(objectifHebdomadaire)
      .where(eq(objectifHebdomadaire.priseEnChargeId, pecs[0].id))
      .orderBy(desc(objectifHebdomadaire.semaine))
      .limit(12)

    return jsonSuccess(objectifs)
  } catch (error) {
    console.error('[Objectifs GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: referralId } = await params
    await getConseillerFromHeaders()

    const pecs = await db.select().from(priseEnCharge).where(eq(priseEnCharge.referralId, referralId))
    if (pecs.length === 0) return jsonError('Prise en charge non trouvée', 404)

    const body = await request.json()
    const { cibleHeures, semaine, commentaire } = body

    if (!cibleHeures || cibleHeures < 0) {
      return jsonError('cibleHeures requis et positif', 400)
    }

    const targetSemaine = semaine || getMondayISO(new Date())
    const now = new Date().toISOString()

    // Upsert : vérifier si un objectif existe déjà pour cette semaine
    const existing = await db
      .select()
      .from(objectifHebdomadaire)
      .where(
        and(
          eq(objectifHebdomadaire.priseEnChargeId, pecs[0].id),
          eq(objectifHebdomadaire.semaine, targetSemaine)
        )
      )

    if (existing.length > 0) {
      await db
        .update(objectifHebdomadaire)
        .set({
          cibleHeures,
          ajusteParConseiller: 1,
          commentaire: commentaire || null,
          misAJourLe: now,
        })
        .where(eq(objectifHebdomadaire.id, existing[0].id))
      return jsonSuccess({ id: existing[0].id })
    }

    const id = uuidv4()
    await db.insert(objectifHebdomadaire).values({
      id,
      priseEnChargeId: pecs[0].id,
      semaine: targetSemaine,
      cibleHeures,
      ajusteParConseiller: 1,
      commentaire: commentaire || null,
      creeLe: now,
      misAJourLe: now,
    })

    return jsonSuccess({ id }, 201)
  } catch (error) {
    console.error('[Objectifs POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
