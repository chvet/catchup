// POST /api/referrals/[id]/cancel — Annuler une demande d'accompagnement
// Accessible par le bénéficiaire (pas d'auth JWT, identifié par le referralId)
// Ne peut annuler que si statut = 'en_attente' ou 'nouvelle' (pas déjà pris en charge)

import { NextResponse } from 'next/server'
import { db } from '@/data/db'
import { referral } from '@/data/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier que le referral existe
    const refs = await db.select().from(referral).where(eq(referral.id, id))
    if (refs.length === 0) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 })
    }

    const ref = refs[0]

    // Vérifier que la demande est annulable (pas encore prise en charge)
    if (ref.statut !== 'en_attente' && ref.statut !== 'nouvelle') {
      return NextResponse.json(
        { error: 'Cette demande ne peut plus être annulée car elle est déjà prise en charge.' },
        { status: 409 }
      )
    }

    // Passer le statut à "annulee"
    const now = new Date().toISOString()
    await db
      .update(referral)
      .set({ statut: 'annulee', misAJourLe: now })
      .where(eq(referral.id, id))

    return NextResponse.json({ success: true, message: 'Demande annulée' })
  } catch (error) {
    console.error('[Referral Cancel]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
