'use client'

interface Consentement {
  id: string
  statut: string
  tiersNom: string
  tiersPrenom: string
  tiersRole: string
  conseillerApprouve: boolean
  beneficiaireApprouve: boolean
}

interface ConsentementCardProps {
  consentement: Consentement
  viewerType: 'conseiller' | 'beneficiaire'
  onApprove?: (id: string) => void
  onRefuse?: (id: string) => void
}

export default function ConsentementCard({ consentement, viewerType, onApprove, onRefuse }: ConsentementCardProps) {
  const { id, statut, tiersNom, tiersPrenom, tiersRole, conseillerApprouve, beneficiaireApprouve } = consentement

  const viewerHasApproved = viewerType === 'conseiller' ? conseillerApprouve : beneficiaireApprouve
  const showActions = statut === 'en_attente' && !viewerHasApproved

  return (
    <div className="my-2 max-w-[85%] md:max-w-[70%]">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2">
          <span className="text-xl" role="img" aria-label="Consentement intervenant">🤝</span>
          <h3 className="text-sm font-semibold text-gray-900">
            Demande d&apos;ajout d&apos;un intervenant
          </h3>
        </div>

        {/* Tiers info */}
        <div className="px-4 pb-3">
          <p className="text-sm text-gray-700 font-medium">
            {tiersPrenom} {tiersNom} <span className="text-gray-400">—</span>{' '}
            <span className="text-gray-500">{tiersRole}</span>
          </p>
        </div>

        {/* Status indicators */}
        <div className="px-4 pb-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <span role="img" aria-label={conseillerApprouve ? 'Approuvé' : 'En attente'}>{conseillerApprouve ? '✅' : '⏳'}</span>
            <span className={conseillerApprouve ? 'text-emerald-600' : 'text-gray-500'}>
              {conseillerApprouve ? 'Conseiller approuvé' : 'En attente conseiller'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span role="img" aria-label={beneficiaireApprouve ? 'Approuvé' : 'En attente'}>{beneficiaireApprouve ? '✅' : '⏳'}</span>
            <span className={beneficiaireApprouve ? 'text-emerald-600' : 'text-gray-500'}>
              {beneficiaireApprouve ? 'Bénéficiaire approuvé' : 'En attente bénéficiaire'}
            </span>
          </div>
        </div>

        {/* Final status badge */}
        {statut === 'approuvee' && (
          <div className="mx-4 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Intervenant accepté
            </span>
          </div>
        )}

        {statut === 'refusee' && (
          <div className="mx-4 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 text-red-700 text-xs font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Refusé
            </span>
          </div>
        )}

        {/* Action buttons */}
        {showActions && (
          <div className="flex border-t border-gray-100">
            <button
              onClick={() => onRefuse?.(id)}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              Refuser
            </button>
            <div className="w-px bg-gray-100" />
            <button
              onClick={() => onApprove?.(id)}
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
