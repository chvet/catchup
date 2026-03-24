// GET /api/conseiller/file-active/[id]/conversation — Historique des messages de la conversation du bénéficiaire
// (permet au conseiller de lire l'échange IA ↔ bénéficiaire avant décision de prise en charge)

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { referral, message, conversation } from '@/data/schema'
import { eq, asc } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await getConseillerFromHeaders()

    // 1. Récupérer le referral pour trouver la conversationId
    const refs = await db
      .select({ conversationId: referral.conversationId })
      .from(referral)
      .where(eq(referral.id, id))

    if (refs.length === 0) {
      return jsonError('Referral non trouvé', 404)
    }

    const convId = refs[0].conversationId
    if (!convId) {
      return jsonSuccess({ messages: [], conversation: null })
    }

    // 2. Récupérer les métadonnées de la conversation
    const convs = await db
      .select()
      .from(conversation)
      .where(eq(conversation.id, convId))

    const conv = convs[0] || null

    // 3. Récupérer tous les messages, triés par horodatage
    const messages = await db
      .select({
        id: message.id,
        role: message.role,
        contenu: message.contenu,
        contenuBrut: message.contenuBrut,
        fragiliteDetectee: message.fragiliteDetectee,
        niveauFragilite: message.niveauFragilite,
        horodatage: message.horodatage,
      })
      .from(message)
      .where(eq(message.conversationId, convId))
      .orderBy(asc(message.horodatage))

    // 4. Audit — tracer la consultation de la conversation (RGPD)
    await logAudit(ctx.id, 'view_conversation', 'referral', id)

    return jsonSuccess({
      conversation: conv ? {
        id: conv.id,
        titre: conv.titre,
        phase: conv.phase,
        nbMessages: conv.nbMessages,
        dureeSecondes: conv.dureeSecondes,
        creeLe: conv.creeLe,
      } : null,
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        contenu: m.contenu || m.contenuBrut || '',
        fragiliteDetectee: m.fragiliteDetectee === 1,
        niveauFragilite: m.niveauFragilite,
        horodatage: m.horodatage,
      })),
    })
  } catch (error) {
    console.error('[Conversation History]', error)
    return jsonError('Erreur serveur', 500)
  }
}
