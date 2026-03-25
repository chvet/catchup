'use client'

interface FicheMetierCardProps {
  codeRome: string
  nom: string
  descriptionCourte: string
  onExpand: () => void
}

export default function FicheMetierCard({ codeRome, nom, descriptionCourte, onExpand }: FicheMetierCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="text-base font-bold text-gray-800 leading-tight">{nom}</h3>
        <span className="shrink-0 text-[11px] font-mono font-semibold text-catchup-primary bg-catchup-primary/10 px-2 py-0.5 rounded-full">
          {codeRome}
        </span>
      </div>

      <p className="text-sm text-gray-500 leading-relaxed line-clamp-3 mb-3">
        {descriptionCourte}
      </p>

      <div className="flex gap-2">
        <button
          onClick={onExpand}
          className="flex-1 text-center text-sm font-semibold text-catchup-primary bg-catchup-primary/5 hover:bg-catchup-primary/10 active:bg-catchup-primary/15 rounded-lg py-2 transition-colors"
        >
          Voir la fiche complete
        </button>
        <a
          href={`/api/fiches/${encodeURIComponent(codeRome)}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-catchup-primary/5 hover:bg-catchup-primary/10 active:bg-catchup-primary/15 text-catchup-primary transition-colors"
          title="T&eacute;l&eacute;charger en PDF"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </a>
      </div>
    </div>
  )
}
