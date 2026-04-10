// Service de traduction automatique pour la messagerie directe
// Utilise le modèle LLM économique (summary tier) pour traduire les messages

import { generateText } from 'ai'
import { getLLMModel } from './llm'

const LANG_NAMES: Record<string, string> = {
  fr: 'français',
  en: 'anglais',
  ar: 'arabe',
  pt: 'portugais',
  tr: 'turc',
  it: 'italien',
  es: 'espagnol',
  de: 'allemand',
  ro: 'roumain',
  zh: 'chinois',
}

/**
 * Traduit un message d'une langue vers une autre.
 * Retourne null si même langue, texte trop court, ou message structuré (JSON).
 */
export async function translateMessage(
  text: string,
  fromLang: string,
  toLang: string
): Promise<string | null> {
  // Pas de traduction si même langue
  if (fromLang === toLang) return null

  // Pas de traduction si texte trop court (emoji, "ok", "oui")
  if (text.trim().length < 3) return null

  // Pas de traduction si message structuré (JSON : documents, RDV, visio)
  if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
    try {
      JSON.parse(text)
      return null // C'est du JSON structuré, pas du texte
    } catch {
      // Pas du JSON, on traduit
    }
  }

  const fromName = LANG_NAMES[fromLang] || fromLang
  const toName = LANG_NAMES[toLang] || toLang

  try {
    const model = await getLLMModel('summary')
    const { text: translated } = await generateText({
      model,
      maxTokens: 500,
      temperature: 0.3,
      system: `Tu es un traducteur. Traduis le message suivant du ${fromName} vers le ${toName}. Garde le ton informel et bienveillant. Retourne UNIQUEMENT la traduction, sans explication ni commentaire.`,
      prompt: text,
    })

    return translated?.trim() || null
  } catch (err) {
    console.error('[Translate] Erreur:', (err as Error).message)
    return null
  }
}
