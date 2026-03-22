'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { WebSTTAdapter } from '@/platform/web/web-stt'

interface Props {
  onResult: (text: string) => void
}

const stt = typeof window !== 'undefined' ? new WebSTTAdapter() : null

export default function VoiceRecorder({ onResult }: Props) {
  const [recording, setRecording] = useState(false)
  const [available] = useState(() => stt?.isAvailable() ?? false)
  const pulseRef = useRef<HTMLDivElement>(null)

  const toggle = useCallback(() => {
    if (!stt) return

    if (recording) {
      stt.stop()
      setRecording(false)
    } else {
      stt.start(
        (text) => {
          onResult(text)
          setRecording(false)
        },
        () => setRecording(false)
      )
      setRecording(true)
    }
  }, [recording, onResult])

  // Auto-stop after 30 seconds
  useEffect(() => {
    if (!recording) return
    const timer = setTimeout(() => {
      stt?.stop()
      setRecording(false)
    }, 30000)
    return () => clearTimeout(timer)
  }, [recording])

  if (!available) return null

  return (
    <div className="relative">
      {recording && (
        <div
          ref={pulseRef}
          className="absolute inset-0 rounded-full bg-red-400/30 pulse-ring"
        />
      )}
      <button
        onClick={toggle}
        className={`p-2 rounded-full transition-all ${
          recording
            ? 'bg-red-500 text-white shadow-lg scale-110'
            : 'text-gray-500 hover:text-catchup-primary hover:bg-gray-100'
        }`}
        title={recording ? 'Arrêter' : 'Dictée vocale'}
        type="button"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
        </svg>
      </button>
    </div>
  )
}
