export interface ISTTAdapter {
  isAvailable(): boolean
  start(onResult: (text: string) => void, onEnd?: () => void): void
  stop(): void
  isListening(): boolean
}
