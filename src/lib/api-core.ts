// API Core — Couche solution API de Catch'Up
// Authentification par clé API, réponses standardisées, CORS, pagination

import { db } from '@/data/db'
import { apiKey } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// === TYPES ===

export interface ApiEnvelope<T = unknown> {
  ok: boolean
  data?: T
  error?: string
  meta?: {
    page?: number
    perPage?: number
    total?: number
    timestamp: string
    version: string
  }
}

export interface ApiKeyPayload {
  id: string
  nom: string
  structureId: string | null
  permissions: string[]
  rateLimitParMinute: number
}

// === RÉPONSES API ENVELOPPÉES ===

const API_VERSION = 'v1'

function envelope<T>(data: T, meta?: Record<string, unknown>): ApiEnvelope<T> {
  return {
    ok: true,
    data,
    meta: { timestamp: new Date().toISOString(), version: API_VERSION, ...meta },
  }
}

export function apiOk<T>(data: T, meta?: Record<string, unknown>): Response {
  return Response.json(envelope(data, meta), { status: 200 })
}

export function apiCreated<T>(data: T): Response {
  return Response.json(envelope(data), { status: 201 })
}

export function apiError(message: string, status: number = 400): Response {
  return Response.json(
    { ok: false, error: message, meta: { timestamp: new Date().toISOString(), version: API_VERSION } },
    { status },
  )
}

export function apiPaginated<T>(data: T[], page: number, perPage: number, total: number): Response {
  return apiOk(data, { page, perPage, total })
}

// === CORS ===

const ALLOWED_ORIGINS: string[] = [
  process.env.PUBLIC_HOST ? `https://${process.env.PUBLIC_HOST}` : 'https://catchup.jaeprive.fr',
  process.env.PRO_HOST ? `https://${process.env.PRO_HOST}` : 'https://pro.catchup.jaeprive.fr',
]

if (process.env.NODE_ENV === 'development') {
  ALLOWED_ORIGINS.push('http://localhost:3000', 'http://127.0.0.1:3000')
}

if (process.env.API_ALLOWED_ORIGINS) {
  ALLOWED_ORIGINS.push(...process.env.API_ALLOWED_ORIGINS.split(',').map(o => o.trim()))
}

export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : '*'
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Allow-Credentials': allowedOrigin !== '*' ? 'true' : 'false',
    'Access-Control-Max-Age': '86400',
  }
}

export function corsPreflightResponse(origin?: string | null): Response {
  return new Response(null, { status: 204, headers: corsHeaders(origin) })
}

// === VALIDATION CLÉ API ===

export async function validateApiKey(request: Request): Promise<ApiKeyPayload | null> {
  const key = request.headers.get('x-api-key')
  if (!key) return null

  const prefixe = key.substring(0, 8)

  try {
    const keys = await db
      .select()
      .from(apiKey)
      .where(and(eq(apiKey.prefixe, prefixe), eq(apiKey.actif, 1)))

    for (const k of keys) {
      if (k.expireLe && new Date(k.expireLe) < new Date()) continue

      const isValid = await bcrypt.compare(key, k.cle)
      if (isValid) {
        db.update(apiKey)
          .set({
            derniereUtilisation: new Date().toISOString(),
            nbAppels: (k.nbAppels || 0) + 1,
            misAJourLe: new Date().toISOString(),
          })
          .where(eq(apiKey.id, k.id))
          .catch(() => {})

        return {
          id: k.id,
          nom: k.nom,
          structureId: k.structureId,
          permissions: JSON.parse(k.permissions),
          rateLimitParMinute: k.rateLimitParMinute || 60,
        }
      }
    }
  } catch (err) {
    console.error('[API] Erreur validation clé API:', err)
  }

  return null
}

// === GÉNÉRATION CLÉ API ===

export function generateApiKey(): { raw: string; prefixe: string } {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let raw = 'cup_'
  for (let i = 0; i < 48; i++) {
    raw += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return { raw, prefixe: raw.substring(0, 8) }
}

export async function hashApiKey(raw: string): Promise<string> {
  return bcrypt.hash(raw, 10)
}

// === PAGINATION ===

export function parsePagination(url: URL): { page: number; perPage: number; offset: number } {
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'))
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get('per_page') || '20')))
  return { page, perPage, offset: (page - 1) * perPage }
}

// === PERMISSIONS ===

export function hasPermission(payload: ApiKeyPayload, permission: string): boolean {
  return payload.permissions.includes('*') || payload.permissions.includes(permission)
}

export async function requireApiKey(request: Request, permission: string): Promise<ApiKeyPayload | Response> {
  const payload = await validateApiKey(request)
  if (!payload) return apiError('Clé API manquante ou invalide. Ajoutez le header X-API-Key.', 401)
  if (!hasPermission(payload, permission)) return apiError(`Permission '${permission}' requise.`, 403)
  return payload
}
