// POST /api/conseiller/auth/login
// Authentification email/mot de passe → JWT cookie
// Si un slug est fourni, vérifie que le conseiller appartient à cette structure

import { login, logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { conseiller, structure } from '@/data/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, slug } = body

    if (!email || !password) {
      return Response.json(
        { error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }

    // Si un slug est fourni, vérifier que le conseiller appartient à la structure
    if (slug) {
      const emailLower = email.toLowerCase().trim()

      // Trouver la structure par slug
      const structures = await db
        .select({ id: structure.id, nom: structure.nom })
        .from(structure)
        .where(eq(structure.slug, slug))

      if (structures.length === 0) {
        return Response.json(
          { error: 'Structure inconnue' },
          { status: 404 }
        )
      }

      const structureId = structures[0].id

      // Vérifier que le conseiller appartient à cette structure (sauf super_admin)
      const conseillers = await db
        .select({ id: conseiller.id, role: conseiller.role, structureId: conseiller.structureId })
        .from(conseiller)
        .where(eq(conseiller.email, emailLower))

      if (conseillers.length > 0) {
        const c = conseillers[0]
        // Les super_admin peuvent se connecter partout
        if (c.role !== 'super_admin' && c.structureId !== structureId) {
          return Response.json(
            { error: `Ce compte n'est pas rattaché à cette structure. Connectez-vous sur votre espace dédié.` },
            { status: 403 }
          )
        }
      }
    }

    const result = await login(email, password)

    if (!result.success) {
      return Response.json(
        { error: result.error },
        { status: 401 }
      )
    }

    // Récupérer le slug de la structure du conseiller pour la redirection
    let conseillerSlug: string | null = null
    const emailLower = email.toLowerCase().trim()
    const cs = await db
      .select({ structureId: conseiller.structureId, role: conseiller.role })
      .from(conseiller)
      .where(eq(conseiller.email, emailLower))

    if (cs.length > 0 && cs[0].structureId) {
      const structs = await db
        .select({ slug: structure.slug })
        .from(structure)
        .where(eq(structure.id, cs[0].structureId))
      if (structs.length > 0) conseillerSlug = structs[0].slug
    }

    // Log de connexion
    await logAudit(null, 'login', 'conseiller', undefined, { email, slug: slug || conseillerSlug || 'direct' })

    return Response.json({ success: true, slug: conseillerSlug })
  } catch (error) {
    console.error('[Auth Login]', error)
    return Response.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
