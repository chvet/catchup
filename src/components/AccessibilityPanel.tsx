'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface A11ySettings {
  fontSize: 0 | 1 | 2        // 0=normal, 1=grand, 2=tres grand
  highContrast: boolean
  reducedMotion: boolean
  lineSpacing: boolean        // interligne augmente
}

const STORAGE_KEY = 'catchup-a11y'
const FONT_LABELS = ['Normal', 'Grand', 'Tres grand'] as const

function loadSettings(): A11ySettings {
  if (typeof window === 'undefined') return { fontSize: 0, highContrast: false, reducedMotion: false, lineSpacing: false }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { fontSize: 0, highContrast: false, reducedMotion: false, lineSpacing: false }
}

function applySettings(s: A11ySettings) {
  const root = document.documentElement
  // Font size
  root.classList.remove('a11y-font-1', 'a11y-font-2')
  if (s.fontSize === 1) root.classList.add('a11y-font-1')
  if (s.fontSize === 2) root.classList.add('a11y-font-2')
  // High contrast
  root.classList.toggle('a11y-contrast', s.highContrast)
  // Reduced motion
  root.classList.toggle('a11y-reduced-motion', s.reducedMotion)
  // Line spacing
  root.classList.toggle('a11y-spacing', s.lineSpacing)
}

interface Props {
  /** Si fourni, le panneau est contrôlé de l'extérieur (ex: header) */
  open?: boolean
  onClose?: () => void
  /** Lecture vocale globale */
  ttsEnabled?: boolean
  onToggleTts?: () => void
}

export default function AccessibilityPanel({ open: controlledOpen, onClose, ttsEnabled, onToggleTts }: Props) {
  // Si pas contrôlé, gestion interne (bouton flottant)
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : internalOpen
  const close = isControlled ? (onClose || (() => {})) : () => setInternalOpen(false)
  const toggle = isControlled ? (onClose || (() => {})) : () => setInternalOpen(v => !v)

  const [settings, setSettings] = useState<A11ySettings>(loadSettings)

  // Apply on mount and changes
  useEffect(() => {
    applySettings(settings)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  // Apply on mount (for SSR hydration)
  useEffect(() => {
    const saved = loadSettings()
    setSettings(saved)
    applySettings(saved)
  }, [])

  const update = useCallback(<K extends keyof A11ySettings>(key: K, value: A11ySettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => {
    setSettings({ fontSize: 0, highContrast: false, reducedMotion: false, lineSpacing: false })
  }, [])

  const hasChanges = settings.fontSize > 0 || settings.highContrast || settings.reducedMotion || settings.lineSpacing

  return (
    <>
      {/* Floating button — seulement si pas contrôlé depuis l'extérieur */}
      {!isControlled && (
        <button
          onClick={toggle}
          className={`fixed bottom-4 left-4 z-50 w-11 h-11 rounded-full shadow-lg border-2 flex items-center justify-center transition-all duration-200
            ${hasChanges
              ? 'bg-catchup-primary text-white border-catchup-primary'
              : 'bg-white text-gray-600 border-gray-200 hover:border-catchup-primary hover:text-catchup-primary'
            }
            focus-visible:ring-2 focus-visible:ring-catchup-primary focus-visible:outline-none`}
          title="Accessibilite"
          aria-label="Ouvrir le panneau d'accessibilite"
          aria-expanded={open}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <circle cx="12" cy="4.5" r="2" fill="currentColor" stroke="none" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5m0 0l-3 6m3-6l3 6M5 10l7 1 7-1" />
          </svg>
          {hasChanges && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-catchup-secondary rounded-full border-2 border-white" />
          )}
        </button>
      )}

      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/20" onClick={close} aria-hidden="true" />
      )}

      {/* Panel — position différente selon le mode */}
      {open && (
        <A11yDialog
          className={`fixed z-50 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden
            ${isControlled ? 'top-16 right-4' : 'bottom-20 left-4'}`}
          onClose={close}
        >
          {/* Header */}
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-catchup-primary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="12" cy="4.5" r="2" fill="currentColor" stroke="none" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7v5m0 0l-3 6m3-6l3 6M5 10l7 1 7-1" />
              </svg>
              <h2 className="text-sm font-semibold text-gray-800">Accessibilite</h2>
            </div>
            <button
              onClick={close}
              className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Fermer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Options */}
          <div className="px-5 py-4 space-y-5">

            {/* Lecture vocale globale */}
            {onToggleTts !== undefined && (
              <ToggleOption
                label="Lecture vocale"
                description="Lire les messages a voix haute"
                checked={!!ttsEnabled}
                onChange={() => onToggleTts?.()}
              />
            )}

            {/* Font size */}
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 block">
                Taille du texte
              </label>
              <div className="flex gap-2">
                {([0, 1, 2] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => update('fontSize', level)}
                    className={`flex-1 py-2 rounded-lg text-center transition-all border
                      ${settings.fontSize === level
                        ? 'bg-catchup-primary text-white border-catchup-primary font-medium'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-catchup-primary/50'
                      }`}
                  >
                    <span style={{ fontSize: level === 0 ? '13px' : level === 1 ? '15px' : '17px' }}>
                      {FONT_LABELS[level]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Interligne */}
            <ToggleOption
              label="Interligne augmente"
              description="Espacement entre les lignes plus grand"
              checked={settings.lineSpacing}
              onChange={v => update('lineSpacing', v)}
            />

            {/* High contrast */}
            <ToggleOption
              label="Contraste renforce"
              description="Textes plus sombres, bordures visibles"
              checked={settings.highContrast}
              onChange={v => update('highContrast', v)}
            />

            {/* Reduced motion */}
            <ToggleOption
              label="Animations reduites"
              description="Limite les mouvements a l'ecran"
              checked={settings.reducedMotion}
              onChange={v => update('reducedMotion', v)}
            />
          </div>

          {/* Footer */}
          {hasChanges && (
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50">
              <button
                onClick={reset}
                className="text-xs text-gray-500 hover:text-catchup-primary transition-colors"
              >
                Reinitialiser les parametres
              </button>
            </div>
          )}
        </A11yDialog>
      )}
    </>
  )
}

/** Dialog wrapper with focus trap and Escape support */
function A11yDialog({ className, onClose, children }: { className: string; onClose: () => void; children: React.ReactNode }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const el = dialogRef.current
      if (!el) return
      const focusable = el.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (e.shiftKey) {
        if (document.activeElement === first) { e.preventDefault(); last.focus() }
      } else {
        if (document.activeElement === last) { e.preventDefault(); first.focus() }
      }
    }
    document.addEventListener('keydown', handleKey)
    const el = dialogRef.current
    if (el) {
      const firstBtn = el.querySelector<HTMLElement>('button')
      firstBtn?.focus()
    }
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div ref={dialogRef} className={className} role="dialog" aria-modal="true" aria-label="Parametres d'accessibilite">
      {children}
    </div>
  )
}

function ToggleOption({ label, description, checked, onChange }: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 group text-left"
      role="switch"
      aria-checked={checked}
    >
      <div>
        <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">{label}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <div className={`w-10 h-6 rounded-full flex-shrink-0 transition-colors duration-200 relative
        ${checked ? 'bg-catchup-primary' : 'bg-gray-300'}`}
      >
        <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
          ${checked ? 'translate-x-[18px]' : 'translate-x-0.5'}`}
        />
      </div>
    </button>
  )
}
