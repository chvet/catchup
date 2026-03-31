import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/data/db'
import { referral, priseEnCharge, conseiller } from '@/data/schema'
import { eq } from 'drizzle-orm'

// Regex UUID v4 pour valider le format du referral ID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Valider le format UUID pour éviter les injections
    if (!id || !UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      )
    }

    // 1. Find the referral
    const ref = await db
      .select({ statut: referral.statut })
      .from(referral)
      .where(eq(referral.id, id))
      .limit(1)

    if (ref.length === 0) {
      // Réponse générique pour ne pas révéler si l'ID existe ou non
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 404 }
      )
    }

    const refData = ref[0]

    // 2. Check for prise en charge — ne retourner que le minimum
    const pec = await db
      .select({ conseillerId: priseEnCharge.conseillerId })
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))
      .limit(1)

    let priseEnChargeInfo: {
      exists: boolean
      conseiller?: { prenom: string }
    } = { exists: false }

    if (pec.length > 0) {
      const conseillerData = await db
        .select({ prenom: conseiller.prenom })
        .from(conseiller)
        .where(eq(conseiller.id, pec[0].conseillerId))
        .limit(1)

      priseEnChargeInfo = {
        exists: true,
        conseiller: conseillerData[0] ? { prenom: conseillerData[0].prenom } : undefined,
      }
    }

    return NextResponse.json({
      statut: refData.statut,
      priseEnCharge: priseEnChargeInfo,
    })
  } catch (error) {
    console.error('[referrals/status] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
