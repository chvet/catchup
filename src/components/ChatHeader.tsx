'use client'

import { useState, useRef, useEffect } from 'react'
import { UserProfile } from '@/core/types'
import { hasSignificantProfile } from '@/core/profile-parser'
import { useAppBrand } from '@/hooks/useAppBrand'
import RgaaPanel from './RgaaPanel'

// Drapeaux SVG inline — aucune dépendance externe
/* eslint-disable react/jsx-key */
const FLAGS: Record<string, React.ReactNode> = {
  fr: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="10" height="20" fill="#002395"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ED2939"/></svg>,
  en: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30"><rect width="60" height="30" fill="#012169"/><rect x="24" y="0" width="12" height="30" fill="#fff"/><rect x="0" y="11" width="60" height="8" fill="#fff"/><rect x="26" y="0" width="8" height="30" fill="#C8102E"/><rect x="0" y="12" width="60" height="6" fill="#C8102E"/></svg>,
  ar: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="15" height="20" fill="#006233"/><rect x="15" width="15" height="20" fill="#fff"/><circle cx="17" cy="10" r="5" fill="#D21034"/><circle cx="18.5" cy="10" r="4" fill="#006233"/></svg>,
  pt: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="12" height="20" fill="#006600"/><rect x="12" width="18" height="20" fill="#FF0000"/><circle cx="12" cy="10" r="4" fill="#FFCC00"/><circle cx="12" cy="10" r="2.5" fill="#FF0000"/></svg>,
  tr: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="30" height="20" fill="#E30A17"/><circle cx="11" cy="10" r="5" fill="#fff"/><circle cx="12.5" cy="10" r="4" fill="#E30A17"/><polygon points="17,10 14.7,8.3 14.7,11.7" fill="#fff"/></svg>,
  it: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="10" height="20" fill="#009246"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#CE2B37"/></svg>,
  es: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="30" height="5" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/><rect y="15" width="30" height="5" fill="#AA151B"/></svg>,
  de: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="30" height="7" fill="#000"/><rect y="7" width="30" height="6" fill="#DD0000"/><rect y="13" width="30" height="7" fill="#FFCC00"/></svg>,
  ro: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="10" height="20" fill="#002B7F"/><rect x="10" width="10" height="20" fill="#FCD116"/><rect x="20" width="10" height="20" fill="#CE1126"/></svg>,
  zh: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="30" height="20" fill="#DE2910"/><polygon points="5,2 6.2,5.7 2.2,3.5 7.8,3.5 3.8,5.7" fill="#FFDE00"/><polygon points="11,1 11.5,2.5 9.8,1.7 12.2,1.7 10.5,2.5" fill="#FFDE00"/><polygon points="13,3 13.5,4.5 11.8,3.7 14.2,3.7 12.5,4.5" fill="#FFDE00"/><polygon points="13,6 13.5,7.5 11.8,6.7 14.2,6.7 12.5,7.5" fill="#FFDE00"/><polygon points="11,8 11.5,9.5 9.8,8.7 12.2,8.7 10.5,9.5" fill="#FFDE00"/></svg>,
}
/* eslint-enable react/jsx-key */

export const LANGUAGES = [
  { code: 'fr', label: 'Français' },
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'pt', label: 'Português' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'it', label: 'Italiano' },
  { code: 'es', label: 'Español' },
  { code: 'de', label: 'Deutsch' },
  { code: 'ro', label: 'Română' },
  { code: 'zh', label: '中文' },
] as const

export type LangCode = typeof LANGUAGES[number]['code']

interface Props {
  profile: UserProfile
  streak?: number
  hasMessages?: boolean
  onToggleProfile: () => void
  onToggleDocuments: () => void
  onToggleFiches: () => void
  onToggleA11y: () => void
  onToggleTts: () => void
  onReset: () => void
  a11yOpen: boolean
  ttsEnabled: boolean
  authPrenom?: string | null
  onAuthClick?: () => void
  selectedLang: LangCode
  onLangChange: (lang: LangCode) => void
}

export default function ChatHeader({ profile, streak = 0, hasMessages = false, onToggleProfile, onToggleDocuments, onToggleFiches, onToggleA11y, onToggleTts, onReset, a11yOpen, ttsEnabled, authPrenom, onAuthClick, selectedLang, onLangChange }: Props) {
  const hasProfile = hasSignificantProfile(profile)
  const brandConfig = useAppBrand()
  const [langOpen, setLangOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  // Close lang dropdown on outside click
  useEffect(() => {
    if (!langOpen) return
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [langOpen])

  return (
    <div className="relative z-30">
    <header className="bg-gradient-to-r from-catchup-primary to-indigo-600 text-white px-2 sm:px-3 py-2 sm:py-2.5 flex items-center gap-2 sm:gap-3 shadow-lg">
      {/* Logo Catch'Up (cursive) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={brandConfig.logo} alt={brandConfig.appName} className="h-12 sm:h-14 object-contain flex-shrink-0 brightness-0 invert" />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {streak >= 2 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold">
              <span className="animate-pulse">🔥</span>
              <span>{streak}j</span>
            </span>
          )}
        </div>
        {hasProfile && profile.name && (
          <p className="text-[11px] text-white/70 truncate">{profile.name}</p>
        )}
      </div>

      <div className="flex items-center gap-0.5">
        {hasMessages && (
          <span className="hidden sm:inline">
          <HeaderBtn
            onClick={onReset}
            active={false}
            title="Nouvelle conversation"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </HeaderBtn>
          </span>
        )}

        {/* Sélecteur de langue — drapeau actif + dropdown */}
        <div ref={langRef} className="relative">
          <button
            onClick={() => setLangOpen(v => !v)}
            className={`p-1.5 rounded-full transition-colors flex items-center gap-1 ${langOpen ? 'bg-white/25' : 'hover:bg-white/10'}`}
            title={LANGUAGES.find(l => l.code === selectedLang)?.label || 'Langue'}
            aria-label="Changer de langue"
            aria-expanded={langOpen}
            aria-haspopup="true"
          >
            <span className="w-7 h-5 rounded-sm overflow-hidden border border-white/40 block">
              {FLAGS[selectedLang]}
            </span>
            <svg className={`w-3 h-3 transition-transform ${langOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown drapeaux — grille adaptative */}
          {langOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} aria-hidden="true" />
              <div
                className="fixed left-2 right-2 sm:absolute sm:left-auto sm:right-0 sm:w-[220px] top-auto mt-1.5 bg-white rounded-xl shadow-2xl border border-gray-200 p-2.5 z-50"
                style={{ top: langRef.current ? langRef.current.getBoundingClientRect().bottom + 6 : undefined }}
                role="listbox"
                aria-label="Choisir une langue"
              >
                <div className="grid grid-cols-5 gap-1.5">
                  {LANGUAGES.map(({ code, label }) => (
                    <button
                      key={code}
                      onClick={() => { onLangChange(code); setLangOpen(false) }}
                      className={`group flex flex-col items-center gap-0.5 p-1.5 rounded-lg transition-all ${
                        selectedLang === code
                          ? 'bg-catchup-primary/10 ring-2 ring-catchup-primary'
                          : 'hover:bg-gray-100'
                      }`}
                      title={label}
                      role="option"
                      aria-selected={selectedLang === code}
                    >
                      <span className={`w-8 h-[22px] rounded-sm overflow-hidden border block ${
                        selectedLang === code ? 'border-catchup-primary' : 'border-gray-200 group-hover:border-gray-400'
                      }`}>
                        {FLAGS[code]}
                      </span>
                      <span className={`text-[9px] leading-tight ${
                        selectedLang === code ? 'text-catchup-primary font-semibold' : 'text-gray-500'
                      }`}>
                        {code.toUpperCase()}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Boutons secondaires — masqués sur mobile */}
        <button
          onClick={onToggleA11y}
          className={`hidden sm:block p-2 rounded-full transition-colors ${a11yOpen ? 'bg-white/25' : 'hover:bg-white/10'}`}
          title="Accessibilité"
          aria-label="Ouvrir les paramètres d'accessibilité"
          aria-expanded={a11yOpen}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="4.5" r="2" fill="currentColor" stroke="none" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5m0 0l-3 6m3-6l3 6M5 10l7 1 7-1" />
          </svg>
        </button>

        <div className="hidden sm:block">
          <RgaaPanel variant="light" />
        </div>

        <button
          onClick={onToggleFiches}
          className="hidden sm:block p-2 rounded-full hover:bg-white/10 transition-colors relative"
          title="Explorer les metiers"
          aria-label="Explorer les metiers"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" strokeWidth={2} />
            <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth={2} strokeLinecap="round" />
          </svg>
        </button>

        <button
          onClick={onToggleDocuments}
          className="hidden sm:block p-2 rounded-full hover:bg-white/10 transition-colors relative"
          title="Mes documents"
          aria-label="Mes documents"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </button>

        {onAuthClick && (
          <button
            onClick={onAuthClick}
            className="p-2 rounded-full hover:bg-white/10 transition-colors relative flex items-center gap-1"
            title={authPrenom ? authPrenom : 'Mon compte'}
          >
            {authPrenom ? (
              <>
                <span className="text-xs font-semibold max-w-[60px] truncate hidden sm:inline">{authPrenom}</span>
                <span className="w-2 h-2 bg-green-400 rounded-full border border-white/50" />
              </>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </button>
        )}

        <button
          onClick={onToggleProfile}
          className="p-2 rounded-full hover:bg-white/10 transition-colors relative"
          title="Mon profil RIASEC"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <circle cx="12" cy="12" r="6" strokeWidth={2} />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
          {hasProfile && (
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-catchup-primary" />
          )}
        </button>

        {/* Menu mobile "..." — tout à droite */}
        <div className="relative sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(v => !v)}
            className={`p-2 rounded-full transition-colors ${mobileMenuOpen ? 'bg-white/25' : 'hover:bg-white/10'}`}
            aria-label="Plus d'options"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
          </button>
          {mobileMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMobileMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 z-50">
                {hasMessages && (
                  <button onClick={() => { onReset(); setMobileMenuOpen(false) }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    🔄 Nouvelle conversation
                  </button>
                )}
                <button onClick={() => { onToggleA11y(); setMobileMenuOpen(false) }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  ♿ Accessibilite
                </button>
                <button onClick={() => { onToggleFiches(); setMobileMenuOpen(false) }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  🔍 Explorer les metiers
                </button>
                <button onClick={() => { onToggleDocuments(); setMobileMenuOpen(false) }} className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                  📁 Mes documents
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
    </div>
  )
}

function HeaderBtn({ onClick, active, title, children }: {
  onClick: () => void
  active: boolean
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-full transition-colors ${active ? 'bg-white/25' : 'hover:bg-white/10'}`}
      title={title}
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {children}
      </svg>
    </button>
  )
}
