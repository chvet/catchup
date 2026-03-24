// GET    /api/conseiller/rdv/[rdvId] — Détail d'un RDV
// PATCH  /api/conseiller/rdv/[rdvId] — Modifier un RDV
// DELETE /api/conseiller/rdv/[rdvId] — Annuler un RDV (statut → annule)

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { rendezVous, priseEnCharge } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { logJournal } from '@/lib/journal'

// Helper : vérifier que le RDV appartient au conseiller
async function getRdvForConseiller(rdvId: string, conseillerId: string) {
  const rdvs = await db
    .select()
    .from(rendezVous)
    .where(eq(rendezVous.id, rdvId))

  if (rdvs.length === 0) return null
  const rdv = rdvs[0]

  // Vérifier que la prise en charge associée appartient au conseiller
  const pecs = await db
    .select()
    .from(priseEnCharge)
    .where(and(eq(priseEnCharge.id, rdv.priseEnChargeId), eq(priseEnCharge.conseillerId, conseillerId)))

  if (pecs.length === 0) return null

  return rdv
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ rdvId: string }> }
) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.id) return jsonError('Non autorisé', 401)

    const { rdvId } = await params
    const rdv = await getRdvForConseiller(rdvId, ctx.id)

    if (!rdv) {
      return jsonError('RDV introuvable ou non autorisé', 404)
    }

    return jsonSuccess({
      rdv: {
        ...rdv,
        participants: rdv.participants ? JSON.parse(rdv.participants) : [],
      },
    })
  } catch (error) {
    console.error('[RDV GET detail]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ rdvId: string }> }
) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.id) return jsonError('Non autorisé', 401)

    const { rdvId } = await params
    const rdv = await getRdvForConseiller(rdvId, ctx.id)

    if (!rdv) {
      return jsonError('RDV introuvable ou non autorisé', 404)
    }

    const body = await request.json()
    const allowedFields = ['titre', 'dateHeure', 'dureeMinutes', 'lieu', 'statut', 'description', 'lienVisio']
    const updates: Record<string, unknown> = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return jsonError('Aucun champ à modifier', 400)
    }

    updates.misAJourLe = new Date().toISOString()

    await db
      .update(rendezVous)
      .set(updates)
      .where(eq(rendezVous.id, rdvId))

    // Tracer dans le journal
    await logJournal(
      rdv.priseEnChargeId,
      'rdv_planifie',
      'conseiller',
      ctx.id,
      `RDV modifié : ${updates.titre || rdv.titre}`,
      {
        cibleType: 'rendez_vous',
        cibleId: rdvId,
        details: { modifications: Object.keys(updates).filter(k => k !== 'misAJourLe') },
      }
    )

    await logAudit(ctx.id, 'rdv_modifie', 'rendez_vous', rdvId, updates)

    // Retourner le RDV mis à jour
    const updated = await db
      .select()
      .from(rendezVous)
      .where(eq(rendezVous.id, rdvId))

    return jsonSuccess({
      rdv: {
        ...updated[0],
        participants: updated[0].participants ? JSON.parse(updated[0].participants) : [],
      },
    })
  } catch (error) {
    console.error('[RDV PATCH]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ rdvId: string }> }
) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.id) return jsonError('Non autorisé', 401)

    const { rdvId } = await params
    const rdv = await getRdvForConseiller(rdvId, ctx.id)

    if (!rdv) {
      return jsonError('RDV introuvable ou non autorisé', 404)
    }

    const now = new Date().toISOString()

    await db
      .update(rendezVous)
      .set({ statut: 'annule', misAJourLe: now })
      .where(eq(rendezVous.id, rdvId))

    // Tracer dans le journal
    await logJournal(
      rdv.priseEnChargeId,
      'rdv_planifie',
      'conseiller',
      ctx.id,
      `RDV annulé : ${rdv.titre}`,
      {
        cibleType: 'rendez_vous',
        cibleId: rdvId,
        details: { action: 'annulation' },
      }
    )

    await logAudit(ctx.id, 'rdv_annule', 'rendez_vous', rdvId)

    return jsonSuccess({ success: true })
  } catch (error) {
    console.error('[RDV DELETE]', error)
    return jsonError('Erreur serveur', 500)
  }
}
