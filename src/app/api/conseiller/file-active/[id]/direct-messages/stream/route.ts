// GET /api/conseiller/file-active/[id]/direct-messages/stream
// SSE endpoint — temps reel pour les messages beneficiaire -> conseiller

import { getConseillerFromHeaders, jsonError } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { priseEnCharge, messageDirect } from '@/data/schema'
import { eq, and, gt } from 'drizzle-orm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: referralId } = await params
    const ctx = await getConseillerFromHeaders()

    if (!ctx.id) {
      return jsonError('Non authentifie', 401)
    }

    // Trouver la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, referralId))

    if (pecs.length === 0) {
      return jsonError('Aucune prise en charge trouvee', 404)
    }

    const pec = pecs[0]
    const priseEnChargeId = pec.id

    const encoder = new TextEncoder()
    let lastCheck = new Date().toISOString()
    let alive = true

    const stream = new ReadableStream({
      async start(controller) {
        // Envoyer un evenement initial de connexion
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'connected', priseEnChargeId })}\n\n`)
        )

        // Intervalle de poll : toutes les 2 secondes
        const pollInterval = setInterval(async () => {
          if (!alive) {
            clearInterval(pollInterval)
            return
          }

          try {
            // Chercher les nouveaux messages du beneficiaire
            const newMessages = await db
              .select()
              .from(messageDirect)
              .where(
                and(
                  eq(messageDirect.priseEnChargeId, priseEnChargeId),
                  eq(messageDirect.expediteurType, 'beneficiaire'),
                  gt(messageDirect.horodatage, lastCheck)
                )
              )

            if (newMessages.length > 0) {
              // Mettre a jour le curseur
              lastCheck = newMessages[newMessages.length - 1].horodatage

              for (const msg of newMessages) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'message', message: msg })}\n\n`)
                )
              }
            }
          } catch (error) {
            console.error('[SSE Poll Error]', error)
            // Ne pas fermer le stream sur une erreur de poll isolee
          }
        }, 2000)

        // Heartbeat toutes les 15 secondes
        const heartbeatInterval = setInterval(() => {
          if (!alive) {
            clearInterval(heartbeatInterval)
            return
          }

          try {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`))
          } catch {
            // Le stream est probablement ferme
            alive = false
            clearInterval(heartbeatInterval)
            clearInterval(pollInterval)
          }
        }, 15000)

        // Nettoyage quand le client se deconnecte
        // On ecoute l'abort signal de la requete
        _request.signal.addEventListener('abort', () => {
          alive = false
          clearInterval(pollInterval)
          clearInterval(heartbeatInterval)
          try {
            controller.close()
          } catch {
            // Deja ferme
          }
        })
      },

      cancel() {
        alive = false
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
  } catch (error) {
    console.error('[Direct Messages Stream]', error)
    return jsonError('Erreur serveur', 500)
  }
}
