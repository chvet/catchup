'use client'

import { useState, lazy, Suspense } from 'react'

const PdfViewerModal = lazy(() => import('./PdfViewerModal'))

interface FicheMetierCardProps {
  codeRome: string
  nom: string
  descriptionCourte: string
  onExpand: () => void
}

export default function FicheMetierCard({ codeRome, nom, descriptionCourte, onExpand }: FicheMetierCardProps) {
  const [showPdf, setShowPdf] = useState(false)

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
        <button
          onClick={(e) => { e.stopPropagation(); setShowPdf(true) }}
          className="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-catchup-primary/5 hover:bg-catchup-primary/10 active:bg-catchup-primary/15 text-catchup-primary transition-colors"
          title="Voir le PDF"
          aria-label={`Voir le PDF de ${nom}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </button>
      </div>

      {showPdf && (
        <Suspense fallback={null}>
          <PdfViewerModal
            codeRome={codeRome}
            nom={nom}
            isOpen={showPdf}
            onClose={() => setShowPdf(false)}
          />
        </Suspense>
      )}
    </div>
  )
}
