// GET /api/tiers/messages/stream?token=xxx
// SSE endpoint pour la réception de messages en temps réel (tiers)

import { db } from '@/data/db'
import { messageDirect } from '@/data/schema'
import { eq, and, gt } from 'drizzle-orm'
import { getTiersFromTokenString } from '@/lib/tiers-helpers'
import { sql } from 'drizzle-orm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return new Response(JSON.stringify({ error: 'Token requis' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let tiers
  try {
    tiers = await getTiersFromTokenString(token)
  } catch {
    return new Response(JSON.stringify({ error: 'Non autorisé' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const encoder = new TextEncoder()
  let cancelled = false

  const stream = new ReadableStream({
    async start(controller) {
      let lastCheck = new Date().toISOString()
      let heartbeatCount = 0

      const sendEvent = (data: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch {
          cancelled = true
        }
      }

      const sendHeartbeat = () => {
        try {
          controller.enqueue(encoder.encode(':\n\n'))
        } catch {
          cancelled = true
        }
      }

      // Envoyer un event de connexion réussie
      sendEvent(JSON.stringify({ type: 'connected', priseEnChargeId: tiers.priseEnChargeId }))

      const poll = async () => {
        while (!cancelled) {
          try {
            // Vérifier les nouveaux messages tiers_beneficiaire
            const newMessages = await db
              .select()
              .from(messageDirect)
              .where(
                and(
                  eq(messageDirect.priseEnChargeId, tiers.priseEnChargeId),
                  eq(messageDirect.conversationType, 'tiers_beneficiaire'),
                  gt(messageDirect.horodatage, lastCheck),
                  sql`(
                    (${messageDirect.expediteurType} = 'tiers' AND ${messageDirect.expediteurId} = ${tiers.tiersId})
                    OR ${messageDirect.expediteurType} = 'beneficiaire'
                  )`
                )
              )

            if (newMessages.length > 0) {
              for (const msg of newMessages) {
                sendEvent(JSON.stringify({ type: 'message', ...msg }))
              }
              lastCheck = newMessages[newMessages.length - 1].horodatage
            }

            heartbeatCount++
            // Heartbeat toutes les ~15 secondes (15/2 = 7-8 cycles de 2s)
            if (heartbeatCount >= 7) {
              sendHeartbeat()
              heartbeatCount = 0
            }

            // Attendre 2 secondes avant le prochain poll
            await new Promise((resolve) => setTimeout(resolve, 2000))
          } catch (error) {
            console.error('[Tiers SSE Poll Error]', error)
            cancelled = true
          }
        }

        try {
          controller.close()
        } catch {
          // Stream déjà fermé
        }
      }

      poll()
    },
    cancel() {
      cancelled = true
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
