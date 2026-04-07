// DELETE/PATCH /api/v1/keys/:id
import { getConseillerFromHeaders, hasRole } from '@/lib/api-helpers'
import { apiOk, apiError } from '@/lib/api-core'
import { db } from '@/data/db'
import { apiKey } from '@/data/schema'
import { eq, and } from 'drizzle-orm'

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.id) return apiError('Non authentifié', 401)
    if (!hasRole(ctx, 'admin_structure')) return apiError('Accès réservé aux administrateurs', 403)
    const { id } = await params
    await db.update(apiKey).set({ actif: 0, misAJourLe: new Date().toISOString() }).where(ctx.role === 'super_admin' ? eq(apiKey.id, id) : and(eq(apiKey.id, id), eq(apiKey.structureId, ctx.structureId || '')))
    return apiOk({ id, actif: false })
  } catch (err) { console.error('[API Keys] Erreur DELETE:', err); return apiError('Erreur interne', 500) }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.id) return apiError('Non authentifié', 401)
    if (!hasRole(ctx, 'admin_structure')) return apiError('Accès réservé aux administrateurs', 403)
    const { id } = await params
    const body = await req.json()
    const updates: Record<string, unknown> = { misAJourLe: new Date().toISOString() }
    if (body.nom) updates.nom = body.nom
    if (body.permissions) updates.permissions = JSON.stringify(body.permissions)
    if (body.rateLimitParMinute) updates.rateLimitParMinute = body.rateLimitParMinute
    if (typeof body.actif === 'number') updates.actif = body.actif
    await db.update(apiKey).set(updates).where(ctx.role === 'super_admin' ? eq(apiKey.id, id) : and(eq(apiKey.id, id), eq(apiKey.structureId, ctx.structureId || '')))
    return apiOk({ id, ...updates })
  } catch (err) { console.error('[API Keys] Erreur PATCH:', err); return apiError('Erreur interne', 500) }
}
