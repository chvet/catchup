'use client'

import { useState, useEffect, lazy, Suspense } from 'react'

const PdfViewerModal = lazy(() => import('./PdfViewerModal'))

interface FicheMetier {
  code_rome: string
  nom_epicene: string
  description_courte: string
  description: string
  competences: string[] | string
  formations: string[] | string
  salaires: string
  perspectives: string
  conditions_travail: string
  profil_riasec: string
  missions_principales: string[] | string
  traits_personnalite: string[] | string
}

interface FicheMetierModalProps {
  codeRome: string
  isOpen: boolean
  onClose: () => void
  onInterested?: (nom: string) => void
}

function AccordionSection({ title, icon, children, defaultOpen = false }: {
  title: string
  icon: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 px-1 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <span>{icon}</span>
          {title}
        </span>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
      {open && (
        <div className="pb-3 px-1 text-sm text-gray-600 leading-relaxed animate-in slide-in-from-top-1">
          {children}
        </div>
      )}
    </div>
  )
}

function RiasecBadges({ riasec }: { riasec: string }) {
  const labels: Record<string, { label: string; color: string }> = {
    R: { label: 'Realiste', color: 'bg-green-100 text-green-700' },
    I: { label: 'Investigateur', color: 'bg-blue-100 text-blue-700' },
    A: { label: 'Artiste', color: 'bg-purple-100 text-purple-700' },
    S: { label: 'Social', color: 'bg-pink-100 text-pink-700' },
    E: { label: 'Entreprenant', color: 'bg-orange-100 text-orange-700' },
    C: { label: 'Conventionnel', color: 'bg-gray-100 text-gray-700' },
  }

  const chars = riasec.toUpperCase().split('').filter(c => labels[c])

  if (chars.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {chars.map(c => (
        <span key={c} className={`text-xs font-semibold px-2.5 py-1 rounded-full ${labels[c].color}`}>
          {c} — {labels[c].label}
        </span>
      ))}
    </div>
  )
}

function renderList(data: string[] | string | undefined): React.ReactNode {
  if (!data) return <p className="text-gray-400 italic">Non disponible</p>
  const items = Array.isArray(data) ? data : data.split('\n').filter(Boolean)
  if (items.length === 0) return <p className="text-gray-400 italic">Non disponible</p>
  return (
    <ul className="space-y-1.5">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2">
          <span className="text-catchup-primary mt-0.5 shrink-0">&#8226;</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function renderTags(data: string[] | string | undefined): React.ReactNode {
  if (!data) return <p className="text-gray-400 italic">Non disponible</p>
  const items = Array.isArray(data) ? data : data.split(',').map(s => s.trim()).filter(Boolean)
  if (items.length === 0) return <p className="text-gray-400 italic">Non disponible</p>
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item, i) => (
        <span key={i} className="text-xs bg-catchup-primary/10 text-catchup-primary font-medium px-2.5 py-1 rounded-full">
          {item}
        </span>
      ))}
    </div>
  )
}

function renderText(data: string | undefined): React.ReactNode {
  if (!data) return <p className="text-gray-400 italic">Non disponible</p>
  return <p className="whitespace-pre-line">{data}</p>
}

export default function FicheMetierModal({ codeRome, isOpen, onClose, onInterested }: FicheMetierModalProps) {
  const [fiche, setFiche] = useState<FicheMetier | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPdf, setShowPdf] = useState(false)

  useEffect(() => {
    if (!isOpen || !codeRome) return

    setLoading(true)
    setError(null)
    setFiche(null)

    fetch(`/api/fiches/${encodeURIComponent(codeRome)}`)
      .then(r => {
        if (!r.ok) throw new Error('Fiche non trouvee')
        return r.json()
      })
      .then(data => setFiche(data))
      .catch(() => setError('Impossible de charger la fiche'))
      .finally(() => setLoading(false))
  }, [isOpen, codeRome])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white md:bg-black/40 md:items-center md:justify-center">
      {/* Desktop backdrop */}
      <div className="hidden md:block absolute inset-0" onClick={onClose} />

      {/* Modal content — full screen on mobile, centered on desktop */}
      <div className="relative flex flex-col w-full h-full md:max-w-lg md:max-h-[90vh] md:rounded-2xl md:shadow-2xl bg-white overflow-hidden animate-in slide-in-from-bottom duration-300">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-gray-800 truncate">
              {fiche?.nom_epicene || 'Fiche metier'}
            </h2>
            <span className="text-[11px] font-mono text-catchup-primary font-semibold">{codeRome}</span>
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

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-3 border-catchup-primary/30 border-t-catchup-primary rounded-full animate-spin" />
              <p className="text-sm text-gray-400">Chargement de la fiche...</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="text-3xl">😕</span>
              <p className="text-sm text-gray-500">{error}</p>
              <button
                onClick={onClose}
                className="text-sm text-catchup-primary font-semibold hover:underline"
              >
                Fermer
              </button>
            </div>
          )}

          {fiche && (
            <div>
              <AccordionSection title="Description" icon="📋" defaultOpen>
                <p className="whitespace-pre-line">{fiche.description || fiche.description_courte}</p>
              </AccordionSection>

              <AccordionSection title="Missions principales" icon="🎯">
                {renderList(fiche.missions_principales)}
              </AccordionSection>

              <AccordionSection title="Competences" icon="💡">
                {renderTags(fiche.competences)}
              </AccordionSection>

              <AccordionSection title="Formations" icon="🎓">
                {renderList(fiche.formations)}
              </AccordionSection>

              <AccordionSection title="Salaires" icon="💰">
                {renderText(fiche.salaires)}
              </AccordionSection>

              <AccordionSection title="Conditions de travail" icon="🏢">
                {renderText(fiche.conditions_travail)}
              </AccordionSection>

              <AccordionSection title="Perspectives d'evolution" icon="📈">
                {renderText(fiche.perspectives)}
              </AccordionSection>

              {fiche.profil_riasec && (
                <AccordionSection title="Profil RIASEC" icon="🧭">
                  <RiasecBadges riasec={fiche.profil_riasec} />
                </AccordionSection>
              )}

              {fiche.traits_personnalite && (
                <AccordionSection title="Traits de personnalite" icon="🧠">
                  {renderTags(fiche.traits_personnalite)}
                </AccordionSection>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-gray-100 px-4 py-3 bg-white">
          {fiche && onInterested && (
            <button
              onClick={() => onInterested(fiche.nom_epicene)}
              className="w-full py-2.5 rounded-xl bg-catchup-primary text-white text-sm font-semibold hover:bg-catchup-primary/90 active:bg-catchup-primary/80 transition-colors mb-2"
            >
              Ca m&apos;interesse !
            </button>
          )}
          {fiche && (
            <button
              onClick={() => setShowPdf(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-catchup-primary/30 text-catchup-primary text-sm font-semibold hover:bg-catchup-primary/5 active:bg-catchup-primary/10 transition-colors mb-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              Voir le PDF
            </button>
          )}
          <p className="text-[10px] text-gray-400 text-center">
            Source : Fondation JAE — Parcoureo
          </p>
        </div>
      </div>

      {showPdf && fiche && (
        <Suspense fallback={null}>
          <PdfViewerModal
            codeRome={codeRome}
            nom={fiche.nom_epicene}
            isOpen={showPdf}
            onClose={() => setShowPdf(false)}
          />
        </Suspense>
      )}
    </div>
  )
}
