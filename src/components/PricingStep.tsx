'use client'

import { useState } from 'react'

interface TarifInfo {
  id: string
  libelle: string
  description?: string | null
  montantHtCentimes: number
  montantTtcCentimes: number
  montantCentimes: number
  devise?: string
  dureeJours?: number | null
}

interface ConditionsInfo {
  id: string
  nom: string
  fichierUrl: string
  version: number
}

interface PricingStepProps {
  structureNom: string
  structureLogoUrl?: string | null
  tarifs: TarifInfo[]
  conditions: ConditionsInfo | null
  onAccept: (tarifId: string, conditionsId: string | null) => void
  onRefuse: () => void
  loading?: boolean
}

export default function PricingStep({
  structureNom,
  structureLogoUrl,
  tarifs,
  conditions,
  onAccept,
  onRefuse,
  loading,
}: PricingStepProps) {
  const [selectedTarifId, setSelectedTarifId] = useState<string | null>(tarifs.length === 1 ? tarifs[0].id : null)
  const [conditionsAccepted, setConditionsAccepted] = useState(false)

  const selectedTarif = tarifs.find(t => t.id === selectedTarifId)
  const canAccept = selectedTarifId && (!conditions || conditionsAccepted)

  return (
    <div className="max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        {structureLogoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={structureLogoUrl}
            alt={`Logo ${structureNom}`}
            className="w-16 h-16 mx-auto mb-3 rounded-xl object-contain border border-gray-100"
          />
        )}
        <h2 className="text-lg font-bold text-gray-900">{structureNom}</h2>
        <p className="text-sm text-gray-500 mt-1">Structure priv&eacute;e &mdash; accompagnement payant</p>
      </div>

      {/* Tarifs */}
      <div className="space-y-2 mb-6">
        <p className="text-sm font-medium text-gray-700 mb-2">Choisissez une formule :</p>
        {tarifs.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelectedTarifId(t.id)}
            className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
              selectedTarifId === t.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">{t.libelle}</p>
                {t.description && <p className="text-xs text-gray-500 mt-0.5">{t.description}</p>}
                {t.dureeJours && <p className="text-xs text-gray-400 mt-0.5">Dur&eacute;e : {t.dureeJours} jours</p>}
              </div>
              <div className="text-right ml-4">
                <p className="text-lg font-bold text-gray-900">
                  {(t.montantTtcCentimes / 100).toFixed(2)}&nbsp;&euro; TTC
                </p>
                <p className="text-xs text-gray-500">
                  {(t.montantHtCentimes / 100).toFixed(2)}&nbsp;&euro; HT
                </p>
                {selectedTarifId === t.id && <span className="text-blue-500 text-sm">&#x2713;</span>}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Conditions commerciales */}
      {conditions && (
        <div className="mb-6">
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
            <input
              type="checkbox"
              id="conditions-accept"
              checked={conditionsAccepted}
              onChange={e => setConditionsAccepted(e.target.checked)}
              className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="conditions-accept" className="text-sm text-gray-700">
              J&apos;ai lu et j&apos;accepte les{' '}
              <a
                href={conditions.fichierUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                conditions commerciales
              </a>
              {' '}(v{conditions.version})
            </label>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={() => canAccept && onAccept(selectedTarifId!, conditions?.id || null)}
          disabled={!canAccept || loading}
          className="w-full py-4 rounded-xl font-semibold text-white text-base bg-blue-500 hover:bg-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Traitement...
            </span>
          ) : selectedTarif ? (
            `Accepter et payer ${(selectedTarif.montantTtcCentimes / 100).toFixed(2)} \u20AC TTC`
          ) : (
            'S\u00E9lectionnez une formule'
          )}
        </button>

        <button
          onClick={onRefuse}
          disabled={loading}
          className="w-full py-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Non merci, je pr&eacute;f&egrave;re un accompagnement gratuit
        </button>
      </div>

      {/* Info */}
      <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
        Le paiement est s&eacute;curis&eacute; par Stripe. Vos donn&eacute;es bancaires ne sont pas stock&eacute;es sur nos serveurs.
      </p>
    </div>
  )
}
