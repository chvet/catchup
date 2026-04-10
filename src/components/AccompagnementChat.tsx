'use client'

// Chat direct bénéficiaire ↔ conseiller (mobile-first)
// SSE pour la réception temps réel + POST pour l'envoi
// Supporte: texte, documents, rendez-vous, visio WebRTC

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import RdvCard from './RdvCard'
import { WebTTSAdapter } from '@/platform/web/web-tts'
import { EqBars } from '@/components/MessageBubble'

const VisioCall = dynamic(() => import('@/components/VisioCall'), { ssr: false })
import PushNotificationManager from './PushNotificationManager'
import OnlineDot from './OnlineDot'
import VoiceRecorder from './VoiceRecorder'
import VoiceMessage from './VoiceMessage'
import { useHeartbeat } from '@/hooks/useHeartbeat'
import { useIsOnline } from '@/hooks/useOnlineStatus'

const SatisfactionSurvey = dynamic(() => import('./SatisfactionSurvey'), { ssr: false })

// Parse les dates SQLite ("2024-01-15 14:30:00") qui échouent sur Safari/iOS
function safeParseDate(dateStr: string): Date {
  if (!dateStr) return new Date()
  // Remplacer l'espace par T et ajouter Z si pas de timezone
  let normalized = dateStr
  if (normalized.includes(' ') && !normalized.includes('T')) {
    normalized = normalized.replace(' ', 'T')
  }
  if (!normalized.endsWith('Z') && !normalized.includes('+') && !normalized.includes('-', 10)) {
    normalized += 'Z'
  }
  const d = new Date(normalized)
  return isNaN(d.getTime()) ? new Date() : d
}

interface DirectMessage {
  id: string
  expediteurType: 'beneficiaire' | 'conseiller'
  expediteurId: string
  contenu: string
  contenuTraduit?: string | null
  langueCible?: string | null
  lu: boolean
  horodatage: string
}

interface AccompagnementChatProps {
  token: string
  referralId?: string
  conseillerId?: string
  conseillerPrenom: string
  structureNom: string
  beneficiairePrenom?: string
  priseEnChargeId?: string
  priseEnChargeStatut?: string
  onNewMessage?: () => void // callback pour notifier le parent (badge)
  embedded?: boolean // quand true, pas de header (le parent fournit le header)
}

// Types de contenu structuré dans les messages
interface DocumentContent {
  type: 'document'
  filename: string
  originalName: string
  size: number
  mimeType: string
  url: string
  priseEnChargeId?: string
}

interface RdvContent {
  type: 'rdv'
  id: string
  rdvId?: string
  titre: string
  dateDebut: string
  dateFin: string
  lieu?: string
  description?: string
  googleUrl: string
  icsUrl: string
  statut?: string
  proposePar?: string
  motifRefus?: string
}

interface RuptureContent {
  type: 'rupture'
  motif: string
  comportementInaproprie?: boolean
  parConseiller?: boolean
  parBeneficiaire?: boolean
}

interface SystemContent {
  type: 'system'
  content: string
  comportementInaproprie?: boolean
}

interface VoiceContent {
  type: 'voice'
  audioUrl: string
  duration: number
  transcription?: string
}

interface VisioContent {
  type: 'visio'
  sessionId: string
  status: string
}

type StructuredContent = DocumentContent | RdvContent | RuptureContent | SystemContent | VoiceContent | VisioContent

function parseMessageContent(contenu: string | null | undefined): StructuredContent | null {
  if (!contenu || typeof contenu !== 'string') return null
  try {
    const parsed = JSON.parse(contenu)
    if (parsed && typeof parsed === 'object' && parsed.type) {
      return parsed as StructuredContent
    }
  } catch {
    // Plain text message
  }
  return null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '\u{1F5BC}'
  if (mimeType === 'application/pdf') return '\u{1F4C4}'
  if (mimeType.includes('word') || mimeType.includes('document')) return '\u{1F4DD}'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '\u{1F4CA}'
  return '\u{1F4CE}'
}

export default function AccompagnementChat({ token, referralId, conseillerId, conseillerPrenom, structureNom, beneficiairePrenom, priseEnChargeId, priseEnChargeStatut, onNewMessage, embedded = false }: AccompagnementChatProps) {
  // Send heartbeat for the beneficiary
  useHeartbeat('beneficiaire', referralId)
  // Check if the conseiller is online
  const conseillerOnline = useIsOnline(conseillerId)

  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [connected, setConnected] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Visio state
  const [incomingCall, setIncomingCall] = useState<{ sessionId: string } | null>(null)
  const [visioSession, setVisioSession] = useState<{ sessionId: string } | null>(null)

  const [error, setError] = useState<string | null>(null)
  const [conseillerTyping, setConseillerTyping] = useState(false)

  // TTS
  const ttsRef = useRef<WebTTSAdapter | null>(null)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && !ttsRef.current) {
      ttsRef.current = new WebTTSAdapter()
      ttsRef.current.init()
    }
  }, [])

  const handleSpeak = useCallback((msgId: string, text: string) => {
    const tts = ttsRef.current
    if (!tts) return
    tts.unlock()
    if (speakingMsgId === msgId) {
      tts.stop()
      setSpeakingMsgId(null)
    } else {
      tts.stop()
      setSpeakingMsgId(msgId)
      setTimeout(() => {
        tts.speak(text, () => setSpeakingMsgId(null))
      }, 150)
    }
  }, [speakingMsgId])
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [ruptured, setRuptured] = useState(false)
  const [ruptureInfo, setRuptureInfo] = useState<RuptureContent | null>(null)

  // Satisfaction survey state
  const [showSurvey, setShowSurvey] = useState(false)
  const [surveyCompleted, setSurveyCompleted] = useState(false)
  const [surveyChecked, setSurveyChecked] = useState(false)

  // Check if survey should be shown (accompaniment terminee + no survey yet)
  useEffect(() => {
    if (priseEnChargeStatut !== 'terminee' || surveyChecked) return
    fetch('/api/accompagnement/satisfaction', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data && !data.exists) {
          // Survey not yet completed — show banner
          setSurveyChecked(true)
        } else if (data?.completed) {
          setSurveyCompleted(true)
          setSurveyChecked(true)
        } else {
          setSurveyChecked(true)
        }
      })
      .catch(() => setSurveyChecked(true))
  }, [priseEnChargeStatut, token, surveyChecked])

  // Charger les messages initiaux
  useEffect(() => {
    fetch('/api/accompagnement/messages', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => {
        if (r.status === 401) {
          // Token invalide ou expiré → supprimer et demander reconnexion
          try { localStorage.removeItem('catchup_accompagnement') } catch {}
          setError('session_expired')
          setLoading(false)
          return null
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
        if (!data) return // handled above (401)
        const msgs = data.messages || []
        setMessages(msgs)
        // Vérifier si un message de rupture existe déjà
        for (const m of msgs) {
          const parsed = parseMessageContent(m.contenu)
          if (parsed && parsed.type === 'rupture') {
            setRuptured(true)
            setRuptureInfo(parsed as RuptureContent)
            break
          }
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('[AccompagnementChat] Load error:', err)
        // Erreur réseau ou serveur — ne PAS supprimer la session, proposer un retry
        setError('Erreur de connexion. Vérifie ta connexion internet.')
        setLoading(false)
      })
  }, [token])

  // SSE pour les messages temps réel
  useEffect(() => {
    const es = new EventSource(`/api/accompagnement/messages/stream?token=${encodeURIComponent(token)}`)

    es.onopen = () => setConnected(true)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        // SSE envoie { type: 'connected' }, { type: 'typing' } ou { type: 'message', ...fields }
        if (data.type === 'connected') { setConnected(true); return }
        if (data.type === 'messages_read') {
          // Le conseiller a lu nos messages — mettre à jour le statut lu
          const readIds = new Set(data.ids || [])
          setMessages(prev => prev.map(m => readIds.has(m.id) ? { ...m, lu: true } : m))
          return
        }
        if (data.type === 'typing') {
          setConseillerTyping(true)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setConseillerTyping(false), 3000)
          return
        }
        const msg: DirectMessage = data.message || data
        if (!msg.id) return
        // Couper l'indicateur de frappe dès qu'un message arrive
        setConseillerTyping(false)
        if (typingTimeoutRef.current) { clearTimeout(typingTimeoutRef.current); typingTimeoutRef.current = null }
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        // Détecter les appels visio entrants
        const parsedMsg = parseMessageContent(msg.contenu)
        if (parsedMsg && parsedMsg.type === 'visio' && (parsedMsg as { status?: string }).status === 'ringing') {
          setIncomingCall({ sessionId: (parsedMsg as { sessionId: string }).sessionId })
        }
        // Détecter les messages de rupture en temps réel
        if (parsedMsg && parsedMsg.type === 'rupture') {
          setRuptured(true)
          setRuptureInfo(parsedMsg as RuptureContent)
        }
        if (msg.expediteurType === 'conseiller' && onNewMessage) {
          onNewMessage()
        }
      } catch { /* heartbeat */ }
    }

    es.onerror = () => setConnected(false)

    return () => es.close()
  }, [token, onNewMessage])

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Envoyer un message texte
  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return
    const contenu = input.trim()
    setInput('')
    setSending(true)

    try {
      const res = await fetch('/api/accompagnement/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ contenu }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.message) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev
            return [...prev, data.message]
          })
        }
      }
    } catch (err) {
      console.error('Erreur envoi', err)
    }

    setSending(false)
    inputRef.current?.focus()
  }, [input, sending, token])

  // Upload de document
  const handleFileUpload = useCallback(async (file: File) => {
    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              // Utiliser le message complet retourné par l'API si disponible
              const docMessage: DirectMessage = data.message || {
                id: data.messageId,
                expediteurType: 'beneficiaire',
                expediteurId: '',
                contenu: JSON.stringify({
                  type: 'document',
                  filename: data.document.filename,
                  originalName: data.document.originalName,
                  size: data.document.size,
                  mimeType: data.document.mimeType,
                  url: data.document.url,
                }),
                lu: false,
                horodatage: new Date().toISOString(),
              }
              if (docMessage.id) {
                setMessages(prev => {
                  if (prev.some(m => m.id === docMessage.id)) return prev
                  return [...prev, docMessage]
                })
              }
            } catch { /* parse error */ }
            resolve()
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))

        xhr.open('POST', '/api/accompagnement/documents')
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        xhr.send(formData)
      })
    } catch (err) {
      console.error('Erreur upload', err)
    }

    setUploading(false)
    setUploadProgress(0)
  }, [token])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
    // Reset pour permettre le re-upload du même fichier
    e.target.value = ''
  }, [handleFileUpload])

  // Enregistrement et envoi d'un message vocal
  const [voiceTranscribing, setVoiceTranscribing] = useState(false)
  const handleVoiceRecorded = useCallback(async (blob: Blob, duration: number) => {
    setVoiceTranscribing(true)

    // Upload du fichier audio sur le serveur + transcription en parallèle
    let audioUrl = ''
    let transcription = ''
    const ext = blob.type.includes('mp4') ? 'm4a' : 'webm'
    const filename = `voice.${ext}`

    const uploadPromise = (async () => {
      try {
        const formData = new FormData()
        formData.append('file', blob, filename)
        const res = await fetch('/api/accompagnement/documents', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData,
        })
        if (res.ok) {
          const data = await res.json()
          audioUrl = data.document?.url || data.url || ''
        }
      } catch { /* upload échoué */ }
    })()

    const transcribePromise = (async () => {
      try {
        const formData = new FormData()
        formData.append('file', blob, filename)
        const res = await fetch('/api/voice/transcribe', { method: 'POST', body: formData })
        if (res.ok) {
          const data = await res.json()
          transcription = data.text?.trim() || ''
        }
      } catch { /* transcription échouée */ }
    })()

    try {
      await Promise.race([
        Promise.all([uploadPromise, transcribePromise]),
        new Promise(resolve => setTimeout(resolve, 15000)),
      ])

      if (!audioUrl) {
        audioUrl = URL.createObjectURL(blob)
      }

      const voicePayload = JSON.stringify({
        type: 'voice',
        audioUrl,
        duration,
        transcription,
      })

      const res = await fetch('/api/accompagnement/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ contenu: voicePayload }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.message) {
          // Remplacer l'audioUrl du serveur par l'URL locale (le serveur stocke le JSON tel quel)
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev
            return [...prev, data.message]
          })
        }
      }
    } catch (err) {
      console.error('Erreur envoi vocal', err)
    }

    setVoiceTranscribing(false)
  }, [token])

  // Accepter un appel visio
  const handleAcceptVisio = useCallback(() => {
    if (!incomingCall) return
    setVisioSession({ sessionId: incomingCall.sessionId })
    setIncomingCall(null)
  }, [incomingCall])

  // Refuser un appel visio
  const handleDeclineVisio = useCallback(async () => {
    if (!incomingCall) return
    try {
      await fetch('/api/visio/signal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline', sessionId: incomingCall.sessionId, from: 'beneficiaire' }),
      })
    } catch { /* */ }
    setIncomingCall(null)
  }, [incomingCall])

  // Réponse à un RDV proposé
  const handleRdvResponse = useCallback(async (rdvMsgId: string, action: 'accepter' | 'refuser', motif?: string) => {
    try {
      const res = await fetch('/api/accompagnement/rdv/reponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messageId: rdvMsgId, action, motif }),
      })

      if (res.ok) {
        setMessages(prev => prev.map(msg => {
          if (msg.id === rdvMsgId) {
            try {
              const parsed = JSON.parse(msg.contenu)
              parsed.statut = action === 'accepter' ? 'accepte' : 'refuse'
              if (motif) parsed.motifRefus = motif
              return { ...msg, contenu: JSON.stringify(parsed) }
            } catch {
              return msg
            }
          }
          return msg
        }))
      }
    } catch (err) {
      console.error('Erreur réponse RDV', err)
    }
  }, [token])

  // Rendu d'un message selon son type
  const renderMessageContent = (msg: DirectMessage, isMine: boolean) => {
    const structured = parseMessageContent(msg.contenu)

    if (!structured) {
      // Message texte classique (avec traduction si disponible)
      const showTranslation = !isMine && msg.contenuTraduit
      return (
        <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isMine
            ? 'bg-catchup-primary text-white rounded-br-md'
            : 'bg-gray-100 text-gray-800 rounded-bl-md'
        }`}>
          {showTranslation ? msg.contenuTraduit : msg.contenu}
          {showTranslation && (
            <p className="mt-1.5 pt-1.5 border-t border-gray-200/50 text-xs text-gray-400 italic">
              {msg.contenu}
            </p>
          )}
        </div>
      )
    }

    switch (structured.type) {
      case 'document': {
        const doc = structured as DocumentContent
        return (
          <div className={`rounded-2xl border overflow-hidden ${
            isMine ? 'border-catchup-primary/30 bg-catchup-primary/5' : 'border-gray-200 bg-white'
          }`}>
            <div className="px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getFileIcon(doc.mimeType)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {doc.originalName || doc.filename}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-100 px-4 py-2">
              <a
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-sm font-medium text-catchup-primary hover:text-catchup-primary/80 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                T&eacute;l&eacute;charger
              </a>
            </div>
          </div>
        )
      }

      case 'visio': {
        return (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-sm text-blue-700">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Appel vid&eacute;o
          </div>
        )
      }

      case 'rdv': {
        const rdv = structured as RdvContent
        return (
          <RdvCard
            rdv={rdv}
            viewerType="beneficiaire"
            onAccept={(id) => handleRdvResponse(msg.id, 'accepter')}
            onDecline={(id, motif) => handleRdvResponse(msg.id, 'refuser', motif)}
          />
        )
      }

      case 'rupture': {
        const ruptureData = structured as RuptureContent
        return (
          <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4 w-full">
            {ruptureData.comportementInaproprie ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">&#9888;&#65039;</span>
                  <span className="text-sm font-semibold text-red-800">Accompagnement interrompu</span>
                </div>
                <p className="text-sm text-red-700">
                  Votre accompagnement a &eacute;t&eacute; interrompu. Un comportement inappropri&eacute; a &eacute;t&eacute; signal&eacute;.
                </p>
              </>
            ) : ruptureData.parBeneficiaire ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">&#8505;&#65039;</span>
                  <span className="text-sm font-semibold text-gray-800">Accompagnement cl&ocirc;tur&eacute;</span>
                </div>
                <p className="text-sm text-gray-700">
                  Cet accompagnement a &eacute;t&eacute; cl&ocirc;tur&eacute; suite &agrave; une nouvelle demande.
                </p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">&#9888;&#65039;</span>
                  <span className="text-sm font-semibold text-red-800">Accompagnement cl&ocirc;tur&eacute;</span>
                </div>
                <p className="text-sm text-red-700">
                  Votre accompagnement a &eacute;t&eacute; cl&ocirc;tur&eacute; par votre conseiller.
                </p>
              </>
            )}
          </div>
        )
      }

      case 'voice': {
        const voice = structured as VoiceContent
        return (
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${
            isMine
              ? 'bg-catchup-primary text-white rounded-br-md'
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
          }`}>
            <VoiceMessage
              audioUrl={voice.audioUrl}
              duration={voice.duration}
              transcription={voice.transcription}
            />
          </div>
        )
      }

      case 'system': {
        const sysData = structured as SystemContent
        return (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 w-full">
            <p className="text-sm text-gray-600">{sysData.content}</p>
          </div>
        )
      }

      default:
        return (
          <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isMine
              ? 'bg-catchup-primary text-white rounded-br-md'
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
          }`}>
            {msg.contenu}
          </div>
        )
    }
  }

  if (error) {
    const isSessionExpired = error === 'session_expired'
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white px-6 text-center">
        <span className="text-4xl mb-4">{isSessionExpired ? '🔄' : '📡'}</span>
        <p className="text-gray-700 font-medium mb-2">
          {isSessionExpired ? 'Ta session a expiré' : 'Problème de connexion'}
        </p>
        <p className="text-gray-400 text-sm mb-4">
          {isSessionExpired
            ? 'Reconnecte-toi avec ton code PIN pour reprendre la conversation.'
            : 'Vérifie ta connexion internet et réessaie.'}
        </p>
        {isSessionExpired ? (
          <button
            onClick={() => {
              localStorage.removeItem('catchup_accompagnement')
              window.location.reload()
            }}
            className="px-5 py-2.5 bg-catchup-primary text-white rounded-xl text-sm font-medium hover:bg-catchup-primary/90 active:scale-[0.98] transition-all"
          >
            Se reconnecter
          </button>
        ) : (
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-catchup-primary text-white rounded-xl text-sm font-medium hover:bg-catchup-primary/90 active:scale-[0.98] transition-all"
          >
            Réessayer
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-x-hidden">
      <PushNotificationManager type="beneficiaire" />

      {/* Appel visio entrant */}
      {incomingCall && !visioSession && (
        <div className="relative z-20 bg-gradient-to-r from-green-500 to-emerald-600 px-4 py-4 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold">Appel entrant</p>
                <p className="text-xs text-white/80">{conseillerPrenom} vous appelle</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeclineVisio}
                className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg active:bg-red-600"
              >
                <svg className="w-5 h-5 rotate-[135deg]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
              <button
                onClick={handleAcceptVisio}
                className="w-10 h-10 rounded-full bg-white text-green-600 flex items-center justify-center shadow-lg active:bg-green-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bandeau enquete de satisfaction */}
      {priseEnChargeStatut === 'terminee' && surveyChecked && !surveyCompleted && !showSurvey && (
        <button
          onClick={() => setShowSurvey(true)}
          className="w-full px-4 py-3 bg-gradient-to-r from-catchup-primary/10 to-purple-50 border-b border-catchup-primary/20 flex items-center gap-2 hover:from-catchup-primary/15 transition-colors"
        >
          <span className="text-xl">💬</span>
          <span className="text-sm font-medium text-gray-700 text-left flex-1">
            Ton accompagnement est termine. Donne-nous ton avis !
          </span>
          <svg className="w-5 h-5 text-catchup-primary flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Modal enquete de satisfaction */}
      {showSurvey && priseEnChargeId && (
        <SatisfactionSurvey
          token={token}
          priseEnChargeId={priseEnChargeId}
          onClose={() => setShowSurvey(false)}
          onSubmitted={() => {
            setShowSurvey(false)
            setSurveyCompleted(true)
          }}
        />
      )}

      {/* En-tête du chat (masqué en mode embedded) */}
      {!embedded && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-catchup-primary/5 to-white">
          <div className="w-10 h-10 rounded-full bg-catchup-primary/20 flex items-center justify-center">
            <span className="text-lg">{'\u{1F464}'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 truncate">{conseillerPrenom}</p>
            <p className="text-xs text-gray-500 truncate">{structureNom}</p>
          </div>
          <OnlineDot online={conseillerOnline || connected} showLabel />
        </div>
      )}

      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-catchup-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">{'\u{1F4AC}'}</p>
            <p className="text-gray-500 text-sm">
              Votre conseiller {conseillerPrenom} est disponible.
            </p>
            <p className="text-gray-400 text-xs mt-1">Envoyez-lui un message pour d&eacute;marrer la conversation !</p>
            <button
              onClick={() => {
                const hour = new Date().getHours()
                const greeting = hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour'
                setInput(`${greeting} ${conseillerPrenom} ! `)
              }}
              className="mt-4 px-4 py-2 bg-catchup-primary/10 text-catchup-primary rounded-full text-sm font-medium hover:bg-catchup-primary/20 transition-colors"
            >
              {new Date().getHours() >= 18 || new Date().getHours() < 5 ? '😊 Bonsoir' : '😊 Bonjour'} {conseillerPrenom}...
            </button>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.expediteurType === 'beneficiaire'
            const time = safeParseDate(msg.horodatage)
            const prevTime = idx > 0 ? safeParseDate(messages[idx - 1].horodatage) : null
            const showTime = idx === 0 || (
              prevTime ? time.getTime() - prevTime.getTime() > 5 * 60 * 1000 : true
            )
            const structured = parseMessageContent(msg.contenu)
            const isCard = structured !== null

            return (
              <div key={msg.id}>
                {showTime && (
                  <div className="flex justify-center my-2">
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-3 py-0.5 rounded-full">
                      {time.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                      {' \u00B7 '}
                      {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  {/* Avatar conseiller */}
                  {!isMine && (
                    <div className="w-7 h-7 rounded-full bg-catchup-primary/15 flex items-center justify-center mr-2 mt-1 shrink-0">
                      <span className="text-xs">{'\u{1F464}'}</span>
                    </div>
                  )}

                  <div className={isCard ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[80%]'}>
                    {!isMine && (
                      <p className="text-[10px] text-catchup-primary/70 mb-0.5 ml-1">{conseillerPrenom}</p>
                    )}
                    {renderMessageContent(msg, isMine)}
                    <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-between'}`}>
                      <span className="text-[10px] text-gray-400">
                        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        {isMine && (
                          <span className="ml-1">{msg.lu ? '\u2713\u2713' : '\u2713'}</span>
                        )}
                      </span>
                      {!isCard && (
                        <button
                          onClick={() => handleSpeak(msg.id, msg.contenu)}
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] transition-all duration-200
                            ${speakingMsgId === msg.id
                              ? 'bg-catchup-primary/10 text-catchup-primary font-medium'
                              : 'text-gray-400 hover:text-catchup-primary hover:bg-gray-50'
                            }`}
                          title={speakingMsgId === msg.id ? 'Arreter' : 'Ecouter'}
                        >
                          {speakingMsgId === msg.id ? (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <rect x="6" y="4" width="4" height="16" rx="1" />
                                <rect x="14" y="4" width="4" height="16" rx="1" />
                              </svg>
                              <EqBars />
                            </>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M11 5L6 9H2v6h4l5 4V5z" />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
        {/* Indicateur "en train d'écrire..." */}
        {conseillerTyping && (
          <div className="flex items-start gap-2 msg-appear">
            <div className="w-7 h-7 rounded-full bg-catchup-primary/15 flex items-center justify-center shrink-0">
              <span className="text-xs">{'\u{1F464}'}</span>
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">{conseillerPrenom} &eacute;crit</span>
                <span className="flex gap-1 ml-1">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 bg-gray-400 rounded-full inline-block"
                      style={{
                        animation: 'typing-dot 1.2s ease-in-out infinite',
                        animationDelay: `${i * 0.2}s`,
                      }}
                    />
                  ))}
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Barre de progression upload */}
      {uploading && (
        <div className="px-4 py-2 border-t border-gray-100 bg-catchup-primary/5">
          <div className="flex items-center gap-3">
            <span className="text-sm">{'\u{1F4CE}'}</span>
            <div className="flex-1">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-catchup-primary rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500 tabular-nums">{uploadProgress}%</span>
          </div>
        </div>
      )}

      {/* Zone de saisie (mobile-optimized) ou bandeau rupture */}
      {ruptured ? (
        <div className="px-4 py-3 border-t border-red-200 bg-red-50 safe-area-bottom">
          <p className="text-sm text-red-700 font-medium text-center">
            {ruptureInfo?.comportementInaproprie
              ? '\u26A0\uFE0F Votre accompagnement a \u00E9t\u00E9 interrompu. Un comportement inappropri\u00E9 a \u00E9t\u00E9 signal\u00E9.'
              : ruptureInfo?.parBeneficiaire
                ? 'Cet accompagnement a \u00E9t\u00E9 cl\u00F4tur\u00E9 suite \u00E0 une nouvelle demande.'
                : 'Votre accompagnement a \u00E9t\u00E9 cl\u00F4tur\u00E9 par votre conseiller.'
            }
          </p>
        </div>
      ) : (
        <div className="px-3 py-2 border-t border-gray-100 bg-white safe-area-bottom">
          {/* Indicateur de transcription vocale */}
          {voiceTranscribing && (
            <div className="flex items-center gap-2 px-3 py-1.5 mb-1">
              <div className="w-3 h-3 border-2 border-catchup-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-500">Transcription en cours...</span>
            </div>
          )}

          <div className="flex items-end gap-2">
            {/* Bouton upload document */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-catchup-primary hover:bg-catchup-primary/10 rounded-full disabled:opacity-40 transition-all active:scale-95"
              aria-label="Joindre un fichier"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="*/*"
            />

            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="Message..."
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-catchup-primary focus:border-transparent outline-none transition bg-gray-50"
              disabled={sending || voiceTranscribing}
            />

            {/* Message vocal */}
            <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={sending || voiceTranscribing} />

            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || voiceTranscribing}
              className="w-10 h-10 flex items-center justify-center bg-catchup-primary text-white rounded-full hover:bg-catchup-primary/90 disabled:opacity-40 transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* Overlay visio */}
      {visioSession && (
        <VisioCall
          sessionId={visioSession.sessionId}
          role="beneficiaire"
          peerName={conseillerPrenom || 'Conseiller'}
          onEnd={() => { setVisioSession(null); setIncomingCall(null) }}
        />
      )}
    </div>
  )
}
