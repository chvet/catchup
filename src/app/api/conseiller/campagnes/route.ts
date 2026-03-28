// GET  /api/conseiller/campagnes — Liste les campagnes de la structure
// POST /api/conseiller/campagnes — Crée une campagne (max 3 par structure)

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { campagne, campagneAssignation, conseiller, priseEnCharge } from '@/data/schema'
import { eq, and, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

const MAX_CAMPAGNES_PER_STRUCTURE = 3

async function computeAvancement(campagneId: string, dateDebut: string, dateFin: string): Promise<number> {
  // Récupérer les conseillers assignés
  const assignations = await db
    .select({ conseillerId: campagneAssignation.conseillerId })
    .from(campagneAssignation)
    .where(eq(campagneAssignation.campagneId, campagneId))

  if (assignations.length === 0) return 0

  // Compter les PEC dans la période pour ces conseillers
  let total = 0
  for (const a of assignations) {
    const result = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(priseEnCharge)
      .where(and(
        eq(priseEnCharge.conseillerId, a.conseillerId),
        sql`${priseEnCharge.creeLe} >= ${dateDebut}`,
        sql`${priseEnCharge.creeLe} <= ${dateFin}`,
        sql`${priseEnCharge.statut} NOT IN ('annulee', 'abandonnee')`
      ))
    total += result[0]?.count || 0
  }
  return total
}

export async function GET(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    const structureId = ctx.structureId
    if (!structureId) return jsonSuccess({ campagnes: [] })

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

        const avancement = await computeAvancement(c.id, c.dateDebut, c.dateFin)
        const pourcentage = c.quantiteObjectif > 0
          ? Math.min(100, Math.round((avancement / c.quantiteObjectif) * 100))
          : 0

        return {
          id: c.id,
          designation: c.designation,
          quantiteObjectif: c.quantiteObjectif,
          uniteOeuvre: c.uniteOeuvre,
          dateDebut: c.dateDebut,
          dateFin: c.dateFin,
          statut: c.statut,
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

    return jsonSuccess({ campagnes: enriched })
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

    await db.insert(campagne).values({
      id: campagneId,
      structureId,
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

    return jsonSuccess({ id: campagneId }, 201)
  } catch (error) {
    console.error('[Campagnes POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
