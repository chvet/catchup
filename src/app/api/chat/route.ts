import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { buildSystemPrompt } from '@/core/system-prompt'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages, profile, messageCount, fromQuiz } = await req.json()

    const systemPrompt = buildSystemPrompt(profile, messageCount || messages.length, fromQuiz)

    const result = streamText({
      model: openai('gpt-4o'),
      system: systemPrompt,
      messages,
      maxTokens: 500,
      temperature: 0.7,
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
