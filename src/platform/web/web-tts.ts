import { ITTSAdapter } from '../interfaces/tts.interface'

let cachedVoice: SpeechSynthesisVoice | null = null
let voicesLoaded = false

function findFrenchMaleVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice && voicesLoaded) return cachedVoice

  const voices = window.speechSynthesis.getVoices()
  if (voices.length === 0) return null

  voicesLoaded = true
  const frVoices = voices.filter(v => v.lang.startsWith('fr'))
  console.log('[TTS] Voix FR:', frVoices.map(v => v.name))

  const maleNames = ['paul', 'thomas', 'claude', 'henri', 'pierre', 'jacques', 'male']

  const priorities = [
    (v: SpeechSynthesisVoice) => v.lang === 'fr-FR' && maleNames.some(n => v.name.toLowerCase().includes(n)) && v.name.toLowerCase().includes('natural'),
    (v: SpeechSynthesisVoice) => v.lang === 'fr-FR' && maleNames.some(n => v.name.toLowerCase().includes(n)),
    (v: SpeechSynthesisVoice) => v.lang === 'fr-FR' && v.name.toLowerCase().includes('paul'),
    (v: SpeechSynthesisVoice) => v.lang === 'fr-FR' && v.name.toLowerCase().includes('henri'),
    (v: SpeechSynthesisVoice) => v.lang === 'fr-FR' && !v.localService,
    (v: SpeechSynthesisVoice) => v.lang === 'fr-FR',
    (v: SpeechSynthesisVoice) => v.lang.startsWith('fr'),
  ]

  for (const matcher of priorities) {
    const found = voices.find(matcher)
    if (found) {
      console.log('[TTS] Voix sélectionnée:', found.name)
      cachedVoice = found
      return found
    }
  }
  return null
}

function splitIntoSentences(text: string): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text]
  return sentences.map(s => s.trim()).filter(s => s.length > 0)
}

export class WebTTSAdapter implements ITTSAdapter {
  async init(): Promise<void> {
    return new Promise(resolve => {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        findFrenchMaleVoice()
        resolve()
        return
      }
      window.speechSynthesis.onvoiceschanged = () => {
        findFrenchMaleVoice()
        resolve()
      }
    })
  }

  speak(text: string, onEnd?: () => void): void {
    window.speechSynthesis.cancel()

    const clean = text.replace(/<!--.*?-->/g, '').replace(/[*_~`#]/g, '')
    const chunks = splitIntoSentences(clean)
    let idx = 0

    const speakNext = () => {
      if (idx >= chunks.length) {
        onEnd?.()
        return
      }
      const utt = new SpeechSynthesisUtterance(chunks[idx])
      utt.lang = 'fr-FR'
      utt.rate = 0.95
      utt.pitch = 0.85
      utt.volume = 1

      const voice = findFrenchMaleVoice()
      if (voice) utt.voice = voice

      utt.onend = () => { idx++; speakNext() }
      utt.onerror = () => { idx++; speakNext() }

      window.speechSynthesis.speak(utt)
    }

    speakNext()
  }

  stop(): void {
    window.speechSynthesis.cancel()
  }

  isSpeaking(): boolean {
    return window.speechSynthesis.speaking
  }

  getAvailableVoices(): string[] {
    return window.speechSynthesis.getVoices()
      .filter(v => v.lang.startsWith('fr'))
      .map(v => v.name)
  }
}
