// Push notification triggers
// Fonctions d'aide pour envoyer des notifications push aux utilisateurs
// Toutes les fonctions sont non-bloquantes (try/catch, ne font pas échouer l'appelant)

import { db } from '@/data/db'
import { pushSubscription, conseiller } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { sendPushNotification } from '@/lib/push'

/**
 * Envoie une notification à tous les appareils d'un utilisateur
 * Supprime les souscriptions expirées automatiquement
 */
async function notifyUser(
  type: 'conseiller' | 'beneficiaire',
  userId: string,
  title: string,
  body: string,
  url?: string
) {
  try {
    const subs = await db
      .select()
      .from(pushSubscription)
      .where(
        and(
          eq(pushSubscription.type, type),
          eq(pushSubscription.userId, userId)
        )
      )

    if (subs.length === 0) return

    const results = await Promise.allSettled(
      subs.map(async (sub) => {
        const success = await sendPushNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.keysP256dh, auth: sub.keysAuth },
          },
          title,
          body,
          url
        )

        // Supprimer la souscription si expirée
        if (!success) {
          await db
            .delete(pushSubscription)
            .where(eq(pushSubscription.id, sub.id))
        }
      })
    )

    const sent = results.filter((r) => r.status === 'fulfilled').length
    if (sent > 0) {
      console.log(`[Push] ${sent} notification(s) envoyée(s) à ${type}:${userId}`)
    }
  } catch (error) {
    console.error(`[Push] Erreur notifyUser(${type}, ${userId}):`, error)
  }
}

/**
 * Envoie une notification à tous les conseillers d'une structure
 */
async function notifyStructureConseillers(
  structureId: string,
  title: string,
  body: string,
  url?: string
) {
  try {
    const conseillers = await db
      .select({ id: conseiller.id })
      .from(conseiller)
      .where(eq(conseiller.structureId, structureId))

    await Promise.allSettled(
      conseillers.map((c) => notifyUser('conseiller', c.id, title, body, url))
    )
  } catch (error) {
    console.error(`[Push] Erreur notifyStructureConseillers(${structureId}):`, error)
  }
}

// === NOTIFICATIONS CONSEILLER ===

/**
 * Nouveau cas en attente dans la structure
 */
export async function notifyConseillerNewCase(
  structureId: string,
  referralInfo: { prenom?: string; priorite?: string }
) {
  try {
    const prenom = referralInfo.prenom || 'Un jeune'
    const urgence = referralInfo.priorite === 'critique' ? ' [URGENT]' : ''
    await notifyStructureConseillers(
      structureId,
      `Nouveau cas en attente${urgence}`,
      `${prenom} a besoin d'accompagnement.`,
      '/conseiller/file-active'
    )
  } catch (error) {
    console.error('[Push] notifyConseillerNewCase:', error)
  }
}

/**
 * Nouveau message d'un bénéficiaire
 */
export async function notifyConseillerNewMessage(
  conseillerId: string,
  beneficiairePrenom: string
) {
  try {
    await notifyUser(
      'conseiller',
      conseillerId,
      `Nouveau message de ${beneficiairePrenom}`,
      `${beneficiairePrenom} vous a envoyé un message.`,
      '/conseiller/file-active'
    )
  } catch (error) {
    console.error('[Push] notifyConseillerNewMessage:', error)
  }
}

/**
 * Rappel de rendez-vous pour le conseiller
 */
export async function notifyConseillerRdvReminder(
  conseillerId: string,
  rdvTitre: string,
  minutes: number
) {
  try {
    await notifyUser(
      'conseiller',
      conseillerId,
      `${minutes} min avant votre RDV`,
      rdvTitre,
      '/conseiller/agenda'
    )
  } catch (error) {
    console.error('[Push] notifyConseillerRdvReminder:', error)
  }
}

// === NOTIFICATIONS BÉNÉFICIAIRE ===

/**
 * Le conseiller a accepté l'accompagnement
 */
export async function notifyBeneficiaireAccepted(
  utilisateurId: string,
  conseillerPrenom: string
) {
  try {
    await notifyUser(
      'beneficiaire',
      utilisateurId,
      `${conseillerPrenom} a accepté de vous accompagner`,
      'Vous pouvez maintenant échanger directement.',
      '/'
    )
  } catch (error) {
    console.error('[Push] notifyBeneficiaireAccepted:', error)
  }
}

/**
 * Nouveau message du conseiller
 */
export async function notifyBeneficiaireNewMessage(
  utilisateurId: string,
  conseillerPrenom: string
) {
  try {
    await notifyUser(
      'beneficiaire',
      utilisateurId,
      `Nouveau message de ${conseillerPrenom}`,
      `${conseillerPrenom} vous a envoyé un message.`,
      '/'
    )
  } catch (error) {
    console.error('[Push] notifyBeneficiaireNewMessage:', error)
  }
}

/**
 * Rendez-vous planifié
 */
export async function notifyBeneficiaireRdv(
  utilisateurId: string,
  titre: string,
  dateHeure: string
) {
  try {
    const date = new Date(dateHeure)
    const dateStr = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
    await notifyUser(
      'beneficiaire',
      utilisateurId,
      `RDV planifie : ${titre}`,
      dateStr,
      '/'
    )
  } catch (error) {
    console.error('[Push] notifyBeneficiaireRdv:', error)
  }
}
