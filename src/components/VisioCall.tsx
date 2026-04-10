'use client'

// Composant visio plein écran — WebRTC P2P
// Compatible iOS Safari : playsInline, autoPlay, muted, user gesture
// Responsive : plein écran mobile (safe-area) + desktop

import { useEffect, useRef, useState, useCallback } from 'react'
import { useWebRTC } from '@/hooks/useWebRTC'

interface VisioCallProps {
  sessionId: string
  role: 'conseiller' | 'beneficiaire'
  peerName: string
  onEnd: () => void
  standalone?: boolean
}

export default function VisioCall({ sessionId, role, peerName, onEnd, standalone }: VisioCallProps) {
  const {
    localStream,
    remoteStream,
    connected,
    reconnecting,
    error,
    audioEnabled,
    videoEnabled,
    start,
    hangup,
    cleanup,
    toggleAudio,
    toggleVideo,
  } = useWebRTC({ sessionId, role, onRemoteHangup: onEnd })

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const [elapsed, setElapsed] = useState(0)
  const [showControls, setShowControls] = useState(true)
  const [callStarted, setCallStarted] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // iOS Safari : démarrer uniquement après un geste utilisateur
  const handleStartCall = useCallback(() => {
    setCallStarted(true)
    start()
  }, [start])

  // Sur desktop/Android, démarrer automatiquement
  useEffect(() => {
    // Détecter iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
    if (!isIOS) {
      // Auto-start sur non-iOS (le geste est déjà le clic sur le bouton visio)
      handleStartCall()
    }
    return () => { cleanup() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Attacher les flux aux éléments vidéo
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream
      // iOS Safari : forcer le play après l'assignation du srcObject
      localVideoRef.current.play().catch(() => {})
    }
  }, [localStream])

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream
      // iOS Safari : forcer le play après l'assignation du srcObject
      remoteVideoRef.current.play().catch(() => {})
    }
  }, [remoteStream])

  // Timer une fois connecté
  useEffect(() => {
    if (connected) {
      timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [connected])

  // Auto-hide des contrôles après 5s
  useEffect(() => {
    if (!connected) return
    const timeout = setTimeout(() => setShowControls(false), 5000)
    return () => clearTimeout(timeout)
  }, [connected, showControls])

  const handleTapScreen = useCallback(() => {
    setShowControls(true)
  }, [])

  const handleHangup = useCallback(async () => {
    await hangup()
    onEnd()
  }, [hangup, onEnd])

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60)
    const sec = s % 60
    return `${min}:${sec.toString().padStart(2, '0')}`
  }

  // Erreur d'accès caméra/micro
  if (error) {
    return (
      <div className={`${standalone ? 'w-full h-screen' : 'fixed inset-0 z-[100]'} bg-black flex items-center justify-center p-6`}>
        <div className="text-center text-white max-w-sm">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">Erreur</p>
          <p className="text-sm text-white/70 mb-6">{error}</p>
          <button
            onClick={onEnd}
            className="px-6 py-3 bg-white/10 rounded-xl text-sm font-medium hover:bg-white/20 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    )
  }

  // iOS : écran d'attente avec bouton pour démarrer (user gesture requis)
  if (!callStarted) {
    return (
      <div className={`${standalone ? 'w-full h-screen' : 'fixed inset-0 z-[100]'} bg-black flex items-center justify-center p-6`}>
        <div className="text-center text-white max-w-sm">
          <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 ring-4 ring-white/5">
            <span className="text-4xl font-bold text-white/80">
              {peerName[0]?.toUpperCase() || '?'}
            </span>
          </div>
          <p className="text-lg font-medium mb-2">{peerName}</p>
          <p className="text-sm text-white/50 mb-6">Appuyez pour demarrer l&apos;appel video</p>
          <button
            onClick={handleStartCall}
            className="px-8 py-4 bg-green-500 rounded-2xl text-lg font-semibold hover:bg-green-600 active:scale-95 transition-all shadow-lg shadow-green-500/30"
          >
            Demarrer l&apos;appel
          </button>
          <button
            onClick={onEnd}
            className="block mx-auto mt-4 px-6 py-2 text-white/50 text-sm hover:text-white/80 transition-colors"
          >
            Annuler
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`${standalone ? 'w-full h-screen' : 'fixed inset-0 z-[100]'} bg-black flex flex-col select-none`}
      onClick={handleTapScreen}
    >
      {/* ── Header : timer + nom ── */}
      <div className={`absolute top-0 left-0 right-0 z-10 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <div className="flex items-center justify-center gap-3 px-4 py-2">
          {connected && (
            <span className="flex items-center gap-1.5 text-xs text-white/80 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              {formatTime(elapsed)}
            </span>
          )}
          <span className="text-sm font-medium text-white/90 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full">
            {peerName}
          </span>
          {reconnecting && (
            <span className="flex items-center gap-1.5 text-xs text-amber-300 bg-black/40 backdrop-blur-sm px-3 py-1.5 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Reconnexion...
            </span>
          )}
        </div>
      </div>

      {/* ── Video distante (plein écran) ── */}
      <div className="flex-1 relative overflow-hidden">
        {remoteStream ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-gray-900 to-black">
            <div className="text-center text-white">
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4 ring-4 ring-white/5">
                <span className="text-4xl font-bold text-white/80">
                  {peerName[0]?.toUpperCase() || '?'}
                </span>
              </div>
              <p className="text-lg font-medium">{peerName}</p>
              <p className="text-sm text-white/50 mt-1">
                {connected ? 'Audio uniquement' : 'Connexion en cours...'}
              </p>
              {!connected && (
                <div className="mt-6">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Video locale (PiP) ── */}
        {localStream && (
          <div className="absolute top-16 right-3 w-24 h-32 sm:w-32 sm:h-44 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)', WebkitTransform: 'scaleX(-1)' }}
            />
            {!videoEnabled && (
              <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                <svg className="w-6 h-6 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Contrôles ── */}
      <div
        className={`transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        <div className="bg-black/60 backdrop-blur-md px-6 py-5">
          <div className="flex items-center justify-center gap-5">
            {/* Toggle Micro */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleAudio() }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                audioEnabled
                  ? 'bg-white/15 text-white active:bg-white/25'
                  : 'bg-red-500 text-white active:bg-red-600'
              }`}
            >
              {audioEnabled ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4M3 3l18 18" />
                </svg>
              )}
            </button>

            {/* Raccrocher */}
            <button
              onClick={(e) => { e.stopPropagation(); handleHangup() }}
              className="w-16 h-16 rounded-full bg-red-500 text-white flex items-center justify-center active:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
            >
              <svg className="w-7 h-7 rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>

            {/* Toggle Caméra */}
            <button
              onClick={(e) => { e.stopPropagation(); toggleVideo() }}
              className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                videoEnabled
                  ? 'bg-white/15 text-white active:bg-white/25'
                  : 'bg-red-500 text-white active:bg-red-600'
              }`}
            >
              {videoEnabled ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2zM3 3l18 18" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
