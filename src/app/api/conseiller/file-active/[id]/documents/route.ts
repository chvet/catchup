// GET & POST /api/conseiller/file-active/[id]/documents
// Upload et liste de documents pour un accompagnement (côté conseiller)

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { priseEnCharge } from '@/data/schema'
import { eq } from 'drizzle-orm'
import {
  processFileUpload,
  createDocumentMessage,
  getDocumentsForPriseEnCharge,
} from '@/lib/documents'

// GET — Liste des documents pour cette prise en charge
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: referralId } = await params
    const ctx = await getConseillerFromHeaders()

    if (!ctx.id) {
      return jsonError('Non authentifié', 401)
    }

    // Trouver la prise en charge liée à ce referral
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, referralId))

    if (pecs.length === 0) {
      return jsonError('Aucune prise en charge trouvée', 404)
    }

    const documents = await getDocumentsForPriseEnCharge(pecs[0].id)

    return jsonSuccess({ documents })
  } catch (error) {
    console.error('[Conseiller Documents GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

// POST — Upload d'un document
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: referralId } = await params
    const ctx = await getConseillerFromHeaders()

    if (!ctx.id) {
      return jsonError('Non authentifié', 401)
    }

    // Trouver la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, referralId))

    if (pecs.length === 0) {
      return jsonError('Aucune prise en charge trouvée', 404)
    }

    const pec = pecs[0]

    if (pec.statut !== 'prise_en_charge') {
      return jsonError(
        `Impossible d'envoyer un document : statut actuel "${pec.statut}". Le statut doit être "prise_en_charge".`,
        400
      )
    }

    // Parser le formData
    const formData = await request.formData()

    // Traiter l'upload
    const result = await processFileUpload(formData, pec.id)

    if (!result.success) {
      return jsonError(result.error, result.status)
    }

    // Créer le message associé
    const messageId = await createDocumentMessage(
      pec.id,
      'conseiller',
      ctx.id,
      result.document
    )

    // Audit
    await logAudit(ctx.id, 'upload_document', 'message_direct', messageId, {
      priseEnChargeId: pec.id,
      referralId,
      filename: result.document.originalName,
      size: result.document.size,
    })

    // Retourner le message complet pour affichage immédiat côté client
    const now = new Date().toISOString()
    return jsonSuccess(
      {
        messageId,
        document: result.document,
        message: {
          id: messageId,
          priseEnChargeId: pec.id,
          expediteurType: 'conseiller',
          expediteurId: ctx.id,
          contenu: JSON.stringify(result.document),
          lu: 0,
          horodatage: now,
        },
      },
      201
    )
  } catch (error) {
    console.error('[Conseiller Documents POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
