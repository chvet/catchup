// POST /api/referrals/[id]/cancel — Annuler une demande d'accompagnement
// Accessible par le bénéficiaire (identifié par le referralId en localStorage)
// Gère tous les statuts : en_attente, nouvelle, prise_en_charge

import { NextResponse } from 'next/server'
import { db } from '@/data/db'
import { referral, priseEnCharge, messageDirect } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { logJournal } from '@/lib/journal'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Vérifier que le referral existe
    const refs = await db.select().from(referral).where(eq(referral.id, id))
    if (refs.length === 0) {
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 })
    }

    const ref = refs[0]
    const now = new Date().toISOString()

    // Demande en attente ou nouvelle → simple annulation
    if (ref.statut === 'en_attente' || ref.statut === 'nouvelle') {
      await db
        .update(referral)
        .set({ statut: 'annulee', misAJourLe: now })
        .where(eq(referral.id, id))

      return NextResponse.json({ success: true, message: 'Demande annulée' })
    }

    // Accompagnement en cours → annulation avec notification au conseiller
    if (ref.statut === 'prise_en_charge') {
      const pecs = await db.select().from(priseEnCharge).where(
        and(
          eq(priseEnCharge.referralId, id),
          eq(priseEnCharge.statut, 'prise_en_charge')
        )
      )

      // Clôturer le referral
      await db.update(referral).set({
        statut: 'annulee',
        misAJourLe: now,
      }).where(eq(referral.id, id))

      for (const pec of pecs) {
        // Clôturer la prise en charge
        await db.update(priseEnCharge).set({
          statut: 'rupture',
          termineeLe: now,
          misAJourLe: now,
        }).where(eq(priseEnCharge.id, pec.id))

        // Envoyer un message système au conseiller
        await db.insert(messageDirect).values({
          id: uuidv4(),
          priseEnChargeId: pec.id,
          expediteurType: 'conseiller',
          expediteurId: 'systeme',
          contenu: JSON.stringify({
            type: 'rupture',
            motif: 'Le bénéficiaire a annulé sa demande d\'accompagnement.',
            comportementInaproprie: false,
            parBeneficiaire: true,
          }),
          conversationType: 'direct',
          lu: 0,
          horodatage: now,
        })

        // Log dans le journal
        await logJournal(
          pec.id,
          'rupture_beneficiaire',
          'systeme',
          ref.utilisateurId,
          'Le bénéficiaire a annulé son accompagnement.',
          { details: { initiePar: 'beneficiaire', action: 'annulation' } }
        )
      }

      return NextResponse.json({ success: true, message: 'Accompagnement annulé' })
    }

    // Déjà terminé/rompu/annulé → rien à faire
    return NextResponse.json({ success: true, message: 'Aucune action nécessaire' })
  } catch (error) {
    console.error('[Referral Cancel]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
