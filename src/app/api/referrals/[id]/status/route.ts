import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/data/db'
import { referral, priseEnCharge, conseiller, structure } from '@/data/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Referral ID is required' },
        { status: 400 }
      )
    }

    // 1. Find the referral
    const ref = await db
      .select()
      .from(referral)
      .where(eq(referral.id, id))
      .limit(1)

    if (ref.length === 0) {
      return NextResponse.json(
        { error: 'Referral not found' },
        { status: 404 }
      )
    }

    const refData = ref[0]

    // 2. Check for prise en charge
    const pec = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))
      .limit(1)

    let priseEnChargeInfo: {
      exists: boolean
      conseiller?: { prenom: string }
      structure?: { nom: string }
    } = { exists: false }

    if (pec.length > 0) {
      const pecData = pec[0]

      // Get conseiller info
      const conseillerData = await db
        .select({ prenom: conseiller.prenom })
        .from(conseiller)
        .where(eq(conseiller.id, pecData.conseillerId))
        .limit(1)

      // Get structure info
      const structureData = await db
        .select({ nom: structure.nom })
        .from(structure)
        .where(eq(structure.id, pecData.structureId))
        .limit(1)

      priseEnChargeInfo = {
        exists: true,
        conseiller: conseillerData[0] ? { prenom: conseillerData[0].prenom } : undefined,
        structure: structureData[0] ? { nom: structureData[0].nom } : undefined,
      }
    }

    // 3. Return response
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
