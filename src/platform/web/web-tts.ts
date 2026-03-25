import { ITTSAdapter } from '../interfaces/tts.interface'

// Stratégie : utiliser un <audio> avec l'API Google Translate TTS (gratuit, fiable sur mobile)
// Fallback sur speechSynthesis si l'audio échoue

function splitIntoChunks(text: string, maxLen = 190): string[] {
  // Google TTS limite à ~200 chars par requête
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text]
  const chunks: string[] = []
  let current = ''

  for (const s of sentences) {
    const trimmed = s.trim()
    if (!trimmed) continue
    if (current.length + trimmed.length + 1 > maxLen) {
      if (current) chunks.push(current.trim())
      // Si la phrase seule est trop longue, découper sur les virgules
      if (trimmed.length > maxLen) {
        const parts = trimmed.split(/,\s*/)
        let part = ''
        for (const p of parts) {
          if (part.length + p.length + 2 > maxLen) {
            if (part) chunks.push(part.trim())
            part = p
          } else {
            part = part ? `${part}, ${p}` : p
          }
        }
        if (part) current = part
      } else {
        current = trimmed
      }
    } else {
      current = current ? `${current} ${trimmed}` : trimmed
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.length > 0 ? chunks : [text.substring(0, maxLen)]
}

export class WebTTSAdapter implements ITTSAdapter {
  private speaking = false
  private audio: HTMLAudioElement | null = null
  private chunks: string[] = []
  private chunkIdx = 0
  private onEndCb: (() => void) | null = null

  async init(): Promise<void> {
    // Précharger les voix pour le fallback speechSynthesis
    window.speechSynthesis?.getVoices()
  }

  unlock(): void {
    // Créer et jouer un audio silencieux pour débloquer l'autoplay sur iOS
    try {
      if (!this.audio) {
        this.audio = new Audio()
      }
      // Data URI d'un WAV silencieux de 0.1s
      this.audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YQAAAAA='
      this.audio.volume = 0.01
      const p = this.audio.play()
      if (p) p.catch(() => {})
      console.log('[TTS] Audio unlock mobile')
    } catch (e) {
      console.warn('[TTS] Unlock error:', e)
    }
  }

  speak(text: string, onEnd?: () => void): void {
    this.stop()

    const clean = text.replace(/<!--.*?-->/g, '').replace(/[*_~`#>]/g, '').trim()
    if (!clean) { onEnd?.(); return }

    this.chunks = splitIntoChunks(clean)
    this.chunkIdx = 0
    this.speaking = true
    this.onEndCb = onEnd || null

    console.log('[TTS] Lecture:', this.chunks.length, 'chunks')
    this.playNextChunk()
  }

  private playNextChunk(): void {
    if (!this.speaking || this.chunkIdx >= this.chunks.length) {
      this.finish()
      return
    }

    const chunk = this.chunks[this.chunkIdx]
    const encoded = encodeURIComponent(chunk)
    // Proxy via notre API pour éviter CORS sur mobile
    const url = `/api/tts?text=${encoded}`

    if (!this.audio) {
      this.audio = new Audio()
    }

    this.audio.src = url
    this.audio.playbackRate = 1.0
    this.audio.volume = 1.0

    this.audio.onended = () => {
      this.chunkIdx++
      this.playNextChunk()
    }

    this.audio.onerror = () => {
      console.warn('[TTS] Audio error on chunk', this.chunkIdx, '- trying speechSynthesis fallback')
      this.fallbackSpeechSynthesis(chunk, () => {
        this.chunkIdx++
        this.playNextChunk()
      })
    }

    const playPromise = this.audio.play()
    if (playPromise) {
      playPromise.catch(() => {
        // Autoplay bloqué — fallback speechSynthesis
        console.warn('[TTS] Autoplay blocked - fallback speechSynthesis')
        this.fallbackSpeechSynthesis(chunk, () => {
          this.chunkIdx++
          this.playNextChunk()
        })
      })
    }
  }

  private fallbackSpeechSynthesis(text: string, onDone: () => void): void {
    try {
      const utt = new SpeechSynthesisUtterance(text)
      utt.lang = 'fr-FR'
      utt.rate = 0.95
      utt.pitch = 0.85
      utt.onend = () => onDone()
      utt.onerror = () => onDone()
      window.speechSynthesis.speak(utt)
    } catch {
      onDone()
    }
  }

  private finish(): void {
    this.speaking = false
    this.onEndCb?.()
    this.onEndCb = null
  }

  stop(): void {
    this.speaking = false
    this.chunks = []
    this.chunkIdx = 0
    this.onEndCb = null
    if (this.audio) {
      this.audio.pause()
      this.audio.src = ''
    }
    try { window.speechSynthesis.cancel() } catch { /* ignore */ }
  }

  isSpeaking(): boolean {
    return this.speaking
  }

  getAvailableVoices(): string[] {
    try {
      return window.speechSynthesis.getVoices()
        .filter(v => v.lang.startsWith('fr'))
        .map(v => v.name)
    } catch { return [] }
  }
}
