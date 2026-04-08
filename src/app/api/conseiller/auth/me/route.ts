// GET /api/conseiller/auth/me
// Retourne les infos du conseiller connecté

import { getConseillerFromHeaders } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { conseiller, structure } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { getStructurePlan } from '@/lib/quota-check'

export async function GET() {
  try {
    const ctx = await getConseillerFromHeaders()

    const conseillers = await db
      .select()
      .from(conseiller)
      .where(eq(conseiller.id, ctx.id))

    if (conseillers.length === 0) {
      return Response.json({ error: 'Conseiller non trouvé' }, { status: 404 })
    }

    const c = conseillers[0]

    // Charger la structure si existe
    let structureData = null
    if (c.structureId) {
      const structures = await db
        .select()
        .from(structure)
        .where(eq(structure.id, c.structureId))
      structureData = structures[0] || null
    }

    // Charger le plan de la structure
    const plan = c.structureId ? await getStructurePlan(c.structureId) : 'free'

    return Response.json({
      id: c.id,
      email: c.email,
      prenom: c.prenom,
      nom: c.nom,
      role: c.role,
      plan,
      parcoureoId: c.parcoureoId || null,
      structure: structureData ? {
        id: structureData.id,
        nom: structureData.nom,
        type: structureData.type,
        slug: structureData.slug || null,
        logoUrl: structureData.logoUrl || null,
      } : null,
    })
  } catch (error) {
    console.error('[Auth Me]', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
