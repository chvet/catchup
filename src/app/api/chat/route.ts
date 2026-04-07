import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { buildSystemPrompt } from '@/core/system-prompt'
import { checkBeforeSend, recordUsage, estimateTokens, estimateMessagesTokens, LIMITS } from '@/lib/token-guard'
import { db } from '@/data/db'
import { structure } from '@/data/schema'
import { eq } from 'drizzle-orm'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, profile, messageCount, fromQuiz, fragilityLevel, conversationId, userName, structureSlug, language, userLocation } = await req.json()

    // ── Fetch structure prompt if structureSlug is provided ──
    let structurePrompt: string | undefined
    if (structureSlug && typeof structureSlug === 'string') {
      try {
        const structs = await db
          .select({ promptPersonnalise: structure.promptPersonnalise })
          .from(structure)
          .where(eq(structure.slug, structureSlug))
        if (structs.length > 0 && structs[0].promptPersonnalise) {
          structurePrompt = structs[0].promptPersonnalise
        }
      } catch (err) {
        console.warn('[Chat API] Failed to fetch structure prompt:', err)
      }
    }

    // ── Construire le system prompt ──
    const systemPrompt = buildSystemPrompt(profile, messageCount || messages.length, fromQuiz, fragilityLevel, userName, structurePrompt, language, userLocation || null)

    // ── Token Guard : vérifier les quotas AVANT d'appeler l'API ──
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0].trim()
      || req.headers.get('x-real-ip')
      || '0.0.0.0'

    const convId = conversationId || 'anonymous-' + clientIP

    const guard = checkBeforeSend(
      convId,
      messages,
      systemPrompt.length,
      clientIP,
      'gpt-4o'
    )

    if (!guard.allowed) {
      // Retourner un message lisible par l'utilisateur, pas une erreur technique
      return new Response(
        JSON.stringify({
          error: guard.reason,
          suggestReferral: guard.suggestReferral || false,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // ── Utiliser les messages tronqués si le contexte était trop long ──
    const effectiveMessages = guard.truncatedMessages || messages

    // ── Appel API OpenAI avec streaming ──
    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages: effectiveMessages,
      maxTokens: LIMITS.MAX_OUTPUT_TOKENS,
      temperature: 0.7,
      // Callback quand le streaming est terminé — enregistrer la consommation
      onFinish: ({ usage }) => {
        if (usage) {
          recordUsage(
            convId,
            clientIP,
            usage.promptTokens,
            usage.completionTokens,
            'gpt-4o'
          )
        }
      },
    })

    return result.toDataStreamResponse()
  } catch (error: unknown) {
    console.error('[Chat API Error]', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
