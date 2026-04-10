// GET /api/campagne/resolve?slug=xxx
// Résout un slug de campagne vers l'ID de la campagne active correspondante
// Public (pas d'auth) — utilisé côté bénéficiaire

import { db } from '@/data/db'
import { campagne, structure } from '@/data/schema'
import { eq, and, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json({ error: 'slug requis' }, { status: 400 })
    }

    // Chercher la campagne active avec ce slug
    const rows = await db
      .select({ id: campagne.id, structureId: campagne.structureId })
      .from(campagne)
      .where(and(
        eq(campagne.slug, slug),
        sql`${campagne.statut} != 'archivee'`
      ))
      .limit(1)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Campagne non trouvee' }, { status: 404 })
    }

    // Incrémenter le compteur de visites (non bloquant)
    db.update(campagne)
      .set({ nbVisites: sql`COALESCE(${campagne.nbVisites}, 0) + 1` })
      .where(eq(campagne.id, rows[0].id))
      .catch(() => {})

    // Récupérer le slug de la structure liée à la campagne
    let structureSlug: string | null = null
    let structureNom: string | null = null
    if (rows[0].structureId) {
      const structs = await db.select({ slug: structure.slug, nom: structure.nom }).from(structure).where(eq(structure.id, rows[0].structureId))
      if (structs.length > 0) {
        structureSlug = structs[0].slug
        structureNom = structs[0].nom
      }
    }

    return NextResponse.json({ campagneId: rows[0].id, structureId: rows[0].structureId, structureSlug, structureNom }, {
      headers: { 'Cache-Control': 'public, max-age=300' }
    })
  } catch (error) {
    console.error('[Campagne Resolve]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
