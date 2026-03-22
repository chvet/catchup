'use client'

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-catchup-bg">
      <div className="text-center max-w-sm">
        {/* Icone */}
        <div className="text-7xl mb-6" aria-hidden="true">
          📡
        </div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Pas de connexion
        </h1>

        {/* Sous-titre */}
        <p className="text-gray-500 mb-8 text-base leading-relaxed">
          Catch&apos;Up a besoin d&apos;internet pour discuter avec toi.
        </p>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => {
              try {
                const profil = localStorage.getItem('catchup-profil')
                if (profil) {
                  alert(profil)
                } else {
                  alert('Aucun profil sauvegardé pour le moment.')
                }
              } catch {
                alert('Impossible de lire le profil.')
              }
            }}
            className="w-full py-3 px-6 rounded-xl bg-white text-gray-700 font-semibold shadow-sm border border-gray-200 active:scale-95 transition-transform"
          >
            Voir ton profil
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-[#6C63FF] to-[#FF6584] text-white font-semibold shadow-md active:scale-95 transition-transform"
          >
            Réessayer
          </button>
        </div>
      </div>
    </div>
  )
}
