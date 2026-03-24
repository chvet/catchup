'use client'

import { useState } from 'react'

interface TiersInfo {
  id: string
  nom: string
  prenom: string
  role: string
}

interface BrisDeGlaceMessage {
  id: string
  expediteurType: string
  contenu: string
  horodatage: string
}

export default function BrisDeGlaceModal({
  referralId,
  tiers,
  isOpen,
  onClose,
}: {
  referralId: string
  tiers: TiersInfo
  isOpen: boolean
  onClose: () => void
}) {
  const [step, setStep] = useState<'justification' | 'messages'>('justification')
  const [justification, setJustification] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<BrisDeGlaceMessage[]>([])
  const [messagesLoading, setMessagesLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async () => {
    if (justification.trim().length < 10) {
      setError('La justification doit contenir au moins 10 caractères')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`/api/conseiller/file-active/${referralId}/bris-de-glace`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tiersId: tiers.id, justification: justification.trim() }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Erreur')
        setLoading(false)
        return
      }

      // Bris de glace activé, charger les messages
      setStep('messages')
      setMessagesLoading(true)

      const msgRes = await fetch(
        `/api/conseiller/file-active/${referralId}/bris-de-glace?tiersId=${tiers.id}`
      )
      if (msgRes.ok) {
        const data = await msgRes.json()
        setMessages(data.messages || [])
      }
      setMessagesLoading(false)
    } catch {
      setError('Erreur réseau')
    }
    setLoading(false)
  }

  const handleClose = () => {
    setStep('justification')
    setJustification('')
    setError('')
    setMessages([])
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔓</span>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Bris de glace</h2>
              <p className="text-sm text-gray-500">
                Échanges avec {tiers.prenom} {tiers.nom} ({tiers.role})
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-xl">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'justification' && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-800 font-medium mb-1">
                  Attention — Accès d&apos;urgence
                </p>
                <p className="text-sm text-red-700">
                  Vous êtes sur le point d&apos;accéder aux messages échangés entre le bénéficiaire
                  et l&apos;intervenant <strong>{tiers.prenom} {tiers.nom}</strong>.
                  Cette action sera enregistrée dans l&apos;audit RGPD et le journal des événements.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Justification obligatoire
                </label>
                <textarea
                  value={justification}
                  onChange={e => setJustification(e.target.value)}
                  placeholder="Décrivez la raison de cet accès (ex: signalement, comportement suspect, alerte bénéficiaire...)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-300 outline-none resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {justification.trim().length}/10 caractères minimum
                </p>
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>
              )}

              <div className="flex gap-3 justify-end">
                <button
                  onClick={handleClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || justification.trim().length < 10}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Activation...' : '🔓 Activer l\'accès d\'urgence'}
                </button>
              </div>
            </div>
          )}

          {step === 'messages' && (
            <div>
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4 text-sm text-yellow-800">
                Accès d&apos;urgence actif — Lecture seule (valide 24h). Chaque consultation est tracée.
              </div>

              {messagesLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-3 border-catchup-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!messagesLoading && messages.length === 0 && (
                <p className="text-center text-gray-400 py-8">Aucun message échangé</p>
              )}

              {!messagesLoading && messages.length > 0 && (
                <div className="space-y-3">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.expediteurType === 'tiers' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                        msg.expediteurType === 'tiers'
                          ? 'bg-blue-100 text-blue-900 rounded-tr-md'
                          : 'bg-gray-100 text-gray-800 rounded-tl-md'
                      }`}>
                        <p className="text-[10px] font-medium mb-0.5 opacity-70">
                          {msg.expediteurType === 'tiers'
                            ? `${tiers.prenom} ${tiers.nom}`
                            : 'Bénéficiaire'
                          }
                        </p>
                        <p className="whitespace-pre-wrap">{msg.contenu}</p>
                        <p className="text-[10px] opacity-50 mt-1">
                          {new Date(msg.horodatage).toLocaleString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
