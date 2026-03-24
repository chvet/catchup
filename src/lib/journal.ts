// Helper — Journal des événements d'accompagnement
// (trace toutes les actions : messages, consentements, visio, rdv, bris de glace)

import { db } from '@/data/db'
import { evenementJournal } from '@/data/schema'
import { v4 as uuidv4 } from 'uuid'

export type JournalEventType =
  | 'message_envoye'
  | 'participant_rejoint'
  | 'participant_quitte'
  | 'consentement_demande'
  | 'consentement_accepte'
  | 'consentement_refuse'
  | 'video_proposee'
  | 'video_acceptee'
  | 'video_refusee'
  | 'rdv_planifie'
  | 'bris_de_glace'
  | 'tiers_invite'
  | 'tiers_revoque'

export type ActeurType = 'conseiller' | 'beneficiaire' | 'tiers' | 'systeme'

export async function logJournal(
  priseEnChargeId: string,
  type: JournalEventType,
  acteurType: ActeurType,
  acteurId: string,
  resume: string,
  options?: {
    cibleType?: string
    cibleId?: string
    details?: Record<string, unknown>
  }
) {
  await db.insert(evenementJournal).values({
    id: uuidv4(),
    priseEnChargeId,
    type,
    acteurType,
    acteurId,
    cibleType: options?.cibleType ?? null,
    cibleId: options?.cibleId ?? null,
    resume,
    details: options?.details ? JSON.stringify(options.details) : null,
    horodatage: new Date().toISOString(),
  })
}
