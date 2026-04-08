// LLM Abstraction Layer — Multi-provider support via Vercel AI SDK
// Supporte OpenAI, Anthropic, Mistral (extensible)

import { createOpenAI } from '@ai-sdk/openai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { createMistral } from '@ai-sdk/mistral'
import { getActiveProvider, resolveProviders, reportSuccess, reportFailure, type ProviderEntry } from './provider-resolver'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyLanguageModel = any

// --- Model defaults per provider and use case ---

const DEFAULT_MODELS: Record<string, Record<string, string>> = {
  openai: {
    chat: 'gpt-4o',
    summary: 'gpt-4o-mini',
    assistant: 'gpt-4o',
  },
  anthropic: {
    chat: 'claude-sonnet-4-20250514',
    summary: 'claude-haiku-4-20250514',
    assistant: 'claude-sonnet-4-20250514',
  },
  mistral: {
    chat: 'mistral-large-latest',
    summary: 'mistral-small-latest',
    assistant: 'mistral-large-latest',
  },
}

// --- Provider factories ---

function createProviderInstance(name: string) {
  switch (name) {
    case 'openai':
      return createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
    case 'anthropic':
      return createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    case 'mistral':
      return createMistral({ apiKey: process.env.MISTRAL_API_KEY })
    default:
      throw new Error(`Unknown LLM provider: ${name}`)
  }
}

// --- Model resolution ---

function resolveModelId(provider: ProviderEntry, useCase: string): string {
  // Check reglages overrides first (admin-configured)
  const override = provider.reglages?.[`${useCase}Model`] as string | undefined
  if (override) return override

  // Fall back to defaults
  return DEFAULT_MODELS[provider.providerName]?.[useCase] || DEFAULT_MODELS.openai[useCase]
}

// --- Smart routing: choose model tier based on conversation complexity ---

interface RoutingContext {
  messageCount: number
  lastUserMessage: string
  fragilityLevel?: string
  profileStable?: boolean
}

/**
 * Determines whether to use the cheap (summary-tier) or expensive (chat-tier) model.
 * Returns 'chat' for complex interactions, 'summary' for simple ones.
 */
export function routeByComplexity(ctx: RoutingContext): 'chat' | 'summary' {
  const msg = ctx.lastUserMessage?.trim() || ''
  const msgLen = msg.length

  // Always use premium model for fragility cases
  if (ctx.fragilityLevel === 'high' || ctx.fragilityLevel === 'medium') return 'chat'

  // Premium for advanced conversations (profile building, career suggestions)
  if (ctx.messageCount > 12) return 'chat'

  // Premium for long/complex user messages (detailed questions)
  if (msgLen > 300) return 'chat'

  // Premium if profile is stabilizing (need precise RIASEC extraction)
  if (ctx.profileStable) return 'chat'

  // Economy for early conversation (greetings, short answers, discovery phase)
  if (ctx.messageCount <= 6 && msgLen < 150) return 'summary'

  // Economy for very short messages (< 50 chars, likely "oui", "non", "je sais pas")
  if (msgLen < 50) return 'summary'

  // Default: premium for everything else
  return 'chat'
}

// --- Public API ---

export type LLMUseCase = 'chat' | 'summary' | 'assistant'

/**
 * Returns the LanguageModel for the highest-priority active LLM provider.
 * Falls back to OpenAI if no provider is configured.
 */
export async function getLLMModel(useCase: LLMUseCase): Promise<AnyLanguageModel> {
  const provider = await getActiveProvider('llm')

  if (!provider) {
    // Ultimate fallback: OpenAI (same behavior as before provider-resolver)
    console.warn('[LLM] No active provider found, falling back to OpenAI')
    const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
    return openai(DEFAULT_MODELS.openai[useCase])
  }

  const instance = createProviderInstance(provider.providerName)
  const modelId = resolveModelId(provider, useCase)

  return instance(modelId)
}

/**
 * Returns the active LLM provider name and model ID (for logging/billing).
 */
export async function getLLMInfo(useCase: LLMUseCase): Promise<{ provider: string; model: string }> {
  const provider = await getActiveProvider('llm')
  const name = provider?.providerName ?? 'openai'
  const modelId = provider ? resolveModelId(provider, useCase) : DEFAULT_MODELS.openai[useCase]
  return { provider: name, model: modelId }
}

/**
 * Tries LLM providers in fallback order. Returns the first working model.
 * Use for critical paths that must not fail (e.g., referral summary).
 */
export async function getLLMModelWithFallback(useCase: LLMUseCase): Promise<{ model: AnyLanguageModel; provider: string; modelId: string }> {
  const providers = await resolveProviders('llm')
  const active = providers.filter(p => p.actif && p.configured)

  for (const provider of active) {
    try {
      const instance = createProviderInstance(provider.providerName)
      const modelId = resolveModelId(provider, useCase)
      return { model: instance(modelId), provider: provider.providerName, modelId }
    } catch (err) {
      console.warn(`[LLM] Provider ${provider.providerName} init failed:`, (err as Error).message)
    }
  }

  // Last resort
  console.warn('[LLM] All providers failed, using OpenAI fallback')
  const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY })
  const modelId = DEFAULT_MODELS.openai[useCase]
  return { model: openai(modelId), provider: 'openai', modelId }
}

/**
 * Report success/failure for the active LLM provider.
 */
export async function reportLLMSuccess(): Promise<void> {
  const provider = await getActiveProvider('llm')
  if (provider) await reportSuccess('llm', provider.providerName)
}

export async function reportLLMFailure(error: string): Promise<void> {
  const provider = await getActiveProvider('llm')
  if (provider) await reportFailure('llm', provider.providerName, error)
}

// --- Pricing (for token-guard cost estimation) ---

export const LLM_PRICING: Record<string, { input: number; output: number }> = {
  // OpenAI ($ per token)
  'gpt-4o': { input: 2.50 / 1_000_000, output: 10.00 / 1_000_000 },
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
  // Anthropic
  'claude-sonnet-4-20250514': { input: 3.00 / 1_000_000, output: 15.00 / 1_000_000 },
  'claude-haiku-4-20250514': { input: 0.80 / 1_000_000, output: 4.00 / 1_000_000 },
  // Mistral
  'mistral-large-latest': { input: 2.00 / 1_000_000, output: 6.00 / 1_000_000 },
  'mistral-small-latest': { input: 0.20 / 1_000_000, output: 0.60 / 1_000_000 },
}

/**
 * Get pricing for a model. Falls back to gpt-4o pricing if unknown.
 */
export function getModelPricing(modelId: string): { input: number; output: number } {
  return LLM_PRICING[modelId] ?? LLM_PRICING['gpt-4o']
}
