import { UserProfile, EMPTY_PROFILE } from './types'

export interface DynamicSuggestion {
  text: string
  emoji: string
}

/**
 * Extrait les suggestions contextuelles depuis le bloc <!--SUGGESTIONS:[...]-->
 */
export function extractSuggestionsFromMessage(content: string): DynamicSuggestion[] | null {
  const match = content.match(/<!--SUGGESTIONS:(.*?)-->/)
  if (!match) return null

  try {
    const data = JSON.parse(match[1])
    if (!Array.isArray(data)) return null
    return data
      .filter((s: unknown) => s && typeof s === 'object' && 'text' in (s as object) && 'emoji' in (s as object))
      .map((s: { text: string; emoji: string }) => ({ text: s.text, emoji: s.emoji }))
      .slice(0, 4)
  } catch {
    return null
  }
}

/**
 * Extrait le profil RIASEC depuis le bloc invisible <!--PROFILE:{...}-->
 * inséré par l'IA dans ses réponses.
 */
export function extractProfileFromMessage(content: string): UserProfile | null {
  const match = content.match(/<!--PROFILE:(.*?)-->/)
  if (!match) return null

  try {
    const data = JSON.parse(match[1])
    return {
      id: 'default',
      name: data.name || undefined,
      genre: data.genre === 'M' || data.genre === 'F' ? data.genre : null,
      age: typeof data.age === 'number' ? data.age : undefined,
      departement: data.departement || undefined,
      R: clamp(data.R || 0),
      I: clamp(data.I || 0),
      A: clamp(data.A || 0),
      S: clamp(data.S || 0),
      E: clamp(data.E || 0),
      C: clamp(data.C || 0),
      traits: Array.isArray(data.traits) ? data.traits : [],
      interests: Array.isArray(data.interests) ? data.interests : [],
      strengths: Array.isArray(data.strengths) ? data.strengths : [],
      suggestion: data.suggestion || '',
      updatedAt: Date.now(),
    }
  } catch {
    return null
  }
}

/**
 * Détecte si le message IA contient le tag <!--GEOLOC_REQUEST-->
 */
export function extractGeolocRequest(content: string): boolean {
  return content.includes('<!--GEOLOC_REQUEST-->')
}

/**
 * Supprime le bloc <!--PROFILE:...--> du contenu affiché.
 * Gère aussi les blocs partiels pendant le streaming
 * (ex: "<!--PROFILE:{" qui n'est pas encore fermé par "-->")
 */
export function cleanMessageContent(content: string): string {
  // 1. Supprimer les blocs PROFILE complets
  let cleaned = content.replace(/<!--PROFILE:.*?-->/g, '')
  // 2. Supprimer les blocs SUGGESTIONS complets
  cleaned = cleaned.replace(/<!--SUGGESTIONS:.*?-->/g, '')
  // 3. Supprimer les blocs GEOLOC_REQUEST complets
  cleaned = cleaned.replace(/<!--GEOLOC_REQUEST-->/g, '')
  // 4. Supprimer les blocs PROFILE partiels en cours de streaming
  cleaned = cleaned.replace(/<!--PROFILE:[\s\S]*$/, '')
  // 5. Supprimer les blocs SUGGESTIONS partiels en cours de streaming
  cleaned = cleaned.replace(/<!--SUGGESTIONS:[\s\S]*$/, '')
  // 6. Supprimer un début de bloc encore plus partiel (ex: "<!--PR", "<!--SU", "<!--GE")
  cleaned = cleaned.replace(/<!--P(?:R(?:O(?:F(?:I(?:L(?:E?)?)?)?)?)?)?$/, '')
  cleaned = cleaned.replace(/<!--S(?:U(?:G(?:G(?:E(?:S(?:T(?:I(?:O(?:N(?:S?)?)?)?)?)?)?)?)?)?)?$/, '')
  cleaned = cleaned.replace(/<!--G(?:E(?:O(?:L(?:O(?:C(?:_(?:R(?:E(?:Q(?:U(?:E(?:S(?:T?)?)?)?)?)?)?)?)?)?)?)?)?)?$/, '')
  // 7. Supprimer les tout premiers caractères du commentaire HTML en cours
  cleaned = cleaned.replace(/<!-?-?$/, '')
  return cleaned.trim()
}

/**
 * Retourne les N dimensions RIASEC les plus fortes
 */
export function getTopDimensions(profile: UserProfile, count = 3) {
  const dims = (['R', 'I', 'A', 'S', 'E', 'C'] as const)
  return dims
    .map(key => ({ key, score: profile[key] }))
    .filter(d => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
}

/**
 * Fusionne un nouveau profil avec l'ancien (garde le name s'il existe)
 */
export function mergeProfiles(prev: UserProfile, next: UserProfile): UserProfile {
  return {
    ...next,
    name: next.name || prev.name,
  }
}

/**
 * Vérifie si le profil a des scores significatifs
 */
export function hasSignificantProfile(profile: UserProfile): boolean {
  return profile.R + profile.I + profile.A + profile.S + profile.E + profile.C > 0
}

export function getEmptyProfile(): UserProfile {
  return { ...EMPTY_PROFILE, updatedAt: Date.now() }
}

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}
