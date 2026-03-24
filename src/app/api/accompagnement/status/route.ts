// GET /api/accompagnement/status
// Statut de la prise en charge, infos conseiller, messages non lus

import { db } from '@/data/db'
import { priseEnCharge, conseiller, structure, messageDirect } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { getBeneficiaireFromToken } from '@/lib/accompagnement-helpers'

export async function GET(request: Request) {
  try {
    const beneficiaire = await getBeneficiaireFromToken(request)
    if (!beneficiaire) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      )
    }

    // Récupérer la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.id, beneficiaire.priseEnChargeId))

    if (pecs.length === 0) {
      return NextResponse.json(
        { error: 'Prise en charge introuvable' },
        { status: 404 }
      )
    }

    const pec = pecs[0]

    // Récupérer les infos du conseiller
    const conseillers = await db
      .select()
      .from(conseiller)
      .where(eq(conseiller.id, beneficiaire.conseillerId))

    const conseillerInfo = conseillers.length > 0 ? conseillers[0] : null

    let structureNom: string | null = null
    let structureType: string | null = null
    if (conseillerInfo?.structureId) {
      const structures = await db
        .select()
        .from(structure)
        .where(eq(structure.id, conseillerInfo.structureId))
      if (structures.length > 0) {
        structureNom = structures[0].nom
        structureType = structures[0].type
      }
    }

    // Compter les messages non lus (envoyés par le conseiller)
    const unreadMessages = await db
      .select()
      .from(messageDirect)
      .where(
        and(
          eq(messageDirect.priseEnChargeId, beneficiaire.priseEnChargeId),
          eq(messageDirect.expediteurType, 'conseiller'),
          eq(messageDirect.lu, 0)
        )
      )

    return NextResponse.json({
      priseEnCharge: {
        id: pec.id,
        statut: pec.statut,
        creeLe: pec.creeLe,
        misAJourLe: pec.misAJourLe,
      },
      conseiller: conseillerInfo
        ? {
            prenom: conseillerInfo.prenom,
            nom: conseillerInfo.nom,
            structureNom,
            structureType,
          }
        : null,
      messagesNonLus: unreadMessages.length,
    })
  } catch (error) {
    console.error('[Accompagnement Status]', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
