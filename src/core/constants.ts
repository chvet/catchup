// ═══ Constantes centralisées Catch'Up ═══
// Utilisé par les composants, hooks et routes API

// --- localStorage keys ---
export const LS_KEYS = {
  MESSAGES: 'catchup_messages',
  PROFILE: 'catchup_profil',
  SESSION_ID: 'catchup_session_id',
  QUIZ: 'catchup_quiz',
  SUGGESTIONS_COUNT: 'catchup_suggestions_count',
  CONVERSATION_ID: 'catchup_conversation_id',
  USER_ID: 'catchup_utilisateur_id',
  REFERRAL_ID: 'catchup_referral_id',
  REFERRAL_REFUSED_AT: 'catchup_referral_refused_at',
  BENEFICIAIRE_INFO: 'catchup_beneficiaire_info',
  STRUCTURE_SLUG: 'catchup_structure_slug',
  CAMPAGNE_ID: 'catchup_campagne_id',
  USER_PRENOM: 'catchup_user_prenom',
  LANG: 'catchup_lang',
  CGU_ACCEPTED: 'catchup_cgu_accepted',
  USER_LOCATION: 'catchup_user_location',
  USER_TOKEN: 'catchup_user_token',
  ACCOMPAGNEMENT: 'catchup_accompagnement',
  TIERS: 'catchup_tiers',
  FAB_POS_BENEF: 'catchup_fab_pos_benef',
  FAB_POS_ADVISER: 'catchup_fab_pos',
  GAME_STATE: 'catchup_game_state',
} as const

// --- Cookie names ---
export const COOKIES = {
  CONSEILLER_SESSION: 'catchup_conseiller_session',
  APP_BRAND: 'app_brand',
} as const

// --- Default values ---
export const DEFAULTS = {
  STRUCTURE_CAPACITY: 50,
  AGE_MIN: 16,
  AGE_MAX: 25,
  SESSION_DURATION_HOURS: 8,
  BENEFICIAIRE_SESSION_DAYS: 30,
  BCRYPT_ROUNDS: 12,
  MAX_MESSAGE_LENGTH: 5000,
  SUMMARY_MAX_TOKENS: 200,
} as const

// --- AI Models ---
export const AI_MODELS = {
  MAIN_CHAT: 'gpt-4o',
  SUMMARY: 'gpt-4o-mini',
  ADVISER_ASSISTANT: 'gpt-4o',
} as const

// --- Rate limit presets ---
export const RATE_LIMITS = {
  LOGIN: { max: 50, windowMs: 15 * 60 * 1000 },
  VERIFY: { max: 5, windowMs: 15 * 60 * 1000 },
  API_GENERAL: { max: 200, windowMs: 60 * 1000 },
} as const

// --- Statuts referral ---
export const REFERRAL_STATUTS = {
  EN_ATTENTE: 'en_attente',
  NOUVELLE: 'nouvelle',
  PRISE_EN_CHARGE: 'prise_en_charge',
  TERMINEE: 'terminee',
  ABANDONNEE: 'abandonnee',
  ANNULEE: 'annulee',
} as const

// --- Priority mapping (fragilityLevel → priorité) ---
export const PRIORITY_MAP: Record<string, string> = {
  high: 'critique',
  medium: 'haute',
  low: 'normale',
  none: 'normale',
}

export const DETECTION_LEVEL_MAP: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
  none: 0,
}

// --- Safe localStorage helpers ---
export function loadFromLS<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function saveToLS(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch { /* quota exceeded — silently ignore */ }
}

// --- Safe JSON parse ---
export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}
