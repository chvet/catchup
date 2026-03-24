// GET /api/conseiller/file-active/[id]/rdv/[rdvId]/ics — Télécharger le fichier .ics d'un RDV
// (compatible Outlook, Apple Calendar, etc.)

import { db } from '@/data/db'
import { evenementJournal } from '@/data/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; rdvId: string }> }
) {
  try {
    const { rdvId } = await params

    const events = await db
      .select()
      .from(evenementJournal)
      .where(eq(evenementJournal.id, rdvId))

    if (events.length === 0 || events[0].type !== 'rdv_planifie') {
      return new Response('RDV non trouvé', { status: 404 })
    }

    const details = events[0].details ? JSON.parse(events[0].details) : {}

    if (!details.icsContent) {
      return new Response('Contenu ICS non disponible', { status: 404 })
    }

    return new Response(details.icsContent, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="rdv-catchup.ics"`,
      },
    })
  } catch (error) {
    console.error('[ICS Download]', error)
    return new Response('Erreur serveur', { status: 500 })
  }
}
