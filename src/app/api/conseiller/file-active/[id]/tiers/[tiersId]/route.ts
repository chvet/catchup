// DELETE /api/conseiller/file-active/[id]/tiers/[tiersId]
// Révocation d'un tiers intervenant

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logJournal } from '@/lib/journal'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { tiersIntervenant, participantConversation, priseEnCharge } from '@/data/schema'
import { eq, and } from 'drizzle-orm'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; tiersId: string }> }
) {
  try {
    const { id, tiersId } = await params
    const ctx = await getConseillerFromHeaders()

    // Vérifier la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))

    if (pecs.length === 0) {
      return jsonError('Prise en charge introuvable', 404)
    }

    const pec = pecs[0]
    const now = new Date().toISOString()

    // Vérifier que le tiers existe et appartient à cette prise en charge
    const tiersRows = await db
      .select()
      .from(tiersIntervenant)
      .where(and(
        eq(tiersIntervenant.id, tiersId),
        eq(tiersIntervenant.priseEnChargeId, pec.id)
      ))

    if (tiersRows.length === 0) {
      return jsonError('Tiers introuvable', 404)
    }

    // Révoquer le tiers
    await db.update(tiersIntervenant)
      .set({ statut: 'revoque', misAJourLe: now })
      .where(eq(tiersIntervenant.id, tiersId))

    // Désactiver le participant conversation
    await db.update(participantConversation)
      .set({ actif: 0, quitteLe: now })
      .where(and(
        eq(participantConversation.participantId, tiersId),
        eq(participantConversation.priseEnChargeId, pec.id)
      ))

    // Journal
    const tiers = tiersRows[0]
    await logJournal(
      pec.id,
      'tiers_revoque',
      'conseiller',
      ctx.id,
      `Révocation de ${tiers.prenom} ${tiers.nom} (${tiers.role})`,
      { cibleType: 'tiers', cibleId: tiersId }
    )

    // Audit
    await logAudit(ctx.id, 'revoke_tiers', 'tiers', tiersId, { referralId: id })

    return jsonSuccess({ success: true })
  } catch (error) {
    console.error('[Tiers DELETE]', error)
    return jsonError('Erreur serveur', 500)
  }
}
