'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface Props {
  onRecorded: (blob: Blob, duration: number) => void
  disabled?: boolean
}

const MAX_DURATION = 120 // secondes

function getSupportedMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
  ]
  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) return type
  }
  return ''
}

export default function VoiceRecorder({ onRecorded, disabled }: Props) {
  const [recording, setRecording] = useState(false)
  const [duration, setDuration] = useState(0)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [isAvailable, setIsAvailable] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const cancelledRef = useRef(false)

  // Vérifier si MediaRecorder est disponible (côté client uniquement)
  useEffect(() => {
    setIsAvailable(
      typeof navigator !== 'undefined'
      && !!navigator.mediaDevices?.getUserMedia
      && typeof MediaRecorder !== 'undefined'
      && !!getSupportedMimeType()
    )
  }, [])

  const cleanup = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try { mediaRecorderRef.current.stop() } catch {}
    }
    mediaRecorderRef.current = null
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
      streamRef.current = null
    }
    chunksRef.current = []
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanup()
  }, [cleanup])

  // Auto-stop after MAX_DURATION
  useEffect(() => {
    if (!recording) return
    const timeout = setTimeout(() => {
      stopRecording()
    }, MAX_DURATION * 1000)
    return () => clearTimeout(timeout)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording])

  const startRecording = useCallback(async () => {
    if (disabled || recording) return
    cancelledRef.current = false
    setPermissionDenied(false)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const mimeType = getSupportedMimeType()
      const recorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = () => {
        if (cancelledRef.current) {
          cleanup()
          return
        }

        const blob = new Blob(chunksRef.current, { type: mimeType })
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)

        // Ignorer les enregistrements trop courts (< 0.5s)
        if (elapsed >= 1 && blob.size > 0) {
          onRecorded(blob, elapsed)
        }

        // Arrêter les tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop())
          streamRef.current = null
        }
        chunksRef.current = []
      }

      recorder.start(100) // timeslice 100ms pour récupérer des chunks réguliers
      startTimeRef.current = Date.now()
      setDuration(0)
      setRecording(true)

      // Timer pour le compteur
      timerRef.current = setInterval(() => {
        const elapsed = Math.round((Date.now() - startTimeRef.current) / 1000)
        setDuration(elapsed)
      }, 200)
    } catch (err: unknown) {
      console.error('Erreur microphone:', err)
      if (err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')) {
        setPermissionDenied(true)
      }
    }
  }, [disabled, recording, onRecorded, cleanup])

  const stopRecording = useCallback(() => {
    if (!recording) return
    setRecording(false)
    setDuration(0)

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [recording])

  const cancelRecording = useCallback(() => {
    cancelledRef.current = true
    setRecording(false)
    setDuration(0)
    cleanup()
  }, [cleanup])

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  if (!isAvailable) return <div className="relative" />

  if (permissionDenied) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-red-500">Micro bloqué</span>
        <button
          onClick={() => setPermissionDenied(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
          type="button"
        >
          ✕
        </button>
      </div>
    )
  }

  if (recording) {
    return (
      <div className="flex items-center gap-1.5">
        {/* Annuler */}
        <button
          onClick={cancelRecording}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          title="Annuler"
          type="button"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Indicateur d'enregistrement */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-50">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-mono text-red-600 tabular-nums min-w-[2.5rem] text-center">
            {formatDuration(duration)}
          </span>
        </div>

        {/* Arrêter / Envoyer */}
        <button
          onClick={stopRecording}
          className="p-2 rounded-full bg-red-500 text-white shadow-lg scale-110 hover:bg-red-600 transition-all active:scale-100"
          title="Arrêter et envoyer"
          type="button"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <button
        onClick={startRecording}
        disabled={disabled}
        className="p-2 rounded-full text-gray-500 hover:text-catchup-primary hover:bg-gray-100 transition-all disabled:opacity-40"
        title="Message vocal"
        type="button"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
    </div>
  )
}
