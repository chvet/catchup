'use client'

import { useState, lazy, Suspense } from 'react'
import { useSavedDocuments, type SavedDocument } from '@/hooks/useSavedDocuments'

const PdfViewerModal = lazy(() => import('./PdfViewerModal'))

interface DocumentsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function DocumentsPanel({ isOpen, onClose }: DocumentsPanelProps) {
  const { documents, removeDocument } = useSavedDocuments()
  const [viewingDoc, setViewingDoc] = useState<SavedDocument | null>(null)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[55] flex flex-col bg-white md:bg-black/40 md:items-end">
      {/* Backdrop */}
      <div className="hidden md:block absolute inset-0" onClick={onClose} />

      {/* Panel */}
      <div className="relative flex flex-col w-full h-full md:max-w-md md:shadow-2xl bg-white overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-catchup-primary to-indigo-600">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h2 className="text-base font-bold text-white">Mes documents</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            aria-label="Fermer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Fiches metier section */}
          <div className="px-4 py-3">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Fiches metier sauvegardees ({documents.length})
            </h3>

            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                <span className="text-4xl">📂</span>
                <p className="text-sm text-gray-500">Aucun document sauvegarde</p>
                <p className="text-xs text-gray-400 max-w-[250px]">
                  Explorez les fiches metier et cliquez sur &quot;Sauvegarder&quot; pour les retrouver ici.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map(doc => (
                  <DocumentItem
                    key={doc.id}
                    doc={doc}
                    onView={() => setViewingDoc(doc)}
                    onRemove={() => removeDocument(doc.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF viewer */}
      {viewingDoc && (
        <Suspense fallback={null}>
          <PdfViewerModal
            codeRome={viewingDoc.codeRome}
            nom={viewingDoc.nom}
            isOpen={!!viewingDoc}
            onClose={() => setViewingDoc(null)}
          />
        </Suspense>
      )}
    </div>
  )
}

function DocumentItem({ doc, onView, onRemove }: { doc: SavedDocument; onView: () => void; onRemove: () => void }) {
  const date = new Date(doc.savedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors group">
      {/* Icon */}
      <div className="shrink-0 w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
        <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
          <text x="7" y="17" fontSize="6" fontWeight="bold" fill="currentColor">PDF</text>
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{doc.nom}</p>
        <p className="text-[11px] text-gray-400">
          <span className="font-mono text-catchup-primary">{doc.codeRome}</span>
          <span className="mx-1">·</span>
          {date}
        </p>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-1">
        <button
          onClick={onView}
          className="p-1.5 rounded-lg hover:bg-catchup-primary/10 text-catchup-primary transition-colors"
          title="Voir le PDF"
          aria-label={`Voir le PDF de ${doc.nom}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </button>
        <a
          href={doc.pdfUrl}
          download
          className="p-1.5 rounded-lg hover:bg-catchup-primary/10 text-catchup-primary transition-colors"
          title="Telecharger"
          aria-label={`Telecharger ${doc.nom}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </a>
        <button
          onClick={onRemove}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
          title="Supprimer"
          aria-label={`Supprimer ${doc.nom}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        </button>
      </div>
    </div>
  )
}
