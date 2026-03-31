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

// ── Constants ──────────────────────────────────────────────────────

const MSG_JPEG = 0x01
const MSG_AUDIO = 0x02
const MSG_VP8_KEY = 0x03
const MSG_VP8_DELTA = 0x04
const MSG_CONTROL = 0x05

const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_DELAY = 2000
const HEARTBEAT_INTERVAL = 8000

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
  const initCalledRef = useRef(false)

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

  // ── Send binary frame ──

  const sendFrame = useCallback((type: number, payload: ArrayBuffer | Uint8Array) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return

    const frame = new Uint8Array(1 + payload.byteLength)
    frame[0] = type
    frame.set(new Uint8Array(payload instanceof ArrayBuffer ? payload : payload.buffer), 1)
    ws.send(frame)
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
      // Control messages don't have sender prefix from server broadcast
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
    const copy = new ArrayBuffer(payload.byteLength)
    new Uint8Array(copy).set(payload)
    const blob = new Blob([copy], { type: 'image/jpeg' })
    const url = URL.createObjectURL(blob)

    if (remoteImgRef.current) {
      remoteImgRef.current.src = url
    }

    // Revoke previous URL
    if (prevObjectUrlRef.current) {
      URL.revokeObjectURL(prevObjectUrlRef.current)
    }
    prevObjectUrlRef.current = url
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
            // Fall back to JPEG
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

    try {
      const chunk = new EncodedVideoChunk({
        type: type === MSG_VP8_KEY ? 'key' : 'delta',
        timestamp: performance.now() * 1000,
        data: payload,
      })
      decoderRef.current!.decode(chunk)
    } catch (err) {
      console.warn('[Visio] VP8 decode error, falling back to JPEG:', err)
      setUseFallbackImg(true)
    }
  }, [])

  // ── Handle audio chunk ──

  const handleAudioChunk = useCallback((payload: Uint8Array) => {
    // Try MediaSource approach (not supported on iOS Safari)
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

    // Fallback: accumulate and play as blob
    const audioCopy = new ArrayBuffer(payload.byteLength)
    new Uint8Array(audioCopy).set(payload)
    audioQueueRef.current.push(audioCopy)

    if (audioQueueRef.current.length >= 5) {
      // Try multiple mime types (iOS Safari doesn't support webm)
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

  // ── Start video encoding (WebCodecs or Canvas fallback) ──

  const startVideoEncoding = useCallback((stream: MediaStream) => {
    const videoTrack = stream.getVideoTracks()[0]
    if (!videoTrack) return

    const hasWebCodecs = typeof VideoEncoder !== 'undefined' && typeof MediaStreamTrackProcessor !== 'undefined'
    setUseWebCodecs(hasWebCodecs)

    if (hasWebCodecs) {
      // ── WebCodecs path (Chrome/Edge) ──
      try {
        let forceKeyframe = false

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
          width: 640,
          height: 480,
          bitrate: 800_000,
          framerate: 15,
        })

        encoderRef.current = encoder

        // Force keyframe every 2 seconds
        keyframeIntervalRef.current = setInterval(() => {
          forceKeyframe = true
        }, 2000)

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

              if (encoder.state === 'configured') {
                encoder.encode(frame, { keyFrame: forceKeyframe })
                forceKeyframe = false
              }
              frame.close()
            } catch {
              break
            }
          }
        }
        readFrame()

        // Also send periodic JPEG fallback frames (every 2s) for receivers
        // that don't support VP8 decoding (Firefox/Safari/older browsers)
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
            fallbackCtx.drawImage(fallbackVideo, 0, 0, 320, 240)
            fallbackCanvas.toBlob(
              (blob) => {
                if (blob) {
                  blob.arrayBuffer().then((buf) => sendFrame(MSG_JPEG, buf))
                }
              },
              'image/jpeg',
              0.5
            )
          }
        }, 2000)
      } catch (err) {
        console.warn('[Visio] WebCodecs encoding failed, falling back to canvas:', err)
        startCanvasFallback(videoTrack)
      }
    } else {
      // ── Canvas JPEG fallback (Firefox/Safari) ──
      startCanvasFallback(videoTrack)
    }
  }, [sendFrame])

  const startCanvasFallback = useCallback((videoTrack: MediaStreamTrack) => {
    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 240
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const video = document.createElement('video')
    video.srcObject = new MediaStream([videoTrack])
    video.muted = true
    video.playsInline = true
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')
    video.play().catch(() => {})

    canvasIntervalRef.current = setInterval(() => {
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, 320, 240)
        canvas.toBlob(
          (blob) => {
            if (blob) {
              blob.arrayBuffer().then((buf) => sendFrame(MSG_JPEG, buf))
            }
          },
          'image/jpeg',
          0.6
        )
      }
    }, 100) // 10fps
  }, [sendFrame])

  // ── Start audio encoding ──

  const startAudioEncoding = useCallback((stream: MediaStream) => {
    const audioTrack = stream.getAudioTracks()[0]
    if (!audioTrack) return

    try {
      const audioStream = new MediaStream([audioTrack])

      // Detect supported mimeType (iOS Safari doesn't support webm)
      let mimeType = 'audio/webm;codecs=opus'
      if (typeof MediaRecorder !== 'undefined') {
        if (!MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4'
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm'
          } else {
            mimeType = '' // let browser choose
          }
        }
      }

      const options: MediaRecorderOptions = { audioBitsPerSecond: 128_000 }
      if (mimeType) options.mimeType = mimeType
      const recorder = new MediaRecorder(audioStream, options)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          e.data.arrayBuffer().then((buf) => sendFrame(MSG_AUDIO, buf))
        }
      }

      recorder.start(200) // chunk every 200ms
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
      }, HEARTBEAT_INTERVAL)
    }

    ws.onmessage = (event) => {
      if (!(event.data instanceof ArrayBuffer)) return

      const buf = new Uint8Array(event.data)
      if (buf.length === 0) return

      const msgType = buf[0]

      if (msgType === MSG_CONTROL) {
        // Control messages from server don't have sender prefix
        const decoder = new TextDecoder()
        const json = decoder.decode(buf.slice(1))
        try {
          const ctrl = JSON.parse(json) as ControlMessage
          if (ctrl.type === 'participants' && ctrl.participants) {
            setParticipants(ctrl.participants.filter(p => p.id !== participantIdRef.current))
          }
        } catch { /* ignore malformed */ }
        return
      }

      // Media frames: parse sender info
      const parsed = parseFrame(event.data)
      if (!parsed) return

      switch (parsed.type) {
        case MSG_JPEG:
          // Toujours accepter les frames JPEG — l'autre participant
          // peut envoyer du JPEG (Firefox/Safari) même si on supporte VP8
          handleJpegFrame(parsed.payload)
          break
        case MSG_VP8_KEY:
        case MSG_VP8_DELTA:
          if (useFallbackImg) {
            // On recevait du JPEG, mais maintenant on reçoit du VP8
            // Basculer vers VP8 (meilleure qualité)
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

      // Auto-reconnect
      if (event.code !== 1000 && event.code !== 4000 && event.code !== 4001 && reconnectCountRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectCountRef.current++
        setConnectionStatus('reconnecting')
        setTimeout(connectWs, RECONNECT_DELAY)
      }
    }

    ws.onerror = () => {
      console.error('[Visio] WebSocket error')
    }
  }, [roomId, participantName, participantRole, sendControl, parseFrame, handleJpegFrame, handleVP8Frame, handleAudioChunk])

  // ── Start media (called from useEffect or from user tap on iOS) ──

  const startMedia = useCallback(async () => {
    if (initCalledRef.current) return
    initCalledRef.current = true
    setNeedsUserGesture(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode },
        audio: { echoCancellation: true, noiseSuppression: true },
      })

        localStreamRef.current = stream

        // Show local preview
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }

        // Start encoding
        startVideoEncoding(stream)
        startAudioEncoding(stream)

        // Setup remote audio playback
        setupAudioPlayback()

        // Connect WebSocket
        connectWs()
      } catch (err: unknown) {
        console.error('[Visio] Failed to get media:', err)
        const errMsg = err instanceof Error ? err.message : 'Erreur inconnue'

        // Try audio-only fallback
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

  // ── Init: detect iOS and either auto-start or wait for tap ──

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    if (isIOS) {
      // iOS Safari requires user gesture for getUserMedia
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

    if (canvasIntervalRef.current) clearInterval(canvasIntervalRef.current)
    if (jpegFallbackIntervalRef.current) clearInterval(jpegFallbackIntervalRef.current)
    if (keyframeIntervalRef.current) clearInterval(keyframeIntervalRef.current)
    if (heartbeatRef.current) clearInterval(heartbeatRef.current)

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
      audioTrack.enabled = isMuted // toggle (was muted, now unmute)
    }

    if (isMuted) {
      sendControl({ type: 'unmute' })
      // Restart MediaRecorder if it was stopped
      if (mediaRecorderRef.current?.state === 'inactive') {
        try { mediaRecorderRef.current.start(200) } catch { /* ok */ }
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
      videoTrack.enabled = isVideoOff // toggle
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

    // Stop current video tracks
    localStreamRef.current?.getVideoTracks().forEach(t => t.stop())

    // Stop current encoding
    frameReaderActiveRef.current = false
    if (canvasIntervalRef.current) clearInterval(canvasIntervalRef.current)
    if (keyframeIntervalRef.current) clearInterval(keyframeIntervalRef.current)
    if (encoderRef.current && encoderRef.current.state !== 'closed') {
      encoderRef.current.close()
      encoderRef.current = null
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: newFacing },
        audio: false,
      })

      const newVideoTrack = newStream.getVideoTracks()[0]
      const stream = localStreamRef.current
      if (stream) {
        // Replace video track in stream
        const oldVideoTrack = stream.getVideoTracks()[0]
        if (oldVideoTrack) stream.removeTrack(oldVideoTrack)
        stream.addTrack(newVideoTrack)
      }

      // Update local preview
      if (localVideoRef.current && stream) {
        localVideoRef.current.srcObject = stream
      }

      // Restart encoding
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

  // iOS: show "tap to start" screen before getUserMedia
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
        <div className="text-white/70 text-sm font-mono">{callDuration}</div>
      </div>

      {/* Main video area */}
      <div className="flex-1 relative overflow-hidden bg-black">
        {/* Remote video — both canvas (VP8) and img (JPEG) are mounted, visibility toggled */}
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

        {/* Local video PiP - bottom right */}
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
