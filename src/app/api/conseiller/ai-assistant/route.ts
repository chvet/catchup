// POST /api/conseiller/ai-assistant
// Assistant IA privé pour les conseillers — streaming via AI SDK

import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { getConseillerFromHeaders } from '@/lib/api-helpers'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    // Vérifier l'authentification conseiller
    await getConseillerFromHeaders()

    const body = await req.json()
    const { messages, context } = body

    if (!messages || !Array.isArray(messages) || !context?.prenom) {
      return Response.json(
        { error: 'Messages et contexte (prenom) requis' },
        { status: 400 }
      )
    }

    const systemPrompt = `Tu es un assistant IA privé pour les conseillers d'orientation Catch'Up/Wesh.
Tu aides le conseiller à accompagner ${context.prenom}${context.age ? `, ${context.age} ans` : ''}.
${context.resumeConversation ? `Résumé de la conversation IA avec le bénéficiaire : ${context.resumeConversation}` : ''}

Ton rôle :
- Suggérer des approches pédagogiques adaptées au profil
- Proposer des formations ou métiers pertinents
- Aider à rédiger des messages bienveillants et motivants
- Alerter sur les signaux de fragilité et comment y répondre
- Être concis et professionnel

Réponds toujours en français.`

    const result = streamText({
      model: openai('gpt-4o'),
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
