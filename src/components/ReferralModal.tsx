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
    preferenceStructure?: 'privee' | 'publique' | 'indifferent'
  }) => void
  urgency: 'immediate' | 'gentle'
  reason?: string
  prenomSuggested?: string
  emailSuggested?: string
  telephoneSuggested?: string
  ageSuggested?: number
  departementSuggested?: string
  structureSlug?: string
  campagneId?: string | null
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
  emailSuggested,
  telephoneSuggested,
  ageSuggested,
  departementSuggested,
  structureSlug,
  campagneId,
}: ReferralModalProps) {
  const [prenom, setPrenom] = useState(prenomSuggested || '')
  const [typeContact, setTypeContact] = useState<'email' | 'telephone'>(telephoneSuggested ? 'telephone' : 'email')
  const [moyenContact, setMoyenContact] = useState(emailSuggested || telephoneSuggested || '')
  const [departement, setDepartement] = useState(departementSuggested || '')
  const [age, setAge] = useState(ageSuggested ? String(ageSuggested) : '')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'asking' | 'loading' | 'done' | 'denied'>('idle')
  const [geoCity, setGeoCity] = useState<string | null>(null)
  const [codePostalInput, setCodePostalInput] = useState('')
  const [preferenceStructure, setPreferenceStructure] = useState<'privee' | 'publique' | 'indifferent'>('indifferent')

  // Sync suggested values when they change
  useEffect(() => {
    if (prenomSuggested) setPrenom(prenomSuggested)
    if (emailSuggested && !moyenContact) { setMoyenContact(emailSuggested); setTypeContact('email') }
    if (telephoneSuggested && !moyenContact) { setMoyenContact(telephoneSuggested); setTypeContact('telephone') }
    if (ageSuggested && !age) setAge(String(ageSuggested))
    if (departementSuggested && !departement) setDepartement(departementSuggested)
  }, [prenomSuggested, emailSuggested, telephoneSuggested, ageSuggested, departementSuggested])

  // Animate in
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true))
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  // Plus de demande automatique — le bouton 📍 dans le champ déclenche la géoloc

  const handleGeolocRequest = async () => {
    if (!navigator.geolocation) {
      setGeoStatus('denied')
      return
    }

    // Vérifier d'abord si la permission est déjà refusée
    try {
      if (navigator.permissions) {
        const perm = await navigator.permissions.query({ name: 'geolocation' })
        if (perm.state === 'denied') {
          setGeoStatus('denied')
          return
        }
      }
    } catch { /* certains navigateurs ne supportent pas permissions.query */ }

    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocoding via API adresse du gouvernement (retourne le code postal)
          const { latitude, longitude } = position.coords
          const res = await fetch(
            `https://api-adresse.data.gouv.fr/reverse/?lon=${longitude}&lat=${latitude}&limit=1`
          )
          if (res.ok) {
            const data = await res.json()
            if (data.features && data.features.length > 0) {
              const props = data.features[0].properties
              const cp = props.postcode || ''
              const ville = props.city || props.label || ''
              const dept = cp.substring(0, 2) === '97' ? cp.substring(0, 3) : cp.substring(0, 2)
              setDepartement(dept)
              setCodePostalInput(cp)
              setGeoCity(`${ville} (${cp})`)
              setGeoStatus('done')
              return
            }
          }
          setGeoStatus('denied')
        } catch {
          setGeoStatus('denied')
        }
      },
      () => {
        setGeoStatus('denied')
      },
      { timeout: 10000, enableHighAccuracy: false }
    )
  }

  const handleGeolocRefuse = () => {
    setGeoStatus('denied')
  }

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
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      newErrors.age = 'Ton âge ne semble pas correct'
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
        preferenceStructure,
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
        className={`relative w-full md:max-w-lg bg-white rounded-t-3xl md:rounded-2xl shadow-2xl transform transition-all duration-300 ease-out max-h-[85vh] max-h-[85dvh] overflow-y-auto ${
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

        {/* Bouton fermer (croix) — toujours visible */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-colors"
          aria-label="Fermer"
        >
          &times;
        </button>

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

            {/* Géolocalisation + Département */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ta localisation
              </label>

              {/* Champ de saisie avec bouton GPS intégré */}
              {geoStatus === 'done' && geoCity ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl mb-2 flex items-center justify-between">
                  <p className="text-sm text-green-800">
                    📍 {geoCity}
                  </p>
                  <button
                    type="button"
                    onClick={() => { setGeoStatus('idle'); setDepartement(''); setGeoCity(null); setCodePostalInput('') }}
                    className="text-xs text-green-600 hover:text-green-800 underline"
                  >
                    Modifier
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative flex gap-2">
                    <button
                      type="button"
                      onClick={handleGeolocRequest}
                      disabled={geoStatus === 'loading'}
                      className="shrink-0 px-3 py-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-600 hover:bg-blue-100 active:bg-blue-200 transition-colors disabled:opacity-50"
                      title="Me géolocaliser"
                    >
                      {geoStatus === 'loading' ? (
                        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <span className="text-lg">📍</span>
                      )}
                    </button>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="Code postal (ex: 75012)"
                      value={codePostalInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9A-Za-z]/g, '').slice(0, 5)
                        setCodePostalInput(val)
                        // Auto-détection du département
                        if (val.length >= 2) {
                          const prefix = val.slice(0, 2)
                          // Cas spéciaux Corse
                          if (val.startsWith('20') && val.length >= 3) {
                            const dep = parseInt(val.slice(0, 3)) <= 201 ? '2A' : '2B'
                            setDepartement(dep)
                          } else if (DEPARTEMENTS.find(d => d.code === prefix)) {
                            setDepartement(prefix)
                          } else if (prefix === '97' && val.length >= 3) {
                            const dep = val.slice(0, 3)
                            if (DEPARTEMENTS.find(d => d.code === dep)) {
                              setDepartement(dep)
                            }
                          }
                        } else {
                          setDepartement('')
                        }
                      }}
                      className={`w-full px-4 py-3 rounded-xl border text-gray-900 bg-white focus:outline-none focus:ring-2 transition-colors ${
                        errors.departement
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-200 focus:ring-blue-200 focus:border-blue-400'
                      }`}
                    />
                    {departement && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                        ✅ {DEPARTEMENTS.find(d => d.code === departement)?.nom || departement}
                      </span>
                    )}
                  </div>
                  {geoStatus === 'denied' && !departement && (
                    <div className="mt-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      <p className="font-medium mb-1">La localisation est bloquée</p>
                      <p className="text-amber-600 leading-relaxed">
                        Pour l&apos;activer : clique sur l&apos;icône 🔒 dans la barre d&apos;adresse de ton navigateur, puis autorise la localisation et recharge la page.
                      </p>
                      <p className="text-amber-500 mt-1">Tu peux aussi entrer ton code postal manuellement ci-dessus.</p>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1">
                    {departement ? `Département détecté : ${departement}` : 'Entre ton code postal (ex: 75012) ou ton numéro de département (ex: 69)'}
                  </p>
                </div>
              )}
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
                min={1}
                max={120}
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

            {/* Preference structure */}
            {!structureSlug && !campagneId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d&apos;accompagnement souhait&eacute;
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setPreferenceStructure('publique')}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      preferenceStructure === 'publique'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-800">Structure publique ou associative</span>
                        <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">Gratuit</span>
                      </div>
                      {preferenceStructure === 'publique' && <span className="text-green-500">&#x2713;</span>}
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferenceStructure('privee')}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      preferenceStructure === 'privee'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm font-medium text-gray-800">Coach ou prestataire priv&eacute;</span>
                        <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Payant</span>
                      </div>
                      {preferenceStructure === 'privee' && <span className="text-blue-500">&#x2713;</span>}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Les tarifs seront affich&eacute;s avant tout engagement</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreferenceStructure('indifferent')}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      preferenceStructure === 'indifferent'
                        ? 'border-gray-500 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-800">Je n'en sais rien</span>
                      {preferenceStructure === 'indifferent' && <span className="text-gray-500">&#x2713;</span>}
                    </div>
                  </button>
                </div>
              </div>
            )}

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
                'Oui, je demande à être accompagné(e) par un conseiller'
              )}
            </button>

            {/* Secondary action */}
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
            >
              Non merci, je préfère continuer avec l&apos;IA pour le moment
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
