// PATCH /api/conseiller/file-active/[id]/status
// Changer le statut d'une prise en charge

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { priseEnCharge, referral } from '@/data/schema'
import { eq } from 'drizzle-orm'

const VALID_STATUTS = ['nouvelle', 'en_attente', 'prise_en_charge', 'terminee', 'abandonnee']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await getConseillerFromHeaders()
    const body = await request.json()
    const { statut } = body

    if (!statut || !VALID_STATUTS.includes(statut)) {
      return jsonError(`Statut invalide. Valeurs acceptées : ${VALID_STATUTS.join(', ')}`, 400)
    }

    // Trouver la prise en charge pour ce referral
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))

    if (pecs.length === 0) {
      return jsonError('Aucune prise en charge trouvée', 404)
    }

    const pec = pecs[0]
    const now = new Date().toISOString()

    const updates: Record<string, unknown> = {
      statut,
      misAJourLe: now,
    }

    if (statut === 'terminee') {
      updates.termineeLe = now
    }

    await db
      .update(priseEnCharge)
      .set(updates)
      .where(eq(priseEnCharge.id, pec.id))

    // Mettre à jour aussi le referral
    const referralStatut = statut === 'terminee'
      ? 'recontacte'
      : statut === 'abandonnee'
        ? 'echoue'
        : statut

    await db
      .update(referral)
      .set({ statut: referralStatut, misAJourLe: now })
      .where(eq(referral.id, id))

    // Audit
    await logAudit(ctx.id, 'update_status', 'prise_en_charge', pec.id, {
      ancien: pec.statut,
      nouveau: statut,
    })

    return jsonSuccess({ message: 'Statut mis à jour' })
  } catch (error) {
    console.error('[Status Update]', error)
    return jsonError('Erreur serveur', 500)
  }
}
