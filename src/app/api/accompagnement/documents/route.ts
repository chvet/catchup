// GET & POST /api/accompagnement/documents
// Upload et liste de documents pour un accompagnement (côté bénéficiaire)

import { NextResponse } from 'next/server'
import { getBeneficiaireFromToken } from '@/lib/accompagnement-helpers'
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
    const beneficiaire = await getBeneficiaireFromToken(request)
    if (!beneficiaire) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const documents = await getDocumentsForPriseEnCharge(beneficiaire.priseEnChargeId)

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('[Accompagnement Documents GET]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

// POST — Upload d'un document
export async function POST(request: Request) {
  try {
    const beneficiaire = await getBeneficiaireFromToken(request)
    if (!beneficiaire) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Vérifier le statut de la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.id, beneficiaire.priseEnChargeId))

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
    const result = await processFileUpload(formData, beneficiaire.priseEnChargeId)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    // Créer le message associé
    const messageId = await createDocumentMessage(
      beneficiaire.priseEnChargeId,
      'beneficiaire',
      beneficiaire.utilisateurId,
      result.document
    )

    // Retourner le message complet pour affichage immédiat côté client
    const now = new Date().toISOString()
    return NextResponse.json(
      {
        messageId,
        document: result.document,
        message: {
          id: messageId,
          priseEnChargeId: beneficiaire.priseEnChargeId,
          expediteurType: 'beneficiaire',
          expediteurId: beneficiaire.utilisateurId,
          contenu: JSON.stringify(result.document),
          lu: 0,
          horodatage: now,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Accompagnement Documents POST]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
