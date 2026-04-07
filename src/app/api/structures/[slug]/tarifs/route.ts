// GET /api/structures/[slug]/tarifs
// Endpoint public : retourne les tarifs et conditions d'une structure privée (sans auth)

import { NextResponse } from 'next/server'
import { db } from '@/data/db'
import { structure, tarification, conditionsCommerciales } from '@/data/schema'
import { eq, and } from 'drizzle-orm'

type Params = { params: Promise<{ slug: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const { slug } = await params

    const structures = await db
      .select()
      .from(structure)
      .where(and(eq(structure.slug, slug), eq(structure.actif, 1)))

    if (structures.length === 0) {
      return NextResponse.json({ error: 'Structure non trouvee' }, { status: 404 })
    }

    const s = structures[0]

    if (s.statut !== 'lucratif') {
      return NextResponse.json({
        structureId: s.id,
        nom: s.nom,
        statut: s.statut,
        tarifs: [],
        conditions: null,
      })
    }

    // Tarifs actifs
    const tarifs = await db
      .select({
        id: tarification.id,
        libelle: tarification.libelle,
        description: tarification.description,
        montantHtCentimes: tarification.montantHtCentimes,
        montantTtcCentimes: tarification.montantTtcCentimes,
        montantCentimes: tarification.montantCentimes,
        devise: tarification.devise,
        dureeJours: tarification.dureeJours,
      })
      .from(tarification)
      .where(and(eq(tarification.structureId, s.id), eq(tarification.actif, 1)))

    // Conditions actives (dernière version)
    const conditions = await db
      .select({
        id: conditionsCommerciales.id,
        nom: conditionsCommerciales.nom,
        fichierUrl: conditionsCommerciales.fichierUrl,
        version: conditionsCommerciales.version,
      })
      .from(conditionsCommerciales)
      .where(and(eq(conditionsCommerciales.structureId, s.id), eq(conditionsCommerciales.actif, 1)))

    return NextResponse.json({
      structureId: s.id,
      nom: s.nom,
      statut: s.statut,
      logoUrl: s.logoUrl,
      tarifs,
      conditions: conditions[0] || null,
    }, {
      headers: { 'Cache-Control': 'public, max-age=300' }, // 5 min cache
    })
  } catch (error) {
    console.error('[Structure tarifs GET]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
