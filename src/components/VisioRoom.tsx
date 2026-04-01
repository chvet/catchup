'use client'
// @ts-nocheck — WebCodecs APIs (VideoEncoder, VideoDecoder, MediaStreamTrackProcessor)
// ne sont pas encore typés dans TypeScript standard

import { useEffect, useRef, useState, useCallback } from 'react'

// ── Types ──────────────────────────────────────────────────────────

interface VisioRoomProps {
  roomId: string
  participantName: string
  participantRole: 'conseiller' | 'beneficiaire' | 'tiers'
  onClose: () => void
}

interface RemoteParticipant {
  id: string
  name: string
  role: string
  muted: boolean
  videoOff: boolean
}

interface ControlMessage {
  type: string
  participantId?: string
  name?: string
  role?: string
  participants?: RemoteParticipant[]
  message?: string
}

type ConnectionStatus = 'connecting' | 'connected' | 'reconnecting' | 'disconnected'

// ── Adaptive quality profiles ─────────────────────────────────────

interface QualityProfile {
  width: number
  height: number
  bitrate: number
  framerate: number
  keyframeInterval: number  // ms
  jpegQuality: number
  jpegInterval: number      // ms for canvas fallback
  label: string
}

const QUALITY_PROFILES: Record<string, QualityProfile> = {
  high: {
    width: 640, height: 480,
    bitrate: 1_500_000, framerate: 30,
    keyframeInterval: 2000,
    jpegQuality: 0.7, jpegInterval: 50,
    label: 'HD',
  },
  medium: {
    width: 480, height: 360,
    bitrate: 800_000, framerate: 20,
    keyframeInterval: 1500,
    jpegQuality: 0.55, jpegInterval: 80,
    label: 'SD',
  },
  low: {
    width: 320, height: 240,
    bitrate: 400_000, framerate: 15,
    keyframeInterval: 1000,
    jpegQuality: 0.4, jpegInterval: 120,
    label: 'LD',
  },
}

// ── Constants ──────────────────────────────────────────────────────

const MSG_JPEG = 0x01
const MSG_AUDIO = 0x02
const MSG_VP8_KEY = 0x03
const MSG_VP8_DELTA = 0x04
const MSG_CONTROL = 0x05

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAY = 1500
const HEARTBEAT_INTERVAL = 8000

// Adaptive bitrate thresholds
const WS_BUFFER_HIGH = 100 * 1024  // 100KB → reduce quality
const WS_BUFFER_CRITICAL = 256 * 1024 // 256KB → skip frames
const ENCODER_QUEUE_MAX = 5  // Max frames queued in encoder

// ── Component ──────────────────────────────────────────────────────

export default function VisioRoom({ roomId, participantName, participantRole, onClose }: VisioRoomProps) {
  // Refs
  const wsRef = useRef<WebSocket | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteCanvasRef = useRef<HTMLCanvasElement>(null)
  const remoteImgRef = useRef<HTMLImageElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const encoderRef = useRef<VideoEncoder | null>(null)
  const decoderRef = useRef<VideoDecoder | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const reconnectCountRef = useRef(0)
  const canvasIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const jpegFallbackIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const keyframeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const callStartRef = useRef<number>(Date.now())
  const prevObjectUrlRef = useRef<string | null>(null)
  const participantIdRef = useRef<string>(crypto.randomUUID())
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceBufferRef = useRef<SourceBuffer | null>(null)
  const mediaSourceRef = useRef<MediaSource | null>(null)
  const audioElementRef = useRef<HTMLAudioElement | null>(null)
  const audioQueueRef = useRef<ArrayBuffer[]>([])
  const processorRef = useRef<ReadableStreamDefaultReader<VideoFrame> | null>(null)
  const frameReaderActiveRef = useRef(false)
  const initCalledRef = useRef(false)

  // Adaptive quality refs
  const qualityRef = useRef<string>('high')
  const profileRef = useRef<QualityProfile>(QUALITY_PROFILES.high)
  const framesSentRef = useRef(0)
  const framesSkippedRef = useRef(0)
  const lastQualityCheckRef = useRef(Date.now())
  const rttSamplesRef = useRef<number[]>([])
  const lastPingSentRef = useRef(0)
  const adaptiveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // State
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoOff, setIsVideoOff] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connecting')
  const [participants, setParticipants] = useState<RemoteParticipant[]>([])
  const [callDuration, setCallDuration] = useState('00:00')
  const [useWebCodecs, setUseWebCodecs] = useState(false)
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false)
  const [useFallbackImg, setUseFallbackImg] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [needsUserGesture, setNeedsUserGesture] = useState(false)
  const [qualityLabel, setQualityLabel] = useState('HD')

  // ── Call duration timer ──

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartRef.current) / 1000)
      const m = String(Math.floor(elapsed / 60)).padStart(2, '0')
      const s = String(elapsed % 60).padStart(2, '0')
      setCallDuration(`${m}:${s}`)
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // ── Check WebSocket backpressure ──

  const getWsBufferedAmount = useCallback((): number => {
    return wsRef.current?.bufferedAmount || 0
  }, [])

  // ── Send binary frame with backpressure check ──

  const sendFrame = useCallback((type: number, payload: ArrayBuffer | Uint8Array) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    // Backpressure: skip non-critical frames if buffer is too full
    const buffered = ws.bufferedAmount || 0
    if (buffered > WS_BUFFER_CRITICAL) {
      // Only allow keyframes and audio through
      if (type !== MSG_VP8_KEY && type !== MSG_AUDIO) {
        framesSkippedRef.current++
        return
      }
    }

    const frame = new Uint8Array(1 + payload.byteLength)
    frame[0] = type
    frame.set(new Uint8Array(payload instanceof ArrayBuffer ? payload : payload.buffer), 1)
    ws.send(frame)
    framesSentRef.current++
  }, [])

  // ── Send control message ──

  const sendControl = useCallback((msg: ControlMessage) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    const json = JSON.stringify(msg)
    const encoder = new TextEncoder()
    const jsonBytes = encoder.encode(json)
    const frame = new Uint8Array(1 + jsonBytes.length)
    frame[0] = MSG_CONTROL
    frame.set(jsonBytes, 1)
    ws.send(frame)
  }, [])

  // ── Parse incoming frame ──

  const parseFrame = useCallback((data: ArrayBuffer): { type: number; senderId: string; payload: Uint8Array } | null => {
    const buf = new Uint8Array(data)
    if (buf.length < 3) return null

    const type = buf[0]

    if (type === MSG_CONTROL) {
      const decoder = new TextDecoder()
      const json = decoder.decode(buf.slice(1))
      try {
        const ctrl = JSON.parse(json) as ControlMessage
        return { type, senderId: ctrl.participantId || '', payload: buf.slice(1) }
      } catch {
        return null
      }
    }

    // Media frames: [type(1)] [senderIdLen(1)] [senderId(N)] [payload(...)]
    const senderIdLen = buf[1]
    if (buf.length < 2 + senderIdLen) return null

    const decoder = new TextDecoder()
    const senderId = decoder.decode(buf.slice(2, 2 + senderIdLen))
    const payload = buf.slice(2 + senderIdLen)

    return { type, senderId, payload }
  }, [])

  // ── Handle received video frame (JPEG fallback) ──

  const handleJpegFrame = useCallback((payload: Uint8Array) => {
    setHasRemoteVideo(true)
    setUseFallbackImg(true)

    // Use createImageBitmap for smoother rendering when available
    const copy = new ArrayBuffer(payload.byteLength)
    new Uint8Array(copy).set(payload)
    const blob = new Blob([copy], { type: 'image/jpeg' })

    if (typeof createImageBitmap !== 'undefined' && remoteCanvasRef.current) {
      createImageBitmap(blob).then(bitmap => {
        const canvas = remoteCanvasRef.current
        if (canvas) {
          const ctx = canvas.getContext('2d')
          if (ctx) {
            canvas.width = bitmap.width
            canvas.height = bitmap.height
            ctx.drawImage(bitmap, 0, 0)
            bitmap.close()
          }
        }
      }).catch(() => {
        // Fallback to img element
        const url = URL.createObjectURL(blob)
        if (remoteImgRef.current) remoteImgRef.current.src = url
        if (prevObjectUrlRef.current) URL.revokeObjectURL(prevObjectUrlRef.current)
        prevObjectUrlRef.current = url
      })
      // Use canvas for JPEG too when createImageBitmap works
      setUseFallbackImg(false)
    } else {
      const url = URL.createObjectURL(blob)
      if (remoteImgRef.current) remoteImgRef.current.src = url
      if (prevObjectUrlRef.current) URL.revokeObjectURL(prevObjectUrlRef.current)
      prevObjectUrlRef.current = url
    }
  }, [])

  // ── Handle VP8 frame with VideoDecoder ──

  const handleVP8Frame = useCallback((type: number, payload: Uint8Array) => {
    setHasRemoteVideo(true)

    if (!decoderRef.current) {
      try {
        decoderRef.current = new VideoDecoder({
          output: (frame: VideoFrame) => {
            const canvas = remoteCanvasRef.current
            if (canvas) {
              const ctx = canvas.getContext('2d')
              if (ctx) {
                canvas.width = frame.displayWidth
                canvas.height = frame.displayHeight
                ctx.drawImage(frame, 0, 0)
              }
            }
            frame.close()
          },
          error: (err: DOMException) => {
            console.error('[Visio] VideoDecoder error:', err)
            setUseFallbackImg(true)
            decoderRef.current?.close()
            decoderRef.current = null
          },
        })
        decoderRef.current.configure({
          codec: 'vp8',
          codedWidth: 640,
          codedHeight: 480,
        })
      } catch {
        console.warn('[Visio] VideoDecoder not supported, using JPEG fallback')
        setUseFallbackImg(true)
        return
      }
    }

    // Check decoder queue — skip delta frames if decoder is backed up
    if (type === MSG_VP8_DELTA && decoderRef.current.decodeQueueSize > 3) {
      return // Skip this delta, wait for next keyframe
    }

    try {
      const chunk = new EncodedVideoChunk({
        type: type === MSG_VP8_KEY ? 'key' : 'delta',
        timestamp: performance.now() * 1000,
        data: payload,
      })
      decoderRef.current!.decode(chunk)
    } catch (err) {
      console.warn('[Visio] VP8 decode error:', err)
      // On delta decode failure, just wait for next keyframe
      if (type === MSG_VP8_KEY) {
        setUseFallbackImg(true)
      }
    }
  }, [])

  // ── Handle audio chunk ──

  const handleAudioChunk = useCallback((payload: Uint8Array) => {
    // Try MediaSource approach
    if (mediaSourceRef.current && sourceBufferRef.current && !sourceBufferRef.current.updating) {
      try {
        const abuf = new ArrayBuffer(payload.byteLength)
        new Uint8Array(abuf).set(payload)
        sourceBufferRef.current.appendBuffer(abuf)
        return
      } catch {
        // MediaSource failed, fall through to blob approach
      }
    }

    // Fallback: play immediately (don't accumulate — reduces latency)
    const audioCopy = new ArrayBuffer(payload.byteLength)
    new Uint8Array(audioCopy).set(payload)
    audioQueueRef.current.push(audioCopy)

    // Play every chunk instead of waiting for 2 — reduces audio latency
    if (audioQueueRef.current.length >= 1) {
      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg']
      let mimeType = 'audio/webm;codecs=opus'
      for (const t of types) {
        try {
          const testBlob = new Blob([], { type: t })
          if (testBlob.type === t) { mimeType = t; break }
        } catch { /* try next */ }
      }

      const blob = new Blob(audioQueueRef.current, { type: mimeType })
      audioQueueRef.current = []

      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audio.play().catch(() => {/* autoplay blocked */})
      audio.onended = () => URL.revokeObjectURL(url)
    }
  }, [])

  // ── Setup audio playback via MediaSource ──

  const setupAudioPlayback = useCallback(() => {
    try {
      if (typeof MediaSource === 'undefined') return

      const ms = new MediaSource()
      mediaSourceRef.current = ms
      const audio = new Audio()
      audio.src = URL.createObjectURL(ms)
      audioElementRef.current = audio

      ms.addEventListener('sourceopen', () => {
        try {
          const sb = ms.addSourceBuffer('audio/webm;codecs=opus')
          sourceBufferRef.current = sb
          audio.play().catch(() => {/* autoplay policy */})
        } catch {
          console.warn('[Visio] MediaSource audio not supported, using fallback')
        }
      })
    } catch {
      console.warn('[Visio] Audio MediaSource setup failed')
    }
  }, [])

  // ── Adaptive quality: switch profile based on network conditions ──

  const switchQuality = useCallback((newQuality: string) => {
    if (newQuality === qualityRef.current) return
    const profile = QUALITY_PROFILES[newQuality]
    if (!profile) return

    console.log(`[Visio] Quality: ${qualityRef.current} → ${newQuality} (${profile.label})`)
    qualityRef.current = newQuality
    profileRef.current = profile
    setQualityLabel(profile.label)

    // Reconfigure encoder if active
    const encoder = encoderRef.current
    if (encoder && encoder.state === 'configured') {
      try {
        encoder.configure({
          codec: 'vp8',
          width: profile.width,
          height: profile.height,
          bitrate: profile.bitrate,
          framerate: profile.framerate,
        })
      } catch {
        console.warn('[Visio] Failed to reconfigure encoder')
      }
    }

    // Update canvas fallback interval if active
    if (canvasIntervalRef.current) {
      clearInterval(canvasIntervalRef.current)
      // Will be restarted by the canvas fallback loop
    }
  }, [])

  // ── Adaptive quality monitor ──

  const startAdaptiveMonitor = useCallback(() => {
    adaptiveTimerRef.current = setInterval(() => {
      const buffered = getWsBufferedAmount()
      const now = Date.now()
      const elapsed = now - lastQualityCheckRef.current

      if (elapsed < 3000) return // Check every 3 seconds
      lastQualityCheckRef.current = now

      const currentQuality = qualityRef.current
      const sent = framesSentRef.current
      const skipped = framesSkippedRef.current
      const skipRate = skipped / Math.max(1, sent + skipped)

      // Reset counters
      framesSentRef.current = 0
      framesSkippedRef.current = 0

      // Decision logic
      if (buffered > WS_BUFFER_HIGH || skipRate > 0.15) {
        // Network congestion → reduce quality
        if (currentQuality === 'high') switchQuality('medium')
        else if (currentQuality === 'medium') switchQuality('low')
      } else if (buffered < 10_000 && skipRate < 0.02) {
        // Network is clear → try to increase quality
        if (currentQuality === 'low') switchQuality('medium')
        else if (currentQuality === 'medium') switchQuality('high')
      }
    }, 2000)
  }, [getWsBufferedAmount, switchQuality])

  // ── Start video encoding (WebCodecs or Canvas fallback) ──

  const startVideoEncoding = useCallback((stream: MediaStream) => {
    const videoTrack = stream.getVideoTracks()[0]
    if (!videoTrack) return

    const hasWebCodecs = typeof VideoEncoder !== 'undefined' && typeof MediaStreamTrackProcessor !== 'undefined'
    setUseWebCodecs(hasWebCodecs)

    const profile = profileRef.current

    if (hasWebCodecs) {
      // ── WebCodecs path (Chrome/Edge) ──
      try {
        let forceKeyframe = false
        let frameCount = 0

        const encoder = new VideoEncoder({
          output: (chunk: EncodedVideoChunk) => {
            const buf = new ArrayBuffer(chunk.byteLength)
            chunk.copyTo(buf)
            const type = chunk.type === 'key' ? MSG_VP8_KEY : MSG_VP8_DELTA
            sendFrame(type, buf)
          },
          error: (err: DOMException) => {
            console.error('[Visio] VideoEncoder error:', err)
          },
        })

        encoder.configure({
          codec: 'vp8',
          width: profile.width,
          height: profile.height,
          bitrate: profile.bitrate,
          framerate: profile.framerate,
        })

        encoderRef.current = encoder

        // Force keyframe periodically
        keyframeIntervalRef.current = setInterval(() => {
          forceKeyframe = true
        }, profile.keyframeInterval)

        // Read frames from track
        const processor = new MediaStreamTrackProcessor({ track: videoTrack })
        const reader = processor.readable.getReader()
        processorRef.current = reader
        frameReaderActiveRef.current = true

        const readFrame = async () => {
          while (frameReaderActiveRef.current) {
            try {
              const { value: frame, done } = await reader.read()
              if (done || !frame) break

              // Skip frame if encoder queue is backed up (prevents lag buildup)
              if (encoder.state === 'configured' && encoder.encodeQueueSize <= ENCODER_QUEUE_MAX) {
                // Skip every other frame if WS buffer is getting full
                const buffered = getWsBufferedAmount()
                frameCount++

                if (buffered > WS_BUFFER_HIGH && frameCount % 2 === 0) {
                  // Drop every other frame under pressure
                  framesSkippedRef.current++
                  frame.close()
                  continue
                }

                encoder.encode(frame, { keyFrame: forceKeyframe })
                forceKeyframe = false
              } else {
                framesSkippedRef.current++
              }
              frame.close()
            } catch {
              break
            }
          }
        }
        readFrame()

        // Send periodic JPEG fallback for Firefox/Safari receivers (every 3s is enough)
        const fallbackCanvas = document.createElement('canvas')
        fallbackCanvas.width = 320
        fallbackCanvas.height = 240
        const fallbackCtx = fallbackCanvas.getContext('2d')
        const fallbackVideo = document.createElement('video')
        fallbackVideo.srcObject = new MediaStream([videoTrack])
        fallbackVideo.muted = true
        fallbackVideo.playsInline = true
        fallbackVideo.play().catch(() => {})

        jpegFallbackIntervalRef.current = setInterval(() => {
          if (fallbackCtx && fallbackVideo.readyState >= 2) {
            // Only send JPEG fallback if WS buffer isn't overloaded
            if (getWsBufferedAmount() < WS_BUFFER_CRITICAL) {
              fallbackCtx.drawImage(fallbackVideo, 0, 0, 320, 240)
              fallbackCanvas.toBlob(
                (blob) => {
                  if (blob) {
                    blob.arrayBuffer().then((buf) => sendFrame(MSG_JPEG, buf))
                  }
                },
                'image/jpeg',
                0.45
              )
            }
          }
        }, 3000) // Every 3s is fine — VP8 is the primary path
      } catch (err) {
        console.warn('[Visio] WebCodecs encoding failed, falling back to canvas:', err)
        startCanvasFallback(videoTrack)
      }
    } else {
      // ── Canvas JPEG fallback (Firefox/Safari) ──
      startCanvasFallback(videoTrack)
    }
  }, [sendFrame, getWsBufferedAmount])

  const startCanvasFallback = useCallback((videoTrack: MediaStreamTrack) => {
    const profile = profileRef.current
    const canvas = document.createElement('canvas')
    canvas.width = profile.width
    canvas.height = profile.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const video = document.createElement('video')
    video.srcObject = new MediaStream([videoTrack])
    video.muted = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.play().catch(() => {})

    // Use requestAnimationFrame for smoother timing than setInterval
    let lastSendTime = 0
    let rafId: number

    const sendCanvasFrame = (timestamp: number) => {
      if (!frameReaderActiveRef.current) return

      const interval = profileRef.current.jpegInterval
      if (timestamp - lastSendTime >= interval) {
        if (video.readyState >= 2) {
          const p = profileRef.current
          canvas.width = p.width
          canvas.height = p.height

          // Skip if WS buffer is overloaded
          if (getWsBufferedAmount() < WS_BUFFER_CRITICAL) {
            ctx.drawImage(video, 0, 0, p.width, p.height)
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  blob.arrayBuffer().then((buf) => sendFrame(MSG_JPEG, buf))
                }
              },
              'image/jpeg',
              p.jpegQuality
            )
          } else {
            framesSkippedRef.current++
          }
        }
        lastSendTime = timestamp
      }

      rafId = requestAnimationFrame(sendCanvasFrame)
    }

    frameReaderActiveRef.current = true
    rafId = requestAnimationFrame(sendCanvasFrame)

    // Store rAF ID for cleanup (use a dummy interval so cleanup code works)
    canvasIntervalRef.current = rafId as any
  }, [sendFrame, getWsBufferedAmount])

  // ── Start audio encoding ──

  const startAudioEncoding = useCallback((stream: MediaStream) => {
    const audioTrack = stream.getAudioTracks()[0]
    if (!audioTrack) return

    try {
      const audioStream = new MediaStream([audioTrack])

      // Detect supported mimeType
      let mimeType = 'audio/webm;codecs=opus'
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4'
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm'
          } else {
            mimeType = ''
          }
        }
      }

      const options: MediaRecorderOptions = { audioBitsPerSecond: 64_000 } // 64kbps is plenty for speech
      if (mimeType) options.mimeType = mimeType
      const recorder = new MediaRecorder(audioStream, options)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          e.data.arrayBuffer().then((buf) => sendFrame(MSG_AUDIO, buf))
        }
      }

      recorder.start(150) // 150ms chunks (lower latency than 200ms)
    } catch (err) {
      console.warn('[Visio] MediaRecorder not available:', err)
    }
  }, [sendFrame])

  // ── Connect WebSocket ──

  const connectWs = useCallback(() => {
    const wsHost = process.env.NEXT_PUBLIC_VISIO_WS_URL || (
      typeof window !== 'undefined' && window.location.hostname === 'localhost'
        ? 'ws://localhost:3003'
        : 'wss://visio.catchup.jaeprive.fr'
    )

    const url = `${wsHost}?room=${encodeURIComponent(roomId)}&id=${encodeURIComponent(participantIdRef.current)}&name=${encodeURIComponent(participantName)}&role=${encodeURIComponent(participantRole)}`

    setConnectionStatus('connecting')
    const ws = new WebSocket(url)
    ws.binaryType = 'arraybuffer'
    wsRef.current = ws

    ws.onopen = () => {
      setConnectionStatus('connected')
      reconnectCountRef.current = 0

      // Start heartbeat
      heartbeatRef.current = setInterval(() => {
        sendControl({ type: 'ping' })
        lastPingSentRef.current = Date.now()
      }, HEARTBEAT_INTERVAL)

      // Start adaptive quality monitor
      startAdaptiveMonitor()
    }

    ws.onmessage = (event) => {
      if (!(event.data instanceof ArrayBuffer)) return

      const buf = new Uint8Array(event.data)
      if (buf.length === 0) return

      const msgType = buf[0]

      if (msgType === MSG_CONTROL) {
        const decoder = new TextDecoder()
        const json = decoder.decode(buf.slice(1))
        try {
          const ctrl = JSON.parse(json) as ControlMessage
          if (ctrl.type === 'participants' && ctrl.participants) {
            setParticipants(ctrl.participants.filter(p => p.id !== participantIdRef.current))
          }
          if (ctrl.type === 'pong' && lastPingSentRef.current > 0) {
            const rtt = Date.now() - lastPingSentRef.current
            rttSamplesRef.current.push(rtt)
            if (rttSamplesRef.current.length > 10) rttSamplesRef.current.shift()
          }
        } catch { /* ignore malformed */ }
        return
      }

      // Media frames: parse sender info
      const parsed = parseFrame(event.data)
      if (!parsed) return

      switch (parsed.type) {
        case MSG_JPEG:
          handleJpegFrame(parsed.payload)
          break
        case MSG_VP8_KEY:
        case MSG_VP8_DELTA:
          if (useFallbackImg) {
            setUseFallbackImg(false)
          }
          handleVP8Frame(parsed.type, parsed.payload)
          break
        case MSG_AUDIO:
          handleAudioChunk(parsed.payload)
          break
      }
    }

    ws.onclose = (event) => {
      setConnectionStatus('disconnected')
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
      if (adaptiveTimerRef.current) clearInterval(adaptiveTimerRef.current)

      // Auto-reconnect with exponential backoff
      if (event.code !== 1000 && event.code !== 4000 && event.code !== 4001 && reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectCountRef.current++
        setConnectionStatus('reconnecting')
        const delay = RECONNECT_DELAY * Math.min(reconnectCountRef.current, 3)
        setTimeout(connectWs, delay)
      }
    }

    ws.onerror = () => {
      console.error('[Visio] WebSocket error')
    }
  }, [roomId, participantName, participantRole, sendControl, parseFrame, handleJpegFrame, handleVP8Frame, handleAudioChunk, startAdaptiveMonitor])

  // ── Start media ──

  const startMedia = useCallback(async () => {
    if (initCalledRef.current) return
    initCalledRef.current = true
    setNeedsUserGesture(false)

    try {
      const profile = profileRef.current
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: profile.width },
          height: { ideal: profile.height },
          facingMode,
          frameRate: { ideal: profile.framerate, max: 30 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

        localStreamRef.current = stream

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        startVideoEncoding(stream)
        startAudioEncoding(stream)
        setupAudioPlayback()
        connectWs()
      } catch (err: unknown) {
        console.error('[Visio] Failed to get media:', err)
        const errMsg = err instanceof Error ? err.message : 'Erreur inconnue'

        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
          localStreamRef.current = audioOnlyStream
          setIsVideoOff(true)
          startAudioEncoding(audioOnlyStream)
          setupAudioPlayback()
          connectWs()
          return
        } catch {
          // Complete failure
        }

        setMediaError(
          errMsg.includes('NotAllowed') || errMsg.includes('Permission')
            ? 'Autorise l\'acces a la camera et au micro dans les reglages de ton navigateur.'
            : errMsg.includes('NotFound')
            ? 'Aucune camera ou micro detecte sur cet appareil.'
            : `Impossible d'acceder a la camera : ${errMsg}`
        )
        setConnectionStatus('disconnected')
      }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectWs, facingMode, setupAudioPlayback, startAudioEncoding, startVideoEncoding])

  // ── Init ──

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    if (isIOS) {
      setNeedsUserGesture(true)
    } else {
      startMedia()
    }

    return () => {
      cleanup()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Cleanup ──

  const cleanup = useCallback(() => {
    frameReaderActiveRef.current = false

    if (processorRef.current) {
      processorRef.current.cancel().catch(() => {})
      processorRef.current = null
    }

    if (encoderRef.current && encoderRef.current.state !== 'closed') {
      encoderRef.current.close()
      encoderRef.current = null
    }

    if (decoderRef.current && decoderRef.current.state !== 'closed') {
      decoderRef.current.close()
      decoderRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }

    if (canvasIntervalRef.current) {
      cancelAnimationFrame(canvasIntervalRef.current as any)
      clearInterval(canvasIntervalRef.current)
    }
    if (jpegFallbackIntervalRef.current) clearInterval(jpegFallbackIntervalRef.current)
    if (keyframeIntervalRef.current) clearInterval(keyframeIntervalRef.current)
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    if (adaptiveTimerRef.current) clearInterval(adaptiveTimerRef.current)

    localStreamRef.current?.getTracks().forEach(t => t.stop())

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      sendControl({ type: 'leave' })
      wsRef.current.close(1000)
    }

    if (prevObjectUrlRef.current) URL.revokeObjectURL(prevObjectUrlRef.current)

    if (audioElementRef.current) {
      audioElementRef.current.pause()
      audioElementRef.current = null
    }
  }, [sendControl])

  // ── Toggle mute ──

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return

    const audioTrack = stream.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = isMuted
    }

    if (isMuted) {
      sendControl({ type: 'unmute' })
      if (mediaRecorderRef.current?.state === 'inactive') {
        try { mediaRecorderRef.current.start(150) } catch { /* ok */ }
      }
    } else {
      sendControl({ type: 'mute' })
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.pause()
      }
    }

    setIsMuted(!isMuted)
  }, [isMuted, sendControl])

  // ── Toggle video ──

  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current
    if (!stream) return

    const videoTrack = stream.getVideoTracks()[0]
    if (videoTrack) {
      videoTrack.enabled = isVideoOff
    }

    if (isVideoOff) {
      sendControl({ type: 'video_on' })
    } else {
      sendControl({ type: 'video_off' })
    }

    setIsVideoOff(!isVideoOff)
  }, [isVideoOff, sendControl])

  // ── Switch camera ──

  const switchCamera = useCallback(async () => {
    const newFacing = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newFacing)

    localStreamRef.current?.getVideoTracks().forEach(t => t.stop())

    frameReaderActiveRef.current = false
    if (canvasIntervalRef.current) {
      cancelAnimationFrame(canvasIntervalRef.current as any)
      clearInterval(canvasIntervalRef.current)
    }
    if (keyframeIntervalRef.current) clearInterval(keyframeIntervalRef.current)
    if (encoderRef.current && encoderRef.current.state !== 'closed') {
      encoderRef.current.close()
      encoderRef.current = null
    }

    try {
      const profile = profileRef.current
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: profile.width },
          height: { ideal: profile.height },
          facingMode: newFacing,
          frameRate: { ideal: profile.framerate, max: 30 },
        },
        audio: false,
      })

      const newVideoTrack = newStream.getVideoTracks()[0]
      const stream = localStreamRef.current
      if (stream) {
        const oldVideoTrack = stream.getVideoTracks()[0]
        if (oldVideoTrack) stream.removeTrack(oldVideoTrack)
        stream.addTrack(newVideoTrack)
      }

      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream
      }

      if (stream) startVideoEncoding(stream)
    } catch (err) {
      console.error('[Visio] Camera switch failed:', err)
    }
  }, [facingMode, startVideoEncoding])

  // ── End call ──

  const endCall = useCallback(() => {
    cleanup()
    onClose()
  }, [cleanup, onClose])

  // ── Determine remote participant name ──

  const remoteParticipant = participants.length > 0 ? participants[0] : null

  // ── Render ──

  if (needsUserGesture) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col items-center justify-center">
        <div className="text-center px-6">
          <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-white text-xl font-bold mb-2">Appel video</h2>
          <p className="text-gray-400 text-sm mb-8">Appuie pour autoriser la camera et le micro</p>
          <button
            onClick={startMedia}
            className="px-8 py-4 bg-emerald-500 text-white text-lg font-semibold rounded-2xl hover:bg-emerald-600 active:bg-emerald-700 transition-colors shadow-lg"
          >
            Demarrer l&apos;appel
          </button>
          <button
            onClick={onClose}
            className="block mx-auto mt-4 text-gray-500 text-sm hover:text-gray-300 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-gray-900 flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-900/90 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          {/* Connection status */}
          <div className={`w-2.5 h-2.5 rounded-full ${
            connectionStatus === 'connected' ? 'bg-green-400' :
            connectionStatus === 'reconnecting' ? 'bg-yellow-400 animate-pulse' :
            connectionStatus === 'connecting' ? 'bg-blue-400 animate-pulse' :
            'bg-red-400'
          }`} />
          <span className="text-white text-sm font-medium">
            {remoteParticipant ? remoteParticipant.name : 'En attente...'}
          </span>
          {remoteParticipant?.muted && (
            <span className="text-xs text-gray-400">
              (micro coupe)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Quality badge */}
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            qualityLabel === 'HD' ? 'bg-green-500/20 text-green-400' :
            qualityLabel === 'SD' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400'
          }`}>
            {qualityLabel}
          </span>
          <span className="text-white/70 text-sm font-mono">{callDuration}</span>
        </div>
      </div>

      {/* Main video area */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {/* Remote video */}
        {hasRemoteVideo ? (
          <>
            <canvas
              ref={remoteCanvasRef}
              className={`w-full h-full object-contain absolute inset-0 ${useFallbackImg ? 'hidden' : ''}`}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={remoteImgRef}
              alt="Video distante"
              className={`w-full h-full object-contain ${useFallbackImg ? '' : 'hidden'}`}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-white/60">
            {connectionStatus === 'connected' ? (
              <>
                <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <p className="text-sm">En attente du correspondant...</p>
                {participants.length > 0 && participants[0].videoOff && (
                  <p className="text-xs text-gray-500 mt-1">Camera desactivee</p>
                )}
              </>
            ) : connectionStatus === 'reconnecting' ? (
              <>
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-3" />
                <p className="text-sm">Reconnexion en cours...</p>
              </>
            ) : connectionStatus === 'connecting' ? (
              <>
                <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mb-3" />
                <p className="text-sm">Connexion...</p>
              </>
            ) : (
              <>
                {mediaError ? (
                  <>
                    <p className="text-sm text-red-400 text-center px-6">{mediaError}</p>
                    <button
                      onClick={onClose}
                      className="mt-3 px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-500 transition-colors"
                    >
                      Fermer
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-sm">Connexion perdue</p>
                    <button
                      onClick={connectWs}
                      className="mt-3 px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition-colors"
                    >
                      Reconnecter
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {/* Local video PiP */}
        <div className="absolute bottom-20 right-4 w-28 h-36 md:w-36 md:h-48 rounded-xl overflow-hidden border-2 border-white/20 shadow-lg bg-gray-800">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''} ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
          {isVideoOff && (
            <div className="w-full h-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={1.5} />
              </svg>
            </div>
          )}
        </div>

        {/* Participant count badge */}
        {participants.length > 0 && (
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {participants.length + 1} participant{participants.length > 0 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Bottom control bar */}
      <div className="bg-gray-900/95 backdrop-blur-sm px-4 py-4 pb-safe">
        <div className="flex items-center justify-center gap-4">
          {/* Mute toggle */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isMuted
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isMuted ? 'Activer le micro' : 'Couper le micro'}
          >
            {isMuted ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Camera toggle */}
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isVideoOff
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isVideoOff ? 'Activer la camera' : 'Couper la camera'}
          >
            {isVideoOff ? (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth={2} />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>

          {/* Switch camera (mobile) */}
          <button
            onClick={switchCamera}
            className="w-14 h-14 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
            title="Changer de camera"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          {/* End call */}
          <button
            onClick={endCall}
            className="w-16 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors shadow-lg"
            title="Raccrocher"
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
