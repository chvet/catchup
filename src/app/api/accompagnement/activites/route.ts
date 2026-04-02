// GET/POST /api/accompagnement/activites — Déclarations d'activité côté bénéficiaire

import { db } from '@/data/db'
import { declarationActivite, priseEnCharge, codeVerification } from '@/data/schema'
import { eq, and, desc } from 'drizzle-orm'
import { cookies } from 'next/headers'
import { v4 as uuidv4 } from 'uuid'

function getMondayISO(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

async function getAuthContext() {
  const cookieStore = await cookies()
  const token = cookieStore.get('accompagnement_token')?.value
  if (!token) return null

  const codes = await db
    .select()
    .from(codeVerification)
    .where(and(eq(codeVerification.token, token), eq(codeVerification.verifie, 1)))

  if (codes.length === 0) return null

  const code = codes[0]
  const pecs = await db
    .select()
    .from(priseEnCharge)
    .where(eq(priseEnCharge.referralId, code.referralId))

  if (pecs.length === 0) return null

  return {
    utilisateurId: code.utilisateurId,
    referralId: code.referralId,
    priseEnChargeId: pecs[0].id,
  }
}

export async function GET(request: Request) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return Response.json({ error: 'Non authentifié' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const semaine = searchParams.get('semaine')

    const declarations = await db
      .select()
      .from(declarationActivite)
      .where(
        semaine
          ? and(eq(declarationActivite.priseEnChargeId, ctx.priseEnChargeId), eq(declarationActivite.dateSemaine, semaine))
          : eq(declarationActivite.priseEnChargeId, ctx.priseEnChargeId)
      )
      .orderBy(desc(declarationActivite.dateActivite))
      .limit(50)

    return Response.json(declarations)
  } catch (error) {
    console.error('[Accompagnement Activites GET]', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getAuthContext()
    if (!ctx) return Response.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const { categorieCode, description, dureeMinutes, dateActivite } = body

    if (!categorieCode || !dureeMinutes || !dateActivite) {
      return Response.json({ error: 'categorieCode, dureeMinutes et dateActivite requis' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const dateSemaine = getMondayISO(new Date(dateActivite))

    const id = uuidv4()
    await db.insert(declarationActivite).values({
      id,
      priseEnChargeId: ctx.priseEnChargeId,
      utilisateurId: ctx.utilisateurId,
      categorieCode,
      description: description || null,
      dureeMinutes: Math.min(Math.max(dureeMinutes, 5), 480), // min 5min, max 8h
      dateSemaine,
      dateActivite,
      source: 'manuel',
      statut: 'en_attente',
      creeLe: now,
      misAJourLe: now,
    })

    return Response.json({ id }, { status: 201 })
  } catch (error) {
    console.error('[Accompagnement Activites POST]', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
