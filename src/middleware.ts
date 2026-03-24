// Middleware Next.js — Routage par sous-domaine + protection JWT + sécurité
// - pro.catchup.jaeprive.fr → Espace Conseiller (sécurisé JWT)
// - catchup.jaeprive.fr     → App bénéficiaire
// En dev (localhost) : les deux espaces sont accessibles sans restriction de hostname

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { applySecurityHeaders } from '@/lib/security-headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'catchup-dev-secret-change-in-production'
)

const COOKIE_NAME = 'catchup_conseiller_session'

// Routes publiques conseiller (pas besoin d'auth)
const PUBLIC_ROUTES = [
  '/conseiller/login',
  '/api/conseiller/auth/login',
]

// Domaines configurables via env (fallback sur les valeurs prod)
const PRO_HOST = process.env.PRO_HOST || 'pro.catchup.jaeprive.fr'
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'catchup.jaeprive.fr'

// Routes bénéficiaire (ne doivent pas être servies sur pro.*)
const BENEFICIAIRE_ROUTES = ['/', '/quiz', '/offline']

// ── Rate limiting en mémoire (Edge Runtime compatible) ──
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(key: string, max: number, windowMs: number): { allowed: boolean; remaining: number; retryAfter: number } {
  cleanupIfNeeded()
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: max - 1, retryAfter: 0 }
  }

  entry.count++
  if (entry.count > max) {
    return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  }
  return { allowed: true, remaining: max - entry.count, retryAfter: 0 }
}

// Nettoyage intégré au checkRateLimit (pas de setInterval en Edge Runtime)
function cleanupIfNeeded() {
  // Nettoyer au max toutes les 60s
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  const keys = Array.from(rateLimitStore.keys())
  for (let i = 0; i < keys.length; i++) {
    const entry = rateLimitStore.get(keys[i])
    if (entry && now > entry.resetAt) rateLimitStore.delete(keys[i])
  }
}
let lastCleanup = Date.now()

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim()
    || request.headers.get('x-real-ip')
    || '0.0.0.0'
}

function getHostname(request: NextRequest): string {
  return request.headers.get('x-forwarded-host')
    || request.headers.get('host')
    || ''
}

function isProDomain(hostname: string): boolean {
  return hostname.startsWith('pro.')
}

function isPublicDomain(hostname: string): boolean {
  return !isProDomain(hostname)
}

function isLocalDev(hostname: string): boolean {
  return hostname.includes('localhost') || hostname.includes('127.0.0.1')
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = getHostname(request)
  const clientIP = getClientIP(request)

  // ══════════════════════════════════════════════════════════
  // 1) RATE LIMITING — Protection brute force AVANT tout traitement
  // ══════════════════════════════════════════════════════════

  // Login conseiller : 5 tentatives / 15 min par IP (anti brute force)
  if (pathname === '/api/conseiller/auth/login' && request.method === 'POST') {
    const rl = checkRateLimit(`login:${clientIP}`, 5, 15 * 60 * 1000)
    if (!rl.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Trop de tentatives de connexion. Réessayez dans quelques minutes.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(rl.retryAfter),
          },
        }
      )
    }
  }

  // Vérification PIN bénéficiaire : 5 tentatives / 15 min par IP
  if (pathname === '/api/accompagnement/verify' && request.method === 'POST') {
    const rl = checkRateLimit(`verify:${clientIP}`, 5, 15 * 60 * 1000)
    if (!rl.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) } }
      )
    }
  }

  // Vérification PIN tiers : 5 tentatives / 15 min par IP
  if (pathname === '/api/tiers/verify' && request.method === 'POST') {
    const rl = checkRateLimit(`tiers:${clientIP}`, 5, 15 * 60 * 1000)
    if (!rl.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Trop de tentatives. Réessayez dans quelques minutes.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) } }
      )
    }
  }

  // API générale : 200 requêtes / minute par IP (anti DDoS applicatif)
  if (pathname.startsWith('/api/')) {
    const rl = checkRateLimit(`api:${clientIP}`, 200, 60 * 1000)
    if (!rl.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Trop de requêtes. Réessayez dans un instant.' }),
        { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) } }
      )
    }
  }

  // ══════════════════════════════════════════════════════════
  // 2) ROUTAGE PAR SOUS-DOMAINE
  // ══════════════════════════════════════════════════════════

  if (!isLocalDev(hostname)) {
    // ── Sur pro.catchup.jaeprive.fr ──
    if (isProDomain(hostname)) {
      if (pathname === '/') {
        return applySecurityHeaders(NextResponse.redirect(new URL('/conseiller', request.url)))
      }
      if (BENEFICIAIRE_ROUTES.includes(pathname) && pathname !== '/') {
        return applySecurityHeaders(NextResponse.redirect(new URL(`https://${PUBLIC_HOST}${pathname}`)))
      }
    }

    // ── Sur catchup.jaeprive.fr ──
    if (isPublicDomain(hostname)) {
      const proEnabled = process.env.PRO_SUBDOMAIN_ENABLED === 'true'
      if (proEnabled && (pathname.startsWith('/conseiller') || pathname.startsWith('/api/conseiller'))) {
        return applySecurityHeaders(NextResponse.redirect(new URL(`https://${PRO_HOST}${pathname}`)))
      }
      return applySecurityHeaders(NextResponse.next())
    }
  }

  // ── Routes accompagnement + tiers → auth par token PIN, pas JWT ──
  if (pathname.startsWith('/accompagnement') || pathname.startsWith('/api/accompagnement')
    || pathname.startsWith('/tiers') || pathname.startsWith('/api/tiers')) {
    return applySecurityHeaders(NextResponse.next())
  }

  // ══════════════════════════════════════════════════════════
  // 3) PROTECTION JWT — Routes /conseiller/*
  // ══════════════════════════════════════════════════════════

  if (!pathname.startsWith('/conseiller') && !pathname.startsWith('/api/conseiller')) {
    return applySecurityHeaders(NextResponse.next())
  }

  // Routes publiques → laisser passer
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return applySecurityHeaders(NextResponse.next())
  }

  // Vérifier le JWT
  const token = request.cookies.get(COOKIE_NAME)?.value
    || request.headers.get('Authorization')?.replace('Bearer ', '')

  if (!token) {
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
      )
    }
    return applySecurityHeaders(
      NextResponse.redirect(new URL('/conseiller/login', request.url))
    )
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)

    // Injecter les infos du conseiller dans les headers
    const response = NextResponse.next()
    response.headers.set('x-conseiller-id', payload.sub as string)
    response.headers.set('x-conseiller-email', payload.email as string)
    response.headers.set('x-conseiller-role', payload.role as string)
    response.headers.set('x-conseiller-structure', (payload.structureId as string) || '')

    return applySecurityHeaders(response)
  } catch {
    if (pathname.startsWith('/api/')) {
      return applySecurityHeaders(
        NextResponse.json({ error: 'Session expirée' }, { status: 401 })
      )
    }
    return applySecurityHeaders(
      NextResponse.redirect(new URL('/conseiller/login', request.url))
    )
  }
}

// Matcher élargi : on doit intercepter TOUTES les routes pour le routage par hostname
export const config = {
  matcher: [
    '/conseiller/:path*',
    '/api/conseiller/:path*',
    '/accompagnement/:path*',
    '/api/accompagnement/:path*',
    '/tiers/:path*',
    '/api/tiers/:path*',
    '/api/chat',
    '/api/messages/:path*',
    '/api/referrals/:path*',
    '/',
    '/quiz',
    '/offline',
  ],
}
