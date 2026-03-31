'use client'

// Composant de chat direct conseiller <-> beneficiaire (cote conseiller)
// Utilise SSE (Server-Sent Events) pour la reception temps reel + POST pour l'envoi
// Integre : envoi de documents, appels video (Jitsi), planification de RDV

import { useState, useEffect, useRef, useCallback } from 'react'
import AiAssistantPanel from '@/components/conseiller/AiAssistantPanel'
import VideoCallCard from '@/components/VideoCallCard'
import RdvCard from '@/components/RdvCard'
import PlanifierRdvModal from '@/components/conseiller/PlanifierRdvModal'
import OnlineDot from '@/components/OnlineDot'
import VoiceRecorder from '@/components/VoiceRecorder'
import VoiceMessage from '@/components/VoiceMessage'
import { useIsOnline } from '@/hooks/useOnlineStatus'

interface DirectMessage {
  id: string
  expediteurType: 'beneficiaire' | 'conseiller'
  expediteurId: string
  contenu: string
  lu: boolean
  horodatage: string
}

interface DirectChatProps {
  referralId: string
  beneficiairePrenom: string
  beneficiaireAge?: number | null
  priseEnChargeStatut: string
}

// --- Types pour les messages structurés ---

interface DocumentPayload {
  type: 'document'
  filename: string
  originalName?: string
  mimeType: string
  size: number
  url: string
}

interface VideoPayload {
  type: 'video'
  id: string
  statut: string
  jitsiUrl: string
  proposePar: string
}

interface RdvPayload {
  type: 'rdv'
  id: string
  titre: string
  dateDebut: string
  dateFin: string
  lieu?: string
  description?: string
  googleUrl: string
  icsUrl: string
  statut?: string
  motifRefus?: string
}

interface RupturePayload {
  type: 'rupture'
  motif: string
  comportementInaproprie?: boolean
  parConseiller?: boolean
  parBeneficiaire?: boolean
}

interface SystemPayload {
  type: 'system'
  content: string
  comportementInaproprie?: boolean
}

interface VoicePayload {
  type: 'voice'
  audioUrl: string
  duration: number
  transcription?: string
}

type StructuredPayload = DocumentPayload | VideoPayload | RdvPayload | RupturePayload | SystemPayload | VoicePayload

// --- Helpers ---

/**
 * Parse une date qui peut être au format ISO ("2024-01-15T14:30:00.000Z")
 * ou au format SQLite ("2024-01-15 14:30:00") — new Date() échoue sur ce dernier
 * dans certains navigateurs (Safari notamment).
 */
function safeParseDate(dateStr: string | null | undefined): Date {
  if (!dateStr) return new Date(NaN)
  // Si la chaîne contient un espace mais pas de T, c'est probablement le format SQLite
  // "2024-01-15 14:30:00" -> "2024-01-15T14:30:00Z"
  let normalized = dateStr.trim()
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(normalized) && !normalized.includes('T')) {
    normalized = normalized.replace(' ', 'T')
    // Ajouter Z si pas de timezone
    if (!normalized.endsWith('Z') && !/[+-]\d{2}:\d{2}$/.test(normalized)) {
      normalized += 'Z'
    }
  }
  const d = new Date(normalized)
  return d
}

function tryParseStructured(contenu: string | null | undefined): StructuredPayload | null {
  if (!contenu || typeof contenu !== 'string') return null
  if (!contenu.startsWith('{') || !contenu.includes('"type"')) return null
  try {
    const parsed = JSON.parse(contenu)
    if (parsed && typeof parsed.type === 'string') {
      if (parsed.type === 'video' && parsed.id && !parsed.appelVideoId) {
        parsed.appelVideoId = parsed.id
      }
      return parsed as StructuredPayload
    }
  } catch { /* not JSON */ }
  return null
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

function mimeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📑'
  return '📎'
}

// --- Document card (inline) ---

function DocumentCard({ doc }: { doc: DocumentPayload }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3">
        <span className="text-2xl">{mimeIcon(doc.mimeType)}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{doc.originalName || doc.filename}</p>
          <p className="text-xs text-gray-400">{formatFileSize(doc.size)}</p>
        </div>
      </div>
      <div className="px-4 pb-3">
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-catchup-primary/30 text-catchup-primary text-xs font-medium hover:bg-catchup-primary/5 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Télécharger
        </a>
      </div>
    </div>
  )
}

// --- Upload progress indicator ---

function UploadProgress({ progress }: { progress: number }) {
  return (
    <div className="mx-6 mb-2 flex items-center gap-3 p-3 bg-catchup-primary/5 border border-catchup-primary/20 rounded-lg">
      <div className="w-5 h-5 border-2 border-catchup-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-medium text-gray-600">Envoi du document…</p>
        <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-catchup-primary h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-500 font-mono">{progress}%</span>
    </div>
  )
}

// --- Main component ---

export default function DirectChat({ referralId, beneficiairePrenom, beneficiaireAge, priseEnChargeStatut }: DirectChatProps) {
  // Real online status for the beneficiary (using referralId as heartbeat userId)
  const beneficiaireOnline = useIsOnline(referralId)

  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [codeInfo, setCodeInfo] = useState<{ code: string; moyenContact: string } | null>(null)
  const [resending, setResending] = useState(false)
  const [resendSuccess, setResendSuccess] = useState(false)
  const [connected, setConnected] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // RDV modal state
  const [rdvModalOpen, setRdvModalOpen] = useState(false)

  // Rupture modal state
  const [ruptureModalOpen, setRuptureModalOpen] = useState(false)
  const [ruptureMotif, setRuptureMotif] = useState('')
  const [ruptureInaproprie, setRuptureInaproprie] = useState(false)
  const [ruptureLoading, setRuptureLoading] = useState(false)
  const [ruptured, setRuptured] = useState(false)

  // Video call loading state
  const [videoLoading, setVideoLoading] = useState(false)
  const [conseillerPrenom, setConseillerPrenom] = useState('')

  // Fetch conseiller prenom for video calls
  useEffect(() => {
    fetch('/api/conseiller/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.prenom) setConseillerPrenom(data.prenom) })
      .catch(() => {})
  }, [])

  // RDV reminder loading state
  const [rdvReminderLoading, setRdvReminderLoading] = useState(false)

  // Inactivity tracking for reminders
  const [joursInactif, setJoursInactif] = useState(0)
  const [sendingRelance, setSendingRelance] = useState(false)

  // AI Assistant panel
  const [showAiAssistant, setShowAiAssistant] = useState(false)

  // Charger les messages initiaux
  useEffect(() => {
    fetch(`/api/conseiller/file-active/${referralId}/direct-messages`)
      .then(r => r.json())
      .then(data => {
        setMessages(data.messages || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [referralId])

  // SSE pour les messages temps réel
  useEffect(() => {
    if (priseEnChargeStatut !== 'prise_en_charge') return

    const es = new EventSource(`/api/conseiller/file-active/${referralId}/direct-messages/stream`)
    eventSourceRef.current = es

    es.onopen = () => setConnected(true)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        // Le SSE envoie { type: 'connected' } ou { type: 'message', message: {...} }
        if (data.type === 'connected') return
        const msg: DirectMessage = data.message || data
        if (!msg.id) return
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
      } catch { /* heartbeat ou données invalides */ }
    }

    es.onerror = () => {
      setConnected(false)
      // EventSource se reconnecte automatiquement
    }

    return () => {
      es.close()
      eventSourceRef.current = null
    }
  }, [referralId, priseEnChargeStatut])

  // Auto-scroll
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Calculer l'inactivite du beneficiaire
  useEffect(() => {
    const benefMsgs = messages.filter(m => m.expediteurType === 'beneficiaire')
    if (benefMsgs.length === 0) {
      setJoursInactif(0)
      return
    }
    const lastMsg = benefMsgs[benefMsgs.length - 1]
    const lastDate = safeParseDate(lastMsg.horodatage)
    const elapsed = Date.now() - lastDate.getTime()
    const jours = Math.floor(elapsed / (24 * 60 * 60 * 1000))
    setJoursInactif(jours)
  }, [messages])

  // Envoyer un message texte
  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return
    const contenu = input.trim()
    setInput('')
    setSending(true)

    try {
      const res = await fetch(`/api/conseiller/file-active/${referralId}/direct-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu }),
      })

      const data = await res.json()

      if (res.ok) {
        // Ajouter le message envoyé
        if (data.message) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev
            return [...prev, data.message]
          })
        }
        // Si un code PIN a été généré (premier message)
        if (data.codeGenere) {
          setCodeInfo({ code: data.code, moyenContact: data.moyenContact })
        }
      }
    } catch (err) {
      console.error('Erreur envoi message', err)
    }

    setSending(false)
  }, [input, sending, referralId])

  // Upload document
  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset input pour permettre de re-sélectionner le même fichier
    e.target.value = ''

    // Vérifier la taille (10 Mo max)
    if (file.size > 10 * 1024 * 1024) {
      alert('Le fichier ne doit pas dépasser 10 Mo')
      return
    }

    setUploading(true)
    setUploadProgress(0)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (evt) => {
        if (evt.lengthComputable) {
          setUploadProgress(Math.round((evt.loaded / evt.total) * 100))
        }
      })

      await new Promise<void>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              if (data.message) {
                setMessages(prev => {
                  if (prev.some(m => m.id === data.message.id)) return prev
                  return [...prev, data.message]
                })
              }
            } catch { /* ignore parse error */ }
            resolve()
          } else {
            reject(new Error(`Upload failed: ${xhr.status}`))
          }
        }
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.open('POST', `/api/conseiller/file-active/${referralId}/documents`)
        xhr.send(formData)
      })
    } catch (err) {
      console.error('Erreur upload document', err)
      alert('Erreur lors de l\'envoi du document')
    }

    setUploading(false)
    setUploadProgress(0)
  }, [referralId])

  // Enregistrement et envoi d'un message vocal (côté conseiller)
  const [voiceTranscribing, setVoiceTranscribing] = useState(false)
  const handleVoiceRecorded = useCallback(async (blob: Blob, duration: number) => {
    setVoiceTranscribing(true)

    const localAudioUrl = URL.createObjectURL(blob)

    // Transcrire en parallèle
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
      } catch { /* transcription échouée */ }
    })()

    try {
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

      const res = await fetch(`/api/conseiller/file-active/${referralId}/direct-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu: voicePayload }),
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
      console.error('Erreur envoi vocal', err)
    }

    setVoiceTranscribing(false)
  }, [referralId])

  // Renvoyer le code PIN au bénéficiaire
  const handleResendCode = useCallback(async () => {
    if (resending) return
    setResending(true)
    try {
      const res = await fetch(`/api/conseiller/file-active/${referralId}/resend-code`, {
        method: 'POST',
      })
      if (res.ok) {
        const data = await res.json()
        setCodeInfo({ code: data.code, moyenContact: data.moyenContact })
        setResendSuccess(true)
        setTimeout(() => setResendSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Erreur renvoi code:', err)
    } finally {
      setResending(false)
    }
  }, [referralId, resending])

  // Proposer un appel vidéo
  const handleProposeVideo = useCallback(async () => {
    if (videoLoading) return
    setVideoLoading(true)

    try {
      const res = await fetch(`/api/conseiller/file-active/${referralId}/video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'proposer' }),
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
      console.error('Erreur proposition visio', err)
    }

    setVideoLoading(false)
  }, [referralId, videoLoading])

  // Trouver le dernier RDV dans les messages (pour le bouton "Rappeler le RDV")
  const latestRdv = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const parsed = tryParseStructured(messages[i].contenu)
      if (parsed && parsed.type === 'rdv') return parsed as RdvPayload
    }
    return null
  })()

  // Rappeler le RDV — renvoie le dernier RDV comme nouveau message
  const handleRdvReminder = useCallback(async () => {
    if (rdvReminderLoading || !latestRdv) return
    setRdvReminderLoading(true)

    try {
      const res = await fetch(`/api/conseiller/file-active/${referralId}/direct-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contenu: JSON.stringify({
            type: 'rdv',
            id: latestRdv.id,
            titre: latestRdv.titre,
            dateDebut: latestRdv.dateDebut,
            dateFin: latestRdv.dateFin,
            lieu: latestRdv.lieu,
            description: latestRdv.description,
            googleUrl: latestRdv.googleUrl,
            icsUrl: latestRdv.icsUrl,
          }),
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const newMsg = data.message || data
        if (newMsg.id) {
          setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
        }
      }
    } catch (err) {
      console.error('Erreur rappel RDV:', err)
    }

    setRdvReminderLoading(false)
  }, [referralId, rdvReminderLoading, latestRdv])

  // Callback quand un RDV est créé via le modal
  const handleRdvCreated = useCallback((rdv: { id: string; titre: string; dateDebut: string; dateFin: string; googleUrl: string; icsUrl: string }) => {
    // Ajouter le message RDV localement dans le chat
    const rdvMessage: DirectMessage = {
      id: `rdv-${rdv.id}`,
      expediteurType: 'conseiller',
      expediteurId: '',
      contenu: JSON.stringify({
        type: 'rdv',
        id: rdv.id,
        titre: rdv.titre,
        dateDebut: rdv.dateDebut,
        dateFin: rdv.dateFin,
        googleUrl: rdv.googleUrl,
        icsUrl: rdv.icsUrl,
      }),
      lu: false,
      horodatage: new Date().toISOString(),
    }
    setMessages(prev => [...prev, rdvMessage])
    setRdvModalOpen(false)
  }, [])

  // Rompre l'accompagnement
  const handleRupture = useCallback(async () => {
    if (ruptureLoading || !ruptureMotif.trim()) return
    setRuptureLoading(true)

    try {
      const res = await fetch(`/api/conseiller/file-active/${referralId}/rupture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          motif: ruptureMotif.trim(),
          comportementInaproprie: ruptureInaproprie,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.message) {
          setMessages(prev => {
            if (prev.some(m => m.id === data.message.id)) return prev
            return [...prev, data.message]
          })
        }
        setRuptured(true)
        setRuptureModalOpen(false)
        setRuptureMotif('')
        setRuptureInaproprie(false)
      } else {
        const err = await res.json().catch(() => null)
        alert(err?.error || 'Erreur lors de la rupture')
      }
    } catch (err) {
      console.error('Erreur rupture', err)
      alert('Erreur lors de la rupture')
    }

    setRuptureLoading(false)
  }, [referralId, ruptureMotif, ruptureInaproprie, ruptureLoading])

  // Render un message en fonction de son contenu
  const renderMessageContent = useCallback((msg: DirectMessage) => {
    const parsed = tryParseStructured(msg.contenu)
    const isConseiller = msg.expediteurType === 'conseiller'

    if (!parsed) {
      // Message texte classique
      return (
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isConseiller
            ? 'bg-catchup-primary text-white rounded-tr-md'
            : 'bg-gray-100 text-gray-800 rounded-tl-md'
        }`}>
          {msg.contenu || ''}
        </div>
      )
    }

    // Message structuré
    switch (parsed.type) {
      case 'document':
        return <DocumentCard doc={parsed} />

      case 'video':
        return (
          <VideoCallCard
            proposal={{
              id: parsed.id,
              statut: parsed.statut,
              jitsiUrl: parsed.jitsiUrl,
              proposePar: parsed.proposePar,
            }}
            viewerType="conseiller"
            viewerId={msg.expediteurId}
            viewerName={conseillerPrenom}
          />
        )

      case 'rdv':
        return (
          <RdvCard
            rdv={{
              id: parsed.id,
              titre: parsed.titre,
              dateDebut: parsed.dateDebut,
              dateFin: parsed.dateFin,
              lieu: parsed.lieu,
              description: parsed.description,
              googleUrl: parsed.googleUrl,
              icsUrl: parsed.icsUrl,
              statut: parsed.statut,
              motifRefus: parsed.motifRefus,
            }}
            viewerType="conseiller"
            onResend={async (rdv) => {
              // Renvoyer le RDV comme nouveau message dans le chat
              try {
                const res = await fetch(`/api/conseiller/file-active/${referralId}/direct-messages`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contenu: JSON.stringify({
                      type: 'rdv',
                      id: rdv.id,
                      titre: rdv.titre,
                      dateDebut: rdv.dateDebut,
                      dateFin: rdv.dateFin,
                      lieu: rdv.lieu,
                      description: rdv.description,
                      googleUrl: rdv.googleUrl,
                      icsUrl: rdv.icsUrl,
                    }),
                  }),
                })
                if (res.ok) {
                  const data = await res.json()
                  const newMsg = data.message || data
                  if (newMsg.id) {
                    setMessages(prev => prev.some(m => m.id === newMsg.id) ? prev : [...prev, newMsg])
                  }
                }
              } catch (err) {
                console.error('Erreur rappel RDV:', err)
              }
            }}
          />
        )

      case 'rupture': {
        const ruptureData = parsed as RupturePayload
        return (
          <div className="rounded-xl border-2 border-red-300 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">&#9888;&#65039;</span>
              <span className="text-sm font-semibold text-red-800">Accompagnement rompu</span>
            </div>
            <p className="text-sm text-red-700">{ruptureData.motif}</p>
            {ruptureData.comportementInaproprie && (
              <p className="text-xs text-red-600 mt-1 font-medium">
                &#128308; Comportement inappropri&eacute; signal&eacute;
              </p>
            )}
            {ruptureData.parBeneficiaire && (
              <p className="text-xs text-red-600 mt-1">Rupture initi&eacute;e par le b&eacute;n&eacute;ficiaire (nouvelle demande)</p>
            )}
          </div>
        )
      }

      case 'voice': {
        const voice = parsed as VoicePayload
        return (
          <div className={`px-3.5 py-2.5 rounded-2xl text-sm ${
            isConseiller
              ? 'bg-catchup-primary text-white rounded-tr-md'
              : 'bg-gray-100 text-gray-800 rounded-tl-md'
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
        const sysData = parsed as SystemPayload
        return (
          <div className="rounded-xl border border-gray-300 bg-gray-50 p-3">
            <p className="text-sm text-gray-700">{sysData.content}</p>
          </div>
        )
      }

      default:
        return (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isConseiller
              ? 'bg-catchup-primary text-white rounded-tr-md'
              : 'bg-gray-100 text-gray-800 rounded-tl-md'
          }`}>
            {msg.contenu}
          </div>
        )
    }
  }, [])

  if (priseEnChargeStatut === 'rupture') {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">&#9888;&#65039;</p>
        <p className="text-red-600 font-medium">Accompagnement rompu</p>
        <p className="text-gray-400 text-sm mt-1">Cet accompagnement a &eacute;t&eacute; interrompu.</p>
      </div>
    )
  }

  // Envoyer une relance au beneficiaire inactif
  const handleRelance = useCallback(async () => {
    if (sendingRelance) return
    setSendingRelance(true)
    try {
      const contenu = `Salut ${beneficiairePrenom} ! Ca fait un moment qu'on ne s'est pas parle. J'espere que tu vas bien. N'hesite pas a me donner de tes nouvelles, je suis la pour t'accompagner 😊`
      const res = await fetch(`/api/conseiller/file-active/${referralId}/direct-messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contenu }),
      })
      const data = await res.json()
      if (res.ok && data.message) {
        setMessages(prev => {
          if (prev.some(m => m.id === data.message.id)) return prev
          return [...prev, data.message]
        })
      }
    } catch (err) {
      console.error('[DirectChat] Relance error:', err)
    } finally {
      setSendingRelance(false)
    }
  }, [sendingRelance, beneficiairePrenom, referralId])

  if (priseEnChargeStatut !== 'prise_en_charge') {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🤝</p>
        <p className="text-gray-500">Prenez en charge ce bénéficiaire pour démarrer l&apos;accompagnement</p>
      </div>
    )
  }

  return (
    <div className={`flex ${showAiAssistant ? 'flex-row' : ''}`} style={{ minHeight: '500px' }}>
    <div className={`flex flex-col ${showAiAssistant ? 'flex-1 min-w-0' : 'w-full'}`}>
      {/* En-tête */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-catchup-primary/20 flex items-center justify-center text-lg">
            {beneficiairePrenom?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {beneficiairePrenom}{beneficiaireAge ? `, ${beneficiaireAge} ans` : ''}
            </p>
            <OnlineDot online={beneficiaireOnline} showLabel />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAiAssistant(prev => !prev)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              showAiAssistant
                ? 'text-indigo-700 bg-indigo-100 border border-indigo-300'
                : 'text-indigo-600 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100'
            }`}
            title="Assistant IA"
          >
            &#129302; IA
          </button>
          {!ruptured && (
            <button
              onClick={() => setRuptureModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              &#9888;&#65039; Rompre
            </button>
          )}
          <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
            Chat direct
          </span>
        </div>
      </div>

      {/* Bandeau inactivite beneficiaire */}
      {joursInactif >= 3 && !ruptured && (
        <div className="mx-6 mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚠️</span>
            <p className="text-sm text-yellow-800 font-medium">
              Aucun message depuis {joursInactif} jour{joursInactif > 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleRelance}
            disabled={sendingRelance}
            className="px-3 py-1.5 text-xs font-medium text-yellow-800 bg-yellow-100 border border-yellow-300 rounded-lg hover:bg-yellow-200 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {sendingRelance ? 'Envoi...' : 'Envoyer une relance'}
          </button>
        </div>
      )}

      {/* Alerte code PIN + bouton renvoyer */}
      {codeInfo && (
        <div className="mx-6 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-blue-800 font-medium">Code PIN pour le bénéficiaire</p>
              <p className="text-xs text-blue-600 mt-1">
                Code : <span className="font-mono font-bold text-lg">{codeInfo.code}</span>
                <span className="ml-2">→ {codeInfo.moyenContact}</span>
              </p>
              <p className="text-xs text-blue-500 mt-1">
                Le bénéficiaire saisit ce code sur catchup.jaeprive.fr/accompagnement
              </p>
            </div>
            <button
              onClick={handleResendCode}
              disabled={resending}
              className="ml-3 shrink-0 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {resending ? '...' : '🔄 Renvoyer'}
            </button>
          </div>
        </div>
      )}

      {/* Bouton renvoyer le code — toujours visible quand il n'y a pas d'alerte PIN active */}
      {!codeInfo && (
        <div className="mx-6 mt-2 flex items-center justify-end gap-2">
          {resendSuccess && (
            <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-lg animate-pulse">
              ✅ Code envoyé !
            </span>
          )}
          <button
            onClick={handleResendCode}
            disabled={resending}
            className="px-3 py-1.5 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {resending ? 'Envoi du code...' : '🔑 Envoyer / Renvoyer le code au bénéficiaire'}
          </button>
        </div>
      )}

      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ maxHeight: '400px' }}>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-catchup-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-gray-400 mb-2">Aucun message pour le moment</p>
            <p className="text-sm text-gray-400">Envoyez un premier message pour démarrer l&apos;accompagnement.<br/>Un code PIN sera automatiquement généré pour le bénéficiaire.</p>
            <button
              onClick={() => {
                const hour = new Date().getHours()
                const greeting = hour >= 18 || hour < 5 ? 'Bonsoir' : 'Bonjour'
                setInput(`${greeting} ${beneficiairePrenom || ''} ! `.trimEnd() + ' ')
              }}
              className="mt-4 px-4 py-2 bg-catchup-primary/10 text-catchup-primary rounded-full text-sm font-medium hover:bg-catchup-primary/20 transition-colors"
            >
              😊 {new Date().getHours() >= 18 || new Date().getHours() < 5 ? 'Bonsoir' : 'Bonjour'} {beneficiairePrenom || ''}...
            </button>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isConseiller = msg.expediteurType === 'conseiller'
          const time = safeParseDate(msg.horodatage)
          const isValidDate = !isNaN(time.getTime())
          const formatTime = (d: Date) => isNaN(d.getTime()) ? '' : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          const formatDate = (d: Date) => isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
          const prevTime = idx > 0 ? safeParseDate(messages[idx - 1].horodatage) : null
          const showTime = isValidDate && (idx === 0 || (
            prevTime !== null && !isNaN(prevTime.getTime()) && time.getTime() - prevTime.getTime() > 5 * 60 * 1000
          ))

          const parsed = tryParseStructured(msg.contenu)
          const isStructured = parsed !== null

          // Montrer un séparateur de jour si la date change par rapport au message précédent
          const showDaySeparator = isValidDate && idx > 0 && prevTime !== null && !isNaN(prevTime.getTime()) && (
            time.toDateString() !== prevTime.toDateString()
          )
          // Montrer le séparateur de jour pour le premier message
          const showFirstDay = isValidDate && idx === 0

          return (
            <div key={msg.id}>
              {(showFirstDay || showDaySeparator) && (
                <div className="flex justify-center my-3">
                  <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full font-medium">
                    {formatDate(time)}
                  </span>
                </div>
              )}
              {showTime && (
                <div className="flex justify-center my-2">
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {formatTime(time)}
                  </span>
                </div>
              )}
              <div className={`flex ${isConseiller ? 'justify-end' : 'justify-start'}`}>
                <div className={isStructured ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[85%] md:max-w-[75%]'}>
                  {renderMessageContent(msg)}
                  <div className={`flex items-center gap-1 mt-0.5 ${isConseiller ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-[10px] text-gray-400">
                      {formatTime(time)}
                    </span>
                    {isConseiller && (
                      <span className="text-[10px] text-gray-400">{msg.lu ? '✓✓' : '✓'}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Upload progress */}
      {uploading && <UploadProgress progress={uploadProgress} />}

      {/* Bandeau rupture */}
      {ruptured && (
        <div className="mx-6 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-sm text-red-700 font-medium">&#9888;&#65039; Accompagnement rompu</p>
          <p className="text-xs text-red-500 mt-1">La conversation est cl&ocirc;tur&eacute;e.</p>
        </div>
      )}

      {/* Barre d'actions + zone de saisie */}
      {!ruptured && <div className="border-t border-gray-100 bg-white">
        {/* Action bar */}
        <div className="px-6 pt-2 pb-1 flex items-center gap-1">
          {/* Document upload */}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.odp,.txt,.csv"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="group relative p-2 rounded-lg text-gray-400 hover:text-catchup-primary hover:bg-catchup-primary/5 transition-colors disabled:opacity-50"
            title="Envoyer un document"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Document (10 Mo max)
            </span>
          </button>

          {/* Visio */}
          <button
            onClick={handleProposeVideo}
            disabled={videoLoading}
            className="group relative p-2 rounded-lg text-gray-400 hover:text-catchup-primary hover:bg-catchup-primary/5 transition-colors disabled:opacity-50"
            title="Proposer un appel vidéo"
          >
            {videoLoading ? (
              <div className="w-5 h-5 border-2 border-catchup-primary border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Appel vidéo
            </span>
          </button>

          {/* RDV */}
          <button
            onClick={() => setRdvModalOpen(true)}
            className="group relative p-2 rounded-lg text-gray-400 hover:text-catchup-primary hover:bg-catchup-primary/5 transition-colors"
            title="Planifier un rendez-vous"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-[10px] text-white bg-gray-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Planifier un RDV
            </span>
          </button>

          {/* Rappeler le RDV — visible uniquement s'il y a un RDV existant */}
          {latestRdv && (
            <button
              onClick={handleRdvReminder}
              disabled={rdvReminderLoading}
              className="group relative flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-orange-600 hover:bg-orange-50 border border-orange-200 transition-colors disabled:opacity-50"
              title="Rappeler le RDV au bénéficiaire"
            >
              {rdvReminderLoading ? (
                <div className="w-3.5 h-3.5 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>📅</>
              )}
              <span>Rappeler le RDV</span>
            </button>
          )}

          <div className="flex-1" />
        </div>

        {/* Indicateur de transcription vocale */}
        {voiceTranscribing && (
          <div className="flex items-center gap-2 px-6 py-1.5">
            <div className="w-3 h-3 border-2 border-catchup-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500">Transcription en cours...</span>
          </div>
        )}

        {/* Message input */}
        <div className="px-6 pb-3">
          <div className="flex gap-2 items-end">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Écrire un message..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-catchup-primary focus:border-transparent outline-none transition"
              disabled={sending || voiceTranscribing}
            />

            {/* Message vocal */}
            <VoiceRecorder onRecorded={handleVoiceRecorded} disabled={sending || voiceTranscribing} />

            <button
              onClick={handleSend}
              disabled={!input.trim() || sending || voiceTranscribing}
              className="px-4 py-2.5 bg-catchup-primary text-white rounded-full text-sm hover:bg-catchup-primary/90 disabled:opacity-50 transition-colors"
            >
              {sending ? '...' : '\u27A4'}
            </button>
          </div>
        </div>
      </div>

      }

      {/* Modal rupture */}
      {ruptureModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <h3 className="text-lg font-bold text-red-700 mb-1">&#9888;&#65039; Rompre l&apos;accompagnement</h3>
            <p className="text-sm text-gray-500 mb-4">
              Cette action est irr&eacute;versible. L&apos;accompagnement sera cl&ocirc;tur&eacute; et le b&eacute;n&eacute;ficiaire sera notifi&eacute;.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Motif de la rupture <span className="text-red-500">*</span>
              </label>
              <textarea
                value={ruptureMotif}
                onChange={e => setRuptureMotif(e.target.value)}
                rows={3}
                placeholder="Expliquez la raison de la rupture..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-400 focus:border-transparent outline-none resize-none"
              />
            </div>

            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={ruptureInaproprie}
                onChange={e => setRuptureInaproprie(e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">Signaler un comportement inappropri&eacute;</span>
            </label>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setRuptureModalOpen(false)
                  setRuptureMotif('')
                  setRuptureInaproprie(false)
                }}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRupture}
                disabled={!ruptureMotif.trim() || ruptureLoading}
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {ruptureLoading ? 'Rupture en cours...' : 'Confirmer la rupture'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal planification RDV */}
      <PlanifierRdvModal
        referralId={referralId}
        isOpen={rdvModalOpen}
        onClose={() => setRdvModalOpen(false)}
        onCreated={handleRdvCreated}
      />
    </div>

    {/* AI Assistant Panel */}
    <AiAssistantPanel
      beneficiairePrenom={beneficiairePrenom}
      beneficiaireAge={beneficiaireAge}
      conversationResume={null}
      isOpen={showAiAssistant}
      onClose={() => setShowAiAssistant(false)}
    />
    </div>
  )
}
