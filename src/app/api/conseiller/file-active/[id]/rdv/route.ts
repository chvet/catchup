// POST /api/conseiller/file-active/[id]/rdv — Planifier un rendez-vous
// (crée un événement journal + génère les liens Google Calendar et .ics)

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logJournal } from '@/lib/journal'
import { generateGoogleCalendarUrl, generateICS } from '@/lib/calendar'
import { db } from '@/data/db'
import { priseEnCharge, evenementJournal, messageDirect } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await getConseillerFromHeaders()
    const body = await request.json()

    const { titre, dateDebut, dateFin, description, lieu } = body

    if (!titre || !dateDebut || !dateFin) {
      return jsonError('titre, dateDebut et dateFin requis', 400)
    }

    const start = new Date(dateDebut)
    const end = new Date(dateFin)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return jsonError('Dates invalides', 400)
    }

    if (end <= start) {
      return jsonError('La date de fin doit être après la date de début', 400)
    }

    // Trouver la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))

    if (pecs.length === 0) return jsonError('Prise en charge non trouvée', 404)
    const pec = pecs[0]

    // Générer les liens
    const googleUrl = generateGoogleCalendarUrl({
      title: titre,
      start,
      end,
      description: description || `RDV Catch'Up — Accompagnement`,
      location: lieu,
    })

    const icsContent = generateICS({
      title: titre,
      start,
      end,
      description: description || `RDV Catch'Up — Accompagnement`,
      location: lieu,
      uid: `catchup-rdv-${uuidv4()}`,
    })

    const now = new Date().toISOString()
    const rdvId = uuidv4()

    // Stocker dans le journal
    await db.insert(evenementJournal).values({
      id: rdvId,
      priseEnChargeId: pec.id,
      type: 'rdv_planifie',
      acteurType: 'conseiller',
      acteurId: ctx.id,
      resume: `RDV : ${titre}`,
      details: JSON.stringify({
        titre,
        dateDebut,
        dateFin,
        description,
        lieu,
        googleUrl,
        icsContent,
      }),
      horodatage: now,
    })

    // Log
    await logJournal(pec.id, 'rdv_planifie', 'conseiller', ctx.id,
      `RDV planifié : ${titre} le ${start.toLocaleDateString('fr-FR')}`,
      { details: { titre, dateDebut, dateFin } }
    )

    const icsUrl = `/api/conseiller/file-active/${id}/rdv/${rdvId}/ics`

    // Insérer un message structuré dans le chat pour que le bénéficiaire voie le RDV
    await db.insert(messageDirect).values({
      id: uuidv4(),
      priseEnChargeId: pec.id,
      expediteurType: 'conseiller',
      expediteurId: ctx.id,
      contenu: JSON.stringify({
        type: 'rdv',
        id: rdvId,
        titre,
        dateDebut,
        dateFin,
        description: description || '',
        lieu: lieu || '',
        googleUrl,
        icsUrl,
      }),
      conversationType: 'direct',
      lu: 0,
      horodatage: now,
    })

    return jsonSuccess({
      id: rdvId,
      titre,
      dateDebut,
      dateFin,
      googleUrl,
      icsUrl,
    })
  } catch (error) {
    console.error('[RDV]', error)
    return jsonError('Erreur serveur', 500)
  }
}
