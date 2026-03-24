'use client'

interface VideoProposal {
  id: string
  statut: string
  jitsiUrl: string
  proposePar: string
}

interface VideoCallCardProps {
  proposal: VideoProposal
  viewerType: 'conseiller' | 'beneficiaire' | 'tiers'
  viewerId: string
  onAccept?: (id: string) => void
  onDecline?: (id: string) => void
}

export default function VideoCallCard({ proposal, viewerType, viewerId, onAccept, onDecline }: VideoCallCardProps) {
  const { id, statut, jitsiUrl, proposePar } = proposal

  const isPending = statut === 'en_attente' || statut === 'proposee'
  const isAccepted = statut === 'acceptee' || statut === 'en_cours'
  const isRefused = statut === 'refusee' || statut === 'declinee'
  const isProposer = viewerId === proposePar
  const showActions = isPending && !isProposer

  // Le proposeur peut rejoindre immédiatement (Jitsi crée la room au premier accès)
  // L'autre participant peut rejoindre dès qu'il a accepté
  const canJoin = isAccepted || (isPending && isProposer)

  return (
    <div className="my-2 max-w-[85%] md:max-w-[70%]">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-3">
          <span className="text-xl">📹</span>
          <h3 className="text-sm font-semibold text-gray-900">
            {isAccepted ? 'Appel vidéo en cours' : isPending ? 'Appel vidéo proposé' : 'Appel vidéo'}
          </h3>
        </div>

        {/* Content */}
        <div className="px-4 pb-3.5">
          {isPending && isProposer && (
            <p className="text-xs text-gray-500 mb-2">En attente de réponse du bénéficiaire…</p>
          )}

          {canJoin && jitsiUrl && (
            <button
              onClick={() => window.open(jitsiUrl, '_blank', 'noopener,noreferrer')}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Rejoindre l&apos;appel
            </button>
          )}

          {isRefused && (
            <p className="text-xs text-gray-400 italic">Appel décliné</p>
          )}
        </div>

        {/* Action buttons for recipient (not the proposer) */}
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
      </div>
    </div>
  )
}
