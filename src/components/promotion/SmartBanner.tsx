'use client'

import { useState, useEffect } from 'react'

function detectPlatform(): 'ios' | 'android' | 'desktop' {
  if (typeof navigator === 'undefined') return 'desktop'
  const ua = navigator.userAgent.toLowerCase()
  if (/iphone|ipad|ipod/.test(ua)) return 'ios'
  if (/android/.test(ua)) return 'android'
  return 'desktop'
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator && (navigator as Record<string, unknown>).standalone === true)
}

export default function SmartBanner() {
  const [visible, setVisible] = useState(false)
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop')

  useEffect(() => {
    const plat = detectPlatform()
    setPlatform(plat)

    // Don't show on desktop, in PWA/native, or if dismissed recently
    if (plat === 'desktop' || isStandalone()) return

    const dismissed = localStorage.getItem('catchup_banner_dismissed')
    if (dismissed) {
      const dismissedAt = parseInt(dismissed)
      const fiveDays = 5 * 24 * 60 * 60 * 1000
      if (Date.now() - dismissedAt < fiveDays) return
    }

    // Show after 2 second delay
    const timer = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    localStorage.setItem('catchup_banner_dismissed', Date.now().toString())
    setVisible(false)
  }

  if (!visible) return null

  const storeUrl = platform === 'ios'
    ? '#' // TODO: App Store URL
    : '#' // TODO: Play Store URL

  return (
    <div className="bg-white border-b border-gray-200 px-3 py-2.5 flex items-center gap-3 shadow-sm animate-slideDown z-50">
      <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-catchup-primary to-catchup-accent flex items-center justify-center flex-shrink-0">
        <span className="text-lg">🚀</span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-800 truncate">Catch&apos;Up</p>
        <p className="text-[10px] text-gray-500">
          {platform === 'ios' ? 'Sur l\'App Store' : 'Sur Google Play'} · Gratuit
        </p>
        <div className="flex gap-0.5 mt-0.5">
          {[1, 2, 3, 4, 5].map(i => (
            <svg key={i} className={`w-2.5 h-2.5 ${i <= 4 ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>
      </div>

      <a
        href={storeUrl}
        className="px-4 py-1.5 bg-catchup-primary text-white text-xs font-bold rounded-full hover:bg-indigo-600 transition-colors flex-shrink-0"
      >
        OBTENIR
      </a>
    </div>
  )
}
