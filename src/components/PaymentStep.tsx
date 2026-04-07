'use client'

import { useState } from 'react'

interface PaymentStepProps {
  acceptationTarifId: string
  montantCentimes: number
  devise?: string
  onSuccess?: () => void
  onCancel?: () => void
}

export default function PaymentStep({
  acceptationTarifId,
  montantCentimes,
  devise = 'EUR',
  onCancel,
}: PaymentStepProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handlePay = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/paiements/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ acceptationTarifId }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: 'Erreur' }))
        setError(data.error || 'Erreur lors de la creation du paiement')
        return
      }

      const { sessionUrl } = await res.json()
      // Redirection vers Stripe Checkout (page hébergée par Stripe)
      window.location.href = sessionUrl
    } catch {
      setError('Erreur de connexion. Veuillez reessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-6">
        <span className="text-4xl block mb-3">&#x1F4B3;</span>
        <h2 className="text-lg font-bold text-gray-900">Paiement s&eacute;curis&eacute;</h2>
        <p className="text-sm text-gray-500 mt-2">
          Vous allez &ecirc;tre redirig&eacute; vers Stripe pour effectuer le paiement de{' '}
          <span className="font-bold text-gray-800">{(montantCentimes / 100).toFixed(2)}&nbsp;&euro;</span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full py-4 rounded-xl font-semibold text-white text-base bg-blue-500 hover:bg-blue-600 transition-all disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Redirection vers Stripe...
          </span>
        ) : (
          `Payer ${(montantCentimes / 100).toFixed(2)} \u20AC`
        )}
      </button>

      {onCancel && (
        <button
          onClick={onCancel}
          disabled={loading}
          className="mt-3 w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Annuler
        </button>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Paiement g&eacute;r&eacute; par Stripe. Vos informations bancaires ne transitent pas par nos serveurs.
      </p>
    </div>
  )
}
