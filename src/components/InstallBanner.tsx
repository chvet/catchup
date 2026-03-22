'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

type Platform = 'ios' | 'android' | 'desktop' | 'unknown'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'unknown'
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'desktop'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  // Vérifie si l'app est déjà en mode standalone (PWA installée)
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

const LS_INSTALL_DISMISSED = 'catchup_install_dismissed'
const LS_INSTALL_DISMISSED_COUNT = 'catchup_install_dismissed_count'

export default function InstallBanner({ messageCount }: { messageCount: number }) {
  const [platform, setPlatform] = useState<Platform>('unknown')
  const [show, setShow] = useState(false)
  const [showInstructions, setShowInstructions] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  // Détection de la plateforme
  useEffect(() => {
    const p = detectPlatform()
    setPlatform(p)

    // Intercepter l'événement beforeinstallprompt (Android/Desktop Chrome)
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPromptRef.current = e as BeforeInstallPromptEvent
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  // Décider quand afficher la bannière
  useEffect(() => {
    // Ne pas afficher si déjà en mode standalone
    if (isStandalone()) return

    // Ne pas afficher si l'utilisateur a refusé 3+ fois
    try {
      const dismissCount = parseInt(localStorage.getItem(LS_INSTALL_DISMISSED_COUNT) || '0')
      if (dismissCount >= 3) return

      // Ne pas afficher si refusé il y a moins de 24h
      const dismissedAt = localStorage.getItem(LS_INSTALL_DISMISSED)
      if (dismissedAt) {
        const diff = Date.now() - parseInt(dismissedAt)
        if (diff < 24 * 60 * 60 * 1000) return
      }
    } catch { /* ignore */ }

    // Afficher après 5 messages (pas immédiatement, laisser le jeune s'engager)
    if (messageCount >= 5) {
      setShow(true)
    }
  }, [messageCount])

  const handleDismiss = useCallback(() => {
    setShow(false)
    try {
      localStorage.setItem(LS_INSTALL_DISMISSED, Date.now().toString())
      const count = parseInt(localStorage.getItem(LS_INSTALL_DISMISSED_COUNT) || '0')
      localStorage.setItem(LS_INSTALL_DISMISSED_COUNT, (count + 1).toString())
    } catch { /* ignore */ }
  }, [])

  const handleInstall = useCallback(async () => {
    if (platform === 'android' && deferredPromptRef.current) {
      // Android/Desktop : déclencher le prompt natif
      try {
        await deferredPromptRef.current.prompt()
        const { outcome } = await deferredPromptRef.current.userChoice
        if (outcome === 'accepted') {
          setShow(false)
        }
        deferredPromptRef.current = null
      } catch {
        // Fallback : montrer les instructions manuelles
        setShowInstructions(true)
      }
    } else {
      // iOS ou pas de prompt natif : montrer les instructions
      setShowInstructions(true)
    }
  }, [platform])

  if (!show) return null

  return (
    <>
      {/* Bannière compacte */}
      {!showInstructions && (
        <div className="mx-3 mb-2 md:mx-6 animate-fade-in">
          <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-catchup-primary/5 to-indigo-50 border border-catchup-primary/15 px-4 py-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-catchup-primary to-catchup-secondary flex items-center justify-center flex-shrink-0">
              <span className="text-lg">📱</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-800">
                {platform === 'ios' ? 'Ajoute Catch\'Up sur ton iPhone' :
                 platform === 'android' ? 'Installe Catch\'Up sur ton téléphone' :
                 'Installe Catch\'Up sur ton ordi'}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Accès rapide, fonctionne hors-ligne, comme une vraie app !
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="px-3 py-1.5 rounded-lg bg-catchup-primary text-white text-xs font-semibold hover:bg-catchup-primary/90 transition-colors active:scale-95"
              >
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Plus tard"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions détaillées (modale) */}
      {showInstructions && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4 pb-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-catchup-primary to-indigo-600 px-5 py-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base">
                  {platform === 'ios' ? '📱 Installer sur iPhone' :
                   platform === 'android' ? '📱 Installer sur Android' :
                   '💻 Installer sur ton ordi'}
                </h3>
                <button
                  onClick={() => { setShowInstructions(false); handleDismiss() }}
                  className="p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-white/80 text-xs mt-1">En 3 clics, Catch&apos;Up devient une vraie app !</p>
            </div>

            {/* Steps */}
            <div className="p-5 space-y-4">
              {platform === 'ios' ? (
                <>
                  <Step num={1} emoji="🧭" text={<>Ouvre cette page dans <strong>Safari</strong> (pas Chrome ni Firefox)</>} />
                  <Step num={2} emoji="📤" text={<>Appuie sur le bouton <strong>Partager</strong> (carré avec une flèche vers le haut) en bas de l&apos;écran</>} />
                  <Step num={3} emoji="➕" text={<>Fais défiler et appuie sur <strong>&quot;Sur l&apos;écran d&apos;accueil&quot;</strong></>} />
                  <Step num={4} emoji="✅" text={<>Appuie sur <strong>&quot;Ajouter&quot;</strong> en haut à droite</>} />
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mt-2">
                    <p className="text-xs text-amber-700">
                      <strong>Important :</strong> Sur iPhone, seul Safari permet d&apos;installer des apps web. Si tu utilises Chrome, copie l&apos;adresse et ouvre-la dans Safari.
                    </p>
                  </div>
                </>
              ) : platform === 'android' ? (
                <>
                  <Step num={1} emoji="⋮" text={<>Appuie sur les <strong>3 points</strong> en haut à droite de Chrome</>} />
                  <Step num={2} emoji="📲" text={<>Appuie sur <strong>&quot;Installer l&apos;application&quot;</strong> ou <strong>&quot;Ajouter à l&apos;écran d&apos;accueil&quot;</strong></>} />
                  <Step num={3} emoji="✅" text={<>Confirme avec <strong>&quot;Installer&quot;</strong></>} />
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 mt-2">
                    <p className="text-xs text-green-700">
                      L&apos;app apparaîtra sur ton écran d&apos;accueil comme une vraie app ! 🎉
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Step num={1} emoji="🌐" text={<>Dans <strong>Chrome</strong> ou <strong>Edge</strong>, clique sur l&apos;icône d&apos;installation dans la barre d&apos;adresse (📥)</>} />
                  <Step num={2} emoji="✅" text={<>Clique sur <strong>&quot;Installer&quot;</strong></>} />
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-2">
                    <p className="text-xs text-blue-700">
                      Catch&apos;Up s&apos;ouvrira dans sa propre fenêtre, comme une app native !
                    </p>
                  </div>
                </>
              )}

              <div className="pt-2 space-y-2">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Pourquoi installer ?</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Perk emoji="⚡" text="Accès instantané" />
                  <Perk emoji="📴" text="Fonctionne hors-ligne" />
                  <Perk emoji="🔔" text="Notifications" />
                  <Perk emoji="🎯" text="Plein écran" />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-5">
              <button
                onClick={() => { setShowInstructions(false); handleDismiss() }}
                className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Je ferai ça plus tard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function Step({ num, emoji, text }: { num: number; emoji: string; text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-7 h-7 rounded-full bg-catchup-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-xs font-bold text-catchup-primary">{num}</span>
      </div>
      <div className="flex-1">
        <p className="text-sm text-gray-700">
          <span className="mr-1.5">{emoji}</span>
          {text}
        </p>
      </div>
    </div>
  )
}

function Perk({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 rounded-lg">
      <span className="text-xs">{emoji}</span>
      <span className="text-[11px] text-gray-600 font-medium">{text}</span>
    </div>
  )
}
