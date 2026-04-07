// GET + POST /api/conseiller/structures/[structureId]/conditions
// Upload et liste des conditions commerciales

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { conditionsCommerciales, structure } from '@/data/schema'
import { eq, and, desc } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { mkdir, writeFile } from 'fs/promises'
import { join, extname } from 'path'

const CONDITIONS_DIR = '/app/data/uploads/conditions'
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIMES = ['application/pdf']

type Params = { params: Promise<{ structureId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { structureId } = await params

    if (!hasRole(ctx, 'super_admin') && ctx.structureId !== structureId) {
      return jsonError('Acces refuse', 403)
    }

    const conditions = await db
      .select()
      .from(conditionsCommerciales)
      .where(eq(conditionsCommerciales.structureId, structureId))
      .orderBy(desc(conditionsCommerciales.version))

    return jsonSuccess({ data: conditions })
  } catch (error) {
    console.error('[Conditions GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { structureId } = await params

    if (!hasRole(ctx, 'admin_structure')) return jsonError('Acces refuse', 403)
    if (!hasRole(ctx, 'super_admin') && ctx.structureId !== structureId) {
      return jsonError('Acces refuse', 403)
    }

    // Vérifier structure privée
    const structures = await db.select().from(structure).where(eq(structure.id, structureId))
    if (structures.length === 0) return jsonError('Structure non trouvee', 404)
    if (structures[0].visibilite !== 'privee') {
      return jsonError('Les conditions commerciales ne sont disponibles que pour les structures privees', 400)
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const nom = formData.get('nom') as string | null

    if (!file) return jsonError('Aucun fichier fourni', 400)
    if (!nom || nom.trim().length === 0) return jsonError('Le nom du document est requis', 400)
    if (file.size > MAX_FILE_SIZE) return jsonError('Le fichier depasse 10 Mo', 400)
    if (file.size === 0) return jsonError('Le fichier est vide', 400)
    if (!ALLOWED_MIMES.includes(file.type)) return jsonError('Seuls les fichiers PDF sont acceptes', 400)

    // Désactiver la version précédente
    const existing = await db.select().from(conditionsCommerciales)
      .where(and(eq(conditionsCommerciales.structureId, structureId), eq(conditionsCommerciales.actif, 1)))
    const nextVersion = existing.length > 0 ? Math.max(...existing.map(c => c.version ?? 1)) + 1 : 1

    for (const c of existing) {
      await db.update(conditionsCommerciales)
        .set({ actif: 0, misAJourLe: new Date().toISOString() })
        .where(eq(conditionsCommerciales.id, c.id))
    }

    // Sauvegarder le fichier
    const ext = extname(file.name).toLowerCase()
    const filename = `${uuidv4()}${ext}`
    const uploadDir = join(CONDITIONS_DIR, structureId)
    await mkdir(uploadDir, { recursive: true })

    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(join(uploadDir, filename), buffer)

    const fichierUrl = `/api/documents/conditions/${structureId}/${filename}`

    const now = new Date().toISOString()
    const newConditions = {
      id: uuidv4(),
      structureId,
      nom: nom.trim(),
      fichierNom: file.name,
      fichierUrl,
      typeMime: file.type,
      tailleFichier: file.size,
      version: nextVersion,
      actif: 1,
      creeLe: now,
      misAJourLe: now,
    }

    await db.insert(conditionsCommerciales).values(newConditions)
    await logAudit(ctx.id, 'upload_conditions', 'conditions_commerciales', newConditions.id)

    return jsonSuccess({ conditions: newConditions }, 201)
  } catch (error) {
    console.error('[Conditions POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
