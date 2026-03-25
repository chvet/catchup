// Web Push — Configuration VAPID et envoi de notifications
// Utilise la bibliothèque web-push avec clés VAPID

import webpush from 'web-push'

let vapidConfigured = false

function ensureVapidConfigured() {
  if (vapidConfigured) return

  let publicKey = process.env.VAPID_PUBLIC_KEY
  let privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT || 'mailto:noreply@fondation-jae.org'

  if (!publicKey || !privateKey) {
    // Générer des clés VAPID si non configurées
    const generated = webpush.generateVAPIDKeys()
    publicKey = generated.publicKey
    privateKey = generated.privateKey

    console.log('='.repeat(60))
    console.log('[VAPID] Clés générées automatiquement.')
    console.log('[VAPID] Ajoutez ces variables d\'environnement pour les conserver :')
    console.log(`VAPID_PUBLIC_KEY=${publicKey}`)
    console.log(`VAPID_PRIVATE_KEY=${privateKey}`)
    console.log('='.repeat(60))
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)
  vapidConfigured = true
}

/**
 * Retourne la clé publique VAPID (pour le client)
 */
export function getVapidPublicKey(): string {
  ensureVapidConfigured()
  return process.env.VAPID_PUBLIC_KEY || ''
}

export interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

export interface PushPayload {
  title: string
  body: string
  url?: string
  actions?: Array<{ action: string; title: string }>
}

/**
 * Envoie une notification push à une souscription
 * Retourne true si envoyée, false si la souscription est expirée/invalide
 */
export async function sendPushNotification(
  subscription: PushSubscriptionData,
  title: string,
  body: string,
  url?: string
): Promise<boolean> {
  ensureVapidConfigured()

  const payload: PushPayload = { title, body }
  if (url) payload.url = url

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload)
    )
    return true
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number })?.statusCode
    // 410 Gone ou 404 Not Found = souscription expirée
    if (statusCode === 410 || statusCode === 404) {
      return false
    }
    console.error('[Push] Erreur envoi notification:', error)
    return false
  }
}
