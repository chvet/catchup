// Webhook Vonage DLR (Delivery Receipt)
// Vonage envoie un callback quand le SMS est délivré, échoué, ou expiré
// URL à configurer dans Vonage Dashboard: https://catchup.jaeprive.fr/api/webhooks/vonage-dlr?secret=XXX

import { db } from '@/data/db'
import { notificationLog } from '@/data/schema'
import { eq } from 'drizzle-orm'

const env = process['env'] as Record<string, string | undefined>

const VONAGE_STATUS_MAP: Record<string, string> = {
  delivered: 'delivre',
  accepted: 'envoye',
  buffered: 'envoye',
  failed: 'echoue',
  rejected: 'echoue',
  expired: 'echoue',
  unknown: 'envoye',
}

async function handleDlr(params: Record<string, string>) {
  const messageId = params.messageId || params['message-id'] || params.messageid
  const status = params.status
  const errCode = params['err-code'] || params.errCode

  if (!messageId || !status) {
    return new Response('Missing params', { status: 400 })
  }

  const newStatut = VONAGE_STATUS_MAP[status] || 'envoye'

  try {
    await db
      .update(notificationLog)
      .set({
        statut: newStatut,
        erreur: errCode && errCode !== '0' ? `Vonage err-code: ${errCode}` : null,
        misAJourLe: new Date().toISOString(),
      })
      .where(eq(notificationLog.externalMessageId, messageId))

    console.log(`[Vonage DLR] messageId=${messageId} status=${status} → ${newStatut}`)
  } catch (e) {
    console.error('[Vonage DLR] Erreur update:', e)
  }

  return new Response('OK', { status: 200 })
}

// Vérifier le secret
function checkSecret(url: URL): boolean {
  const secret = env.VONAGE_WEBHOOK_SECRET
  if (!secret) return true // pas de secret configuré = pas de vérification
  return url.searchParams.get('secret') === secret
}

// Vonage peut envoyer en POST (form-encoded ou JSON)
export async function POST(request: Request) {
  const url = new URL(request.url)
  if (!checkSecret(url)) return new Response('Forbidden', { status: 403 })

  let params: Record<string, string> = {}
  const ct = request.headers.get('content-type') || ''

  if (ct.includes('application/json')) {
    params = await request.json()
  } else {
    const formData = await request.formData()
    formData.forEach((v, k) => { params[k] = String(v) })
  }

  return handleDlr(params)
}

// Vonage peut aussi envoyer en GET
export async function GET(request: Request) {
  const url = new URL(request.url)
  if (!checkSecret(url)) return new Response('Forbidden', { status: 403 })

  const params: Record<string, string> = {}
  url.searchParams.forEach((v, k) => { params[k] = v })

  return handleDlr(params)
}
