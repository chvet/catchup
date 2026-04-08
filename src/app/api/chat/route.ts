import { streamText } from 'ai'
import { buildSystemPrompt } from '@/core/system-prompt'
import { checkBeforeSend, recordUsage, estimateTokens, estimateMessagesTokens, LIMITS } from '@/lib/token-guard'
import { getLLMModel, getLLMInfo, reportLLMSuccess, reportLLMFailure, routeByComplexity } from '@/lib/llm'
import { db } from '@/data/db'
import { structure } from '@/data/schema'
import { eq } from 'drizzle-orm'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, profile, messageCount, fromQuiz, fragilityLevel, conversationId, userName, structureSlug, language, userLocation } = body || {}

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages requis' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
    }

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

    // ── Routage intelligent : modèle économique ou premium selon la complexité ──
    const lastUserMsg = messages[messages.length - 1]?.content || ''
    const tier = routeByComplexity({
      messageCount: messageCount || messages.length,
      lastUserMessage: lastUserMsg,
      fragilityLevel,
      profileStable: profile?.estStable,
    })

    const llmInfo = await getLLMInfo(tier)

    const guard = checkBeforeSend(
      convId,
      messages,
      systemPrompt.length,
      clientIP,
      llmInfo.model
    )

    if (!guard.allowed) {
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

    // ── Appel LLM avec streaming (provider + tier configurables) ──
    const model = await getLLMModel(tier)
    const result = streamText({
      model,
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
            llmInfo.model
          )
          reportLLMSuccess().catch(() => {})
        }
      },
    })

    return result.toDataStreamResponse({
      headers: {
        'X-LLM-Model': llmInfo.model,
        'X-LLM-Provider': llmInfo.provider,
        'X-LLM-Tier': tier,
      },
    })
  } catch (error: unknown) {
    console.error('[Chat API Error]', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    reportLLMFailure(message).catch(() => {})
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
