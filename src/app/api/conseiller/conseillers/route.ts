// GET + POST /api/conseiller/conseillers
// Liste et creation de conseillers

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit, hashPassword } from '@/lib/auth'
import { db } from '@/data/db'
import { conseiller, structure } from '@/data/schema'
import { eq, and, like, sql, or } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function GET(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const structureId = searchParams.get('structureId')
    const actif = searchParams.get('actif')

    const conditions = []

    // Role-based access
    if (!hasRole(ctx, 'super_admin')) {
      // admin_structure or conseiller: only their structure
      if (!ctx.structureId) {
        return jsonSuccess({ data: [] })
      }
      conditions.push(eq(conseiller.structureId, ctx.structureId))
    }

    // Filters
    if (search) {
      conditions.push(
        or(
          like(conseiller.nom, `%${search}%`),
          like(conseiller.prenom, `%${search}%`),
          like(conseiller.email, `%${search}%`)
        )!
      )
    }

    if (role) {
      conditions.push(eq(conseiller.role, role))
    }

    if (structureId && hasRole(ctx, 'super_admin')) {
      conditions.push(eq(conseiller.structureId, structureId))
    }

    if (actif !== null && actif !== undefined && actif !== '') {
      conditions.push(eq(conseiller.actif, parseInt(actif)))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    const conseillers = await db
      .select({
        id: conseiller.id,
        email: conseiller.email,
        prenom: conseiller.prenom,
        nom: conseiller.nom,
        role: conseiller.role,
        structureId: conseiller.structureId,
        structureNom: structure.nom,
        actif: conseiller.actif,
        derniereConnexion: conseiller.derniereConnexion,
        creeLe: conseiller.creeLe,
        misAJourLe: conseiller.misAJourLe,
      })
      .from(conseiller)
      .leftJoin(structure, eq(conseiller.structureId, structure.id))
      .where(whereClause)

    return jsonSuccess({ data: conseillers })
  } catch (error) {
    console.error('[Conseillers GET]', error)
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
    const { email, prenom, nom, role: newRole, structureId, motDePasse } = body

    // Validate required fields
    if (!email || typeof email !== 'string') {
      return jsonError('Email requis', 400)
    }
    if (!prenom || typeof prenom !== 'string') {
      return jsonError('Prenom requis', 400)
    }
    if (!nom || typeof nom !== 'string') {
      return jsonError('Nom requis', 400)
    }
    if (!motDePasse || typeof motDePasse !== 'string' || motDePasse.length < 8) {
      return jsonError('Mot de passe requis (min 8 caracteres)', 400)
    }

    const roleToSet = newRole || 'conseiller'
    const validRoles = ['conseiller', 'admin_structure', 'super_admin']
    if (!validRoles.includes(roleToSet)) {
      return jsonError('Role invalide', 400)
    }

    // admin_structure restrictions
    if (!hasRole(ctx, 'super_admin')) {
      // Can only create in their own structure
      if (structureId && structureId !== ctx.structureId) {
        return jsonError('Vous ne pouvez creer un conseiller que dans votre structure', 403)
      }
      // Can only create role=conseiller
      if (roleToSet !== 'conseiller') {
        return jsonError('Vous ne pouvez creer que des conseillers', 403)
      }
    }

    const targetStructureId = hasRole(ctx, 'super_admin') ? structureId : ctx.structureId

    if (!targetStructureId) {
      return jsonError('structureId requis', 400)
    }

    // Verify structure exists
    const existingStructure = await db
      .select()
      .from(structure)
      .where(eq(structure.id, targetStructureId))

    if (existingStructure.length === 0) {
      return jsonError('Structure non trouvee', 404)
    }

    // Check email uniqueness
    const emailNormalized = email.toLowerCase().trim()
    const existingEmail = await db
      .select({ id: conseiller.id })
      .from(conseiller)
      .where(eq(conseiller.email, emailNormalized))

    if (existingEmail.length > 0) {
      return jsonError('Cet email est deja utilise', 409)
    }

    // Hash password
    const hashedPassword = await hashPassword(motDePasse)

    const now = new Date().toISOString()
    const newConseiller = {
      id: uuidv4(),
      email: emailNormalized,
      motDePasse: hashedPassword,
      prenom: prenom.trim(),
      nom: nom.trim(),
      role: roleToSet,
      structureId: targetStructureId,
      actif: 1,
      derniereConnexion: null,
      creeLe: now,
      misAJourLe: now,
    }

    await db.insert(conseiller).values(newConseiller)

    await logAudit(ctx.id, 'create_conseiller', 'conseiller', newConseiller.id, {
      email: emailNormalized,
      role: roleToSet,
      structureId: targetStructureId,
    })

    // Return without password
    const { motDePasse: _, ...conseillerSafe } = newConseiller

    return jsonSuccess({ conseiller: conseillerSafe }, 201)
  } catch (error) {
    console.error('[Conseillers POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
