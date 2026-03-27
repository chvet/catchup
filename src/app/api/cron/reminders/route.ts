// GET /api/cron/reminders
// Verifie les beneficiaires inactifs et cree des rappels + notifications push
// Peut etre appele par un cron externe ou piggybacke sur les alerts

import { db } from '@/data/db'
import { priseEnCharge, messageDirect, rappel, conseiller, referral, utilisateur } from '@/data/schema'
import { eq, and, sql, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Seuils de rappel
const SEUIL_INACTIF_48H = 48 * 60 * 60 * 1000 // 48 heures
const SEUIL_ALERTE_7J = 7 * 24 * 60 * 60 * 1000 // 7 jours

export async function GET() {
  try {
    const now = new Date()
    const nowISO = now.toISOString()
    let rappelsCrees = 0

    // Recuperer toutes les prises en charge actives
    const prisesActives = await db
      .select({
        id: priseEnCharge.id,
        conseillerId: priseEnCharge.conseillerId,
        referralId: priseEnCharge.referralId,
        structureId: priseEnCharge.structureId,
      })
      .from(priseEnCharge)
      .where(
        sql`${priseEnCharge.statut} IN ('prise_en_charge', 'recontacte')`
      )

    for (const pec of prisesActives) {
      // Trouver le dernier message du beneficiaire
      const lastBenefMsg = await db
        .select({ horodatage: messageDirect.horodatage })
        .from(messageDirect)
        .where(
          and(
            eq(messageDirect.priseEnChargeId, pec.id),
            eq(messageDirect.expediteurType, 'beneficiaire')
          )
        )
        .orderBy(desc(messageDirect.horodatage))
        .limit(1)

      if (lastBenefMsg.length === 0) continue

      const lastMsgDate = new Date(lastBenefMsg[0].horodatage)
      const elapsed = now.getTime() - lastMsgDate.getTime()

      // Recuperer le prenom du conseiller pour le message push
      const conseillerInfo = await db
        .select({ prenom: conseiller.prenom })
        .from(conseiller)
        .where(eq(conseiller.id, pec.conseillerId))
        .limit(1)

      const conseillerPrenom = conseillerInfo[0]?.prenom || 'votre conseiller'

      // Recuperer l'utilisateurId et prenom du beneficiaire
      const refInfo = await db
        .select({
          utilisateurId: referral.id, // referralId est utilise comme userId dans le systeme push
          moyenContact: referral.moyenContact,
        })
        .from(referral)
        .where(eq(referral.id, pec.referralId))
        .limit(1)

      // === 48h sans message du beneficiaire ===
      if (elapsed >= SEUIL_INACTIF_48H && elapsed < SEUIL_ALERTE_7J) {
        // Verifier qu'on n'a pas deja envoye un rappel de ce type recemment
        const deuxJoursAvant = new Date(now.getTime() - SEUIL_INACTIF_48H).toISOString()
        const existant = await db
          .select({ id: rappel.id })
          .from(rappel)
          .where(
            and(
              eq(rappel.priseEnChargeId, pec.id),
              eq(rappel.type, 'beneficiaire_inactif'),
              sql`${rappel.creeLe} > ${deuxJoursAvant}`
            )
          )
          .limit(1)

        if (existant.length === 0) {
          const contenu = `Ca fait un moment qu'on ne s'est pas parle ! Ton conseiller ${conseillerPrenom} est la pour toi.`

          await db.insert(rappel).values({
            id: uuidv4(),
            priseEnChargeId: pec.id,
            type: 'beneficiaire_inactif',
            statut: 'envoye',
            dateEnvoi: nowISO,
            contenu,
            creeLe: nowISO,
          })

          // Envoyer la notification push au beneficiaire
          try {
            const { notifyBeneficiaireNewMessage } = await import('@/lib/push-triggers')
            // Reutilise la notification existante — le beneficiaire verra un message de relance
            if (refInfo[0]) {
              await notifyBeneficiaireNewMessage(refInfo[0].utilisateurId, conseillerPrenom)
            }
          } catch {
            // Push non bloquant
          }

          rappelsCrees++
        }
      }

      // === 7 jours sans message — alerte au conseiller ===
      if (elapsed >= SEUIL_ALERTE_7J) {
        const septJoursAvant = new Date(now.getTime() - SEUIL_ALERTE_7J).toISOString()
        const existant = await db
          .select({ id: rappel.id })
          .from(rappel)
          .where(
            and(
              eq(rappel.priseEnChargeId, pec.id),
              eq(rappel.type, 'conseiller_alerte'),
              sql`${rappel.creeLe} > ${septJoursAvant}`
            )
          )
          .limit(1)

        if (existant.length === 0) {
          // Recuperer le prenom du beneficiaire depuis l'utilisateur
          const benefPrenom = refInfo[0]?.moyenContact?.split('@')[0] || 'Un beneficiaire'

          const contenu = `${benefPrenom} n'a pas donne de nouvelles depuis 7 jours`

          await db.insert(rappel).values({
            id: uuidv4(),
            priseEnChargeId: pec.id,
            type: 'conseiller_alerte',
            statut: 'envoye',
            dateEnvoi: nowISO,
            contenu,
            creeLe: nowISO,
          })

          // Notifier le conseiller
          try {
            const { notifyConseillerNewMessage } = await import('@/lib/push-triggers')
            await notifyConseillerNewMessage(pec.conseillerId, benefPrenom)
          } catch {
            // Push non bloquant
          }

          rappelsCrees++
        }
      }
    }

    return NextResponse.json({
      success: true,
      rappelsCrees,
      prisesVerifiees: prisesActives.length,
      timestamp: nowISO,
    })
  } catch (error) {
    console.error('[Cron reminders]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
