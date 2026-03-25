'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import FicheMetierCard from './FicheMetierCard'
import FicheMetierModal from './FicheMetierModal'

interface FicheResult {
  code_rome: string
  nom_epicene: string
  description_courte: string
}

interface FichesSearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  onInterested: (nomMetier: string) => void
}

export default function FichesSearchOverlay({ isOpen, onClose, onInterested }: FichesSearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<FicheResult[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200)
    } else {
      setQuery('')
      setResults([])
      setSearched(false)
      setSelectedCode(null)
    }
  }, [isOpen])

  const search = useCallback((term: string) => {
    if (term.trim().length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    setSearched(true)
    fetch(`/api/fiches?search=${encodeURIComponent(term.trim())}`)
      .then(r => r.ok ? r.json() : { results: [] })
      .then(data => {
        // L'API retourne { total, results: [...] } — extraire results
        const items = data.results || (Array.isArray(data) ? data : [])
        setResults(items)
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 400)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    search(query)
  }

  const handleInterested = (nomMetier: string) => {
    setSelectedCode(null)
    onClose()
    onInterested(nomMetier)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-white md:bg-black/40 md:items-center md:justify-center">
        {/* Desktop backdrop */}
        <div className="hidden md:block absolute inset-0" onClick={onClose} />

        <div className="relative flex flex-col w-full h-full md:max-w-lg md:max-h-[85vh] md:rounded-2xl md:shadow-2xl bg-white overflow-hidden animate-in slide-in-from-bottom duration-300">
          {/* Header + search */}
          <div className="shrink-0 px-4 pt-4 pb-3 border-b border-gray-100 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-800">Explorer les metiers</h2>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                aria-label="Fermer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={handleInputChange}
                placeholder="Ex : musique, informatique, sante..."
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-catchup-primary/30 focus:border-catchup-primary transition-all"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-catchup-primary/30 border-t-catchup-primary rounded-full animate-spin" />
                </div>
              )}
            </form>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {!searched && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-4xl mb-3">🔍</span>
                <p className="text-sm text-gray-500 max-w-[240px]">
                  Recherche un domaine ou un metier qui t&apos;interesse
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {['Informatique', 'Sante', 'Art', 'Sport', 'Commerce'].map(tag => (
                    <button
                      key={tag}
                      onClick={() => {
                        setQuery(tag)
                        search(tag)
                      }}
                      className="text-xs bg-catchup-primary/10 text-catchup-primary font-medium px-3 py-1.5 rounded-full hover:bg-catchup-primary/20 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {searched && !loading && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-3xl mb-3">😕</span>
                <p className="text-sm text-gray-500">
                  Aucun metier trouve pour &laquo; {query} &raquo;
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Essaie avec un autre mot-cle
                </p>
              </div>
            )}

            {results.length > 0 && (
              <div className="space-y-3">
                {results.map(fiche => (
                  <FicheMetierCard
                    key={fiche.code_rome}
                    codeRome={fiche.code_rome}
                    nom={fiche.nom_epicene}
                    descriptionCourte={fiche.description_courte}
                    onExpand={() => setSelectedCode(fiche.code_rome)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-gray-100 px-4 py-2 bg-white">
            <p className="text-[10px] text-gray-400 text-center">
              Fiches metiers fournies par Fondation JAE — Parcoureo
            </p>
          </div>
        </div>
      </div>

      {/* Fiche detail modal */}
      {selectedCode && (
        <FicheMetierModal
          codeRome={selectedCode}
          isOpen={true}
          onClose={() => setSelectedCode(null)}
          onInterested={handleInterested}
        />
      )}
    </>
  )
}
