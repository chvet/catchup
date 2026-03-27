'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface Props {
  audioUrl: string
  duration: number
  transcription?: string
}

export default function VoiceMessage({ audioUrl, duration, transcription }: Props) {
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [audioDuration, setAudioDuration] = useState(duration || 0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const animFrameRef = useRef<number>(0)

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60)
    const s = Math.floor(secs % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const progress = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0

  const updateTime = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
      if (!audioRef.current.paused) {
        animFrameRef.current = requestAnimationFrame(updateTime)
      }
    }
  }, [])

  useEffect(() => {
    const audio = new Audio(audioUrl)
    audioRef.current = audio

    audio.addEventListener('loadedmetadata', () => {
      if (audio.duration && isFinite(audio.duration)) {
        setAudioDuration(audio.duration)
      }
    })

    audio.addEventListener('ended', () => {
      setPlaying(false)
      setCurrentTime(0)
      cancelAnimationFrame(animFrameRef.current)
    })

    audio.addEventListener('pause', () => {
      setPlaying(false)
      cancelAnimationFrame(animFrameRef.current)
    })

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      audio.pause()
      audio.src = ''
    }
  }, [audioUrl, updateTime])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (playing) {
      audio.pause()
    } else {
      audio.play().catch(() => {})
      setPlaying(true)
      animFrameRef.current = requestAnimationFrame(updateTime)
    }
  }, [playing, updateTime])

  const handleBarClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !audioDuration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * audioDuration
    setCurrentTime(audio.currentTime)
  }, [audioDuration])

  // Pseudo-waveform bars (decorative, fixed pattern)
  const bars = [3, 5, 8, 4, 7, 9, 6, 4, 8, 5, 7, 3, 6, 9, 5, 7, 4, 8, 6, 3, 5, 7, 9, 4, 6]

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        {/* Bouton play/pause */}
        <button
          onClick={togglePlay}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 transition-colors shrink-0"
          type="button"
        >
          {playing ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Waveform progress bar */}
        <div
          className="flex-1 flex items-center gap-[2px] h-8 cursor-pointer"
          onClick={handleBarClick}
        >
          {bars.map((h, i) => {
            const barProgress = (i / bars.length) * 100
            const isPlayed = barProgress < progress
            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-colors duration-150 ${
                  isPlayed ? 'opacity-100' : 'opacity-40'
                }`}
                style={{
                  height: `${h * 3}px`,
                  minWidth: '2px',
                  backgroundColor: 'currentColor',
                }}
              />
            )
          })}
        </div>

        {/* Duration */}
        <span className="text-[11px] font-mono tabular-nums opacity-80 shrink-0">
          {playing || currentTime > 0 ? formatTime(currentTime) : formatTime(audioDuration)}
        </span>
      </div>

      {/* Transcription */}
      {transcription && (
        <p className="text-xs italic opacity-70 leading-relaxed pl-10">
          {transcription}
        </p>
      )}
    </div>
  )
}
