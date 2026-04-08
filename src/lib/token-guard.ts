// Token Guard — Protection contre les coûts excessifs des API LLM
// Gère les quotas par session, par jour et globalement
// Estime les tokens AVANT envoi pour éviter les mauvaises surprises

import { getModelPricing } from '@/lib/llm'

// ─── Tarifs multi-provider (fallback si le modèle n'est pas connu) ───
const PRICING: Record<string, { input: number; output: number }> = {
  'gpt-4o': { input: 2.50 / 1_000_000, output: 10.00 / 1_000_000 },
  'gpt-4o-mini': { input: 0.15 / 1_000_000, output: 0.60 / 1_000_000 },
  'claude-sonnet-4-20250514': { input: 3.00 / 1_000_000, output: 15.00 / 1_000_000 },
  'claude-haiku-4-20250514': { input: 0.80 / 1_000_000, output: 4.00 / 1_000_000 },
  'mistral-large-latest': { input: 2.00 / 1_000_000, output: 6.00 / 1_000_000 },
  'mistral-small-latest': { input: 0.20 / 1_000_000, output: 0.60 / 1_000_000 },
}

// ─── Limites configurables via variables d'environnement ───
export const LIMITS = {
  // Nombre max de messages IA par conversation (au-delà, on suggère un conseiller)
  MAX_MESSAGES_PER_CONVERSATION: parseInt(process.env.MAX_MESSAGES_PER_CONV || '999'),

  // Nombre max de tokens en sortie par message
  MAX_OUTPUT_TOKENS: parseInt(process.env.MAX_OUTPUT_TOKENS || '500'),

  // Budget quotidien global en dollars (toutes conversations confondues)
  DAILY_BUDGET_USD: parseFloat(process.env.DAILY_BUDGET_USD || '999'),

  // Budget max par conversation en dollars
  MAX_COST_PER_CONVERSATION: parseFloat(process.env.MAX_COST_PER_CONV || '999'),

  // Nombre max de conversations par IP par jour (anti-abus)
  MAX_CONVERSATIONS_PER_IP_PER_DAY: parseInt(process.env.MAX_CONV_PER_IP || '999'),

  // Nombre max de tokens dans le contexte envoyé (tronquer si dépassé)
  MAX_CONTEXT_TOKENS: parseInt(process.env.MAX_CONTEXT_TOKENS || '8000'),

  // Limite quotidienne de tokens par utilisateur/IP (input + output combinés)
  TOKEN_DAILY_LIMIT: parseInt(process.env.TOKEN_DAILY_LIMIT || '9999999'),

  // Limite mensuelle de tokens par utilisateur/IP
  TOKEN_MONTHLY_LIMIT: parseInt(process.env.TOKEN_MONTHLY_LIMIT || '99999999'),
}

// ─── Compteurs en mémoire (réinitialisés au restart) ───
interface DailyCounter {
  date: string // YYYY-MM-DD
  totalTokensIn: number
  totalTokensOut: number
  totalCostUsd: number
  conversations: number
}

interface ConversationCounter {
  messagesCount: number
  totalTokensIn: number
  totalTokensOut: number
  costUsd: number
  lastMessageAt: number
}

interface IpCounter {
  date: string
  conversationsStarted: number
}

// Compteur de tokens par utilisateur (clé = IP ou conversationId) par jour
interface UserDailyTokens {
  date: string  // YYYY-MM-DD
  totalTokens: number
}

// Compteur de tokens par utilisateur par mois
interface UserMonthlyTokens {
  month: string  // YYYY-MM
  totalTokens: number
}

let dailyCounter: DailyCounter = { date: '', totalTokensIn: 0, totalTokensOut: 0, totalCostUsd: 0, conversations: 0 }
const conversationCounters = new Map<string, ConversationCounter>()
const ipCounters = new Map<string, IpCounter>()
const userDailyTokens = new Map<string, UserDailyTokens>()
const userMonthlyTokens = new Map<string, UserMonthlyTokens>()

function getToday(): string {
  return new Date().toISOString().slice(0, 10)
}

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7) // YYYY-MM
}

function ensureDailyReset() {
  const today = getToday()
  if (dailyCounter.date !== today) {
    dailyCounter = { date: today, totalTokensIn: 0, totalTokensOut: 0, totalCostUsd: 0, conversations: 0 }
    // Nettoyer les compteurs périmés
    const keys = Array.from(conversationCounters.keys())
    for (let i = 0; i < keys.length; i++) {
      const c = conversationCounters.get(keys[i])
      if (c && Date.now() - c.lastMessageAt > 24 * 60 * 60 * 1000) {
        conversationCounters.delete(keys[i])
      }
    }
    // Nettoyer les compteurs quotidiens d'utilisateurs périmés
    const dailyKeys = Array.from(userDailyTokens.keys())
    for (let i = 0; i < dailyKeys.length; i++) {
      const counter = userDailyTokens.get(dailyKeys[i])
      if (counter && counter.date !== today) {
        userDailyTokens.delete(dailyKeys[i])
      }
    }
  }
  // Nettoyer les compteurs mensuels périmés
  const currentMonth = getCurrentMonth()
  const monthlyKeys = Array.from(userMonthlyTokens.keys())
  for (let i = 0; i < monthlyKeys.length; i++) {
    const counter = userMonthlyTokens.get(monthlyKeys[i])
    if (counter && counter.month !== currentMonth) {
      userMonthlyTokens.delete(monthlyKeys[i])
    }
  }
}

// ─── Estimation du nombre de tokens (approximation rapide) ───
// Règle : ~4 caractères = 1 token en français (un peu moins qu'en anglais)
export function estimateTokens(text: string): number {
  if (!text) return 0
  return Math.ceil(text.length / 3.5)
}

// ─── Estimation des tokens d'un historique de messages ───
export function estimateMessagesTokens(messages: { role: string; content: string }[]): number {
  let total = 0
  for (const msg of messages) {
    total += estimateTokens(msg.content) + 4 // overhead par message (role, separators)
  }
  return total + 3 // overhead global
}

// ─── Vérification AVANT envoi à l'API ───
export interface TokenGuardResult {
  allowed: boolean
  reason?: string
  suggestReferral?: boolean  // Si true, proposer une mise en relation avec un conseiller
  truncatedMessages?: { role: string; content: string }[]  // Messages tronqués si contexte trop long
  estimatedCost?: number
}

export function checkBeforeSend(
  conversationId: string,
  messages: { role: string; content: string }[],
  systemPromptLength: number,
  clientIP: string,
  model: string = 'gpt-4o'
): TokenGuardResult {
  ensureDailyReset()

  // 1. Budget quotidien global dépassé ?
  if (dailyCounter.totalCostUsd >= LIMITS.DAILY_BUDGET_USD) {
    return {
      allowed: false,
      reason: 'Le service est temporairement limité. Réessayez demain.',
      suggestReferral: true,
    }
  }

  // 2. Limite de conversations par IP par jour
  const today = getToday()
  const ipKey = `${clientIP}`
  const ipCounter = ipCounters.get(ipKey)
  if (ipCounter && ipCounter.date === today) {
    // On vérifie seulement si c'est une NOUVELLE conversation
    if (!conversationCounters.has(conversationId) && ipCounter.conversationsStarted >= LIMITS.MAX_CONVERSATIONS_PER_IP_PER_DAY) {
      return {
        allowed: false,
        reason: 'Nombre maximum de conversations atteint pour aujourd\'hui.',
      }
    }
  }

  // 2b. Limite quotidienne de tokens par utilisateur (basé sur IP)
  const userDailyKey = clientIP
  const userDaily = userDailyTokens.get(userDailyKey)
  if (userDaily && userDaily.date === today && userDaily.totalTokens >= LIMITS.TOKEN_DAILY_LIMIT) {
    console.log(`[Token Guard] Limite quotidienne atteinte pour ${clientIP}: ${userDaily.totalTokens}/${LIMITS.TOKEN_DAILY_LIMIT} tokens`)
    return {
      allowed: false,
      reason: 'Vous avez atteint votre limite quotidienne d\'utilisation. Revenez demain pour continuer notre conversation !',
      suggestReferral: true,
    }
  }

  // 2c. Limite mensuelle de tokens par utilisateur (basé sur IP)
  const currentMonth = getCurrentMonth()
  const userMonthly = userMonthlyTokens.get(userDailyKey)
  if (userMonthly && userMonthly.month === currentMonth && userMonthly.totalTokens >= LIMITS.TOKEN_MONTHLY_LIMIT) {
    console.log(`[Token Guard] Limite mensuelle atteinte pour ${clientIP}: ${userMonthly.totalTokens}/${LIMITS.TOKEN_MONTHLY_LIMIT} tokens`)
    return {
      allowed: false,
      reason: 'Vous avez atteint votre limite mensuelle d\'utilisation. Un conseiller peut prendre le relais pour vous accompagner.',
      suggestReferral: true,
    }
  }

  // 3. Limite de messages par conversation
  const convCounter = conversationCounters.get(conversationId)
  if (convCounter && convCounter.messagesCount >= LIMITS.MAX_MESSAGES_PER_CONVERSATION) {
    return {
      allowed: false,
      reason: 'La conversation a atteint sa limite. Un conseiller peut maintenant prendre le relais.',
      suggestReferral: true,
    }
  }

  // 4. Budget par conversation dépassé ?
  if (convCounter && convCounter.costUsd >= LIMITS.MAX_COST_PER_CONVERSATION) {
    return {
      allowed: false,
      reason: 'Limite de la conversation atteinte. Un conseiller va prendre le relais.',
      suggestReferral: true,
    }
  }

  // 5. Tronquer le contexte si trop long (garder les derniers messages)
  const systemTokens = estimateTokens('x'.repeat(systemPromptLength))
  let contextTokens = estimateMessagesTokens(messages)
  let truncatedMessages = messages

  if (systemTokens + contextTokens > LIMITS.MAX_CONTEXT_TOKENS) {
    // Garder le 1er message (contexte initial) + les N derniers messages
    const maxMsgTokens = LIMITS.MAX_CONTEXT_TOKENS - systemTokens - 100 // marge
    truncatedMessages = []
    let currentTokens = 0

    // Parcourir depuis la fin
    for (let i = messages.length - 1; i >= 0; i--) {
      const msgTokens = estimateTokens(messages[i].content) + 4
      if (currentTokens + msgTokens > maxMsgTokens && truncatedMessages.length > 0) {
        break
      }
      truncatedMessages.unshift(messages[i])
      currentTokens += msgTokens
    }

    contextTokens = currentTokens
  }

  // 6. Estimer le coût de cette requête
  const inputTokens = systemTokens + contextTokens
  const outputTokens = LIMITS.MAX_OUTPUT_TOKENS // worst case
  const pricing = PRICING[model] || getModelPricing(model)
  const estimatedCost = (inputTokens * pricing.input) + (outputTokens * pricing.output)

  return {
    allowed: true,
    truncatedMessages: truncatedMessages !== messages ? truncatedMessages : undefined,
    estimatedCost,
  }
}

// ─── Enregistrer la consommation APRÈS réponse ───
export function recordUsage(
  conversationId: string,
  clientIP: string,
  inputTokens: number,
  outputTokens: number,
  model: string = 'gpt-4o'
) {
  ensureDailyReset()

  const pricing = PRICING[model] || getModelPricing(model)
  const cost = (inputTokens * pricing.input) + (outputTokens * pricing.output)

  // Compteur quotidien
  dailyCounter.totalTokensIn += inputTokens
  dailyCounter.totalTokensOut += outputTokens
  dailyCounter.totalCostUsd += cost

  // Compteur conversation
  let conv = conversationCounters.get(conversationId)
  if (!conv) {
    conv = { messagesCount: 0, totalTokensIn: 0, totalTokensOut: 0, costUsd: 0, lastMessageAt: Date.now() }
    conversationCounters.set(conversationId, conv)

    // Nouvelle conversation → incrémenter le compteur IP
    dailyCounter.conversations++
    const todayStr = getToday()
    const ipCounter = ipCounters.get(clientIP)
    if (!ipCounter || ipCounter.date !== todayStr) {
      ipCounters.set(clientIP, { date: todayStr, conversationsStarted: 1 })
    } else {
      ipCounter.conversationsStarted++
    }
  }

  conv.messagesCount++
  conv.totalTokensIn += inputTokens
  conv.totalTokensOut += outputTokens
  conv.costUsd += cost
  conv.lastMessageAt = Date.now()

  // Compteur quotidien par utilisateur (clé = IP)
  const totalTokens = inputTokens + outputTokens
  const today = getToday()
  const userDaily = userDailyTokens.get(clientIP)
  if (!userDaily || userDaily.date !== today) {
    userDailyTokens.set(clientIP, { date: today, totalTokens })
  } else {
    userDaily.totalTokens += totalTokens
  }

  // Compteur mensuel par utilisateur (clé = IP)
  const currentMonth = getCurrentMonth()
  const userMonthly = userMonthlyTokens.get(clientIP)
  if (!userMonthly || userMonthly.month !== currentMonth) {
    userMonthlyTokens.set(clientIP, { month: currentMonth, totalTokens })
  } else {
    userMonthly.totalTokens += totalTokens
  }

  // Log de la consommation
  const dailyUsed = userDailyTokens.get(clientIP)?.totalTokens || 0
  const monthlyUsed = userMonthlyTokens.get(clientIP)?.totalTokens || 0
  console.log(
    `[Token Usage] IP=${clientIP} conv=${conversationId} | ` +
    `in=${inputTokens} out=${outputTokens} cost=$${cost.toFixed(4)} | ` +
    `daily=${dailyUsed}/${LIMITS.TOKEN_DAILY_LIMIT} monthly=${monthlyUsed}/${LIMITS.TOKEN_MONTHLY_LIMIT} | ` +
    `global=$${dailyCounter.totalCostUsd.toFixed(4)}/$${LIMITS.DAILY_BUDGET_USD}`
  )
}

// ─── Stats pour le dashboard admin ───
export function getUsageStats() {
  ensureDailyReset()
  return {
    today: { ...dailyCounter },
    limits: { ...LIMITS },
    activeConversations: conversationCounters.size,
    budgetRemainingUsd: Math.max(0, LIMITS.DAILY_BUDGET_USD - dailyCounter.totalCostUsd),
    budgetUsedPercent: Math.round((dailyCounter.totalCostUsd / LIMITS.DAILY_BUDGET_USD) * 100),
    trackedUsersDaily: userDailyTokens.size,
    trackedUsersMonthly: userMonthlyTokens.size,
  }
}

// ─── Stats pour un utilisateur spécifique (par IP) ───
export function getUserUsageStats(clientIP: string) {
  ensureDailyReset()
  const today = getToday()
  const currentMonth = getCurrentMonth()

  const daily = userDailyTokens.get(clientIP)
  const monthly = userMonthlyTokens.get(clientIP)

  return {
    dailyTokensUsed: (daily && daily.date === today) ? daily.totalTokens : 0,
    dailyTokensLimit: LIMITS.TOKEN_DAILY_LIMIT,
    dailyTokensRemaining: Math.max(0, LIMITS.TOKEN_DAILY_LIMIT - ((daily && daily.date === today) ? daily.totalTokens : 0)),
    monthlyTokensUsed: (monthly && monthly.month === currentMonth) ? monthly.totalTokens : 0,
    monthlyTokensLimit: LIMITS.TOKEN_MONTHLY_LIMIT,
    monthlyTokensRemaining: Math.max(0, LIMITS.TOKEN_MONTHLY_LIMIT - ((monthly && monthly.month === currentMonth) ? monthly.totalTokens : 0)),
  }
}
