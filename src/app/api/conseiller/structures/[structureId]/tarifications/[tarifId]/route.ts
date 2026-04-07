// PUT + DELETE /api/conseiller/structures/[structureId]/tarifications/[tarifId]
// Modification et suppression d'un tarif

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { tarification } from '@/data/schema'
import { eq, and } from 'drizzle-orm'

type Params = { params: Promise<{ structureId: string; tarifId: string }> }

export async function PUT(request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { structureId, tarifId } = await params

    if (!hasRole(ctx, 'admin_structure')) return jsonError('Acces refuse', 403)
    if (!hasRole(ctx, 'super_admin') && ctx.structureId !== structureId) {
      return jsonError('Acces refuse', 403)
    }

    const existing = await db.select().from(tarification)
      .where(and(eq(tarification.id, tarifId), eq(tarification.structureId, structureId)))
    if (existing.length === 0) return jsonError('Tarification non trouvee', 404)

    const body = await request.json()
    const allowedFields = ['libelle', 'description', 'montantCentimes', 'devise', 'dureeJours', 'actif']
    const updateData: Record<string, unknown> = { misAJourLe: new Date().toISOString() }

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    if (updateData.montantCentimes !== undefined) {
      if (typeof updateData.montantCentimes !== 'number' || (updateData.montantCentimes as number) <= 0) {
        return jsonError('Le montant doit etre un nombre positif', 400)
      }
    }

    await db.update(tarification).set(updateData)
      .where(and(eq(tarification.id, tarifId), eq(tarification.structureId, structureId)))

    await logAudit(ctx.id, 'update_tarification', 'tarification', tarifId)

    const updated = await db.select().from(tarification).where(eq(tarification.id, tarifId))
    return jsonSuccess({ tarification: updated[0] })
  } catch (error) {
    console.error('[Tarification PUT]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { structureId, tarifId } = await params

    if (!hasRole(ctx, 'admin_structure')) return jsonError('Acces refuse', 403)
    if (!hasRole(ctx, 'super_admin') && ctx.structureId !== structureId) {
      return jsonError('Acces refuse', 403)
    }

    const existing = await db.select().from(tarification)
      .where(and(eq(tarification.id, tarifId), eq(tarification.structureId, structureId)))
    if (existing.length === 0) return jsonError('Tarification non trouvee', 404)

    // Soft delete
    await db.update(tarification)
      .set({ actif: 0, misAJourLe: new Date().toISOString() })
      .where(and(eq(tarification.id, tarifId), eq(tarification.structureId, structureId)))

    await logAudit(ctx.id, 'delete_tarification', 'tarification', tarifId)

    return jsonSuccess({ message: 'Tarification desactivee' })
  } catch (error) {
    console.error('[Tarification DELETE]', error)
    return jsonError('Erreur serveur', 500)
  }
}
