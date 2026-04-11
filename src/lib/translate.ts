// Service de traduction automatique pour la messagerie directe
// Détecte la langue du message et traduit automatiquement

import { generateText } from 'ai'
import { getLLMModel } from './llm'

const LANG_NAMES: Record<string, string> = {
  fr: 'fran\u00e7ais', en: 'anglais', ar: 'arabe', pt: 'portugais',
  tr: 'turc', it: 'italien', es: 'espagnol', de: 'allemand',
  ro: 'roumain', zh: 'chinois',
}

/**
 * D\u00e9tecte la langue d'un message et le traduit vers la langue cible.
 * Retourne { translated, detectedLang } ou null si pas de traduction n\u00e9cessaire.
 */
export async function detectAndTranslate(
  text: string,
  targetLang: string
): Promise<{ translated: string; detectedLang: string } | null> {
  // Pas de traduction si texte trop court
  if (text.trim().length < 4) return null

  // Pas de traduction si message structur\u00e9 (JSON)
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try { JSON.parse(text); return null } catch { /* pas du JSON */ }
  }

  const targetName = LANG_NAMES[targetLang] || targetLang

  try {
    const model = await getLLMModel('summary')
    const { text: result } = await generateText({
      model,
      maxTokens: 600,
      temperature: 0.1,
      system: `Tu es un d\u00e9tecteur de langue et traducteur.
1. D\u00e9tecte la langue du message.
2. Si le message est d\u00e9j\u00e0 en ${targetName}, r\u00e9ponds EXACTEMENT : SAME
3. Sinon, traduis-le en ${targetName}.

R\u00e9ponds UNIQUEMENT dans ce format (2 lignes) :
LANG:code_iso
TEXT:traduction

Exemples :
- Message "Hello how are you?" vers fran\u00e7ais :
LANG:en
TEXT:Bonjour comment vas-tu ?

- Message "Bonjour" vers fran\u00e7ais :
SAME`,
      prompt: text,
    })

    if (!result) return null
    const trimmed = result.trim()

    // Pas de traduction n\u00e9cessaire
    if (trimmed === 'SAME' || trimmed.startsWith('SAME')) return null

    // Parser la r\u00e9ponse
    const langMatch = trimmed.match(/^LANG:(\w+)/m)
    const textMatch = trimmed.match(/^TEXT:([\s\S]+)/m)

    if (langMatch && textMatch) {
      const detectedLang = langMatch[1].toLowerCase()
      const translated = textMatch[1].trim()
      if (detectedLang === targetLang) return null
      if (translated.length < 2) return null
      console.log(`[Translate] ${detectedLang} \u2192 ${targetLang}: "${text.substring(0, 30)}..." \u2192 "${translated.substring(0, 30)}..."`)
      return { translated, detectedLang }
    }

    return null
  } catch (err) {
    console.error('[Translate] Erreur:', (err as Error).message)
    return null
  }
}

/**
 * Traduit un message d'une langue connue vers une autre.
 * @deprecated Utiliser detectAndTranslate \u00e0 la place
 */
export async function translateMessage(
  text: string,
  fromLang: string,
  toLang: string
): Promise<string | null> {
  if (fromLang === toLang) return null
  const result = await detectAndTranslate(text, toLang)
  return result?.translated ?? null
}
