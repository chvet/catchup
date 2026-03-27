// GET + POST /api/accompagnement/satisfaction
// Beneficiaire : verifier si une enquete existe / soumettre ses reponses
// Auth via Bearer token (comme les autres routes accompagnement)

import { db } from '@/data/db'
import { enqueteSatisfaction, codeVerification, priseEnCharge, referral } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export const dynamic = 'force-dynamic'

/**
 * Extrait le token Bearer et verifie l'identite du beneficiaire
 * (meme logique que /api/accompagnement/messages)
 */
async function getBeneficiaireFromToken(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null

  const token = auth.slice(7)

  const codes = await db
    .select()
    .from(codeVerification)
    .where(eq(codeVerification.token, token))

  if (codes.length === 0) return null
  const cv = codes[0]

  // Trouver la prise en charge
  const prises = await db
    .select()
    .from(priseEnCharge)
    .where(eq(priseEnCharge.referralId, cv.referralId))

  if (prises.length === 0) return null

  return {
    utilisateurId: cv.utilisateurId,
    referralId: cv.referralId,
    priseEnChargeId: prises[0].id,
    priseEnChargeStatut: prises[0].statut,
  }
}

// GET — Verifier si une enquete existe pour ce beneficiaire
export async function GET(request: NextRequest) {
  try {
    const ctx = await getBeneficiaireFromToken(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const existing = await db
      .select()
      .from(enqueteSatisfaction)
      .where(eq(enqueteSatisfaction.priseEnChargeId, ctx.priseEnChargeId))

    return NextResponse.json({
      exists: existing.length > 0,
      completed: existing.length > 0 && existing[0].completee === 1,
      priseEnChargeStatut: ctx.priseEnChargeStatut,
    })
  } catch (error) {
    console.error('[Satisfaction GET]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST — Soumettre ou mettre a jour l'enquete
export async function POST(request: NextRequest) {
  try {
    const ctx = await getBeneficiaireFromToken(request)
    if (!ctx) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 })
    }

    const body = await request.json()
    const {
      noteGlobale,
      noteEcoute,
      noteUtilite,
      noteConseiller,
      noteRecommandation,
      pointsForts,
      ameliorations,
    } = body

    if (!noteGlobale || noteGlobale < 1 || noteGlobale > 5) {
      return NextResponse.json({ error: 'Note globale requise (1-5)' }, { status: 400 })
    }

    const now = new Date().toISOString()

    // Verifier si une enquete existe deja
    const existing = await db
      .select()
      .from(enqueteSatisfaction)
      .where(eq(enqueteSatisfaction.priseEnChargeId, ctx.priseEnChargeId))

    if (existing.length > 0) {
      // Mise a jour
      await db
        .update(enqueteSatisfaction)
        .set({
          noteGlobale,
          noteEcoute,
          noteUtilite,
          noteConseiller,
          noteRecommandation,
          pointsForts,
          ameliorations,
          completee: 1,
        })
        .where(eq(enqueteSatisfaction.id, existing[0].id))

      return NextResponse.json({ success: true, updated: true })
    }

    // Creation
    await db.insert(enqueteSatisfaction).values({
      id: uuidv4(),
      priseEnChargeId: ctx.priseEnChargeId,
      utilisateurId: ctx.utilisateurId,
      noteGlobale,
      noteEcoute,
      noteUtilite,
      noteConseiller,
      noteRecommandation,
      pointsForts,
      ameliorations,
      completee: 1,
      creeLe: now,
    })

    return NextResponse.json({ success: true, created: true })
  } catch (error) {
    console.error('[Satisfaction POST]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
