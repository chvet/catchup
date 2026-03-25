// POST /api/conseiller/file-active/[id]/video — Proposer un appel vidéo
// (génère une URL Daily.co, insère un message structuré dans le chat + événement journal)

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logJournal } from '@/lib/journal'
import { createDailyRoom } from '@/lib/jitsi'
import { db } from '@/data/db'
import { priseEnCharge, messageDirect } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await getConseillerFromHeaders()

    // Trouver la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))

    if (pecs.length === 0) return jsonError('Prise en charge non trouvée', 404)
    const pec = pecs[0]

    if (pec.statut !== 'prise_en_charge') {
      return jsonError('Prise en charge non active', 400)
    }

    // Créer une room Daily.co (24h)
    const videoUrl = await createDailyRoom(pec.id)
    const now = new Date().toISOString()
    const msgId = uuidv4()

    // Insérer un message structuré dans le chat (type: video)
    await db.insert(messageDirect).values({
      id: msgId,
      priseEnChargeId: pec.id,
      expediteurType: 'conseiller',
      expediteurId: ctx.id,
      contenu: JSON.stringify({
        type: 'video',
        id: msgId,
        statut: 'en_attente',
        jitsiUrl: videoUrl,
        proposePar: ctx.id,
      }),
      conversationType: 'conseiller_beneficiaire',
      horodatage: now,
      lu: 0,
    })

    // Log journal
    await logJournal(pec.id, 'video_proposee', 'conseiller', ctx.id,
      'Appel vidéo proposé par le conseiller',
      { details: { videoUrl, messageId: msgId } }
    )

    // Retourner le message complet
    return jsonSuccess({
      id: msgId,
      priseEnChargeId: pec.id,
      expediteurType: 'conseiller',
      expediteurId: ctx.id,
      contenu: JSON.stringify({
        type: 'video',
        id: msgId,
        statut: 'en_attente',
        jitsiUrl: videoUrl,
        proposePar: ctx.id,
      }),
      conversationType: 'conseiller_beneficiaire',
      horodatage: now,
      lu: 0,
    })
  } catch (error) {
    console.error('[Video Propose]', error)
    return jsonError('Erreur serveur', 500)
  }
}
