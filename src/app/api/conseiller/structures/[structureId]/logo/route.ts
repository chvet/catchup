// POST /api/conseiller/structures/[structureId]/logo — Upload du logo de la structure (stocké en base64 dans la DB)
// DELETE — Supprimer le logo

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { structure } from '@/data/schema'
import { eq } from 'drizzle-orm'

const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2 MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

type Params = { params: Promise<{ structureId: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { structureId } = await params

    // Only admin_structure (own) or super_admin can upload
    if (!hasRole(ctx, 'super_admin') && ctx.structureId !== structureId) {
      return jsonError('Acces refuse', 403)
    }
    if (!hasRole(ctx, 'super_admin') && !hasRole(ctx, 'admin_structure')) {
      return jsonError('Seul un administrateur peut modifier le logo', 403)
    }

    const formData = await request.formData()
    const file = formData.get('logo') as File | null

    if (!file || !file.size) {
      return jsonError('Aucun fichier fourni', 400)
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return jsonError('Format non supporte. Utilisez JPG, PNG, WebP ou GIF.', 400)
    }

    if (file.size > MAX_LOGO_SIZE) {
      return jsonError('Le logo ne doit pas depasser 2 Mo', 400)
    }

    // Convertir en base64 data URI
    const buffer = Buffer.from(await file.arrayBuffer())
    const base64 = buffer.toString('base64')
    const dataUri = `data:${file.type};base64,${base64}`

    // Stocker directement dans la DB
    await db.update(structure).set({
      logoUrl: dataUri,
      misAJourLe: new Date().toISOString(),
    }).where(eq(structure.id, structureId))

    return jsonSuccess({ logoUrl: dataUri })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('[Structure Logo Upload]', msg, error)
    return jsonError(`Erreur serveur: ${msg}`, 500)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { structureId } = await params

    if (!hasRole(ctx, 'super_admin') && ctx.structureId !== structureId) {
      return jsonError('Acces refuse', 403)
    }

    // Clear DB
    await db.update(structure).set({
      logoUrl: null,
      misAJourLe: new Date().toISOString(),
    }).where(eq(structure.id, structureId))

    return jsonSuccess({ deleted: true })
  } catch (error) {
    console.error('[Structure Logo Delete]', error)
    return jsonError('Erreur serveur', 500)
  }
}
