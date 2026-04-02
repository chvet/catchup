// GET /api/conseiller/admin/stats
// Dashboard multi-structure pour super_admin

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { referral, priseEnCharge, structure, conseiller } from '@/data/schema'
import { eq, and, gte, sql, or, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const ctx = await getConseillerFromHeaders()

    // Super admin uniquement
    if (!hasRole(ctx, 'super_admin')) {
      return jsonError('Accès refusé', 403)
    }

    const now = new Date()
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const il_y_a_30j = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const il_y_a_48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    const il_y_a_24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

    // === A. KPIs globaux ===

    // En attente (toutes structures)
    const enAttente = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(referral)
      .where(or(eq(referral.statut, 'en_attente'), eq(referral.statut, 'nouvelle')))

    // Prises en charge actives
    const prisesActives = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(priseEnCharge)
      .where(sql`${priseEnCharge.statut} IN ('nouvelle', 'en_attente', 'prise_en_charge')`)

    // Terminées ce mois
    const terminesCeMois = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(priseEnCharge)
      .where(and(
        eq(priseEnCharge.statut, 'terminee'),
        gte(priseEnCharge.termineeLe, debutMois)
      ))

    // Ruptures ce mois
    const rupturesCeMois = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(priseEnCharge)
      .where(and(
        eq(priseEnCharge.statut, 'abandonnee'),
        gte(priseEnCharge.misAJourLe, debutMois)
      ))

    // Temps d'attente moyen global (heures)
    const tempsAttenteMoyen = await db
      .select({
        avgHeures: sql<number>`AVG(
          EXTRACT(EPOCH FROM (${priseEnCharge.premiereActionLe}::timestamp - ${referral.creeLe}::timestamp)) / 3600
        )`,
      })
      .from(priseEnCharge)
      .innerJoin(referral, eq(priseEnCharge.referralId, referral.id))
      .where(sql`${priseEnCharge.premiereActionLe} IS NOT NULL`)

    // Taux de prise en charge global
    const totalReferrals = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(referral)

    const totalPrisEnCharge = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${priseEnCharge.referralId})` })
      .from(priseEnCharge)

    const totalRef = totalReferrals[0]?.count || 0
    const totalPec = totalPrisEnCharge[0]?.count || 0
    const tauxPriseEnCharge = totalRef > 0 ? Math.round((totalPec / totalRef) * 100) : 0

    // === B. Stats par structure ===

    const allStructures = await db
      .select()
      .from(structure)
      .where(eq(structure.actif, 1))

    const structureStats = await Promise.all(allStructures.map(async (s) => {
      // Conseillers actifs
      const conseillers = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(conseiller)
        .where(and(eq(conseiller.structureId, s.id), eq(conseiller.actif, 1)))

      // Cas en attente (referrals dirigés vers cette structure)
      const casEnAttente = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(referral)
        .where(and(
          eq(referral.structureSuggereId, s.id),
          or(eq(referral.statut, 'en_attente'), eq(referral.statut, 'nouvelle'))
        ))

      // Cas pris en charge (actifs)
      const casPrisEnCharge = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(priseEnCharge)
        .where(and(
          eq(priseEnCharge.structureId, s.id),
          sql`${priseEnCharge.statut} IN ('nouvelle', 'en_attente', 'prise_en_charge')`
        ))

      // Terminés ce mois
      const casTermines = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(priseEnCharge)
        .where(and(
          eq(priseEnCharge.structureId, s.id),
          eq(priseEnCharge.statut, 'terminee'),
          gte(priseEnCharge.termineeLe, debutMois)
        ))

      // Ruptures
      const casRupture = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(priseEnCharge)
        .where(and(
          eq(priseEnCharge.structureId, s.id),
          eq(priseEnCharge.statut, 'abandonnee'),
          gte(priseEnCharge.misAJourLe, debutMois)
        ))

      // Temps d'attente moyen par structure
      const tempsAttenteStruct = await db
        .select({
          avgHeures: sql<number>`AVG(
            EXTRACT(EPOCH FROM (${priseEnCharge.premiereActionLe}::timestamp - ${referral.creeLe}::timestamp)) / 3600
          )`,
        })
        .from(priseEnCharge)
        .innerJoin(referral, eq(priseEnCharge.referralId, referral.id))
        .where(and(
          eq(priseEnCharge.structureId, s.id),
          sql`${priseEnCharge.premiereActionLe} IS NOT NULL`
        ))

      // Derniere connexion d'un conseiller
      const derniereConnexion = await db
        .select({ derniere: conseiller.derniereConnexion })
        .from(conseiller)
        .where(and(eq(conseiller.structureId, s.id), eq(conseiller.actif, 1)))
        .orderBy(desc(conseiller.derniereConnexion))
        .limit(1)

      const totalStruct = casEnAttente[0]?.count + casPrisEnCharge[0]?.count
      const tauxStruct = totalStruct > 0
        ? Math.round((casPrisEnCharge[0]?.count / totalStruct) * 100)
        : 0

      // Départements de la structure (stockés en JSON)
      let departementsList: string[] = []
      try {
        departementsList = s.departements ? JSON.parse(s.departements) : []
      } catch {
        departementsList = s.departements ? [s.departements] : []
      }

      return {
        id: s.id,
        nom: s.nom,
        type: s.type,
        departements: departementsList,
        capaciteMax: s.capaciteMax ?? 50,
        conseillersActifs: conseillers[0]?.count || 0,
        casEnAttente: casEnAttente[0]?.count || 0,
        casPrisEnCharge: casPrisEnCharge[0]?.count || 0,
        casTermines: casTermines[0]?.count || 0,
        casRupture: casRupture[0]?.count || 0,
        tempsMoyenAttente: Math.round(tempsAttenteStruct[0]?.avgHeures || 0),
        tauxPriseEnCharge: tauxStruct,
        derniereConnexionConseiller: derniereConnexion[0]?.derniere || null,
      }
    }))

    // === C. Evolution des demandes sur 30 jours ===

    const evolutionJours = await db
      .select({
        jour: sql<string>`DATE(${referral.creeLe})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(referral)
      .where(gte(referral.creeLe, il_y_a_30j))
      .groupBy(sql`DATE(${referral.creeLe})`)
      .orderBy(sql`DATE(${referral.creeLe})`)

    // Repartition globale des statuts referral
    const repartitionStatuts = await db
      .select({
        statut: referral.statut,
        count: sql<number>`COUNT(*)`,
      })
      .from(referral)
      .groupBy(referral.statut)

    // Repartition statuts PEC (pour le stacked bar)
    const repartitionPecParStructure = await db
      .select({
        structureId: priseEnCharge.structureId,
        statut: priseEnCharge.statut,
        count: sql<number>`COUNT(*)`,
      })
      .from(priseEnCharge)
      .groupBy(priseEnCharge.structureId, priseEnCharge.statut)

    // === D. Alertes ===

    // Structures avec > 5 en attente
    const structuresEnAlerte = structureStats
      .filter(s => s.casEnAttente > 5)
      .map(s => ({ id: s.id, nom: s.nom, casEnAttente: s.casEnAttente }))

    // Beneficiaires en attente > 48h
    const enAttente48h = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(referral)
      .where(and(
        or(eq(referral.statut, 'en_attente'), eq(referral.statut, 'nouvelle')),
        sql`${referral.creeLe} < ${il_y_a_48h}`
      ))

    // Structures sans conseiller connecte depuis 24h
    const structuresSansConnexion = structureStats
      .filter(s => {
        if (!s.derniereConnexionConseiller) return true
        return s.derniereConnexionConseiller < il_y_a_24h
      })
      .map(s => ({ id: s.id, nom: s.nom, derniereConnexion: s.derniereConnexionConseiller }))

    // Construire les données du stacked bar chart
    const barChartData = structureStats.map(s => {
      const pecStruct = repartitionPecParStructure.filter(p => p.structureId === s.id)
      return {
        nom: s.nom.length > 20 ? s.nom.substring(0, 18) + '...' : s.nom,
        en_attente: s.casEnAttente,
        prise_en_charge: pecStruct.filter(p => ['nouvelle', 'en_attente', 'prise_en_charge'].includes(p.statut || '')).reduce((sum, p) => sum + p.count, 0),
        terminee: pecStruct.filter(p => p.statut === 'terminee').reduce((sum, p) => sum + p.count, 0),
        rupture: pecStruct.filter(p => p.statut === 'abandonnee').reduce((sum, p) => sum + p.count, 0),
      }
    })

    return jsonSuccess({
      kpis: {
        enAttente: enAttente[0]?.count || 0,
        prisesActives: prisesActives[0]?.count || 0,
        terminesCeMois: terminesCeMois[0]?.count || 0,
        rupturesCeMois: rupturesCeMois[0]?.count || 0,
        tempsMoyenAttente: Math.round(tempsAttenteMoyen[0]?.avgHeures || 0),
        tauxPriseEnCharge,
      },
      structures: structureStats,
      barChartData,
      evolutionJours,
      repartitionStatuts,
      alertes: {
        structuresEnAlerte,
        enAttente48h: enAttente48h[0]?.count || 0,
        structuresSansConnexion,
      },
    })
  } catch (error) {
    console.error('[Admin Stats]', error)
    return jsonError('Erreur serveur', 500)
  }
}
