// POST /api/accompagnement/video/reponse — Bénéficiaire accepte/refuse un appel vidéo
// Le message vidéo est stocké dans messageDirect avec contenu JSON { type: 'video', ... }

import { getBeneficiaireFromToken } from '@/lib/accompagnement-helpers'
import { logJournal } from '@/lib/journal'
import { db } from '@/data/db'
import { messageDirect } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const ctx = await getBeneficiaireFromToken(request)
    if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const { messageId, action } = body

    if (!messageId || !['accepter', 'refuser'].includes(action)) {
      return NextResponse.json({ error: 'messageId et action (accepter|refuser) requis' }, { status: 400 })
    }

    // Récupérer le message vidéo
    const msgs = await db
      .select()
      .from(messageDirect)
      .where(eq(messageDirect.id, messageId))

    if (msgs.length === 0) {
      return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 })
    }

    const msg = msgs[0]

    // Vérifier que c'est bien un message vidéo de cette prise en charge
    if (msg.priseEnChargeId !== ctx.priseEnChargeId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(msg.contenu)
    } catch {
      return NextResponse.json({ error: 'Message invalide' }, { status: 400 })
    }

    if (parsed.type !== 'video') {
      return NextResponse.json({ error: 'Ce message n\'est pas une proposition vidéo' }, { status: 400 })
    }

    // Mettre à jour le statut dans le contenu JSON du message
    const newStatut = action === 'accepter' ? 'acceptee' : 'refusee'
    const updatedContent = { ...parsed, statut: newStatut }

    await db
      .update(messageDirect)
      .set({ contenu: JSON.stringify(updatedContent) })
      .where(eq(messageDirect.id, messageId))

    // Log journal
    const journalType = action === 'accepter' ? 'video_acceptee' : 'video_refusee'
    await logJournal(
      ctx.priseEnChargeId,
      journalType as 'video_acceptee' | 'video_refusee',
      'beneficiaire',
      ctx.utilisateurId,
      action === 'accepter' ? 'Appel vidéo accepté par le bénéficiaire' : 'Appel vidéo refusé par le bénéficiaire'
    )

    return NextResponse.json({
      statut: newStatut,
      jitsiUrl: action === 'accepter' ? parsed.jitsiUrl : null,
    })
  } catch (error) {
    console.error('[Video Reponse]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
