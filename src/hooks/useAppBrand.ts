// Hook pour détecter le branding de l'app (wesh vs catchup)
// Utilise le cookie 'app_brand' défini par le middleware ou le hostname

import { useState, useEffect } from 'react'

export type AppBrand = 'wesh' | 'catchup'

export interface BrandConfig {
  brand: AppBrand
  appName: string
  tagline: string
  proHost: string
  publicHost: string
  primaryColor: string // Classe Tailwind
  logo: string // Emoji ou URL
}

const BRANDS: Record<AppBrand, BrandConfig> = {
  wesh: {
    brand: 'wesh',
    appName: 'Wesh',
    tagline: 'Ton guide orientation',
    proHost: 'pro.wesh.chat',
    publicHost: 'wesh.chat',
    primaryColor: '#6C63FF',
    logo: '/logo-wesh.png',
  },
  catchup: {
    brand: 'catchup',
    appName: "Catch'Up",
    tagline: 'Ton guide orientation',
    proHost: 'pro.catchup.jaeprive.fr',
    publicHost: 'catchup.jaeprive.fr',
    primaryColor: '#6C63FF',
    logo: '/logo-catchup.svg',
  },
}

function detectBrand(): AppBrand {
  if (typeof window === 'undefined') return 'wesh'

  // 1. Cookie défini par le middleware
  const cookie = document.cookie.split(';').find(c => c.trim().startsWith('app_brand='))
  if (cookie) {
    const value = cookie.split('=')[1]?.trim()
    if (value === 'catchup' || value === 'wesh') return value
  }

  // 2. Hostname
  const host = window.location.hostname
  if (host.includes('wesh.chat')) return 'wesh'
  if (host.includes('catchup') || host.includes('jaeprive')) return 'catchup'

  // 3. Default
  return 'wesh'
}

export function useAppBrand(): BrandConfig {
  const [brand, setBrand] = useState<AppBrand>('wesh')

  useEffect(() => {
    setBrand(detectBrand())
  }, [])

  return BRANDS[brand]
}

export function getAppBrand(): BrandConfig {
  return BRANDS[detectBrand()]
}
