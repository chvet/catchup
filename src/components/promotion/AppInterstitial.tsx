'use client'

import { useState, useEffect } from 'react'
import { useAppBrand } from '@/hooks/useAppBrand'

interface Props {
  conversationCount: number
}

const EXCLUSIVE_FEATURES = [
  { icon: '📱', text: 'Secoue pour un métier surprise' },
  { icon: '📸', text: 'Filtre AR "moi en tant que..."' },
  { icon: '📍', text: 'Formations & stages à côté de chez toi' },
  { icon: '🏠', text: 'Widget motivation quotidien' },
  { icon: '✈️', text: 'Exercices d\'orientation hors-ligne' },
  { icon: '🔔', text: 'Rappels bienveillants' },
]

export default function AppInterstitial({ conversationCount }: Props) {
  const brandConfig = useAppBrand()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (conversationCount < 4) return
    const shown = localStorage.getItem('catchup_interstitial_shown')
    if (shown) return
    setVisible(true)
  }, [conversationCount])

  const dismiss = () => {
    localStorage.setItem('catchup_interstitial_shown', 'true')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-catchup-primary to-indigo-600 px-6 py-8 text-center text-white">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brandConfig.logo} alt="" className="w-10 h-10 object-contain" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold mb-1">Passe à la vitesse supérieure</h2>
          <p className="text-white/70 text-sm">Débloque des fonctionnalités exclusives</p>
        </div>

        {/* Features */}
        <div className="px-6 py-5 space-y-3">
          {EXCLUSIVE_FEATURES.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-lg">{f.icon}</span>
              <span className="text-sm text-gray-700">{f.text}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2">
          <a
            href="#"
            className="block w-full py-3 bg-catchup-primary text-white text-center font-bold rounded-xl hover:bg-indigo-600 transition-colors"
          >
            Télécharger l&apos;app
          </a>
          <button
            onClick={dismiss}
            className="block w-full py-2.5 text-gray-400 text-center text-sm hover:text-gray-600 transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
    </div>
  )
}
