import { ISTTAdapter } from '../interfaces/stt.interface'

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : unknown

export class WebSTTAdapter implements ISTTAdapter {
  private recognition: InstanceType<SpeechRecognitionType & (new () => unknown)> | null = null
  private listening = false

  isAvailable(): boolean {
    return typeof window !== 'undefined' &&
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  }

  start(onResult: (text: string) => void, onEnd?: () => void): void {
    if (!this.isAvailable()) return

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    this.recognition = new SR()

    const rec = this.recognition as Record<string, unknown>
    rec.lang = 'fr-FR'
    rec.interimResults = true
    rec.continuous = false
    rec.maxAlternatives = 1

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.recognition as any).onresult = (event: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => {
      const last = event.results[event.results.length - 1]
      if (last.isFinal) {
        onResult(last[0].transcript)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.recognition as any).onend = () => {
      this.listening = false
      onEnd?.()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.recognition as any).onerror = () => {
      this.listening = false
      onEnd?.()
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(this.recognition as any).start()
    this.listening = true
  }

  stop(): void {
    if (this.recognition && this.listening) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(this.recognition as any).stop()
      this.listening = false
    }
  }

  isListening(): boolean {
    return this.listening
  }
}
