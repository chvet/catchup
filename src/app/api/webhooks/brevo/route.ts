// Webhook Brevo (ex-Sendinblue) — Delivery status pour emails transactionnels
// URL à configurer dans Brevo Dashboard: Transactional > Settings > Webhooks
// Events: delivered, hard_bounce, soft_bounce, spam, blocked, error, opened, click

import { db } from '@/data/db'
import { notificationLog } from '@/data/schema'
import { eq } from 'drizzle-orm'

const BREVO_STATUS_MAP: Record<string, string> = {
  delivered: 'delivre',
  opened: 'ouvert',
  click: 'clique',
  soft_bounce: 'rebond',
  hard_bounce: 'rebond',
  spam: 'spam',
  blocked: 'echoue',
  error: 'echoue',
  deferred: 'envoye',
  request: 'envoye',
}

const ERROR_EVENTS = ['soft_bounce', 'hard_bounce', 'blocked', 'error', 'spam']

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const event = String(body.event || '')
  const messageId = String(body['message-id'] || body.messageId || '')

  if (!event || !messageId) {
    return new Response('Missing event or message-id', { status: 400 })
  }

  const newStatut = BREVO_STATUS_MAP[event] || 'envoye'

  try {
    await db
      .update(notificationLog)
      .set({
        statut: newStatut,
        erreur: ERROR_EVENTS.includes(event) ? `Brevo: ${event}` : null,
        misAJourLe: new Date().toISOString(),
      })
      .where(eq(notificationLog.externalMessageId, messageId))

    console.log(`[Brevo Webhook] messageId=${messageId} event=${event} → ${newStatut}`)
  } catch (e) {
    console.error('[Brevo Webhook] Erreur update:', e)
  }

  return new Response('OK', { status: 200 })
}
