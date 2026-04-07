// POST /api/accompagnement/tarif/accepter
// Enregistre l'acceptation d'un tarif par le bénéficiaire

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/data/db'
import { acceptationTarif, referral, tarification, conditionsCommerciales, structure } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { referralId, tarificationId, conditionsId } = body

    if (!referralId || !tarificationId) {
      return NextResponse.json({ error: 'referralId et tarificationId requis' }, { status: 400 })
    }

    // Vérifier le referral
    const referrals = await db.select().from(referral).where(eq(referral.id, referralId))
    if (referrals.length === 0) {
      return NextResponse.json({ error: 'Referral non trouve' }, { status: 404 })
    }
    const ref = referrals[0]

    // Vérifier le tarif
    const tarifs = await db.select().from(tarification)
      .where(and(eq(tarification.id, tarificationId), eq(tarification.actif, 1)))
    if (tarifs.length === 0) {
      return NextResponse.json({ error: 'Tarification non trouvee ou inactive' }, { status: 404 })
    }
    const tarif = tarifs[0]

    // Vérifier que la structure est bien privée
    const structures = await db.select().from(structure).where(eq(structure.id, tarif.structureId))
    if (structures.length === 0 || structures[0].visibilite !== 'privee') {
      return NextResponse.json({ error: 'Structure non privee' }, { status: 400 })
    }

    // Vérifier les conditions si fournies
    if (conditionsId) {
      const conds = await db.select().from(conditionsCommerciales)
        .where(and(eq(conditionsCommerciales.id, conditionsId), eq(conditionsCommerciales.actif, 1)))
      if (conds.length === 0) {
        return NextResponse.json({ error: 'Conditions commerciales non trouvees' }, { status: 404 })
      }
    }

    // Récupérer l'IP pour la traçabilité légale
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown'

    const now = new Date().toISOString()
    const acceptation = {
      id: uuidv4(),
      referralId,
      utilisateurId: ref.utilisateurId,
      structureId: tarif.structureId,
      tarificationId,
      conditionsId: conditionsId || null,
      montantCentimes: tarif.montantCentimes,
      statut: 'acceptee',
      accepteeLe: now,
      refuseeLe: null,
      ipAcceptation: ip,
      creeLe: now,
      misAJourLe: now,
    }

    await db.insert(acceptationTarif).values(acceptation)

    return NextResponse.json({
      acceptationTarifId: acceptation.id,
      montantCentimes: tarif.montantCentimes,
      devise: tarif.devise || 'EUR',
      structureId: tarif.structureId,
    })
  } catch (error) {
    console.error('[Acceptation tarif POST]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
