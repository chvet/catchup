// Type declarations for WebCodecs APIs not yet in TypeScript lib
// These APIs are available in Chrome/Edge but not in the standard TS types

interface VideoEncoderConfig {
  codec: string
  width: number
  height: number
  bitrate: number
  framerate?: number
  latencyMode?: string
  hardwareAcceleration?: string
}

interface VideoEncoderInit {
  output: (chunk: EncodedVideoChunk, metadata?: EncodedVideoChunkMetadata) => void
  error: (error: Error) => void
}

interface EncodedVideoChunk {
  type: string
  timestamp: number
  byteLength: number
  copyTo: (dest: ArrayBuffer) => void
}

interface EncodedVideoChunkMetadata {
  decoderConfig?: VideoDecoderConfig
}

interface VideoDecoderConfig {
  codec: string
  codedWidth?: number
  codedHeight?: number
  description?: ArrayBuffer
}

interface VideoDecoderInit {
  output: (frame: VideoFrame) => void
  error: (error: Error) => void
}

interface VideoFrame {
  timestamp: number
  codedWidth: number
  codedHeight: number
  close: () => void
}

declare class VideoEncoder {
  constructor(init: VideoEncoderInit)
  configure(config: VideoEncoderConfig): void
  encode(frame: VideoFrame, options?: { keyFrame?: boolean }): void
  flush(): Promise<void>
  close(): void
  state: string
}

declare class VideoDecoder {
  constructor(init: VideoDecoderInit)
  configure(config: VideoDecoderConfig): void
  decode(chunk: EncodedVideoChunk): void
  flush(): Promise<void>
  close(): void
  state: string
}

declare class EncodedVideoChunk {
  constructor(init: { type: string; timestamp: number; data: ArrayBuffer | Uint8Array })
  readonly type: string
  readonly timestamp: number
  readonly byteLength: number
  copyTo(dest: ArrayBuffer): void
}

declare class MediaStreamTrackProcessor {
  constructor(init: { track: MediaStreamTrack })
  readable: ReadableStream<VideoFrame>
}

declare class MediaStreamTrackGenerator {
  constructor(init: { kind: string })
  writable: WritableStream<VideoFrame>
  readonly kind: string
}
