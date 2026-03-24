// GET /api/conseiller/file-active/[id]/journal — Timeline des événements d'un accompagnement
// (traçabilité complète pour le conseiller référent : messages, consentements, visio, rdv, bris de glace)

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { evenementJournal, priseEnCharge } from '@/data/schema'
import { eq, desc } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(
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

    if (pecs.length === 0) {
      return jsonError('Prise en charge non trouvée', 404)
    }

    const pec = pecs[0]

    // Filtrer par page (pagination optionnelle)
    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    // Récupérer les événements, les plus récents en premier
    const events = await db
      .select()
      .from(evenementJournal)
      .where(eq(evenementJournal.priseEnChargeId, pec.id))
      .orderBy(desc(evenementJournal.horodatage))
      .limit(limit)
      .offset(offset)

    return jsonSuccess({
      evenements: events.map(e => ({
        id: e.id,
        type: e.type,
        acteurType: e.acteurType,
        acteurId: e.acteurId,
        cibleType: e.cibleType,
        cibleId: e.cibleId,
        resume: e.resume,
        details: e.details ? JSON.parse(e.details) : null,
        horodatage: e.horodatage,
      })),
    })
  } catch (error) {
    console.error('[Journal]', error)
    return jsonError('Erreur serveur', 500)
  }
}
