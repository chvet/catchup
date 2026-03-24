'use client'

// Chat direct tiers ↔ bénéficiaire (mobile-first)
// SSE pour la réception temps réel + POST pour l'envoi
// Supporte: texte, documents, appels vidéo (lecture seule), rendez-vous (lecture seule)

import { useState, useEffect, useRef, useCallback } from 'react'
import VideoCallCard from './VideoCallCard'
import RdvCard from './RdvCard'

interface DirectMessage {
  id: string
  expediteurType: 'tiers' | 'beneficiaire'
  expediteurId: string
  contenu: string
  lu: boolean | number
  horodatage: string
}

interface TiersChatProps {
  token: string
  beneficiairePrenom: string
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
  titre: string
  dateDebut: string
  dateFin: string
  description?: string
  googleUrl: string
  icsUrl: string
}

type StructuredContent = DocumentContent | VideoContent | RdvContent

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

export default function TiersChat({ token, beneficiairePrenom }: TiersChatProps) {
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

  // Charger les messages initiaux
  useEffect(() => {
    fetch('/api/tiers/messages', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => {
        setMessages(data.messages || [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [token])

  // SSE pour les messages temps réel
  useEffect(() => {
    const es = new EventSource(`/api/tiers/messages/stream?token=${encodeURIComponent(token)}`)

    es.onopen = () => setConnected(true)

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'connected') {
          setConnected(true)
          return
        }
        if (data.type === 'message') {
          const msg: DirectMessage = data
          setMessages(prev => {
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, msg]
          })
        }
      } catch { /* heartbeat */ }
    }

    es.onerror = () => setConnected(false)

    return () => es.close()
  }, [token])

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
      const res = await fetch('/api/tiers/messages', {
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
              if (data.messageId) {
                const docMessage: DirectMessage = {
                  id: data.messageId,
                  expediteurType: 'tiers',
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

        xhr.open('POST', '/api/tiers/documents')
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

  // Rendu d'un message selon son type
  const renderMessageContent = (msg: DirectMessage, isMine: boolean) => {
    const structured = parseMessageContent(msg.contenu)

    if (!structured) {
      // Message texte classique
      return (
        <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isMine
            ? 'bg-emerald-600 text-white rounded-br-md'
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
            isMine ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 bg-white'
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
                className="flex items-center justify-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
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
        // Tiers: lecture seule, pas de boutons accepter/refuser
        return (
          <VideoCallCard
            proposal={{
              id: video.appelVideoId,
              statut: video.statut,
              jitsiUrl: video.jitsiUrl,
              proposePar: video.proposePar,
            }}
            viewerType="tiers"
            viewerId=""
          />
        )
      }

      case 'rdv': {
        const rdv = structured as RdvContent
        return (
          <RdvCard rdv={rdv} />
        )
      }

      default:
        return (
          <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isMine
              ? 'bg-emerald-600 text-white rounded-br-md'
              : 'bg-gray-100 text-gray-800 rounded-bl-md'
          }`}>
            {msg.contenu}
          </div>
        )
    }
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* En-tête du chat */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-white">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
          <span className="text-lg">{'\u{1F464}'}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            Discussion avec {beneficiairePrenom}
          </p>
          <p className="text-xs text-gray-500">Messagerie directe</p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
          <span className="text-xs text-gray-400">{connected ? 'En ligne' : 'Connexion...'}</span>
        </div>
      </div>

      {/* Zone de messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">{'\u{1F4AC}'}</p>
            <p className="text-gray-500 text-sm">
              Vous pouvez &eacute;changer avec {beneficiairePrenom}.
            </p>
            <p className="text-gray-400 text-xs mt-1">Envoyez un message pour d&eacute;marrer la conversation !</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.expediteurType === 'tiers'
            const time = new Date(msg.horodatage)
            const showTime = idx === 0 || (
              time.getTime() - new Date(messages[idx - 1].horodatage).getTime() > 5 * 60 * 1000
            )
            const isRead = msg.lu === 1 || msg.lu === true
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
                  {/* Avatar bénéficiaire */}
                  {!isMine && (
                    <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center mr-2 mt-1 shrink-0">
                      <span className="text-xs">{'\u{1F464}'}</span>
                    </div>
                  )}

                  <div className={isCard ? 'max-w-[85%] md:max-w-[70%]' : 'max-w-[80%]'}>
                    {!isMine && (
                      <p className="text-[10px] text-gray-400 mb-0.5 ml-1">{beneficiairePrenom}</p>
                    )}
                    {renderMessageContent(msg, isMine)}
                    <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-[10px] text-gray-400">
                        {time.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMine && (
                        <span className={`text-[10px] ${isRead ? 'text-emerald-500' : 'text-gray-400'}`}>
                          {isRead ? '\u2713\u2713' : '\u2713'}
                        </span>
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
        <div className="px-4 py-2 border-t border-gray-100 bg-emerald-50">
          <div className="flex items-center gap-3">
            <span className="text-sm">{'\u{1F4CE}'}</span>
            <div className="flex-1">
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500 tabular-nums">{uploadProgress}%</span>
          </div>
        </div>
      )}

      {/* Zone de saisie (mobile-optimized) */}
      <div className="px-3 py-2 border-t border-gray-100 bg-white safe-area-bottom">
        <div className="flex items-end gap-2">
          {/* Bouton upload document */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full disabled:opacity-40 transition-all active:scale-95"
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
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-full text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition bg-gray-50"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 flex items-center justify-center bg-emerald-600 text-white rounded-full hover:bg-emerald-700 disabled:opacity-40 transition-all active:scale-95"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
