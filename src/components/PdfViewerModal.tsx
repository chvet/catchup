'use client'

import { useSavedDocuments } from '@/hooks/useSavedDocuments'

interface PdfViewerModalProps {
  codeRome: string
  nom: string
  isOpen: boolean
  onClose: () => void
}

export default function PdfViewerModal({ codeRome, nom, isOpen, onClose }: PdfViewerModalProps) {
  const { saveDocument, isDocumentSaved } = useSavedDocuments()
  const saved = isDocumentSaved(codeRome)

  if (!isOpen) return null

  const pdfUrl = `/api/fiches/${encodeURIComponent(codeRome)}/pdf?inline=1`
  const downloadUrl = `/api/fiches/${encodeURIComponent(codeRome)}/pdf`

  const handleSave = () => {
    saveDocument({
      type: 'fiche_metier',
      codeRome,
      nom,
      pdfUrl: downloadUrl,
    })
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white md:bg-black/50 md:items-center md:justify-center">
      {/* Desktop backdrop */}
      <div className="hidden md:block absolute inset-0" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex flex-col w-full h-full md:max-w-3xl md:max-h-[92vh] md:rounded-2xl md:shadow-2xl bg-white overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-bold text-gray-800 truncate">{nom}</h2>
            <span className="text-[11px] font-mono text-catchup-primary font-semibold">{codeRome} — PDF</span>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors ml-3"
            aria-label="Fermer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* PDF viewer */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <iframe
            src={pdfUrl}
            className="w-full h-full border-0"
            title={`Fiche métier ${nom}`}
          />
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 px-4 py-3 bg-white flex gap-2">
          <button
            onClick={handleSave}
            disabled={saved}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors ${
              saved
                ? 'bg-green-50 text-green-600 border border-green-200 cursor-default'
                : 'bg-catchup-primary/10 text-catchup-primary hover:bg-catchup-primary/20 border border-catchup-primary/30'
            }`}
          >
            {saved ? (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Sauvegarde
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                </svg>
                Sauvegarder
              </>
            )}
          </button>
          <a
            href={downloadUrl}
            download
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-catchup-primary text-white text-sm font-semibold hover:bg-catchup-primary/90 active:bg-catchup-primary/80 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Telecharger
          </a>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
