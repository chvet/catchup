// GET /api/visio/signal/stream?sessionId=xxx&role=conseiller|beneficiaire
// SSE stream pour recevoir les signaux WebRTC de l'autre partie

import { getSession, subscribe } from '@/lib/visio-signal'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('sessionId')
  const role = searchParams.get('role') as 'conseiller' | 'beneficiaire' | null

  if (!sessionId || !role) {
    return new Response('sessionId et role requis', { status: 400 })
  }

  const session = getSession(sessionId)
  if (!session) {
    return new Response('Session introuvable', { status: 404 })
  }

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Envoyer les signaux existants de l'autre partie (rattrapage)
      for (const signal of session.signals) {
        if (signal.from !== role) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(signal)}\n\n`))
        }
      }

      // S'abonner aux nouveaux signaux
      const unsubscribe = subscribe(sessionId, (signal) => {
        if (signal.from !== role) {
          try {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(signal)}\n\n`))
          } catch {
            unsubscribe()
          }
        }
      })

      // Heartbeat toutes les 15s
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
          unsubscribe()
        }
      }, 15_000)

      // Cleanup à la déconnexion
      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unsubscribe()
        try { controller.close() } catch { /* already closed */ }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
