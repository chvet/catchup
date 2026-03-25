// POST /api/conseiller/file-active/[id]/rupture — Rompre un accompagnement
// Le conseiller peut rompre l'accompagnement avec un motif et signaler un comportement inapproprié

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logJournal } from '@/lib/journal'
import { db } from '@/data/db'
import { priseEnCharge, referral, messageDirect, evenementAudit } from '@/data/schema'
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

    const { motif, comportementInaproprie } = body

    if (!motif || typeof motif !== 'string' || motif.trim().length === 0) {
      return jsonError('Le motif est requis', 400)
    }

    // Trouver la prise en charge via le referralId
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))

    if (pecs.length === 0) return jsonError('Prise en charge non trouvée', 404)
    const pec = pecs[0]

    if (pec.statut !== 'prise_en_charge') {
      return jsonError('Cet accompagnement n\'est pas actif', 400)
    }

    // Vérifier que le conseiller est bien le responsable
    if (pec.conseillerId !== ctx.id) {
      return jsonError('Vous n\'êtes pas le conseiller responsable de cet accompagnement', 403)
    }

    const now = new Date().toISOString()

    // 1. Mettre à jour la prise en charge
    await db.update(priseEnCharge).set({
      statut: 'rupture',
      termineeLe: now,
      misAJourLe: now,
    }).where(eq(priseEnCharge.id, pec.id))

    // 2. Mettre à jour le referral
    await db.update(referral).set({
      statut: 'rupture',
      misAJourLe: now,
    }).where(eq(referral.id, id))

    // 3. Envoyer un message système dans le chat
    const systemMessageContent = JSON.stringify({
      type: 'rupture',
      motif: motif.trim(),
      comportementInaproprie: !!comportementInaproprie,
      parConseiller: true,
    })

    const systemMsgId = uuidv4()
    await db.insert(messageDirect).values({
      id: systemMsgId,
      priseEnChargeId: pec.id,
      expediteurType: 'conseiller',
      expediteurId: 'systeme',
      contenu: systemMessageContent,
      conversationType: 'direct',
      lu: 0,
      horodatage: now,
    })

    // 4. Si comportement inapproprié, créer un message système supplémentaire pour le signalement
    if (comportementInaproprie) {
      await db.insert(messageDirect).values({
        id: uuidv4(),
        priseEnChargeId: pec.id,
        expediteurType: 'conseiller',
        expediteurId: 'systeme',
        contenu: JSON.stringify({
          type: 'system',
          content: `Comportement inapproprié signalé. Motif : ${motif.trim()}`,
          comportementInaproprie: true,
        }),
        conversationType: 'direct',
        lu: 0,
        horodatage: now,
      })
    }

    // 5. Log journal
    await logJournal(pec.id, 'rupture_conseiller', 'conseiller', ctx.id,
      `Rupture de l'accompagnement${comportementInaproprie ? ' (comportement inapproprié signalé)' : ''} — ${motif.trim()}`,
      {
        details: {
          motif: motif.trim(),
          comportementInaproprie: !!comportementInaproprie,
        },
      }
    )

    // 6. Audit
    await db.insert(evenementAudit).values({
      id: uuidv4(),
      conseillerId: ctx.id,
      action: 'rupture_accompagnement',
      cibleType: 'prise_en_charge',
      cibleId: pec.id,
      details: JSON.stringify({
        referralId: id,
        motif: motif.trim(),
        comportementInaproprie: !!comportementInaproprie,
      }),
      horodatage: now,
    })

    return jsonSuccess({
      ok: true,
      message: {
        id: systemMsgId,
        expediteurType: 'conseiller',
        expediteurId: 'systeme',
        contenu: systemMessageContent,
        lu: false,
        horodatage: now,
      },
    })
  } catch (error) {
    console.error('[RUPTURE]', error)
    return jsonError('Erreur serveur', 500)
  }
}
