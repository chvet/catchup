'use client'

// Chat direct bénéficiaire ↔ conseiller (mobile-first)
// SSE pour la réception temps réel + POST pour l'envoi
// Supporte: texte, documents, appels vidéo, rendez-vous

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import VideoCallCard from './VideoCallCard'
import RdvCard from './RdvCard'
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

interface VideoContent {
  type: 'video'
  appelVideoId: string
  statut: string
  jitsiUrl: string
  proposePar: string
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

type StructuredContent = DocumentContent | VideoContent | RdvContent | RuptureContent | SystemContent | VoiceContent

function parseMessageContent(contenu: string | null | undefined): StructuredContent | null {
  if (!contenu || typeof contenu !== 'string') return null
  try {
    const parsed = JSON.parse(contenu)
    if (parsed && typeof parsed === 'object' && parsed.type) {
      // Normaliser : le JSON stocké utilise "id" mais l'interface attend "appelVideoId"
      if (parsed.type === 'video' && parsed.id && !parsed.appelVideoId) {
        parsed.appelVideoId = parsed.id
      }
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

  const [error, setError] = useState<string | null>(null)
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
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json()
      })
      .then(data => {
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
        setError('Session expirée. Veuillez vous reconnecter.')
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
        // SSE envoie { type: 'connected' } ou { type: 'message', ...fields }
        if (data.type === 'connected') { setConnected(true); return }
        const msg: DirectMessage = data.message || data
        if (!msg.id) return
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        // Détecter les messages de rupture en temps réel
        const parsedMsg = parseMessageContent(msg.contenu)
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

    // 1. Créer une URL locale pour la lecture immédiate
    const localAudioUrl = URL.createObjectURL(blob)

    // 2. Transcrire en parallèle (ne bloque pas l'envoi)
    let transcription = ''
    const transcribePromise = (async () => {
      try {
        const formData = new FormData()
        formData.append('file', blob, `voice.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`)
        const res = await fetch('/api/voice/transcribe', { method: 'POST', body: formData })
        if (res.ok) {
          const data = await res.json()
          transcription = data.text?.trim() || ''
        }
      } catch { /* transcription échouée — on continue sans */ }
    })()

    // 3. Envoyer le message vocal structuré immédiatement
    try {
      // Attendre la transcription (max 15s)
      await Promise.race([
        transcribePromise,
        new Promise(resolve => setTimeout(resolve, 15000)),
      ])

      const voicePayload = JSON.stringify({
        type: 'voice',
        audioUrl: localAudioUrl,
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

  // Réponse à un appel vidéo
  const handleVideoResponse = useCallback(async (appelVideoId: string, action: 'accepter' | 'refuser') => {
    try {
      const res = await fetch('/api/accompagnement/video/reponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ messageId: appelVideoId, action }),
      })

      if (res.ok) {
        const responseData = await res.json()
        // Mettre à jour le statut du message vidéo localement
        setMessages(prev => prev.map(msg => {
          if (msg.id === appelVideoId) {
            // Mettre à jour le JSON stocké dans contenu
            try {
              const parsed = JSON.parse(msg.contenu)
              parsed.statut = action === 'accepter' ? 'acceptee' : 'refusee'
              return { ...msg, contenu: JSON.stringify(parsed) }
            } catch {
              return msg
            }
          }
          return msg
        }))

        // Si accepté, ouvrir directement la visio sur mobile
        if (action === 'accepter' && responseData.jitsiUrl) {
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
          if (isMobile) {
            // Append beneficiary role and name to the visio URL
            const visioUrl = new URL(responseData.jitsiUrl, window.location.origin)
            visioUrl.searchParams.set('role', 'beneficiaire')
            if (beneficiairePrenom) visioUrl.searchParams.set('name', beneficiairePrenom)
            window.open(visioUrl.toString(), '_blank', 'noopener,noreferrer')
          }
        }
      }
    } catch (err) {
      console.error('Erreur réponse vidéo', err)
    }
  }, [token])

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
      // Message texte classique
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

      case 'video': {
        const video = structured as VideoContent
        return (
          <VideoCallCard
            proposal={{
              id: msg.id,
              statut: video.statut,
              jitsiUrl: video.jitsiUrl,
              proposePar: video.proposePar,
            }}
            viewerType="beneficiaire"
            viewerId={msg.expediteurType === 'beneficiaire' ? msg.expediteurId : ''}
            viewerName={beneficiairePrenom}
            onAccept={(id) => handleVideoResponse(id, 'accepter')}
            onDecline={(id) => handleVideoResponse(id, 'refuser')}
          />
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
    return (
      <div className="flex flex-col items-center justify-center h-full bg-white px-6 text-center">
        <span className="text-4xl mb-4">⚠️</span>
        <p className="text-gray-700 font-medium mb-2">{error}</p>
        <button
          onClick={() => {
            localStorage.removeItem('catchup_accompagnement')
            window.location.reload()
          }}
          className="mt-3 px-4 py-2 bg-catchup-primary text-white rounded-lg text-sm hover:bg-catchup-primary/90 transition-colors"
        >
          Se reconnecter
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-x-hidden">
      <PushNotificationManager type="beneficiaire" />

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
                    <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-gray-400">
                        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMine && (
                        <span className="text-[10px] text-gray-400">{msg.lu ? '\u2713\u2713' : '\u2713'}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })
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
    </div>
  )
}
