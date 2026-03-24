// GET /api/conseiller/dashboard/stats
// KPIs agrégés pour le dashboard

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { referral, priseEnCharge, structure } from '@/data/schema'
import { eq, and, gte, sql, or } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    const url = new URL(request.url)

    // Période (en jours)
    const periodeJours = parseInt(url.searchParams.get('periode') || '30')
    const depuis = new Date(Date.now() - periodeJours * 24 * 60 * 60 * 1000).toISOString()

    // Filtre structure
    const structureFilter = hasRole(ctx, 'super_admin')
      ? undefined
      : ctx.structureId
        ? or(
            eq(referral.structureSuggereId, ctx.structureId),
            sql`${referral.structureSuggereId} IS NULL`
          )
        : undefined

    const baseWhere = and(
      gte(referral.creeLe, depuis),
      structureFilter
    )

    // === KPIs ===

    // Nombre total de demandes
    const totalDemandes = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(referral)
      .where(baseWhere)

    // Par priorité
    const parPriorite = await db
      .select({
        priorite: referral.priorite,
        count: sql<number>`COUNT(*)`,
      })
      .from(referral)
      .where(baseWhere)
      .groupBy(referral.priorite)

    // Prises en charge
    const pecWhere = and(
      gte(priseEnCharge.creeLe, depuis),
      !hasRole(ctx, 'super_admin') && ctx.structureId
        ? eq(priseEnCharge.structureId, ctx.structureId)
        : undefined
    )

    const pecStats = await db
      .select({
        statut: priseEnCharge.statut,
        count: sql<number>`COUNT(*)`,
      })
      .from(priseEnCharge)
      .where(pecWhere)
      .groupBy(priseEnCharge.statut)

    // Temps d'attente moyen (en heures)
    const tempsAttente = await db
      .select({
        avgHeures: sql<number>`AVG(
          CAST((julianday(${priseEnCharge.premiereActionLe}) - julianday(${referral.creeLe})) * 24 AS REAL)
        )`,
      })
      .from(priseEnCharge)
      .innerJoin(referral, eq(priseEnCharge.referralId, referral.id))
      .where(and(
        gte(priseEnCharge.creeLe, depuis),
        sql`${priseEnCharge.premiereActionLe} IS NOT NULL`,
        !hasRole(ctx, 'super_admin') && ctx.structureId
          ? eq(priseEnCharge.structureId, ctx.structureId)
          : undefined
      ))

    // Urgences en cours (non terminées)
    const urgencesEnCours = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(referral)
      .where(and(
        or(eq(referral.priorite, 'haute'), eq(referral.priorite, 'critique')),
        sql`${referral.statut} NOT IN ('recontacte', 'echoue', 'refuse')`,
        structureFilter
      ))

    // Capacité structure
    let capaciteInfo = null
    if (ctx.structureId) {
      const structures = await db
        .select()
        .from(structure)
        .where(eq(structure.id, ctx.structureId))

      if (structures.length > 0) {
        const s = structures[0]
        const casActifs = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(priseEnCharge)
          .where(and(
            eq(priseEnCharge.structureId, ctx.structureId),
            sql`${priseEnCharge.statut} IN ('nouvelle', 'en_attente', 'prise_en_charge')`
          ))

        capaciteInfo = {
          max: s.capaciteMax,
          actifs: casActifs[0]?.count || 0,
          taux: Math.round(((casActifs[0]?.count || 0) / (s.capaciteMax ?? 50)) * 100),
        }
      }
    }

    // Formater les stats
    const demandes = totalDemandes[0]?.count || 0
    const prisesEnCharge = pecStats.reduce((sum, p) => sum + p.count, 0)
    const terminees = pecStats.find(p => p.statut === 'terminee')?.count || 0
    const abandonnees = pecStats.find(p => p.statut === 'abandonnee')?.count || 0
    const enCours = prisesEnCharge - terminees - abandonnees
    const tauxPriseEnCharge = demandes > 0 ? Math.round((prisesEnCharge / demandes) * 100) : 0

    return jsonSuccess({
      periode: periodeJours,
      kpis: {
        demandes,
        prisesEnCharge: enCours,
        terminees,
        abandonnees,
        tauxPriseEnCharge,
        tempsMoyenAttente: Math.round(tempsAttente[0]?.avgHeures || 0),
        urgencesEnCours: urgencesEnCours[0]?.count || 0,
        capacite: capaciteInfo,
      },
      repartitionUrgences: {
        normale: parPriorite.find(p => p.priorite === 'normale')?.count || 0,
        haute: parPriorite.find(p => p.priorite === 'haute')?.count || 0,
        critique: parPriorite.find(p => p.priorite === 'critique')?.count || 0,
      },
    })
  } catch (error) {
    console.error('[Dashboard Stats]', error)
    return jsonError('Erreur serveur', 500)
  }
}
