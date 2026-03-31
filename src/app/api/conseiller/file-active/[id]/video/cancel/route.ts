// POST /api/conseiller/file-active/[id]/video/cancel — Annuler un appel vidéo
// Met à jour le statut du message vidéo dans le chat

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { messageDirect } from '@/data/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await getConseillerFromHeaders()
    const body = await request.json()
    const { messageId } = body

    if (!messageId) {
      return jsonError('messageId requis', 400)
    }

    // Récupérer le message
    const msgs = await db.select().from(messageDirect).where(eq(messageDirect.id, messageId))
    if (msgs.length === 0) return jsonError('Message non trouvé', 404)

    const msg = msgs[0]
    const content = JSON.parse(msg.contenu)

    if (content.type !== 'video') {
      return jsonError('Ce message n\'est pas un appel vidéo', 400)
    }

    // Mettre à jour le statut
    const updatedContent = { ...content, statut: 'declinee' }
    await db.update(messageDirect).set({
      contenu: JSON.stringify(updatedContent),
    }).where(eq(messageDirect.id, messageId))

    return jsonSuccess({ success: true })
  } catch (error) {
    console.error('[Video Cancel]', error)
    return jsonError('Erreur serveur', 500)
  }
}
