// POST /api/conseiller/ai-assistant
// Assistant IA privé pour les conseillers — streaming via AI SDK

import { streamText } from 'ai'
import { getConseillerFromHeaders, jsonError } from '@/lib/api-helpers'
import { getLLMModel } from '@/lib/llm'
import { checkFeature } from '@/lib/quota-check'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    // Vérifier l'authentification conseiller
    const ctx = await getConseillerFromHeaders()

    // Feature gate : assistant IA réservé au plan Pro+
    if (ctx.structureId) {
      const gate = await checkFeature(ctx.structureId, 'assistant_ia')
      if (!gate.allowed) return jsonError(gate.message || 'Fonctionnalite reservee', 403)
    }

    const body = await req.json()
    const { messages, context } = body

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Messages requis' },
        { status: 400 }
      )
    }

    const hasContext = context?.prenom
    const systemPrompt = hasContext
      ? `Tu es un assistant IA privé pour les conseillers d'orientation Catch'Up.
Tu aides le conseiller à accompagner ${context.prenom}${context.age ? `, ${context.age} ans` : ''}.
${context.resumeConversation ? `Résumé de la conversation IA avec le bénéficiaire : ${context.resumeConversation}` : ''}

Ton rôle :
- Suggérer des approches pédagogiques adaptées au profil du bénéficiaire
- Proposer des formations ou métiers pertinents
- Aider à rédiger des messages bienveillants et motivants
- Alerter sur les signaux de fragilité et comment y répondre
- Être concis et professionnel

Réponds toujours en français.`
      : `Tu es un assistant IA privé pour les conseillers d'orientation Catch'Up.
Tu aides les conseillers dans leur travail quotidien d'accompagnement de jeunes (16-25 ans).

Ton rôle :
- Conseiller sur les approches pédagogiques
- Proposer des formations, métiers ou ressources
- Aider à rédiger des messages ou courriers
- Informer sur les dispositifs d'insertion (Garantie Jeunes, PACEA, CEJ, etc.)
- Être concis et professionnel

Réponds toujours en français.`

    const model = await getLLMModel('assistant')
    const result = streamText({
      model,
      system: systemPrompt,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      maxTokens: 500,
      temperature: 0.7,
    })

    return result.toDataStreamResponse()
  } catch (error: unknown) {
    console.error('[AI Assistant API Error]', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return Response.json({ error: message }, { status: 500 })
  }
}
