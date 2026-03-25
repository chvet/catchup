export interface ITTSAdapter {
  init(): Promise<void>
  unlock(): void
  speak(text: string, onEnd?: () => void): void
  stop(): void
  isSpeaking(): boolean
  getAvailableVoices(): string[]
}
