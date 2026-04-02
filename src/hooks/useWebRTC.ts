// Hook WebRTC P2P — gère la connexion audio/vidéo entre 2 pairs
// Signaling via SSE + POST sur /api/visio/signal

import { useState, useRef, useCallback, useEffect } from 'react'

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
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

    // 1. Obtenir caméra + micro
    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
    } catch (e) {
      console.error('[WebRTC] getUserMedia failed:', e)
      setError('Impossible d\'accéder à la caméra ou au micro. Vérifiez les permissions.')
      return
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
      event.streams[0]?.getTracks().forEach(track => {
        if (!remoteMediaStream.getTracks().find(t => t.id === track.id)) {
          remoteMediaStream.addTrack(track)
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
      if (state === 'connected') setConnected(true)
      if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        if (!cleanedUpRef.current) onRemoteHangupRef.current?.()
      }
    }

    // 3. Écouter les signaux de l'autre partie via SSE
    const es = new EventSource(`/api/visio/signal/stream?sessionId=${sessionId}&role=${role}`)
    esRef.current = es

    es.onmessage = async (event) => {
      try {
        const signal = JSON.parse(event.data)

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
            if (pc.signalingState !== 'stable' && pc.signalingState !== 'have-local-offer') break
            await pc.setRemoteDescription(new RTCSessionDescription(signal.data))
            await flushPendingCandidates(pc)
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            sendSignal('answer', pc.localDescription)
            break
          }
          case 'answer': {
            if (pc.signalingState !== 'have-local-offer') break
            await pc.setRemoteDescription(new RTCSessionDescription(signal.data))
            await flushPendingCandidates(pc)
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
      // SSE auto-reconnecte, mais si la session est morte on cleanup
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
    return () => {
      cleanup()
    }
  }, [cleanup])

  // Gestion du passage en arrière-plan (iOS)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && localStreamRef.current) {
        // Couper la vidéo en arrière-plan (économie batterie)
        localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = false })
      } else if (document.visibilityState === 'visible' && localStreamRef.current && videoEnabled) {
        localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = true })
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [videoEnabled])

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
