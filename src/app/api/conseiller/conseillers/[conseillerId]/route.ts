// GET + PUT + DELETE /api/conseiller/conseillers/[conseillerId]
// Detail, mise a jour et desactivation d'un conseiller

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit, hashPassword } from '@/lib/auth'
import { db } from '@/data/db'
import { conseiller, structure, priseEnCharge } from '@/data/schema'
import { eq, and, sql } from 'drizzle-orm'

type Params = { params: Promise<{ conseillerId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { conseillerId } = await params

    // Fetch conseiller with structure info
    const results = await db
      .select({
        id: conseiller.id,
        email: conseiller.email,
        prenom: conseiller.prenom,
        nom: conseiller.nom,
        role: conseiller.role,
        structureId: conseiller.structureId,
        actif: conseiller.actif,
        derniereConnexion: conseiller.derniereConnexion,
        creeLe: conseiller.creeLe,
        misAJourLe: conseiller.misAJourLe,
        structureNom: structure.nom,
        structureType: structure.type,
      })
      .from(conseiller)
      .leftJoin(structure, eq(conseiller.structureId, structure.id))
      .where(eq(conseiller.id, conseillerId))

    if (results.length === 0) {
      return jsonError('Conseiller non trouve', 404)
    }

    const c = results[0]

    // Access control: admin_structure can only see conseillers in their structure
    if (!hasRole(ctx, 'super_admin') && c.structureId !== ctx.structureId) {
      return jsonError('Acces refuse', 403)
    }

    // Stats: active and terminated cases
    const casActifs = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(priseEnCharge)
      .where(
        and(
          eq(priseEnCharge.conseillerId, conseillerId),
          sql`${priseEnCharge.statut} NOT IN ('terminee', 'annulee')`
        )
      )

    const casTermines = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(priseEnCharge)
      .where(
        and(
          eq(priseEnCharge.conseillerId, conseillerId),
          sql`${priseEnCharge.statut} IN ('terminee', 'annulee')`
        )
      )

    return jsonSuccess({
      conseiller: c,
      stats: {
        nbCasActifs: casActifs[0]?.count ?? 0,
        nbCasTermines: casTermines[0]?.count ?? 0,
      },
    })
  } catch (error) {
    console.error('[Conseiller GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { conseillerId } = await params

    // Fetch existing conseiller
    const existing = await db
      .select()
      .from(conseiller)
      .where(eq(conseiller.id, conseillerId))

    if (existing.length === 0) {
      return jsonError('Conseiller non trouve', 404)
    }

    const target = existing[0]

    // Access control
    if (!hasRole(ctx, 'super_admin')) {
      if (!hasRole(ctx, 'admin_structure')) {
        return jsonError('Acces refuse', 403)
      }
      if (target.structureId !== ctx.structureId) {
        return jsonError('Acces refuse: conseiller hors de votre structure', 403)
      }
    }

    const body = await request.json()

    // admin_structure cannot promote to super_admin
    if (!hasRole(ctx, 'super_admin') && body.role === 'super_admin') {
      return jsonError('Vous ne pouvez pas attribuer le role super_admin', 403)
    }

    // Validate role if provided
    if (body.role !== undefined) {
      const validRoles = ['conseiller', 'admin_structure', 'super_admin']
      if (!validRoles.includes(body.role)) {
        return jsonError('Role invalide', 400)
      }
    }

    // If email changed, check uniqueness
    if (body.email !== undefined) {
      const emailNormalized = body.email.toLowerCase().trim()
      if (emailNormalized !== target.email) {
        const emailExists = await db
          .select({ id: conseiller.id })
          .from(conseiller)
          .where(eq(conseiller.email, emailNormalized))

        if (emailExists.length > 0) {
          return jsonError('Cet email est deja utilise', 409)
        }
        body.email = emailNormalized
      }
    }

    // Hash password if provided
    if (body.motDePasse) {
      if (typeof body.motDePasse !== 'string' || body.motDePasse.length < 8) {
        return jsonError('Mot de passe invalide (min 8 caracteres)', 400)
      }
      body.motDePasse = await hashPassword(body.motDePasse)
    }

    // Build update object (only allowed fields)
    const allowedFields = ['email', 'prenom', 'nom', 'role', 'structureId', 'motDePasse', 'actif']
    const updateData: Record<string, unknown> = { misAJourLe: new Date().toISOString() }

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    await db
      .update(conseiller)
      .set(updateData)
      .where(eq(conseiller.id, conseillerId))

    await logAudit(ctx.id, 'update_conseiller', 'conseiller', conseillerId, {
      fields: Object.keys(updateData).filter(k => k !== 'motDePasse'),
    })

    // Return updated conseiller (without password)
    const updated = await db
      .select({
        id: conseiller.id,
        email: conseiller.email,
        prenom: conseiller.prenom,
        nom: conseiller.nom,
        role: conseiller.role,
        structureId: conseiller.structureId,
        actif: conseiller.actif,
        derniereConnexion: conseiller.derniereConnexion,
        creeLe: conseiller.creeLe,
        misAJourLe: conseiller.misAJourLe,
      })
      .from(conseiller)
      .where(eq(conseiller.id, conseillerId))

    return jsonSuccess({ conseiller: updated[0] })
  } catch (error) {
    console.error('[Conseiller PUT]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { conseillerId } = await params

    // Cannot delete yourself
    if (conseillerId === ctx.id) {
      return jsonError('Vous ne pouvez pas desactiver votre propre compte', 400)
    }

    // Fetch existing conseiller
    const existing = await db
      .select()
      .from(conseiller)
      .where(eq(conseiller.id, conseillerId))

    if (existing.length === 0) {
      return jsonError('Conseiller non trouve', 404)
    }

    const target = existing[0]

    // Access control
    if (!hasRole(ctx, 'super_admin')) {
      if (!hasRole(ctx, 'admin_structure')) {
        return jsonError('Acces refuse', 403)
      }
      if (target.structureId !== ctx.structureId) {
        return jsonError('Acces refuse: conseiller hors de votre structure', 403)
      }
    }

    // Soft delete
    await db
      .update(conseiller)
      .set({ actif: 0, misAJourLe: new Date().toISOString() })
      .where(eq(conseiller.id, conseillerId))

    await logAudit(ctx.id, 'deactivate_conseiller', 'conseiller', conseillerId)

    return jsonSuccess({ message: 'Conseiller desactive' })
  } catch (error) {
    console.error('[Conseiller DELETE]', error)
    return jsonError('Erreur serveur', 500)
  }
}
