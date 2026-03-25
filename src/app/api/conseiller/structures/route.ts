// GET + POST /api/conseiller/structures
// Liste et creation de structures

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { structure, conseiller, priseEnCharge } from '@/data/schema'
import { eq, and, like, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

/** Generate a URL-safe slug from a French name */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')    // replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')        // trim leading/trailing hyphens
}

export async function GET(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    // Base condition depending on role
    const conditions = []

    if (!hasRole(ctx, 'super_admin')) {
      // admin_structure or conseiller: only their own structure
      if (!ctx.structureId) {
        return jsonSuccess({ data: [] })
      }
      conditions.push(eq(structure.id, ctx.structureId))
    }

    if (search) {
      conditions.push(like(structure.nom, `%${search}%`))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const structures = await db
      .select({
        id: structure.id,
        nom: structure.nom,
        slug: structure.slug,
        type: structure.type,
        departements: structure.departements,
        regions: structure.regions,
        ageMin: structure.ageMin,
        ageMax: structure.ageMax,
        specialites: structure.specialites,
        genrePreference: structure.genrePreference,
        capaciteMax: structure.capaciteMax,
        webhookUrl: structure.webhookUrl,
        parcoureoId: structure.parcoureoId,
        actif: structure.actif,
        creeLe: structure.creeLe,
        misAJourLe: structure.misAJourLe,
        nbConseillers: sql<number>`(SELECT COUNT(*) FROM conseiller WHERE conseiller.structure_id = structure.id AND conseiller.actif = 1)`.as('nb_conseillers'),
        nbCasActifs: sql<number>`(SELECT COUNT(*) FROM prise_en_charge WHERE prise_en_charge.structure_id = structure.id AND prise_en_charge.statut NOT IN ('terminee', 'annulee'))`.as('nb_cas_actifs'),
      })
      .from(structure)
      .where(whereClause)

    return jsonSuccess({ data: structures })
  } catch (error) {
    console.error('[Structures GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()

    if (!hasRole(ctx, 'admin_structure')) {
      return jsonError('Acces refuse', 403)
    }

    const body = await request.json()
    const { nom, type, departements, regions, ageMin, ageMax, specialites, genrePreference, capaciteMax, webhookUrl, parcoureoId, slug: slugInput } = body

    if (!nom || typeof nom !== 'string' || nom.trim().length === 0) {
      return jsonError('Le nom est requis', 400)
    }

    if (!type || typeof type !== 'string') {
      return jsonError('Le type est requis', 400)
    }

    const validTypes = ['mission_locale', 'pole_emploi', 'cap_emploi', 'association', 'autre']
    if (!validTypes.includes(type)) {
      return jsonError(`Type invalide. Types acceptes: ${validTypes.join(', ')}`, 400)
    }

    if (!departements || !Array.isArray(departements) || departements.length === 0) {
      return jsonError('Au moins un departement est requis', 400)
    }

    // Generate or validate slug
    const generatedSlug = slugInput ? slugify(slugInput) : slugify(nom)
    const existingSlug = await db
      .select({ id: structure.id })
      .from(structure)
      .where(eq(structure.slug, generatedSlug))
    if (existingSlug.length > 0) {
      return jsonError('Ce slug est deja utilise', 409)
    }

    const now = new Date().toISOString()
    const newStructure = {
      id: uuidv4(),
      nom: nom.trim(),
      slug: generatedSlug,
      type,
      departements: JSON.stringify(departements),
      regions: regions ? JSON.stringify(regions) : null,
      ageMin: ageMin || 16,
      ageMax: ageMax || 25,
      specialites: specialites ? JSON.stringify(specialites) : null,
      genrePreference: genrePreference || null,
      capaciteMax: capaciteMax || 50,
      webhookUrl: webhookUrl || null,
      parcoureoId: parcoureoId || null,
      actif: 1,
      creeLe: now,
      misAJourLe: now,
    }

    await db.insert(structure).values(newStructure)

    await logAudit(ctx.id, 'create_structure', 'structure', newStructure.id)

    return jsonSuccess({ structure: newStructure }, 201)
  } catch (error) {
    console.error('[Structures POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
