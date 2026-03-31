'use client'

import { useState } from 'react'

interface VideoProposal {
  id: string
  statut: string
  jitsiUrl: string  // backward compat — now a web join URL (/visio?room=xxx)
  wsUrl?: string    // WebSocket URL for direct connection
  proposePar: string
}

interface VideoCallCardProps {
  proposal: VideoProposal
  viewerType: 'conseiller' | 'beneficiaire' | 'tiers'
  viewerId: string
  viewerName?: string
  onAccept?: (id: string) => void
  onDecline?: (id: string) => void
  onCancel?: (id: string) => void
}

export default function VideoCallCard({ proposal, viewerType, viewerId, viewerName, onAccept, onDecline, onCancel }: VideoCallCardProps) {
  const { id, statut, jitsiUrl: videoUrl, proposePar } = proposal
  const [showIOSWarning, setShowIOSWarning] = useState(false)
  const [iosCopied, setIosCopied] = useState(false)

  const isPending = statut === 'en_attente' || statut === 'proposee'
  const isAccepted = statut === 'acceptee' || statut === 'en_cours'
  const isRefused = statut === 'refusee' || statut === 'declinee'
  const isProposer = viewerId === proposePar
  const showActions = isPending && !isProposer

  const canJoin = isAccepted || (isPending && isProposer)

  // Detect iOS + non-Safari browser (camera requires Safari on iOS)
  const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isSafari = typeof navigator !== 'undefined' && /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
  const isIOSNonSafari = isIOS && !isSafari

  // Extract room ID from the join URL (/visio?room=xxx or full URL)
  const extractRoomId = (): string => {
    try {
      const url = new URL(videoUrl, window.location.origin)
      return url.searchParams.get('room') || id
    } catch {
      return id
    }
  }

  const handleCopyVideoUrl = () => {
    if (!videoUrl) return
    // Append role and name for beneficiary links
    try {
      const url = new URL(videoUrl, window.location.origin)
      if (viewerType === 'beneficiaire') {
        url.searchParams.set('role', 'beneficiaire')
        if (viewerName) url.searchParams.set('name', viewerName)
      }
      navigator.clipboard.writeText(url.toString())
    } catch {
      navigator.clipboard.writeText(videoUrl)
    }
    setIosCopied(true)
    setTimeout(() => setIosCopied(false), 2000)
  }

  const handleJoin = () => {
    if (isIOSNonSafari) {
      setShowIOSWarning(true)
      return
    }
    if (videoUrl) {
      try {
        const url = new URL(videoUrl, window.location.origin)
        if (viewerName) url.searchParams.set('name', viewerName)
        url.searchParams.set('role', viewerType)
        window.open(url.toString(), '_blank', 'noopener')
      } catch {
        window.open(videoUrl, '_blank', 'noopener')
      }
    }
  }

  return (
    <div className="my-2 max-w-[85%] md:max-w-[70%]">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-3">
          <span className="text-xl">
            <svg className="w-5 h-5 text-emerald-500 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </span>
          <h3 className="text-sm font-semibold text-gray-900">
            {isAccepted ? 'Appel video en cours' : isPending ? 'Appel video propose' : 'Appel video'}
          </h3>
        </div>

        {/* Content */}
        <div className="px-4 pb-3.5">
          {isPending && isProposer && (
            <p className="text-xs text-gray-500 mb-2">En attente de reponse du beneficiaire...</p>
          )}

          {canJoin && videoUrl && !showIOSWarning && (
            <button
              onClick={handleJoin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 active:bg-emerald-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Rejoindre la visio
            </button>
          )}

          {/* iOS non-Safari warning */}
          {showIOSWarning && videoUrl && (
            <div className="space-y-2">
              <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-base mt-0.5">!</span>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Sur iPhone, ouvrez ce lien dans Safari pour activer la camera
                </p>
              </div>
              <button
                onClick={handleCopyVideoUrl}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm ${
                  iosCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                {iosCopied ? 'Lien copie !' : 'Copier le lien'}
              </button>
            </div>
          )}

          {isRefused && (
            <p className="text-xs text-gray-400 italic">Appel decline</p>
          )}
        </div>

        {/* Action buttons for recipient */}
        {showActions && (
          <div className="flex border-t border-gray-100">
            <button
              onClick={() => onDecline?.(id)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Refuser
            </button>
            <div className="w-px bg-gray-100" />
            <button
              onClick={() => onAccept?.(id)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              Accepter
            </button>
          </div>
        )}

        {/* Cancel button for proposer (pending) or anyone (accepted) */}
        {onCancel && !isRefused && (isPending && isProposer || isAccepted) && (
          <div className="border-t border-gray-100">
            <button
              onClick={() => onCancel(id)}
              className="w-full px-4 py-2 text-xs font-medium text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            >
              Annuler l&apos;appel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
