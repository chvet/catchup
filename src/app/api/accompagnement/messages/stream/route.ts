// GET /api/accompagnement/messages/stream?token=xxx
// SSE endpoint pour la réception de messages en temps réel

import { db } from '@/data/db'
import { messageDirect } from '@/data/schema'
import { eq, and, gt } from 'drizzle-orm'
import { getBeneficiaireFromTokenString } from '@/lib/accompagnement-helpers'

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

  const beneficiaire = await getBeneficiaireFromTokenString(token)
  if (!beneficiaire) {
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
      sendEvent(JSON.stringify({ type: 'connected', priseEnChargeId: beneficiaire.priseEnChargeId }))

      const poll = async () => {
        while (!cancelled) {
          try {
            // Vérifier les nouveaux messages
            const newMessages = await db
              .select()
              .from(messageDirect)
              .where(
                and(
                  eq(messageDirect.priseEnChargeId, beneficiaire.priseEnChargeId),
                  gt(messageDirect.horodatage, lastCheck)
                )
              )

            if (newMessages.length > 0) {
              for (const msg of newMessages) {
                sendEvent(JSON.stringify({ type: 'message', ...msg }))
              }
              // Mettre à jour lastCheck avec le dernier message
              lastCheck = newMessages[newMessages.length - 1].horodatage
            }

            heartbeatCount++
            // Heartbeat toutes les ~15 secondes (15/2 = 7-8 cycles de 2s)
            if (heartbeatCount >= 7) {
              sendHeartbeat()
              heartbeatCount = 0
            }

            // Attendre 1 seconde avant le prochain poll
            await new Promise((resolve) => setTimeout(resolve, 1000))
          } catch (error) {
            console.error('[SSE Poll Error]', error)
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
