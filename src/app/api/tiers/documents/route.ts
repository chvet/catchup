// GET & POST /api/tiers/documents
// Upload et liste de documents pour un accompagnement (côté tiers intervenant)

import { NextResponse } from 'next/server'
import { getTiersFromToken } from '@/lib/tiers-helpers'
import { db } from '@/data/db'
import { priseEnCharge } from '@/data/schema'
import { eq } from 'drizzle-orm'
import {
  processFileUpload,
  createDocumentMessage,
  getDocumentsForPriseEnCharge,
} from '@/lib/documents'

// GET — Liste des documents pour cette prise en charge
export async function GET(request: Request) {
  try {
    const tiers = await getTiersFromToken(request)

    const documents = await getDocumentsForPriseEnCharge(tiers.priseEnChargeId)

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('[Tiers Documents GET]', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    const status = message === 'Token manquant' || message === 'Token invalide ou expiré' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// POST — Upload d'un document
export async function POST(request: Request) {
  try {
    const tiers = await getTiersFromToken(request)

    // Vérifier le statut de la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.id, tiers.priseEnChargeId))

    if (pecs.length === 0) {
      return NextResponse.json({ error: 'Prise en charge non trouvée' }, { status: 404 })
    }

    const pec = pecs[0]

    if (pec.statut !== 'prise_en_charge') {
      return NextResponse.json(
        { error: `Impossible d'envoyer un document : statut actuel "${pec.statut}".` },
        { status: 400 }
      )
    }

    // Parser le formData
    const formData = await request.formData()

    // Traiter l'upload
    const result = await processFileUpload(formData, tiers.priseEnChargeId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    // Créer le message associé (conversation type tiers_beneficiaire)
    const messageId = await createDocumentMessage(
      tiers.priseEnChargeId,
      'tiers',
      tiers.tiersId,
      result.document,
      'tiers_beneficiaire'
    )

    return NextResponse.json(
      {
        messageId,
        document: result.document,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Tiers Documents POST]', error)
    const message = error instanceof Error ? error.message : 'Erreur serveur'
    const status = message === 'Token manquant' || message === 'Token invalide ou expiré' ? 401 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
