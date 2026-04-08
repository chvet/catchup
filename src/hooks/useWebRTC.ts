// Hook WebRTC P2P — gère la connexion audio/vidéo entre 2 pairs
// Signaling via SSE + POST sur /api/visio/signal
// Compatible iOS Safari (getUserMedia fallback, autoplay, background handling)

import { useState, useRef, useCallback, useEffect } from 'react'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // TURN relay UDP
  {
    urls: 'turn:catchup.jaeprive.fr:3478',
    username: 'catchup',
    credential: 'CatchUp2024Turn!',
  },
  // TURN relay TCP (plus fiable sur cellular)
  {
    urls: 'turn:catchup.jaeprive.fr:3478?transport=tcp',
    username: 'catchup',
    credential: 'CatchUp2024Turn!',
  },
]

interface UseWebRTCOptions {
  sessionId: string
  role: 'conseiller' | 'beneficiaire'
  onRemoteHangup?: () => void
}

export function useWebRTC({ sessionId, role, onRemoteHangup }: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const onRemoteHangupRef = useRef(onRemoteHangup)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const cleanedUpRef = useRef(false)

  useEffect(() => { onRemoteHangupRef.current = onRemoteHangup }, [onRemoteHangup])

  const sendSignal = useCallback(async (type: string, data: unknown) => {
    try {
      await fetch('/api/visio/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'signal', sessionId, type, data, from: role }),
      })
    } catch (e) {
      console.warn('[WebRTC] Erreur envoi signal:', e)
    }
  }, [sessionId, role])

  const cleanup = useCallback(() => {
    if (cleanedUpRef.current) return
    cleanedUpRef.current = true
    esRef.current?.close()
    esRef.current = null
    pcRef.current?.close()
    pcRef.current = null
    localStreamRef.current?.getTracks().forEach(t => t.stop())
    localStreamRef.current = null
    setLocalStream(null)
    setRemoteStream(null)
    setConnected(false)
  }, [])

  const flushPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    for (const c of pendingCandidatesRef.current) {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch { /* ignore */ }
    }
    pendingCandidatesRef.current = []
  }, [])

  const start = useCallback(async () => {
    cleanedUpRef.current = false
    setError(null)

    // 1. Obtenir caméra + micro (avec fallback iOS Safari)
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    } catch (e) {
      const err = e as DOMException
      console.warn('[WebRTC] getUserMedia failed:', err.name, err.message)

      // Fallback iOS : contraintes minimales si les avancées échouent
      if (err.name === 'NotSupportedError' || err.name === 'OverconstrainedError' || err.name === 'TypeError') {
        try {
          console.log('[WebRTC] Retry with minimal constraints (iOS fallback)')
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        } catch (e2) {
          const err2 = e2 as DOMException
          console.error('[WebRTC] Fallback getUserMedia failed:', err2.name)
          setError(getMediaErrorMessage(err2))
          return
        }
      } else {
        setError(getMediaErrorMessage(err))
        return
      }
    }
    localStreamRef.current = stream
    setLocalStream(stream)

    // 2. Créer la connexion P2P
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS })
    pcRef.current = pc

    // Ajouter les tracks locaux
    stream.getTracks().forEach(track => pc.addTrack(track, stream))

    // Recevoir les tracks distants
    const remoteMediaStream = new MediaStream()
    pc.ontrack = (event) => {
      console.log('[WebRTC] ontrack:', event.track.kind, event.streams.length)
      event.streams[0]?.getTracks().forEach(track => {
        if (!remoteMediaStream.getTracks().find(t => t.id === track.id)) {
          remoteMediaStream.addTrack(track)
          console.log('[WebRTC] Added remote track:', track.kind, track.id)
        }
      })
      setRemoteStream(new MediaStream(remoteMediaStream.getTracks()))
    }

    // Envoyer les ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendSignal('ice-candidate', event.candidate.toJSON())
      }
    }

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      console.log('[WebRTC] connectionState:', state)
      if (state === 'connected') setConnected(true)
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        if (!cleanedUpRef.current) onRemoteHangupRef.current?.()
      }
    }

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] iceConnectionState:', pc.iceConnectionState)
      // iOS Safari : reconnecter si ICE échoue
      if (pc.iceConnectionState === 'failed') {
        try { pc.restartIce() } catch { /* not supported on all browsers */ }
      }
    }

    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] signalingState:', pc.signalingState)
    }

    // 3. Écouter les signaux de l'autre partie via SSE
    const es = new EventSource(`/api/visio/signal/stream?sessionId=${sessionId}&role=${role}`)
    esRef.current = es

    es.onmessage = async (event) => {
      try {
        const signal = JSON.parse(event.data)
        console.log('[WebRTC] Signal reçu:', signal.type, 'from:', signal.from)

        switch (signal.type) {
          case 'accept': {
            // Le bénéficiaire a accepté → le conseiller crée l'offre
            if (role === 'conseiller' && pc.signalingState === 'stable') {
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              sendSignal('offer', pc.localDescription)
            }
            break
          }
          case 'offer': {
            if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') {
              console.warn('[WebRTC] Ignoring offer, signalingState:', pc.signalingState)
              break
            }
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.data))
              await flushPendingCandidates(pc)
              const answer = await pc.createAnswer()
              await pc.setLocalDescription(answer)
              sendSignal('answer', pc.localDescription)
            } catch (offerErr) {
              console.error('[WebRTC] Failed to process offer:', offerErr)
            }
            break
          }
          case 'answer': {
            if (pc.signalingState !== 'have-local-offer') {
              console.warn('[WebRTC] Ignoring answer, signalingState:', pc.signalingState)
              break
            }
            try {
              await pc.setRemoteDescription(new RTCSessionDescription(signal.data))
              await flushPendingCandidates(pc)
            } catch (answerErr) {
              console.error('[WebRTC] Failed to process answer:', answerErr)
            }
            break
          }
          case 'ice-candidate': {
            if (signal.data) {
              if (pc.remoteDescription) {
                try { await pc.addIceCandidate(new RTCIceCandidate(signal.data)) } catch { /* */ }
              } else {
                pendingCandidatesRef.current.push(signal.data)
              }
            }
            break
          }
          case 'hangup':
          case 'decline': {
            if (!cleanedUpRef.current) onRemoteHangupRef.current?.()
            break
          }
        }
      } catch (e) {
        console.warn('[WebRTC] Erreur traitement signal:', e)
      }
    }

    es.onerror = () => {
      console.warn('[WebRTC] SSE error — will auto-reconnect')
    }

    // 4. Si bénéficiaire → envoyer 'accept' pour déclencher l'offre du conseiller
    if (role === 'beneficiaire') {
      await fetch('/api/visio/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'accept', sessionId }),
      })
    }
  }, [sessionId, role, sendSignal, flushPendingCandidates])

  const hangup = useCallback(async () => {
    try {
      await fetch('/api/visio/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'hangup', sessionId, from: role }),
      })
    } catch { /* */ }
    cleanup()
  }, [sessionId, role, cleanup])

  const toggleAudio = useCallback(() => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setAudioEnabled(prev => !prev)
  }, [])

  const toggleVideo = useCallback(() => {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setVideoEnabled(prev => !prev)
  }, [])

  // Cleanup au démontage
  useEffect(() => {
    return () => { cleanup() }
  }, [cleanup])

  // Gestion du passage en arrière-plan (iOS : couper video + audio)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && localStreamRef.current) {
        // Couper video en arrière-plan (économie batterie iOS)
        localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = false })
        // Couper audio aussi pour éviter les échos
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = false })
      } else if (document.visibilityState === 'visible' && localStreamRef.current) {
        // Restaurer selon les préférences utilisateur
        localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = videoEnabled })
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = audioEnabled })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [audioEnabled, videoEnabled])

  return {
    localStream,
    remoteStream,
    connected,
    error,
    audioEnabled,
    videoEnabled,
    start,
    hangup,
    cleanup,
    toggleAudio,
    toggleVideo,
  }
}

// Messages d'erreur adaptés par type d'erreur (iOS-specific)
function getMediaErrorMessage(err: DOMException): string {
  switch (err.name) {
    case 'NotAllowedError':
      return 'Acces camera/micro refuse. Sur iPhone, allez dans Reglages > Safari > Camera et Microphone.'
    case 'NotFoundError':
      return 'Aucune camera ou micro detecte sur cet appareil.'
    case 'NotSupportedError':
      return 'Votre navigateur ne supporte pas la visio. Utilisez Safari sur iPhone ou Chrome sur Android.'
    case 'NotReadableError':
      return 'Camera ou micro deja utilise par une autre application. Fermez-la et reessayez.'
    case 'OverconstrainedError':
      return 'Camera incompatible avec les parametres demandes. Reessayez.'
    default:
      return `Impossible d'acceder a la camera ou au micro (${err.name}).`
  }
}
