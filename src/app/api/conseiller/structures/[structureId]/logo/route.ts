// POST /api/conseiller/structures/[structureId]/logo — Upload du logo de la structure
// DELETE — Supprimer le logo

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { structure } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { mkdir, writeFile, unlink } from 'fs/promises'
import { join, extname } from 'path'
import { existsSync } from 'fs'

const UPLOADS_DIR = '/app/data/uploads/structures'
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

    // Create directory
    const structureDir = join(UPLOADS_DIR, structureId)
    await mkdir(structureDir, { recursive: true })

    // Write file
    const ext = extname(file.name) || '.png'
    const filename = `logo${ext}`
    const filepath = join(structureDir, filename)
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(filepath, buffer)

    // Update DB
    const logoUrl = `/api/conseiller/structures/${structureId}/logo/serve`
    await db.update(structure).set({
      logoUrl,
      misAJourLe: new Date().toISOString(),
    }).where(eq(structure.id, structureId))

    return jsonSuccess({ logoUrl })
  } catch (error) {
    console.error('[Structure Logo Upload]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { structureId } = await params

    if (!hasRole(ctx, 'super_admin') && ctx.structureId !== structureId) {
      return jsonError('Acces refuse', 403)
    }

    // Remove file
    const structureDir = join(UPLOADS_DIR, structureId)
    for (const ext of ['.png', '.jpg', '.jpeg', '.webp', '.gif']) {
      const filepath = join(structureDir, `logo${ext}`)
      if (existsSync(filepath)) {
        await unlink(filepath)
      }
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
