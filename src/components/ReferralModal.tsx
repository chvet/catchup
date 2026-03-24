'use client'

import { useState, useEffect } from 'react'

// --- Départements français (101 : métropole + DOM-TOM) ---
const DEPARTEMENTS = [
  { code: '01', nom: 'Ain' },
  { code: '02', nom: 'Aisne' },
  { code: '03', nom: 'Allier' },
  { code: '04', nom: 'Alpes-de-Haute-Provence' },
  { code: '05', nom: 'Hautes-Alpes' },
  { code: '06', nom: 'Alpes-Maritimes' },
  { code: '07', nom: 'Ardèche' },
  { code: '08', nom: 'Ardennes' },
  { code: '09', nom: 'Ariège' },
  { code: '10', nom: 'Aube' },
  { code: '11', nom: 'Aude' },
  { code: '12', nom: 'Aveyron' },
  { code: '13', nom: 'Bouches-du-Rhône' },
  { code: '14', nom: 'Calvados' },
  { code: '15', nom: 'Cantal' },
  { code: '16', nom: 'Charente' },
  { code: '17', nom: 'Charente-Maritime' },
  { code: '18', nom: 'Cher' },
  { code: '19', nom: 'Corrèze' },
  { code: '2A', nom: 'Corse-du-Sud' },
  { code: '2B', nom: 'Haute-Corse' },
  { code: '21', nom: "Côte-d'Or" },
  { code: '22', nom: "Côtes-d'Armor" },
  { code: '23', nom: 'Creuse' },
  { code: '24', nom: 'Dordogne' },
  { code: '25', nom: 'Doubs' },
  { code: '26', nom: 'Drôme' },
  { code: '27', nom: 'Eure' },
  { code: '28', nom: 'Eure-et-Loir' },
  { code: '29', nom: 'Finistère' },
  { code: '30', nom: 'Gard' },
  { code: '31', nom: 'Haute-Garonne' },
  { code: '32', nom: 'Gers' },
  { code: '33', nom: 'Gironde' },
  { code: '34', nom: 'Hérault' },
  { code: '35', nom: 'Ille-et-Vilaine' },
  { code: '36', nom: 'Indre' },
  { code: '37', nom: 'Indre-et-Loire' },
  { code: '38', nom: 'Isère' },
  { code: '39', nom: 'Jura' },
  { code: '40', nom: 'Landes' },
  { code: '41', nom: 'Loir-et-Cher' },
  { code: '42', nom: 'Loire' },
  { code: '43', nom: 'Haute-Loire' },
  { code: '44', nom: 'Loire-Atlantique' },
  { code: '45', nom: 'Loiret' },
  { code: '46', nom: 'Lot' },
  { code: '47', nom: 'Lot-et-Garonne' },
  { code: '48', nom: 'Lozère' },
  { code: '49', nom: 'Maine-et-Loire' },
  { code: '50', nom: 'Manche' },
  { code: '51', nom: 'Marne' },
  { code: '52', nom: 'Haute-Marne' },
  { code: '53', nom: 'Mayenne' },
  { code: '54', nom: 'Meurthe-et-Moselle' },
  { code: '55', nom: 'Meuse' },
  { code: '56', nom: 'Morbihan' },
  { code: '57', nom: 'Moselle' },
  { code: '58', nom: 'Nièvre' },
  { code: '59', nom: 'Nord' },
  { code: '60', nom: 'Oise' },
  { code: '61', nom: 'Orne' },
  { code: '62', nom: 'Pas-de-Calais' },
  { code: '63', nom: 'Puy-de-Dôme' },
  { code: '64', nom: 'Pyrénées-Atlantiques' },
  { code: '65', nom: 'Hautes-Pyrénées' },
  { code: '66', nom: 'Pyrénées-Orientales' },
  { code: '67', nom: 'Bas-Rhin' },
  { code: '68', nom: 'Haut-Rhin' },
  { code: '69', nom: 'Rhône' },
  { code: '70', nom: 'Haute-Saône' },
  { code: '71', nom: 'Saône-et-Loire' },
  { code: '72', nom: 'Sarthe' },
  { code: '73', nom: 'Savoie' },
  { code: '74', nom: 'Haute-Savoie' },
  { code: '75', nom: 'Paris' },
  { code: '76', nom: 'Seine-Maritime' },
  { code: '77', nom: 'Seine-et-Marne' },
  { code: '78', nom: 'Yvelines' },
  { code: '79', nom: 'Deux-Sèvres' },
  { code: '80', nom: 'Somme' },
  { code: '81', nom: 'Tarn' },
  { code: '82', nom: 'Tarn-et-Garonne' },
  { code: '83', nom: 'Var' },
  { code: '84', nom: 'Vaucluse' },
  { code: '85', nom: 'Vendée' },
  { code: '86', nom: 'Vienne' },
  { code: '87', nom: 'Haute-Vienne' },
  { code: '88', nom: 'Vosges' },
  { code: '89', nom: 'Yonne' },
  { code: '90', nom: 'Territoire de Belfort' },
  { code: '91', nom: 'Essonne' },
  { code: '92', nom: 'Hauts-de-Seine' },
  { code: '93', nom: 'Seine-Saint-Denis' },
  { code: '94', nom: 'Val-de-Marne' },
  { code: '95', nom: "Val-d'Oise" },
  { code: '971', nom: 'Guadeloupe' },
  { code: '972', nom: 'Martinique' },
  { code: '973', nom: 'Guyane' },
  { code: '974', nom: 'La Réunion' },
  { code: '976', nom: 'Mayotte' },
] as const

// --- Types ---
interface ReferralModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    prenom: string
    moyenContact: string
    typeContact: 'email' | 'telephone'
    departement: string
    age: number
  }) => void
  urgency: 'immediate' | 'gentle'
  reason?: string
  prenomSuggested?: string
}

interface FormErrors {
  prenom?: string
  moyenContact?: string
  departement?: string
  age?: string
}

// --- Component ---
export default function ReferralModal({
  isOpen,
  onClose,
  onSubmit,
  urgency,
  reason,
  prenomSuggested,
}: ReferralModalProps) {
  const [prenom, setPrenom] = useState(prenomSuggested || '')
  const [typeContact, setTypeContact] = useState<'email' | 'telephone'>('email')
  const [moyenContact, setMoyenContact] = useState('')
  const [departement, setDepartement] = useState('')
  const [age, setAge] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Sync prenomSuggested when it changes
  useEffect(() => {
    if (prenomSuggested) setPrenom(prenomSuggested)
  }, [prenomSuggested])

  // Animate in
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true))
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setErrors({})
      setIsSubmitting(false)
    }
  }, [isOpen])

  function validate(): boolean {
    const newErrors: FormErrors = {}

    if (!prenom.trim() || prenom.trim().length < 2) {
      newErrors.prenom = 'Ton prénom doit faire au moins 2 caractères'
    }

    if (typeContact === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(moyenContact.trim())) {
        newErrors.moyenContact = 'Entre une adresse email valide'
      }
    } else {
      const phoneRegex = /^0[1-9]\d{8}$/
      if (!phoneRegex.test(moyenContact.replace(/\s/g, ''))) {
        newErrors.moyenContact = 'Entre un numéro à 10 chiffres commençant par 0'
      }
    }

    if (!departement) {
      newErrors.departement = 'Choisis ton département'
    }

    const ageNum = parseInt(age, 10)
    if (!age || isNaN(ageNum) || ageNum < 12 || ageNum > 30) {
      newErrors.age = 'Ton âge doit être entre 12 et 30 ans'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    try {
      await onSubmit({
        prenom: prenom.trim(),
        moyenContact: moyenContact.trim(),
        typeContact,
        departement,
        age: parseInt(age, 10),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  const isImmediate = urgency === 'immediate'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="referral-title"
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity duration-300 ${
          isVisible ? 'opacity-50' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-2xl transform transition-all duration-300 ease-out max-h-[90vh] overflow-y-auto ${
          isVisible
            ? 'translate-y-0 opacity-100'
            : 'translate-y-full md:translate-y-8 opacity-0'
        }`}
      >
        {/* Urgence banner */}
        {isImmediate && (
          <div className="bg-red-50 border-b border-red-100 px-6 py-4 rounded-t-3xl md:rounded-t-2xl">
            <p className="text-red-800 font-medium text-sm text-center">
              Tu traverses un moment difficile. Parler à quelqu&apos;un peut aider.
            </p>
            <p className="text-red-700 text-sm text-center mt-2 font-semibold">
              En cas d&apos;urgence : 📞 3114
              <span className="font-normal block text-xs mt-0.5">
                Numéro national de prévention du suicide, gratuit, 24h/24
              </span>
            </p>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-6 md:py-8">
          {/* Header */}
          <div className="text-center mb-6">
            <span className="text-4xl mb-3 block" role="img" aria-label="poignée de main">
              🤝
            </span>
            <h2 id="referral-title" className="text-xl font-bold text-gray-900">
              {isImmediate
                ? 'Quelqu\u2019un peut t\u2019écouter'
                : 'Un conseiller peut t\u2019aider à avancer'}
            </h2>
            <p className="text-gray-500 text-sm mt-2 leading-relaxed">
              {isImmediate
                ? 'Un professionnel bienveillant et formé te contactera. C\u2019est gratuit, confidentiel et sans jugement.'
                : 'C\u2019est gratuit, confidentiel et sans engagement. Un professionnel de l\u2019orientation te contactera pour t\u2019accompagner.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Prénom */}
            <div>
              <label htmlFor="ref-prenom" className="block text-sm font-medium text-gray-700 mb-1">
                Ton prénom
              </label>
              <input
                id="ref-prenom"
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Comment tu t'appelles ?"
                className={`w-full px-4 py-3 rounded-xl border text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.prenom
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                }`}
              />
              {errors.prenom && (
                <p className="text-red-500 text-xs mt-1">{errors.prenom}</p>
              )}
            </div>

            {/* Type de contact toggle */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comment te joindre ?
              </label>
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  type="button"
                  onClick={() => {
                    setTypeContact('email')
                    setMoyenContact('')
                    setErrors((prev) => ({ ...prev, moyenContact: undefined }))
                  }}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    typeContact === 'email'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📧 Email
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTypeContact('telephone')
                    setMoyenContact('')
                    setErrors((prev) => ({ ...prev, moyenContact: undefined }))
                  }}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    typeContact === 'telephone'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  📱 Téléphone
                </button>
              </div>
            </div>

            {/* Contact input */}
            <div>
              <input
                id="ref-contact"
                type={typeContact === 'email' ? 'email' : 'tel'}
                value={moyenContact}
                onChange={(e) => setMoyenContact(e.target.value)}
                placeholder={
                  typeContact === 'email'
                    ? 'ton.email@exemple.fr'
                    : '06 12 34 56 78'
                }
                inputMode={typeContact === 'telephone' ? 'tel' : 'email'}
                className={`w-full px-4 py-3 rounded-xl border text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.moyenContact
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                }`}
              />
              {errors.moyenContact && (
                <p className="text-red-500 text-xs mt-1">{errors.moyenContact}</p>
              )}
            </div>

            {/* Département */}
            <div>
              <label htmlFor="ref-departement" className="block text-sm font-medium text-gray-700 mb-1">
                Ton département
              </label>
              <select
                id="ref-departement"
                value={departement}
                onChange={(e) => setDepartement(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border text-gray-900 bg-white focus:outline-none focus:ring-2 transition-colors appearance-none ${
                  errors.departement
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                } ${!departement ? 'text-gray-400' : ''}`}
              >
                <option value="" disabled>
                  Choisis ton département
                </option>
                {DEPARTEMENTS.map((dep) => (
                  <option key={dep.code} value={dep.code}>
                    {dep.code} — {dep.nom}
                  </option>
                ))}
              </select>
              {errors.departement && (
                <p className="text-red-500 text-xs mt-1">{errors.departement}</p>
              )}
            </div>

            {/* Âge */}
            <div>
              <label htmlFor="ref-age" className="block text-sm font-medium text-gray-700 mb-1">
                Ton âge
              </label>
              <input
                id="ref-age"
                type="number"
                min={12}
                max={30}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Ex : 17"
                inputMode="numeric"
                className={`w-full px-4 py-3 rounded-xl border text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors ${
                  errors.age
                    ? 'border-red-300 focus:ring-red-200'
                    : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                }`}
              />
              {errors.age && (
                <p className="text-red-500 text-xs mt-1">{errors.age}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 rounded-xl font-semibold text-white text-base transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${
                isImmediate
                  ? 'bg-red-500 hover:bg-red-600 focus:ring-red-200'
                  : 'bg-green-500 hover:bg-green-600 focus:ring-green-200'
              } focus:outline-none focus:ring-2`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Envoi en cours...
                </span>
              ) : isImmediate ? (
                'Je veux parler à quelqu\u2019un'
              ) : (
                'Oui, je veux être accompagné(e)'
              )}
            </button>

            {/* Secondary action */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Non merci, je continue avec l&apos;IA
            </button>

            {/* RGPD notice */}
            <p className="text-xs text-gray-400 text-center leading-relaxed">
              Tes données sont protégées (RGPD). Seul le conseiller y aura accès.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
