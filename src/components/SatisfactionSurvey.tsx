'use client'

// Enquete de satisfaction beneficiaire — affichee quand l'accompagnement est termine
// Mobile-first, card style, stars + NPS + questions ouvertes

import { useState } from 'react'

interface SatisfactionSurveyProps {
  token: string
  priseEnChargeId: string
  onClose: () => void
  onSubmitted: () => void
}

// Composant etoile cliquable
function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0)

  return (
    <div className="mb-5">
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 transition-transform active:scale-110"
            aria-label={`${star} etoile${star > 1 ? 's' : ''}`}
          >
            <svg
              className={`w-10 h-10 transition-colors ${
                star <= (hover || value) ? 'text-yellow-400' : 'text-gray-300'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

// Composant NPS (0-10)
function NpsRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="mb-5">
      <p className="text-sm font-medium text-gray-700 mb-2">
        Recommanderais-tu ce service a un ami ?
      </p>
      <div className="flex flex-wrap gap-1.5 justify-center">
        {Array.from({ length: 11 }, (_, i) => i).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`w-10 h-10 rounded-lg text-sm font-bold transition-all border-2 ${
              value === n
                ? n <= 6
                  ? 'bg-red-500 border-red-500 text-white'
                  : n <= 8
                  ? 'bg-yellow-500 border-yellow-500 text-white'
                  : 'bg-green-500 border-green-500 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400'
            }`}
            aria-label={`Score ${n}`}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
        <span>Pas du tout</span>
        <span>Absolument</span>
      </div>
    </div>
  )
}

export default function SatisfactionSurvey({ token, priseEnChargeId, onClose, onSubmitted }: SatisfactionSurveyProps) {
  const [noteGlobale, setNoteGlobale] = useState(0)
  const [noteEcoute, setNoteEcoute] = useState(0)
  const [noteUtilite, setNoteUtilite] = useState(0)
  const [noteConseiller, setNoteConseiller] = useState(0)
  const [noteRecommandation, setNoteRecommandation] = useState(-1)
  const [pointsForts, setPointsForts] = useState('')
  const [ameliorations, setAmeliorations] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (noteGlobale === 0) {
      setError('Merci de donner au moins une note globale.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/accompagnement/satisfaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          priseEnChargeId,
          noteGlobale,
          noteEcoute: noteEcoute || null,
          noteUtilite: noteUtilite || null,
          noteConseiller: noteConseiller || null,
          noteRecommandation: noteRecommandation >= 0 ? noteRecommandation : null,
          pointsForts: pointsForts.trim() || null,
          ameliorations: ameliorations.trim() || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      setSubmitted(true)
      setTimeout(() => onSubmitted(), 2500)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSubmitting(false)
    }
  }

  // Ecran de remerciement
  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Merci pour ton retour !</h2>
          <p className="text-gray-500 text-sm">
            Ton avis nous aide a ameliorer l&apos;accompagnement pour tous les jeunes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white rounded-t-2xl border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800">Ton avis compte !</h2>
            <p className="text-xs text-gray-400">2 min pour nous aider a progresser</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5">
          <StarRating
            label="Comment evalues-tu ton experience globale ?"
            value={noteGlobale}
            onChange={setNoteGlobale}
          />

          <StarRating
            label="As-tu senti que tu etais ecoute(e) ?"
            value={noteEcoute}
            onChange={setNoteEcoute}
          />

          <StarRating
            label="L'IA t'a-t-elle aide(e) a mieux te connaitre ?"
            value={noteUtilite}
            onChange={setNoteUtilite}
          />

          <StarRating
            label="Ton conseiller t'a-t-il aide(e) ?"
            value={noteConseiller}
            onChange={setNoteConseiller}
          />

          <NpsRating
            value={noteRecommandation}
            onChange={setNoteRecommandation}
          />

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qu&apos;est-ce qui t&apos;a le plus aide ?
            </label>
            <textarea
              value={pointsForts}
              onChange={(e) => setPointsForts(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-catchup-primary/30 focus:border-catchup-primary resize-none"
              placeholder="Dis-nous ce qui a bien fonctionne..."
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Qu&apos;est-ce qu&apos;on pourrait ameliorer ?
            </label>
            <textarea
              value={ameliorations}
              onChange={(e) => setAmeliorations(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-catchup-primary/30 focus:border-catchup-primary resize-none"
              placeholder="Tes suggestions sont precieuses..."
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm mb-3">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 bg-catchup-primary text-white font-semibold rounded-xl hover:bg-catchup-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi...
              </span>
            ) : (
              'Envoyer mon avis'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
