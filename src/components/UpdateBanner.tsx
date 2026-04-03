'use client'

import { useVersionCheck } from '@/hooks/useVersionCheck'

export default function UpdateBanner() {
  const { updateAvailable, forceUpdate } = useVersionCheck()

  if (!updateAvailable) return null

  return (
    <>
      {/* Bandeau bloquant */}
      <div className="fixed inset-0 z-[9999] flex flex-col">
        {/* Bannière du haut */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-3 shadow-lg">
          <div className="max-w-lg mx-auto flex items-center gap-3">
            <div className="flex-shrink-0">
              <svg className="w-6 h-6 animate-spin-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Nouvelle version disponible</p>
              <p className="text-xs text-white/80">Une mise a jour est necessaire pour continuer</p>
            </div>
            <button
              onClick={forceUpdate}
              className="px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold text-sm hover:bg-white/90 active:scale-95 transition-all shadow"
            >
              Mettre a jour
            </button>
          </div>
        </div>

        {/* Overlay bloquant le reste de l'interface */}
        <div className="flex-1 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center text-white px-6">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/10 flex items-center justify-center">
              <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
            </div>
            <p className="text-lg font-medium mb-2">Mise a jour requise</p>
            <p className="text-sm text-white/70 mb-6 max-w-xs mx-auto">
              Clique sur le bouton ci-dessus pour charger la derniere version de l&apos;application.
            </p>
            <button
              onClick={forceUpdate}
              className="px-6 py-3 bg-catchup-primary text-white rounded-xl font-semibold hover:bg-catchup-primary/90 active:scale-95 transition-all shadow-lg"
            >
              Mettre a jour maintenant
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
