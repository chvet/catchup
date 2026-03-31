// Hook branding — Catch'Up uniquement

export interface BrandConfig {
  brand: 'catchup'
  appName: string
  tagline: string
  proHost: string
  publicHost: string
  primaryColor: string
  logo: string
}

const BRAND_CONFIG: BrandConfig = {
  brand: 'catchup',
  appName: "Catch'Up",
  tagline: 'Ton guide orientation',
  proHost: process.env.PRO_HOST || 'pro.catchup.jaeprive.fr',
  publicHost: process.env.PUBLIC_HOST || 'catchup.jaeprive.fr',
  primaryColor: '#6C63FF',
  logo: '/favicon-catchup.png?v=2',
}

export function useAppBrand(): BrandConfig {
  return BRAND_CONFIG
}

export function getAppBrand(): BrandConfig {
  return BRAND_CONFIG
}
