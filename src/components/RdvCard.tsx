'use client'

interface Rdv {
  id: string
  titre: string
  dateDebut: string
  dateFin: string
  description?: string
  googleUrl: string
  icsUrl: string
}

interface RdvCardProps {
  rdv: Rdv
}

function formatDateFr(dateStr: string): string {
  const date = new Date(dateStr)
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

  const jour = jours[date.getDay()]
  const numero = date.getDate()
  const moisNom = mois[date.getMonth()]
  const annee = date.getFullYear()
  const heures = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')

  return `${jour} ${numero} ${moisNom} ${annee} à ${heures}h${minutes !== '00' ? minutes : ''}`
}

export default function RdvCard({ rdv }: RdvCardProps) {
  const { titre, dateDebut, description, googleUrl, icsUrl } = rdv

  return (
    <div className="my-2 max-w-[85%] md:max-w-[70%]">
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2.5 px-4 pt-3.5 pb-2">
          <span className="text-xl">📅</span>
          <h3 className="text-sm font-semibold text-gray-900">{titre}</h3>
        </div>

        {/* Date */}
        <div className="px-4 pb-2">
          <p className="text-sm text-gray-600">{formatDateFr(dateDebut)}</p>
        </div>

        {/* Description */}
        {description && (
          <div className="px-4 pb-3">
            <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
          </div>
        )}

        {/* Calendar buttons */}
        <div className="flex gap-2.5 px-4 pb-4">
          <button
            onClick={() => window.open(googleUrl, '_blank', 'noopener,noreferrer')}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-blue-200 text-blue-600 text-xs font-medium hover:bg-blue-50 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.5 3h-3V1.5h-1.5V3h-6V1.5H7.5V3h-3C3.675 3 3 3.675 3 4.5v15c0 .825.675 1.5 1.5 1.5h15c.825 0 1.5-.675 1.5-1.5v-15c0-.825-.675-1.5-1.5-1.5zm0 16.5h-15V8.25h15v11.25z" />
            </svg>
            Google Agenda
          </button>
          <button
            onClick={() => window.open(icsUrl, '_self')}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-300 text-gray-600 text-xs font-medium hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Outlook / iCal
          </button>
        </div>
      </div>
    </div>
  )
}
