// GET + PUT + DELETE /api/conseiller/structures/[structureId]
// Detail, mise a jour et suppression d'une structure

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { structure, conseiller, priseEnCharge } from '@/data/schema'
import { eq, and, sql, notInArray, ne } from 'drizzle-orm'

/** Generate a URL-safe slug from a French name */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type Params = { params: Promise<{ structureId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { structureId } = await params

    // Access control: admin_structure can only see their own structure
    if (!hasRole(ctx, 'super_admin') && ctx.structureId !== structureId) {
      return jsonError('Acces refuse', 403)
    }

    // Fetch the structure
    const structures = await db
      .select()
      .from(structure)
      .where(eq(structure.id, structureId))

    if (structures.length === 0) {
      return jsonError('Structure non trouvee', 404)
    }

    // Fetch conseillers for this structure
    const conseillers = await db
      .select({
        id: conseiller.id,
        email: conseiller.email,
        prenom: conseiller.prenom,
        nom: conseiller.nom,
        role: conseiller.role,
        actif: conseiller.actif,
        derniereConnexion: conseiller.derniereConnexion,
      })
      .from(conseiller)
      .where(eq(conseiller.structureId, structureId))

    // Count active prises en charge
    const casActifs = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(priseEnCharge)
      .where(
        and(
          eq(priseEnCharge.structureId, structureId),
          sql`${priseEnCharge.statut} NOT IN ('terminee', 'annulee')`
        )
      )

    const nbConseillers = conseillers.filter(c => c.actif === 1).length
    const nbCasActifs = casActifs[0]?.count ?? 0

    return jsonSuccess({
      structure: structures[0],
      conseillers,
      stats: {
        nbConseillers,
        nbCasActifs,
      },
    })
  } catch (error) {
    console.error('[Structure GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { structureId } = await params

    // Access control
    if (!hasRole(ctx, 'super_admin') && ctx.structureId !== structureId) {
      return jsonError('Acces refuse', 403)
    }
    if (!hasRole(ctx, 'admin_structure')) {
      return jsonError('Acces refuse', 403)
    }

    // Verify structure exists
    const existing = await db
      .select()
      .from(structure)
      .where(eq(structure.id, structureId))

    if (existing.length === 0) {
      return jsonError('Structure non trouvee', 404)
    }

    const body = await request.json()

    // Validate nom if provided
    if (body.nom !== undefined) {
      if (typeof body.nom !== 'string' || body.nom.trim().length === 0) {
        return jsonError('Le nom ne peut pas etre vide', 400)
      }
      body.nom = body.nom.trim()
    }

    // Validate type if provided
    if (body.type !== undefined) {
      const validTypes = ['mission_locale', 'pole_emploi', 'cap_emploi', 'association', 'autre']
      if (!validTypes.includes(body.type)) {
        return jsonError(`Type invalide. Types acceptes: ${validTypes.join(', ')}`, 400)
      }
    }

    // Validate slug if provided
    if (body.slug !== undefined) {
      if (typeof body.slug !== 'string' || body.slug.trim().length === 0) {
        return jsonError('Le slug ne peut pas etre vide', 400)
      }
      // Enforce slug format: lowercase, alphanumeric, hyphens only
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
      if (!slugRegex.test(body.slug)) {
        return jsonError('Le slug ne peut contenir que des lettres minuscules, chiffres et tirets', 400)
      }
      // Check uniqueness
      const existingSlug = await db
        .select({ id: structure.id })
        .from(structure)
        .where(and(eq(structure.slug, body.slug), sql`${structure.id} != ${structureId}`))
      if (existingSlug.length > 0) {
        return jsonError('Ce slug est deja utilise par une autre structure', 409)
      }
    }

    // Validate promptPersonnalise if provided (max 1000 chars + injection check)
    if (body.promptPersonnalise !== undefined && body.promptPersonnalise !== null) {
      if (typeof body.promptPersonnalise !== 'string' || body.promptPersonnalise.length > 1000) {
        return jsonError('Le prompt personnalise ne peut pas depasser 1000 caracteres', 400)
      }
      // Vérifier les patterns d'injection courants
      const injectionPatterns = [
        /ignore[rz]?\s+(toute|les|tout|all|previous)/i,
        /oublie[rz]?\s+(toute|les|tout)/i,
        /tu\s+es\s+(maintenant|désormais|dorénavant)/i,
        /you\s+are\s+now/i,
        /agis\s+comme/i,
        /sans\s+(aucune\s+)?restriction/i,
        /\[SYSTEM\]/i,
        /\[INST\]/i,
        /jailbreak/i,
        /mode\s+d[ée]veloppeur/i,
      ]
      const hasInjection = injectionPatterns.some(p => p.test(body.promptPersonnalise))
      if (hasInjection) {
        return jsonError('Le prompt contient des instructions non autorisees. Decrivez uniquement votre public cible et vos attentes d\'accompagnement.', 400)
      }
    }

    // Validate statut if provided
    if (body.statut !== undefined) {
      const validStatuts = ['public', 'prive_non_lucratif', 'lucratif']
      if (!validStatuts.includes(body.statut)) {
        return jsonError(`Statut invalide. Valeurs acceptees: ${validStatuts.join(', ')}`, 400)
      }
    }

    // Build the update object (only allowed fields)
    const allowedFields = [
      'nom', 'slug', 'type', 'departements', 'regions', 'ageMin', 'ageMax',
      'specialites', 'genrePreference', 'capaciteMax', 'webhookUrl', 'parcoureoId', 'actif',
      'adresse', 'codePostal', 'ville', 'latitude', 'longitude',
      'promptPersonnalise', 'statut', 'tauxTva',
    ]

    const updateData: Record<string, unknown> = { misAJourLe: new Date().toISOString() }
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Serialize JSON fields
        if (['departements', 'regions', 'specialites'].includes(field) && Array.isArray(body[field])) {
          updateData[field] = JSON.stringify(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }

    // Auto-géocodage si l'adresse a été modifiée
    const addressChanged = body.adresse !== undefined || body.codePostal !== undefined || body.ville !== undefined
    if (addressChanged) {
      const adresse = body.adresse ?? existing[0].adresse ?? ''
      const cp = body.codePostal ?? existing[0].codePostal ?? ''
      const ville = body.ville ?? existing[0].ville ?? ''
      if (adresse && ville) {
        try {
          const q = encodeURIComponent(`${adresse} ${cp} ${ville}`)
          const geoRes = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${q}&limit=1`)
          if (geoRes.ok) {
            const geoData = await geoRes.json()
            if (geoData.features && geoData.features.length > 0) {
              const [lng, lat] = geoData.features[0].geometry.coordinates
              updateData.latitude = lat
              updateData.longitude = lng
            }
          }
        } catch (geoErr) {
          console.warn('[Geocoding] Erreur:', geoErr)
        }
      }
    }

    await db
      .update(structure)
      .set(updateData)
      .where(eq(structure.id, structureId))

    await logAudit(ctx.id, 'update_structure', 'structure', structureId, { fields: Object.keys(updateData) })

    // Return updated structure
    const updated = await db.select().from(structure).where(eq(structure.id, structureId))

    return jsonSuccess({ structure: updated[0] })
  } catch (error) {
    console.error('[Structure PUT]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { structureId } = await params

    // Only super_admin can delete structures
    if (!hasRole(ctx, 'super_admin')) {
      return jsonError('Acces refuse: super_admin requis', 403)
    }

    // Verify structure exists
    const existing = await db
      .select()
      .from(structure)
      .where(eq(structure.id, structureId))

    if (existing.length === 0) {
      return jsonError('Structure non trouvee', 404)
    }

    // Check for active prises en charge
    const casActifs = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(priseEnCharge)
      .where(
        and(
          eq(priseEnCharge.structureId, structureId),
          sql`${priseEnCharge.statut} NOT IN ('terminee', 'annulee')`
        )
      )

    if ((casActifs[0]?.count ?? 0) > 0) {
      return jsonError('Impossible de desactiver: des prises en charge sont encore actives', 409)
    }

    // Soft delete
    await db
      .update(structure)
      .set({ actif: 0, misAJourLe: new Date().toISOString() })
      .where(eq(structure.id, structureId))

    await logAudit(ctx.id, 'delete_structure', 'structure', structureId)

    return jsonSuccess({ message: 'Structure desactivee' })
  } catch (error) {
    console.error('[Structure DELETE]', error)
    return jsonError('Erreur serveur', 500)
  }
}
