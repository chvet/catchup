'use client'

import { useState } from 'react'

// RGAA audit items — updated when features evolve
const RGAA_ITEMS = [
  { label: 'Navigation au clavier', status: 'ok' as const },
  { label: 'Attributs ARIA (roles, labels)', status: 'ok' as const },
  { label: 'Contraste des textes (AA)', status: 'ok' as const },
  { label: 'Taille de texte ajustable', status: 'ok' as const },
  { label: 'Interligne ajustable', status: 'ok' as const },
  { label: 'Mode contraste renforce', status: 'ok' as const },
  { label: 'Animations reductibles', status: 'ok' as const },
  { label: 'Lecture vocale (TTS) sur chaque message', status: 'ok' as const },
  { label: 'Support multilingue (10 langues)', status: 'ok' as const },
  { label: 'Formulaires accessibles', status: 'ok' as const },
  { label: 'Textes alternatifs images et icones', status: 'ok' as const },
  { label: 'Sous-titres / transcriptions audio (Whisper)', status: 'ok' as const },
  { label: 'Compatible lecteurs d\'ecran (NVDA/VoiceOver)', status: 'partial' as const, note: 'Tests en cours' },
  { label: 'Documentation accessibilite (RGAA 4.1)', status: 'ok' as const },
] as const

export const RGAA_SCORE = Math.round(
  (RGAA_ITEMS.filter(i => i.status === 'ok').length / RGAA_ITEMS.length) * 100
)

interface Props {
  /** 'light' pour fond sombre (header bénéficiaire), 'dark' pour fond clair (header conseiller) */
  variant?: 'light' | 'dark'
}

export default function RgaaPanel({ variant = 'dark' }: Props) {
  const [open, setOpen] = useState(false)

  const btnClass = variant === 'light'
    ? `hidden sm:inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide transition-colors ${
        open ? 'bg-white/25 text-white' : 'text-white/50 hover:text-white/80 hover:bg-white/10'
      }`
    : `px-2 py-1 rounded-md text-[11px] font-medium tracking-wide transition-colors ${
        open ? 'bg-catchup-primary/10 text-catchup-primary' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
      }`

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className={btnClass}
        title="Voir le detail de conformite RGAA"
        aria-expanded={open}
      >
        RGAA {RGAA_SCORE}%
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute top-full right-0 mt-1 z-50 w-80 max-w-[calc(100vw-1rem)] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden animate-fade-in"
            role="dialog" aria-label="Detail conformite RGAA">
            <div className="px-4 py-3 bg-gradient-to-r from-catchup-primary to-indigo-600 text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Conformite RGAA</h3>
                <p className="text-[11px] text-white/70">Referentiel general d&apos;amelioration de l&apos;accessibilite</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold">{RGAA_SCORE}%</span>
                <p className="text-[10px] text-white/60">{RGAA_ITEMS.filter(i => i.status === 'ok').length}/{RGAA_ITEMS.length} criteres</p>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto px-4 py-3 space-y-2">
              {RGAA_ITEMS.map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    item.status === 'ok'
                      ? 'bg-green-100 text-green-600'
                      : item.status === 'partial'
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-red-100 text-red-500'
                  }`}>
                    {item.status === 'ok' ? '✓' : item.status === 'partial' ? '~' : '✕'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs ${item.status === 'ok' ? 'text-gray-700' : 'text-gray-500'}`}>{item.label}</p>
                    {'note' in item && item.note && (
                      <p className="text-[10px] text-gray-400">{item.note}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <a href="/accessibilite" className="text-[10px] text-catchup-primary hover:underline" target="_blank" rel="noopener">
                Declaration d&apos;accessibilite
              </a>
              <button onClick={() => setOpen(false)} className="text-xs text-catchup-primary hover:underline">
                Fermer
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
