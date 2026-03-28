// GET    /api/conseiller/campagnes/[id] — Détail campagne
// PUT    /api/conseiller/campagnes/[id] — Modifier campagne
// DELETE /api/conseiller/campagnes/[id] — Supprimer campagne

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { campagne, campagneAssignation, conseiller, priseEnCharge } from '@/data/schema'
import { eq, and, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { id } = await params

    const rows = await db.select().from(campagne).where(eq(campagne.id, id))
    if (rows.length === 0) return jsonError('Campagne non trouvee', 404)

    const c = rows[0]
    if (c.structureId !== ctx.structureId && !hasRole(ctx, 'super_admin')) {
      return jsonError('Acces refuse', 403)
    }

    const assignations = await db
      .select({
        conseillerId: campagneAssignation.conseillerId,
        prenom: conseiller.prenom,
        nom: conseiller.nom,
      })
      .from(campagneAssignation)
      .leftJoin(conseiller, eq(campagneAssignation.conseillerId, conseiller.id))
      .where(eq(campagneAssignation.campagneId, c.id))

    // Avancement par conseiller
    const detailConseillers = await Promise.all(
      assignations.map(async (a) => {
        const result = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(priseEnCharge)
          .where(and(
            eq(priseEnCharge.conseillerId, a.conseillerId),
            sql`${priseEnCharge.creeLe} >= ${c.dateDebut}`,
            sql`${priseEnCharge.creeLe} <= ${c.dateFin}`,
            sql`${priseEnCharge.statut} NOT IN ('annulee', 'abandonnee')`
          ))
        return {
          id: a.conseillerId,
          prenom: a.prenom,
          nom: a.nom,
          avancement: result[0]?.count || 0,
        }
      })
    )

    const totalAvancement = detailConseillers.reduce((sum, d) => sum + d.avancement, 0)
    const pourcentage = c.quantiteObjectif > 0
      ? Math.min(100, Math.round((totalAvancement / c.quantiteObjectif) * 100))
      : 0

    return jsonSuccess({
      ...c,
      avancement: totalAvancement,
      pourcentage,
      conseillers: detailConseillers,
    })
  } catch (error) {
    console.error('[Campagne GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'admin_structure')) {
      return jsonError('Acces reserve aux administrateurs de structure', 403)
    }

    const { id } = await params
    const rows = await db.select().from(campagne).where(eq(campagne.id, id))
    if (rows.length === 0) return jsonError('Campagne non trouvee', 404)

    const c = rows[0]
    if (c.structureId !== ctx.structureId && !hasRole(ctx, 'super_admin')) {
      return jsonError('Acces refuse', 403)
    }

    const body = await request.json()
    const { designation, quantiteObjectif, uniteOeuvre, dateDebut, dateFin, statut, conseillerIds } = body

    const now = new Date().toISOString()
    await db.update(campagne).set({
      ...(designation && { designation }),
      ...(quantiteObjectif && { quantiteObjectif: parseInt(quantiteObjectif, 10) }),
      ...(uniteOeuvre && { uniteOeuvre }),
      ...(dateDebut && { dateDebut }),
      ...(dateFin && { dateFin }),
      ...(statut && { statut }),
      misAJourLe: now,
    }).where(eq(campagne.id, id))

    // Mettre à jour les assignations si fournies
    if (conseillerIds && Array.isArray(conseillerIds)) {
      // Supprimer les anciennes
      await db.delete(campagneAssignation).where(eq(campagneAssignation.campagneId, id))
      // Insérer les nouvelles
      for (const cId of conseillerIds) {
        await db.insert(campagneAssignation).values({
          id: uuidv4(),
          campagneId: id,
          conseillerId: cId,
          creeLe: now,
        })
      }
    }

    return jsonSuccess({ success: true })
  } catch (error) {
    console.error('[Campagne PUT]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'admin_structure')) {
      return jsonError('Acces reserve aux administrateurs de structure', 403)
    }

    const { id } = await params
    const rows = await db.select().from(campagne).where(eq(campagne.id, id))
    if (rows.length === 0) return jsonError('Campagne non trouvee', 404)

    if (rows[0].structureId !== ctx.structureId && !hasRole(ctx, 'super_admin')) {
      return jsonError('Acces refuse', 403)
    }

    // Supprimer assignations puis campagne
    await db.delete(campagneAssignation).where(eq(campagneAssignation.campagneId, id))
    await db.delete(campagne).where(eq(campagne.id, id))

    return jsonSuccess({ success: true })
  } catch (error) {
    console.error('[Campagne DELETE]', error)
    return jsonError('Erreur serveur', 500)
  }
}
