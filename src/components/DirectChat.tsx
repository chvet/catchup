'use client'

// Composant de chat direct conseiller <-> beneficiaire (cote conseiller)
// Utilise SSE (Server-Sent Events) pour la reception temps reel + POST pour l'envoi
// Integre : envoi de documents, appels video (Jitsi), planification de RDV

import { useState, useEffect, useRef, useCallback } from 'react'
import VideoCallCard from '@/components/VideoCallCard'
import RdvCard from '@/components/RdvCard'
import PlanifierRdvModal from '@/components/conseiller/PlanifierRdvModal'

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
  description?: string
  googleUrl: string
  icsUrl: string
}

type StructuredPayload = DocumentPayload | VideoPayload | RdvPayload

// --- Helpers ---

function tryParseStructured(contenu: string | null | undefined): StructuredPayload | null {
  if (!contenu || typeof contenu !== 'string') return null
  if (!contenu.startsWith('{') || !contenu.includes('"type"')) return null
  try {
    const parsed = JSON.parse(contenu)
    if (parsed && typeof parsed.type === 'string') return parsed as StructuredPayload
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
          <p className="text-sm font-medium text-gray-900 truncate">{doc.filename}</p>
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
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [codeInfo, setCodeInfo] = useState<{ code: string; moyenContact: string } | null>(null)
  const [connected, setConnected] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  // Upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // RDV modal state
  const [rdvModalOpen, setRdvModalOpen] = useState(false)

  // Video call loading state
  const [videoLoading, setVideoLoading] = useState(false)

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
        const msg: DirectMessage = JSON.parse(event.data)
        setMessages(prev => {
          // Éviter les doublons
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

  // Callback quand un RDV est créé via le modal
  const handleRdvCreated = useCallback((rdv: { id: string; titre: string; dateDebut: string; dateFin: string; googleUrl: string; icsUrl: string }) => {
    // Le message sera ajouté via SSE, mais on peut aussi l'ajouter localement
    // si le serveur le renvoie dans la réponse du modal
    // (PlanifierRdvModal fait le POST et appelle onCreated)
  }, [])

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
              description: parsed.description,
              googleUrl: parsed.googleUrl,
              icsUrl: parsed.icsUrl,
            }}
          />
        )

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

  if (priseEnChargeStatut !== 'prise_en_charge') {
    return (
      <div className="text-center py-12">
        <p className="text-4xl mb-3">🤝</p>
        <p className="text-gray-500">Prenez en charge ce bénéficiaire pour démarrer l&apos;accompagnement</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col" style={{ minHeight: '500px' }}>
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
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-300'}`} />
              <span className="text-xs text-gray-400">
                {connected ? 'Connecté' : 'Hors ligne'}
              </span>
            </div>
          </div>
        </div>
        <span className="text-xs text-gray-400 bg-white px-2 py-1 rounded border border-gray-200">
          Chat direct
        </span>
      </div>

      {/* Alerte code PIN */}
      {codeInfo && (
        <div className="mx-6 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">Code PIN envoyé au bénéficiaire</p>
          <p className="text-xs text-blue-600 mt-1">
            Code : <span className="font-mono font-bold text-lg">{codeInfo.code}</span>
            <span className="ml-2">→ {codeInfo.moyenContact}</span>
          </p>
          <p className="text-xs text-blue-500 mt-1">
            Le bénéficiaire devra saisir ce code sur catchup.jaeprive.fr/accompagnement pour accéder au chat.
          </p>
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
          </div>
        )}

        {messages.map((msg, idx) => {
          const isConseiller = msg.expediteurType === 'conseiller'
          const time = new Date(msg.horodatage)
          const isValidDate = !isNaN(time.getTime())
          const formatTime = (d: Date) => isNaN(d.getTime()) ? '' : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
          const formatDate = (d: Date) => isNaN(d.getTime()) ? '' : d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
          const showTime = isValidDate && (idx === 0 || (
            time.getTime() - new Date(messages[idx - 1].horodatage).getTime() > 5 * 60 * 1000
          ))

          const parsed = tryParseStructured(msg.contenu)
          const isStructured = parsed !== null

          return (
            <div key={msg.id}>
              {showTime && (
                <div className="flex justify-center my-2">
                  <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                    {formatDate(time)} {formatTime(time)}
                  </span>
                </div>
              )}
              <div className={`flex ${isConseiller ? 'justify-end' : 'justify-start'}`}>
                <div className={isStructured ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[75%]'}>
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

      {/* Barre d'actions + zone de saisie */}
      <div className="border-t border-gray-100 bg-white">
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

          <div className="flex-1" />
        </div>

        {/* Message input */}
        <div className="px-6 pb-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="Écrire un message..."
              className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-catchup-primary focus:border-transparent outline-none transition"
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              className="px-4 py-2.5 bg-catchup-primary text-white rounded-full text-sm hover:bg-catchup-primary/90 disabled:opacity-50 transition-colors"
            >
              {sending ? '...' : '➤'}
            </button>
          </div>
        </div>
      </div>

      {/* Modal planification RDV */}
      <PlanifierRdvModal
        referralId={referralId}
        isOpen={rdvModalOpen}
        onClose={() => setRdvModalOpen(false)}
        onCreated={handleRdvCreated}
      />
    </div>
  )
}
