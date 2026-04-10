// Middleware Next.js — Routage par sous-domaine + protection JWT + sécurité + API CORS/versioning
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { applySecurityHeaders } from '@/lib/security-headers'

if (!process.env.JWT_SECRET) {
  console.error('[SECURITY] JWT_SECRET is not set. Authentication will fail.')
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || '')
const COOKIE_NAME = 'catchup_conseiller_session'
const PUBLIC_ROUTES = ['/conseiller/login', '/api/conseiller/auth/login', '/api/conseiller/auth/parcoureo']
const PRO_HOST = process.env.PRO_HOST || 'pro.catchup.jaeprive.fr'
const PUBLIC_HOST = process.env.PUBLIC_HOST || 'catchup.jaeprive.fr'
const BENEFICIAIRE_ROUTES = ['/', '/quiz', '/offline']

// Helper: verify JWT and set conseiller headers on response
async function verifyAndSetHeaders(token: string): Promise<NextResponse | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    const response = NextResponse.next()
    response.headers.set('x-conseiller-id', payload.sub as string)
    response.headers.set('x-conseiller-email', payload.email as string)
    response.headers.set('x-conseiller-role', payload.role as string)
    response.headers.set('x-conseiller-structure', (payload.structureId as string) || '')
    return response
  } catch {
    return null
  }
}

const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(key: string, max: number, windowMs: number): { allowed: boolean; remaining: number; retryAfter: number } {
  cleanupIfNeeded()
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  if (!entry || now > entry.resetAt) { rateLimitStore.set(key, { count: 1, resetAt: now + windowMs }); return { allowed: true, remaining: max - 1, retryAfter: 0 } }
  entry.count++
  if (entry.count > max) return { allowed: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) }
  return { allowed: true, remaining: max - entry.count, retryAfter: 0 }
}
function cleanupIfNeeded() {
  const now = Date.now()
  if (now - lastCleanup < 60_000) return
  lastCleanup = now
  const keys = Array.from(rateLimitStore.keys())
  for (let i = 0; i < keys.length; i++) { const entry = rateLimitStore.get(keys[i]); if (entry && now > entry.resetAt) rateLimitStore.delete(keys[i]) }
}
let lastCleanup = Date.now()

function getClientIP(request: NextRequest): string {
  return request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || '0.0.0.0'
}

// ── CORS helpers pour les réponses API ──
function corsPreflightResponse(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin') || '*'
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  })
}
function applyCorsHeaders(response: NextResponse, request: NextRequest): void {
  const origin = request.headers.get('origin')
  if (origin) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Credentials', 'true')
  }
}

function getHostname(request: NextRequest): string { return request.headers.get('x-forwarded-host') || request.headers.get('host') || '' }
function isProDomain(hostname: string): boolean { return hostname.startsWith('pro.') }
function isPublicDomain(hostname: string): boolean { return !isProDomain(hostname) }
function isLocalDev(hostname: string): boolean { return hostname.includes('localhost') || hostname.includes('127.0.0.1') }
function withBrand(response: NextResponse, brand: string): NextResponse {
  response.headers.set('x-app-brand', brand)
  response.cookies.set('app_brand', brand, { path: '/', httpOnly: false, sameSite: 'lax' })
  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const hostname = getHostname(request)
  const clientIP = getClientIP(request)

  // ══ 0) API VERSIONING — Rewrite /api/v1/* → /api/* ══
  if (pathname.startsWith('/api/v1/') && !pathname.startsWith('/api/v1/docs') && !pathname.startsWith('/api/v1/heartbeat') && !pathname.startsWith('/api/v1/keys')) {
    const rewritten = pathname.replace('/api/v1/', '/api/')
    const url = request.nextUrl.clone()
    url.pathname = rewritten
    const response = NextResponse.rewrite(url)
    response.headers.set('X-API-Version', 'v1')
    if (request.method === 'OPTIONS') return corsPreflightResponse(request)
    applyCorsHeaders(response, request)
    return response
  }

  // ══ 0b) CORS PREFLIGHT — OPTIONS sur /api/* ══
  if (request.method === 'OPTIONS' && pathname.startsWith('/api/')) {
    return corsPreflightResponse(request)
  }

  // ══ 1) RATE LIMITING ══
  if (pathname === '/api/conseiller/auth/login' && request.method === 'POST') {
    const rl = checkRateLimit(`login:${clientIP}`, 50, 15 * 60 * 1000)
    if (!rl.allowed) return new NextResponse(JSON.stringify({ error: 'Trop de tentatives de connexion.' }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) } })
  }
  if (pathname === '/api/accompagnement/verify' && request.method === 'POST') {
    const rl = checkRateLimit(`verify:${clientIP}`, 15, 15 * 60 * 1000)
    if (!rl.allowed) return new NextResponse(JSON.stringify({ error: 'Trop de tentatives.' }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) } })
  }
  if (pathname === '/api/tiers/verify' && request.method === 'POST') {
    const rl = checkRateLimit(`tiers:${clientIP}`, 5, 15 * 60 * 1000)
    if (!rl.allowed) return new NextResponse(JSON.stringify({ error: 'Trop de tentatives.' }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) } })
  }
  if (pathname.startsWith('/api/')) {
    const rl = checkRateLimit(`api:${clientIP}`, 200, 60 * 1000)
    if (!rl.allowed) return new NextResponse(JSON.stringify({ error: 'Trop de requêtes.' }), { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(rl.retryAfter) } })
  }

  // ══ 1b) CSRF — Exemption pour X-API-Key ══
  if (pathname.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
    const origin = request.headers.get('origin')
    const hasApiKey = !!request.headers.get('x-api-key')
    const isSSE = pathname.includes('/stream')
    if (!hasApiKey && !isSSE && origin && !isLocalDev(hostname)) {
      const allowedOrigins = [`https://${PUBLIC_HOST}`, `https://${PRO_HOST}`, 'https://catchup.jaeprive.fr', 'https://pro.catchup.jaeprive.fr']
      if (!allowedOrigins.some(o => origin.startsWith(o))) {
        return new NextResponse(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { 'Content-Type': 'application/json' } })
      }
    }
  }

  // ══ 2) BRANDING ══
  const appBrand = 'catchup'

  // ══ 3) ROUTAGE PAR SOUS-DOMAINE ══
  if (!isLocalDev(hostname)) {
    if (isProDomain(hostname)) {
      if (pathname === '/') return applySecurityHeaders(NextResponse.redirect(new URL('/conseiller', request.url)))
      if (BENEFICIAIRE_ROUTES.includes(pathname) && pathname !== '/') return applySecurityHeaders(NextResponse.redirect(new URL(`https://${PUBLIC_HOST}${pathname}`)))
    }
    if (isPublicDomain(hostname)) {
      const proEnabled = process.env.PRO_SUBDOMAIN_ENABLED === 'true'
      if (proEnabled && (pathname.startsWith('/conseiller') || pathname.startsWith('/api/conseiller'))) return applySecurityHeaders(NextResponse.redirect(new URL(`https://${PRO_HOST}${pathname}`)))
      return withBrand(applySecurityHeaders(NextResponse.next()), appBrand)
    }
  }

  if (pathname.startsWith('/accompagnement') || pathname.startsWith('/api/accompagnement') || pathname.startsWith('/tiers') || pathname.startsWith('/api/tiers')) {
    return withBrand(applySecurityHeaders(NextResponse.next()), appBrand)
  }

  if (pathname.startsWith('/api/calendar/google/callback') || pathname.startsWith('/api/calendar/outlook/callback')) {
    return withBrand(applySecurityHeaders(NextResponse.next()), appBrand)
  }

  if (pathname.startsWith('/api/calendar/')) {
    const calToken = request.cookies.get(COOKIE_NAME)?.value || request.headers.get('Authorization')?.replace('Bearer ', '')
    if (!calToken) return applySecurityHeaders(NextResponse.json({ error: 'Non authentifie' }, { status: 401 }))
    const calResponse = await verifyAndSetHeaders(calToken)
    if (!calResponse) return applySecurityHeaders(NextResponse.json({ error: 'Session expiree' }, { status: 401 }))
    return withBrand(applySecurityHeaders(calResponse), appBrand)
  }

  // ══ 4) PROTECTION JWT — Routes /conseiller/* ══
  if (!pathname.startsWith('/conseiller') && !pathname.startsWith('/api/conseiller')) {
    return withBrand(applySecurityHeaders(NextResponse.next()), appBrand)
  }
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return withBrand(applySecurityHeaders(NextResponse.next()), appBrand)
  }

  const token = request.cookies.get(COOKIE_NAME)?.value || request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    if (pathname.startsWith('/api/')) return applySecurityHeaders(NextResponse.json({ error: 'Non authentifié' }, { status: 401 }))
    return applySecurityHeaders(NextResponse.redirect(new URL('/conseiller/login', request.url)))
  }

  const verified = await verifyAndSetHeaders(token)
  if (verified) return withBrand(applySecurityHeaders(verified), appBrand)
  if (pathname.startsWith('/api/')) return applySecurityHeaders(NextResponse.json({ error: 'Session expirée' }, { status: 401 }))
  return applySecurityHeaders(NextResponse.redirect(new URL('/conseiller/login', request.url)))
}

export const config = {
  matcher: [
    '/api/v1/:path*',
    '/conseiller/:path*',
    '/api/conseiller/:path*',
    '/api/calendar/:path*',
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
