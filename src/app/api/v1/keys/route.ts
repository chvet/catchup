// GET/POST /api/v1/keys — CRUD clés API
import { getConseillerFromHeaders, hasRole } from '@/lib/api-helpers'
import { apiOk, apiCreated, apiError, generateApiKey, hashApiKey } from '@/lib/api-core'
import { db } from '@/data/db'
import { apiKey } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.id) return apiError('Non authentifié', 401)
    if (!hasRole(ctx, 'admin_structure')) return apiError('Accès réservé aux administrateurs', 403)
    const keys = await db.select({ id: apiKey.id, nom: apiKey.nom, prefixe: apiKey.prefixe, structureId: apiKey.structureId, permissions: apiKey.permissions, rateLimitParMinute: apiKey.rateLimitParMinute, actif: apiKey.actif, derniereUtilisation: apiKey.derniereUtilisation, nbAppels: apiKey.nbAppels, expireLe: apiKey.expireLe, creeLe: apiKey.creeLe }).from(apiKey).where(ctx.role === 'super_admin' ? undefined as any : eq(apiKey.structureId, ctx.structureId || ''))
    return apiOk(keys.map(k => ({ ...k, permissions: JSON.parse(k.permissions) })))
  } catch (err) { console.error('[API Keys] Erreur GET:', err); return apiError('Erreur interne', 500) }
}

export async function POST(req: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.id) return apiError('Non authentifié', 401)
    if (!hasRole(ctx, 'admin_structure')) return apiError('Accès réservé aux administrateurs', 403)
    const body = await req.json()
    const { nom, permissions, structureId, rateLimitParMinute, expireDansJours } = body
    if (!nom || !permissions || !Array.isArray(permissions) || permissions.length === 0) return apiError('Champs requis : nom (string), permissions (string[])')
    const validPermissions = ['chat', 'referrals', 'users', 'conseiller', 'stats', 'structures', '*']
    for (const p of permissions) { if (!validPermissions.includes(p)) return apiError(`Permission invalide : '${p}'.`) }
    const targetStructureId = ctx.role === 'super_admin' && structureId ? structureId : ctx.structureId
    const { raw, prefixe } = generateApiKey()
    const hashed = await hashApiKey(raw)
    const now = new Date().toISOString()
    const id = uuidv4()
    const expireLe = expireDansJours ? new Date(Date.now() + expireDansJours * 86400000).toISOString() : null
    await db.insert(apiKey).values({ id, nom, cle: hashed, prefixe, structureId: targetStructureId, permissions: JSON.stringify(permissions), rateLimitParMinute: rateLimitParMinute || 60, actif: 1, expireLe, creeLe: now, misAJourLe: now })
    return apiCreated({ id, nom, prefixe, cle: raw, permissions, structureId: targetStructureId, rateLimitParMinute: rateLimitParMinute || 60, expireLe, creeLe: now })
  } catch (err) { console.error('[API Keys] Erreur POST:', err); return apiError('Erreur interne', 500) }
}
