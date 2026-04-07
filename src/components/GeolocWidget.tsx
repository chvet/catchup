'use client'

import { useState } from 'react'

// Départements français pour auto-détection depuis code postal
const DEPARTEMENTS: Record<string, string> = {
  '01': 'Ain', '02': 'Aisne', '03': 'Allier', '04': 'Alpes-de-Haute-Provence', '05': 'Hautes-Alpes',
  '06': 'Alpes-Maritimes', '07': 'Ardèche', '08': 'Ardennes', '09': 'Ariège', '10': 'Aube',
  '11': 'Aude', '12': 'Aveyron', '13': 'Bouches-du-Rhône', '14': 'Calvados', '15': 'Cantal',
  '16': 'Charente', '17': 'Charente-Maritime', '18': 'Cher', '19': 'Corrèze', '2A': 'Corse-du-Sud',
  '2B': 'Haute-Corse', '21': "Côte-d'Or", '22': "Côtes-d'Armor", '23': 'Creuse', '24': 'Dordogne',
  '25': 'Doubs', '26': 'Drôme', '27': 'Eure', '28': 'Eure-et-Loir', '29': 'Finistère',
  '30': 'Gard', '31': 'Haute-Garonne', '32': 'Gers', '33': 'Gironde', '34': 'Hérault',
  '35': 'Ille-et-Vilaine', '36': 'Indre', '37': 'Indre-et-Loire', '38': 'Isère', '39': 'Jura',
  '40': 'Landes', '41': 'Loir-et-Cher', '42': 'Loire', '43': 'Haute-Loire', '44': 'Loire-Atlantique',
  '45': 'Loiret', '46': 'Lot', '47': 'Lot-et-Garonne', '48': 'Lozère', '49': 'Maine-et-Loire',
  '50': 'Manche', '51': 'Marne', '52': 'Haute-Marne', '53': 'Mayenne', '54': 'Meurthe-et-Moselle',
  '55': 'Meuse', '56': 'Morbihan', '57': 'Moselle', '58': 'Nièvre', '59': 'Nord',
  '60': 'Oise', '61': 'Orne', '62': 'Pas-de-Calais', '63': 'Puy-de-Dôme', '64': 'Pyrénées-Atlantiques',
  '65': 'Hautes-Pyrénées', '66': 'Pyrénées-Orientales', '67': 'Bas-Rhin', '68': 'Haut-Rhin',
  '69': 'Rhône', '70': 'Haute-Saône', '71': 'Saône-et-Loire', '72': 'Sarthe', '73': 'Savoie',
  '74': 'Haute-Savoie', '75': 'Paris', '76': 'Seine-Maritime', '77': 'Seine-et-Marne',
  '78': 'Yvelines', '79': 'Deux-Sèvres', '80': 'Somme', '81': 'Tarn', '82': 'Tarn-et-Garonne',
  '83': 'Var', '84': 'Vaucluse', '85': 'Vendée', '86': 'Vienne', '87': 'Haute-Vienne',
  '88': 'Vosges', '89': 'Yonne', '90': 'Territoire de Belfort', '91': 'Essonne',
  '92': 'Hauts-de-Seine', '93': 'Seine-Saint-Denis', '94': 'Val-de-Marne', '95': "Val-d'Oise",
  '971': 'Guadeloupe', '972': 'Martinique', '973': 'Guyane', '974': 'La Réunion', '976': 'Mayotte',
}

export interface LocationResult {
  type: 'gps' | 'code_postal' | 'departement' | 'region' | 'aucune'
  value: string
  label: string
}

interface GeolocWidgetProps {
  onLocationSelected: (location: LocationResult) => void
}

export default function GeolocWidget({ onLocationSelected }: GeolocWidgetProps) {
  const [mode, setMode] = useState<'choice' | 'gps_loading' | 'manual' | 'done'>('choice')
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [codePostalInput, setCodePostalInput] = useState('')
  const [detectedDept, setDetectedDept] = useState<string | null>(null)
  const [detectedCity, setDetectedCity] = useState<string | null>(null)

  const handleGPS = async () => {
    if (!navigator.geolocation) {
      setGpsError('La g\u00E9olocalisation n\'est pas disponible sur ton appareil')
      setMode('manual')
      return
    }

    setMode('gps_loading')
    setGpsError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
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
              const deptNom = DEPARTEMENTS[dept] || dept

              onLocationSelected({
                type: 'gps',
                value: cp,
                label: `${ville} (${cp}), ${deptNom}`,
              })
              setMode('done')
              return
            }
          }
          setGpsError('Impossible de d\u00E9terminer ta position')
          setMode('manual')
        } catch {
          setGpsError('Erreur lors de la g\u00E9olocalisation')
          setMode('manual')
        }
      },
      () => {
        setGpsError('La g\u00E9olocalisation a \u00E9t\u00E9 refus\u00E9e')
        setMode('manual')
      },
      { timeout: 10000, enableHighAccuracy: false }
    )
  }

  const handleCodePostalChange = (val: string) => {
    const clean = val.replace(/[^0-9A-Za-z]/g, '').slice(0, 5)
    setCodePostalInput(clean)
    setDetectedDept(null)
    setDetectedCity(null)

    if (clean.length >= 2) {
      const prefix = clean.slice(0, 2)
      if (clean.startsWith('20') && clean.length >= 3) {
        const dep = parseInt(clean.slice(0, 3)) <= 201 ? '2A' : '2B'
        setDetectedDept(dep)
      } else if (DEPARTEMENTS[prefix]) {
        setDetectedDept(prefix)
      } else if (prefix === '97' && clean.length >= 3 && DEPARTEMENTS[clean.slice(0, 3)]) {
        setDetectedDept(clean.slice(0, 3))
      }
    }

    // Auto-recherche ville quand 5 chiffres
    if (clean.length === 5) {
      fetch(`https://api-adresse.data.gouv.fr/search/?q=${clean}&type=municipality&limit=1`)
        .then(r => r.json())
        .then(data => {
          if (data.features?.[0]) {
            setDetectedCity(data.features[0].properties.city || data.features[0].properties.label)
          }
        })
        .catch(() => {})
    }
  }

  const handleManualSubmit = () => {
    if (!detectedDept) return
    const deptNom = DEPARTEMENTS[detectedDept] || detectedDept
    const label = detectedCity
      ? `${detectedCity} (${codePostalInput}), ${deptNom}`
      : `${deptNom} (${detectedDept})`

    onLocationSelected({
      type: codePostalInput.length === 5 ? 'code_postal' : 'departement',
      value: codePostalInput.length === 5 ? codePostalInput : detectedDept,
      label,
    })
    setMode('done')
  }

  if (mode === 'done') return null

  return (
    <div className="my-3 mx-2 p-4 bg-blue-50 border border-blue-200 rounded-2xl animate-in fade-in slide-in-from-bottom-2">
      {mode === 'choice' && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-3">O&ugrave; cherches-tu des formations ?</p>
          <div className="space-y-2">
            <button
              onClick={handleGPS}
              className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-blue-400 bg-white text-left transition-all active:scale-[0.98]"
            >
              <span className="text-sm font-medium text-gray-800">Pr&egrave;s de chez moi</span>
              <span className="block text-xs text-gray-500 mt-0.5">Utilise ta position actuelle</span>
            </button>
            <button
              onClick={() => setMode('manual')}
              className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-blue-400 bg-white text-left transition-all active:scale-[0.98]"
            >
              <span className="text-sm font-medium text-gray-800">Un lieu pr&eacute;cis</span>
              <span className="block text-xs text-gray-500 mt-0.5">Saisis ton code postal ou d&eacute;partement</span>
            </button>
            <button
              onClick={() => {
                onLocationSelected({ type: 'aucune', value: '', label: '' })
                setMode('done')
              }}
              className="w-full p-3 rounded-xl border-2 border-gray-200 hover:border-gray-300 bg-white text-left transition-all active:scale-[0.98]"
            >
              <span className="text-sm font-medium text-gray-800">Peu importe</span>
              <span className="block text-xs text-gray-500 mt-0.5">Pas de pr&eacute;f&eacute;rence g&eacute;ographique</span>
            </button>
          </div>
        </>
      )}

      {mode === 'gps_loading' && (
        <div className="flex items-center gap-3 py-2">
          <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">G&eacute;olocalisation en cours...</span>
        </div>
      )}

      {mode === 'manual' && (
        <>
          {gpsError && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-3">{gpsError}</p>
          )}
          <p className="text-sm font-medium text-gray-700 mb-2">Ton code postal ou d&eacute;partement :</p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                inputMode="numeric"
                placeholder="Ex : 75012 ou 69"
                value={codePostalInput}
                onChange={e => handleCodePostalChange(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400"
                autoFocus
              />
              {detectedDept && (
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                  {DEPARTEMENTS[detectedDept] || detectedDept}
                </span>
              )}
            </div>
            <button
              onClick={handleManualSubmit}
              disabled={!detectedDept}
              className="px-4 py-2.5 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-40"
            >
              OK
            </button>
          </div>
          {detectedCity && (
            <p className="text-xs text-green-600 mt-1">{detectedCity}</p>
          )}
          <button
            onClick={() => setMode('choice')}
            className="mt-2 text-xs text-gray-400 hover:text-gray-600"
          >
            Retour
          </button>
        </>
      )}
    </div>
  )
}
