// GET /api/conseiller/file-active/[id]/activites — Déclarations d'activité d'un bénéficiaire
// POST /api/conseiller/file-active/[id]/activites — Créer une déclaration (côté conseiller)

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { declarationActivite, priseEnCharge, referral } from '@/data/schema'
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

    // Trouver la prise en charge
    const pecs = await db.select().from(priseEnCharge).where(eq(priseEnCharge.referralId, referralId))
    if (pecs.length === 0) return jsonError('Prise en charge non trouvée', 404)

    const { searchParams } = new URL(request.url)
    const semaine = searchParams.get('semaine') // filtre optionnel par semaine

    let query = db
      .select()
      .from(declarationActivite)
      .where(
        semaine
          ? and(eq(declarationActivite.priseEnChargeId, pecs[0].id), eq(declarationActivite.dateSemaine, semaine))
          : eq(declarationActivite.priseEnChargeId, pecs[0].id)
      )
      .orderBy(desc(declarationActivite.dateActivite))

    const declarations = await query

    return jsonSuccess(declarations)
  } catch (error) {
    console.error('[Activites GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: referralId } = await params
    const ctx = await getConseillerFromHeaders()

    const pecs = await db.select().from(priseEnCharge).where(eq(priseEnCharge.referralId, referralId))
    if (pecs.length === 0) return jsonError('Prise en charge non trouvée', 404)

    const refs = await db.select().from(referral).where(eq(referral.id, referralId))
    if (refs.length === 0) return jsonError('Referral non trouvé', 404)

    const body = await request.json()
    const { categorieCode, description, dureeMinutes, dateActivite } = body

    if (!categorieCode || !dureeMinutes || !dateActivite) {
      return jsonError('categorieCode, dureeMinutes et dateActivite requis', 400)
    }

    const now = new Date().toISOString()
    const dateSemaine = getMondayISO(new Date(dateActivite))

    const id = uuidv4()
    await db.insert(declarationActivite).values({
      id,
      priseEnChargeId: pecs[0].id,
      utilisateurId: refs[0].utilisateurId,
      categorieCode,
      description: description || null,
      dureeMinutes,
      dateSemaine,
      dateActivite,
      source: 'manuel',
      statut: 'validee', // créé par le conseiller = validé d'office
      valideePar: ctx.id,
      valideLe: now,
      creeLe: now,
      misAJourLe: now,
    })

    return jsonSuccess({ id }, 201)
  } catch (error) {
    console.error('[Activites POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
