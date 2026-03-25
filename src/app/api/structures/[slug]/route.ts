// GET /api/structures/[slug]
// Public endpoint — returns structure info by slug (no auth required)

import { db } from '@/data/db'
import { structure } from '@/data/schema'
import { eq } from 'drizzle-orm'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params

    if (!slug || typeof slug !== 'string') {
      return Response.json({ error: 'Slug requis' }, { status: 400 })
    }

    const results = await db
      .select({
        nom: structure.nom,
        slug: structure.slug,
        type: structure.type,
      })
      .from(structure)
      .where(eq(structure.slug, slug))

    if (results.length === 0) {
      return Response.json({ error: 'Structure non trouvee' }, { status: 404 })
    }

    return Response.json({ structure: results[0] }, {
      headers: { 'Cache-Control': 'public, max-age=3600' },
    })
  } catch (error) {
    console.error('[Structures slug GET]', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
