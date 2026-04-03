'use client'

import { UserProfile } from '@/core/types'
import { hasSignificantProfile } from '@/core/profile-parser'
import { useAppBrand } from '@/hooks/useAppBrand'

// Drapeaux SVG inline — aucune dépendance externe
/* eslint-disable react/jsx-key */
const FLAGS: Record<string, React.ReactNode> = {
  fr: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="10" height="20" fill="#002395"/><rect x="10" width="10" height="20" fill="#fff"/><rect x="20" width="10" height="20" fill="#ED2939"/></svg>,
  gb: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 30"><rect width="60" height="30" fill="#012169"/><rect x="24" y="0" width="12" height="30" fill="#fff"/><rect x="0" y="11" width="60" height="8" fill="#fff"/><rect x="26" y="0" width="8" height="30" fill="#C8102E"/><rect x="0" y="12" width="60" height="6" fill="#C8102E"/></svg>,
  dz: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20"><rect width="15" height="20" fill="#006233"/><rect x="15" width="15" height="20" fill="#fff"/><circle cx="17" cy="10" r="5" fill="#D21034"/><circle cx="18.5" cy="10" r="4" fill="#006233"/></svg>,
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
  onToggleRgaa: () => void
  onToggleTts: () => void
  onReset: () => void
  rgaaMode: boolean
  ttsEnabled: boolean
  authPrenom?: string | null
  onAuthClick?: () => void
  selectedLang: LangCode
  onLangChange: (lang: LangCode) => void
}

export default function ChatHeader({ profile, streak = 0, hasMessages = false, onToggleProfile, onToggleRgaa, onToggleTts, onReset, rgaaMode, ttsEnabled, authPrenom, onAuthClick, selectedLang, onLangChange }: Props) {
  const hasProfile = hasSignificantProfile(profile)
  const brandConfig = useAppBrand()

  return (
    <>
    <header className="bg-gradient-to-r from-catchup-primary to-indigo-600 text-white px-3 py-2.5 flex items-center gap-3 shadow-lg z-30">
      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
        {brandConfig.logo.startsWith('/') ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={brandConfig.logo} alt={brandConfig.appName} className="w-8 h-8 object-contain" />
        ) : (
          <span className="text-xl">{brandConfig.logo}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-base tracking-tight">{brandConfig.appName}</h1>
          {streak >= 2 && (
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/15 text-[11px] font-semibold">
              <span className="animate-pulse">🔥</span>
              <span>{streak}j</span>
            </span>
          )}
        </div>
        <p className="text-[11px] text-white/70 truncate">
          {hasProfile && profile.name ? `${profile.name} · ` : ''}
          {brandConfig.tagline}
        </p>
      </div>

      <div className="flex items-center gap-0.5">
        {hasMessages && (
          <HeaderBtn
            onClick={onReset}
            active={false}
            title="Nouvelle conversation"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </HeaderBtn>
        )}

        <HeaderBtn
          onClick={onToggleTts}
          active={ttsEnabled}
          title={ttsEnabled ? 'Désactiver la voix' : 'Activer la voix'}
        >
          {ttsEnabled ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M17.95 6.05a8 8 0 010 11.9M11 5L6 9H2v6h4l5 4V5z" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          )}
        </HeaderBtn>

        <HeaderBtn
          onClick={onToggleRgaa}
          active={rgaaMode}
          title={rgaaMode ? 'Désactiver accessibilité' : 'Mode accessibilité'}
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </HeaderBtn>

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
          {/* Icône cible / bullseye pour le profil RIASEC */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" strokeWidth={2} />
            <circle cx="12" cy="12" r="6" strokeWidth={2} />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
          {hasProfile && (
            <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-catchup-primary" />
          )}
        </button>
      </div>
    </header>

    {/* ── Barre de drapeaux / sélection de langue ── */}
    <div className="bg-gradient-to-r from-catchup-primary/90 to-indigo-600/90 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto scrollbar-hide border-t border-white/10">
      {LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => onLangChange(code)}
          className={`flex-shrink-0 w-9 h-6 rounded-sm overflow-hidden transition-all border ${
            selectedLang === code
              ? 'scale-110 ring-2 ring-white/60 border-white/80 shadow-md'
              : 'hover:scale-105 opacity-70 hover:opacity-100 border-white/20'
          }`}
          title={label}
          aria-label={label}
          aria-pressed={selectedLang === code}
        >
          {FLAGS[code]}
        </button>
      ))}
    </div>
    </>
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
