'use client'

import { useState } from 'react'

interface InviterTiersModalProps {
  referralId: string
  isOpen: boolean
  onClose: () => void
  onInvited: (tiers: { id: string; nom: string; prenom: string; role: string }) => void
}

const ROLES = [
  'Employeur',
  'Éducateur',
  'Formateur',
  'Assistant social',
  'Psychologue',
  'Autre',
]

export default function InviterTiersModal({ referralId, isOpen, onClose, onInvited }: InviterTiersModalProps) {
  const [prenom, setPrenom] = useState('')
  const [nom, setNom] = useState('')
  const [telephone, setTelephone] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const validatePhone = (phone: string) => {
    // Format FR : 0X XX XX XX XX ou +33 X XX XX XX XX
    const cleaned = phone.replace(/\s/g, '')
    return /^(0[1-9]\d{8}|\+33[1-9]\d{8})$/.test(cleaned)
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}
    if (!prenom.trim()) newErrors.prenom = 'Le prénom est requis'
    if (!nom.trim()) newErrors.nom = 'Le nom est requis'
    if (!telephone.trim()) {
      newErrors.telephone = 'Le téléphone est requis'
    } else if (!validatePhone(telephone)) {
      newErrors.telephone = 'Format invalide (ex: 06 12 34 56 78)'
    }
    if (!role) newErrors.role = 'Veuillez sélectionner un rôle'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    try {
      const res = await fetch(`/api/conseiller/file-active/${referralId}/tiers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prenom: prenom.trim(),
          nom: nom.trim(),
          telephone: telephone.trim(),
          role,
        }),
      })

      if (!res.ok) throw new Error('Erreur lors de l\'invitation')

      const data = await res.json()
      setSuccess(true)
      onInvited({ id: data.id, nom: nom.trim(), prenom: prenom.trim(), role })

      setTimeout(() => {
        setSuccess(false)
        setPrenom('')
        setNom('')
        setTelephone('')
        setRole('')
        onClose()
      }, 1500)
    } catch {
      setErrors({ submit: 'Une erreur est survenue. Veuillez réessayer.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6 animate-in fade-in zoom-in-95">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          aria-label="Fermer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-gray-900 mb-1">Inviter un intervenant</h2>
        <p className="text-sm text-gray-500 mb-5">Ajoutez un tiers à l&apos;accompagnement</p>

        {/* Success toast */}
        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Invitation envoyée avec succès !
          </div>
        )}

        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {errors.submit}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Prénom */}
          <div>
            <label htmlFor="tiers-prenom" className="block text-sm font-medium text-gray-700 mb-1">
              Prénom
            </label>
            <input
              id="tiers-prenom"
              type="text"
              value={prenom}
              onChange={e => setPrenom(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-catchup-primary/30 focus:border-catchup-primary transition-colors ${
                errors.prenom ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
              }`}
              placeholder="Prénom de l'intervenant"
            />
            {errors.prenom && <p className="mt-1 text-xs text-red-500">{errors.prenom}</p>}
          </div>

          {/* Nom */}
          <div>
            <label htmlFor="tiers-nom" className="block text-sm font-medium text-gray-700 mb-1">
              Nom
            </label>
            <input
              id="tiers-nom"
              type="text"
              value={nom}
              onChange={e => setNom(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-catchup-primary/30 focus:border-catchup-primary transition-colors ${
                errors.nom ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
              }`}
              placeholder="Nom de l'intervenant"
            />
            {errors.nom && <p className="mt-1 text-xs text-red-500">{errors.nom}</p>}
          </div>

          {/* Téléphone */}
          <div>
            <label htmlFor="tiers-telephone" className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <input
              id="tiers-telephone"
              type="tel"
              value={telephone}
              onChange={e => setTelephone(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-gray-50 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-catchup-primary/30 focus:border-catchup-primary transition-colors ${
                errors.telephone ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
              }`}
              placeholder="06 12 34 56 78"
            />
            {errors.telephone && <p className="mt-1 text-xs text-red-500">{errors.telephone}</p>}
          </div>

          {/* Rôle */}
          <div>
            <label htmlFor="tiers-role" className="block text-sm font-medium text-gray-700 mb-1">
              Rôle
            </label>
            <select
              id="tiers-role"
              value={role}
              onChange={e => setRole(e.target.value)}
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-catchup-primary/30 focus:border-catchup-primary transition-colors appearance-none ${
                errors.role ? 'border-red-300 bg-red-50/30' : 'border-gray-200'
              } ${!role ? 'text-gray-400' : ''}`}
            >
              <option value="" disabled>Sélectionner un rôle</option>
              {ROLES.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {errors.role && <p className="mt-1 text-xs text-red-500">{errors.role}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-xl bg-catchup-primary text-white text-sm font-medium hover:bg-catchup-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Envoi...
                </>
              ) : (
                'Inviter'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
