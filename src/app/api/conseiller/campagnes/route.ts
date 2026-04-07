// GET  /api/conseiller/campagnes — Liste les campagnes de la structure
// POST /api/conseiller/campagnes — Crée une campagne (max 3 par structure)

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { campagne, campagneAssignation, conseiller, priseEnCharge, referral, structure } from '@/data/schema'
import { eq, and, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

const MAX_CAMPAGNES_PER_STRUCTURE = 3

async function computeAvancement(campagneId: string): Promise<number> {
  // Compter les PEC liées à des referrals issus de cette campagne
  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(priseEnCharge)
    .innerJoin(referral, eq(priseEnCharge.referralId, referral.id))
    .where(and(
      eq(referral.campagneId, campagneId),
      sql`${priseEnCharge.statut} NOT IN ('annulee', 'abandonnee')`
    ))
  return result[0]?.count || 0
}

export async function GET(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    const structureId = ctx.structureId
    if (!structureId) return jsonSuccess({ campagnes: [] })

    // Récupérer le slug de la structure pour les QR codes
    const structures = await db.select({ slug: structure.slug }).from(structure).where(eq(structure.id, structureId))
    const structureSlug = structures[0]?.slug || null

    const campagnes = await db
      .select()
      .from(campagne)
      .where(eq(campagne.structureId, structureId))
      .orderBy(campagne.dateDebut)

    const enriched = await Promise.all(
      campagnes.map(async (c) => {
        const assignations = await db
          .select({
            conseillerId: campagneAssignation.conseillerId,
            prenom: conseiller.prenom,
            nom: conseiller.nom,
          })
          .from(campagneAssignation)
          .leftJoin(conseiller, eq(campagneAssignation.conseillerId, conseiller.id))
          .where(eq(campagneAssignation.campagneId, c.id))

        const avancement = await computeAvancement(c.id)
        const pourcentage = c.quantiteObjectif > 0
          ? Math.min(100, Math.round((avancement / c.quantiteObjectif) * 100))
          : 0

        return {
          id: c.id,
          slug: c.slug,
          designation: c.designation,
          quantiteObjectif: c.quantiteObjectif,
          uniteOeuvre: c.uniteOeuvre,
          dateDebut: c.dateDebut,
          dateFin: c.dateFin,
          statut: c.statut,
          remplaceeParId: c.remplaceeParId,
          archiveeLe: c.archiveeLe,
          avancement,
          pourcentage,
          conseillers: assignations.map(a => ({
            id: a.conseillerId,
            prenom: a.prenom,
            nom: a.nom,
          })),
          creeLe: c.creeLe,
          misAJourLe: c.misAJourLe,
        }
      })
    )

    return jsonSuccess({ campagnes: enriched, structureSlug })
  } catch (error) {
    console.error('[Campagnes GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()

    if (!hasRole(ctx, 'admin_structure')) {
      return jsonError('Acces reserve aux administrateurs de structure', 403)
    }

    const structureId = ctx.structureId
    if (!structureId) return jsonError('Structure non trouvee', 400)

    // Vérifier max 3 (hors archivées)
    const existing = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(campagne)
      .where(and(
        eq(campagne.structureId, structureId),
        sql`${campagne.statut} != 'archivee'`
      ))

    if ((existing[0]?.count || 0) >= MAX_CAMPAGNES_PER_STRUCTURE) {
      return jsonError(`Maximum ${MAX_CAMPAGNES_PER_STRUCTURE} campagnes actives par structure`, 400)
    }

    const body = await request.json()
    const { designation, quantiteObjectif, uniteOeuvre, dateDebut, dateFin, conseillerIds } = body

    if (!designation || !quantiteObjectif || !uniteOeuvre || !dateDebut || !dateFin) {
      return jsonError('Tous les champs sont requis', 400)
    }

    const now = new Date().toISOString()
    const campagneId = uuidv4()

    // Générer un slug unique à partir de la désignation
    const baseSlug = designation
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 40)
    // Vérifier unicité et ajouter suffix si nécessaire
    let slug = baseSlug
    let suffix = 0
    while (true) {
      const existing2 = await db.select({ id: campagne.id }).from(campagne).where(eq(campagne.slug, slug))
      if (existing2.length === 0) break
      suffix++
      slug = `${baseSlug}-${suffix}`
    }

    await db.insert(campagne).values({
      id: campagneId,
      structureId,
      slug,
      designation,
      quantiteObjectif: parseInt(quantiteObjectif, 10),
      uniteOeuvre,
      dateDebut,
      dateFin,
      statut: 'active',
      creeLe: now,
      misAJourLe: now,
    })

    // Assignations
    if (conseillerIds && Array.isArray(conseillerIds)) {
      for (const cId of conseillerIds) {
        await db.insert(campagneAssignation).values({
          id: uuidv4(),
          campagneId,
          conseillerId: cId,
          creeLe: now,
        })
      }
    }

    return jsonSuccess({ id: campagneId, slug }, 201)
  } catch (error) {
    console.error('[Campagnes POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
