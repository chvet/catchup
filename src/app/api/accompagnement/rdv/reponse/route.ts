// POST /api/accompagnement/rdv/reponse — Bénéficiaire accepte/refuse un RDV
import { getBeneficiaireFromToken } from '@/lib/accompagnement-helpers'
import { logJournal } from '@/lib/journal'
import { db } from '@/data/db'
import { messageDirect, rendezVous } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const ctx = await getBeneficiaireFromToken(request)
    if (!ctx) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const { messageId, action, motif } = body

    if (!messageId || !['accepter', 'refuser'].includes(action)) {
      return NextResponse.json({ error: 'messageId et action (accepter|refuser) requis' }, { status: 400 })
    }

    if (action === 'refuser' && (!motif || !motif.trim())) {
      return NextResponse.json({ error: 'Un motif est requis pour refuser un rendez-vous' }, { status: 400 })
    }

    // Récupérer le message RDV
    const msgs = await db
      .select()
      .from(messageDirect)
      .where(eq(messageDirect.id, messageId))

    if (msgs.length === 0) {
      return NextResponse.json({ error: 'Message non trouvé' }, { status: 404 })
    }

    const msg = msgs[0]

    if (msg.priseEnChargeId !== ctx.priseEnChargeId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(msg.contenu)
    } catch {
      return NextResponse.json({ error: 'Message invalide' }, { status: 400 })
    }

    if (parsed.type !== 'rdv') {
      return NextResponse.json({ error: 'Ce message n\'est pas une proposition de rendez-vous' }, { status: 400 })
    }

    // Mettre à jour le statut dans le message
    const newStatut = action === 'accepter' ? 'accepte' : 'refuse'
    const updatedContent = {
      ...parsed,
      statut: newStatut,
      ...(action === 'refuser' ? { motifRefus: motif.trim() } : {}),
    }

    await db
      .update(messageDirect)
      .set({ contenu: JSON.stringify(updatedContent) })
      .where(eq(messageDirect.id, messageId))

    // Mettre à jour la table rendez_vous si le rdvId existe
    if (parsed.rdvId) {
      const rdvStatut = action === 'accepter' ? 'confirme' : 'annule'
      await db
        .update(rendezVous)
        .set({ statut: rdvStatut, misAJourLe: new Date().toISOString() })
        .where(eq(rendezVous.id, parsed.rdvId as string))
    }

    // Log journal
    await logJournal(
      ctx.priseEnChargeId,
      action === 'accepter' ? 'rdv_accepte' : 'rdv_refuse',
      'beneficiaire',
      ctx.utilisateurId,
      action === 'accepter'
        ? `RDV "${parsed.titre}" accepté par le bénéficiaire`
        : `RDV "${parsed.titre}" refusé — Motif : ${motif.trim()}`
    )

    return NextResponse.json({ statut: newStatut })
  } catch (error) {
    console.error('[RDV Reponse]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
