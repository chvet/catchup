// GET /api/conseiller/dashboard/stats
// KPIs agrégés pour le dashboard — structure-filtered

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { referral, priseEnCharge, structure, enqueteSatisfaction, evenementJournal, conseiller as conseillerTable } from '@/data/schema'
import { eq, and, gte, sql, or, desc } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    const url = new URL(request.url)

    // Période (en jours)
    const periodeJours = parseInt(url.searchParams.get('periode') || '30')
    const depuis = new Date(Date.now() - periodeJours * 24 * 60 * 60 * 1000).toISOString()

    // Début du mois courant
    const now = new Date()
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    // Filtre structure
    const isSuperAdmin = hasRole(ctx, 'super_admin')
    const structureFilter = isSuperAdmin
      ? undefined
      : ctx.structureId
        ? or(
            eq(referral.structureSuggereId, ctx.structureId),
            sql`${referral.structureSuggereId} IS NULL`
          )
        : undefined

    const pecStructureFilter = !isSuperAdmin && ctx.structureId
      ? eq(priseEnCharge.structureId, ctx.structureId)
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
      pecStructureFilter
    )

    const pecStats = await db
      .select({
        statut: priseEnCharge.statut,
        count: sql<number>`COUNT(*)`,
      })
      .from(priseEnCharge)
      .where(pecWhere)
      .groupBy(priseEnCharge.statut)

    // Mes accompagnements actifs (pour le conseiller connecté)
    const mesAccompagnements = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(priseEnCharge)
      .where(and(
        eq(priseEnCharge.conseillerId, ctx.id),
        sql`${priseEnCharge.statut} IN ('nouvelle', 'en_attente', 'prise_en_charge')`
      ))

    // Cas terminés ce mois
    const terminesCeMois = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(priseEnCharge)
      .where(and(
        gte(priseEnCharge.termineeLe, debutMois),
        eq(priseEnCharge.statut, 'terminee'),
        pecStructureFilter
      ))

    // Temps d'attente moyen (en heures)
    const tempsAttente = await db
      .select({
        avgHeures: sql<number>`AVG(
          EXTRACT(EPOCH FROM (${priseEnCharge.premiereActionLe}::timestamp - ${referral.creeLe}::timestamp)) / 3600
        )`,
      })
      .from(priseEnCharge)
      .innerJoin(referral, eq(priseEnCharge.referralId, referral.id))
      .where(and(
        gte(priseEnCharge.creeLe, depuis),
        sql`${priseEnCharge.premiereActionLe} IS NOT NULL`,
        pecStructureFilter
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

    // === Répartition par statut (pour bar chart) ===
    const enAttenteCount = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(referral)
      .where(and(
        sql`${referral.statut} IN ('en_attente', 'nouvelle')`,
        structureFilter
      ))

    const repartitionStatut = [
      { statut: 'en_attente', count: enAttenteCount[0]?.count || 0 },
      ...(pecStats.map(p => ({ statut: p.statut || 'inconnu', count: p.count })))
    ]

    // === Evolution 30 derniers jours ===
    const evolution30j = await db
      .select({
        date: sql<string>`DATE(${referral.creeLe})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(referral)
      .where(and(
        gte(referral.creeLe, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        structureFilter
      ))
      .groupBy(sql`DATE(${referral.creeLe})`)
      .orderBy(sql`DATE(${referral.creeLe})`)

    // Remplir les jours manquants
    const evolutionMap = new Map(evolution30j.map(e => [e.date, e.count]))
    const evolutionComplete: { date: string; count: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().split('T')[0]
      evolutionComplete.push({ date: dateStr, count: evolutionMap.get(dateStr) || 0 })
    }

    // === Satisfaction moyenne (NPS) ===
    let satisfactionMoyenne: number | null = null
    try {
      const satResult = await db
        .select({
          avg: sql<number>`AVG(${enqueteSatisfaction.noteRecommandation})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(enqueteSatisfaction)
        .innerJoin(priseEnCharge, eq(enqueteSatisfaction.priseEnChargeId, priseEnCharge.id))
        .where(and(
          eq(enqueteSatisfaction.completee, 1),
          pecStructureFilter
        ))

      if (satResult[0]?.count > 0) {
        satisfactionMoyenne = Math.round((satResult[0].avg || 0) * 10) / 10
      }
    } catch {
      // Table might not exist yet
    }

    // === Activité récente (5 derniers événements) ===
    let recentActivity: { type: string; resume: string | null; acteurType: string; horodatage: string }[] = []
    try {
      if (ctx.structureId && !isSuperAdmin) {
        // Get PEC IDs for the structure
        const pecIds = await db
          .select({ id: priseEnCharge.id })
          .from(priseEnCharge)
          .where(eq(priseEnCharge.structureId, ctx.structureId))

        if (pecIds.length > 0) {
          const ids = pecIds.map(p => `'${p.id}'`).join(',')
          recentActivity = await db
            .select({
              type: evenementJournal.type,
              resume: evenementJournal.resume,
              acteurType: evenementJournal.acteurType,
              horodatage: evenementJournal.horodatage,
            })
            .from(evenementJournal)
            .where(sql`${evenementJournal.priseEnChargeId} IN (${sql.raw(ids)})`)
            .orderBy(desc(evenementJournal.horodatage))
            .limit(5)
        }
      } else if (isSuperAdmin) {
        recentActivity = await db
          .select({
            type: evenementJournal.type,
            resume: evenementJournal.resume,
            acteurType: evenementJournal.acteurType,
            horodatage: evenementJournal.horodatage,
          })
          .from(evenementJournal)
          .orderBy(desc(evenementJournal.horodatage))
          .limit(5)
      } else {
        // Regular conseiller: own PECs
        const myPecIds = await db
          .select({ id: priseEnCharge.id })
          .from(priseEnCharge)
          .where(eq(priseEnCharge.conseillerId, ctx.id))

        if (myPecIds.length > 0) {
          const ids = myPecIds.map(p => `'${p.id}'`).join(',')
          recentActivity = await db
            .select({
              type: evenementJournal.type,
              resume: evenementJournal.resume,
              acteurType: evenementJournal.acteurType,
              horodatage: evenementJournal.horodatage,
            })
            .from(evenementJournal)
            .where(sql`${evenementJournal.priseEnChargeId} IN (${sql.raw(ids)})`)
            .orderBy(desc(evenementJournal.horodatage))
            .limit(5)
        }
      }
    } catch {
      // Journal table might not exist yet
    }

    // Fallback: if no journal events, use recent referral changes
    if (recentActivity.length === 0) {
      try {
        const recentReferrals = await db
          .select({
            statut: referral.statut,
            priorite: referral.priorite,
            creeLe: referral.creeLe,
            misAJourLe: referral.misAJourLe,
          })
          .from(referral)
          .where(structureFilter)
          .orderBy(desc(referral.misAJourLe))
          .limit(5)

        recentActivity = recentReferrals.map(r => ({
          type: r.statut === 'en_attente' ? 'nouvelle_demande' : `statut_${r.statut}`,
          resume: r.statut === 'en_attente'
            ? `Nouvelle demande (priorité ${r.priorite})`
            : `Demande passée en ${r.statut}`,
          acteurType: 'systeme',
          horodatage: r.misAJourLe,
        }))
      } catch {
        // Ignore
      }
    }

    // Formater les stats
    const demandes = totalDemandes[0]?.count || 0
    const prisesEnCharge = pecStats.reduce((sum, p) => sum + p.count, 0)
    const terminees = pecStats.find(p => p.statut === 'terminee')?.count || 0
    const abandonnees = pecStats.find(p => p.statut === 'abandonnee')?.count || 0
    const ruptures = pecStats.find(p => p.statut === 'rupture')?.count || abandonnees
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
        // New KPIs
        mesAccompagnementsActifs: mesAccompagnements[0]?.count || 0,
        terminesCeMois: terminesCeMois[0]?.count || 0,
        satisfactionMoyenne,
        enAttente: enAttenteCount[0]?.count || 0,
      },
      repartitionUrgences: {
        normale: parPriorite.find(p => p.priorite === 'normale')?.count || 0,
        haute: parPriorite.find(p => p.priorite === 'haute')?.count || 0,
        critique: parPriorite.find(p => p.priorite === 'critique')?.count || 0,
      },
      // New data for charts
      repartitionStatut,
      evolution30j: evolutionComplete,
      recentActivity,
    })
  } catch (error) {
    console.error('[Dashboard Stats]', error)
    return jsonError('Erreur serveur', 500)
  }
}
