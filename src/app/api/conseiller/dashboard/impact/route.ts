// GET /api/conseiller/dashboard/impact
// Tableau de bord Indicateurs d'insertion
// KPI compatibles réglementation européenne (annexe I règlement 2021/1057)

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { referral, priseEnCharge, utilisateur, messageDirect } from '@/data/schema'
import { eq, and, sql, gte } from 'drizzle-orm'

export async function GET() {
  try {
    const ctx = await getConseillerFromHeaders()

    // Filtre par structure (sauf super_admin qui voit tout)
    const structureFilter = hasRole(ctx, 'super_admin')
      ? sql`1=1`
      : eq(priseEnCharge.structureId, ctx.structureId!)

    // === 1. File active ===
    const fileActive = await db.select({ count: sql<number>`COUNT(*)` }).from(priseEnCharge)
      .where(and(structureFilter, sql`${priseEnCharge.statut} NOT IN ('terminee', 'annulee', 'abandonnee')`))

    // === 2. Sorties positives / total sorties ===
    const sortiesPositives = await db.select({ count: sql<number>`COUNT(*)` }).from(priseEnCharge)
      .where(and(structureFilter, eq(priseEnCharge.sortiePositive, 1)))

    const sortiesTotal = await db.select({ count: sql<number>`COUNT(*)` }).from(priseEnCharge)
      .where(and(structureFilter, sql`${priseEnCharge.statut} IN ('terminee', 'abandonnee')`))

    const tauxSortiePositive = sortiesTotal[0]?.count > 0
      ? Math.round((sortiesPositives[0]?.count / sortiesTotal[0]?.count) * 100)
      : 0

    // === 3. Répartition par genre ===
    const parGenre = await db.select({
      genre: utilisateur.genre,
      count: sql<number>`COUNT(*)`,
    }).from(priseEnCharge)
      .innerJoin(referral, eq(priseEnCharge.referralId, referral.id))
      .innerJoin(utilisateur, eq(referral.utilisateurId, utilisateur.id))
      .where(structureFilter)
      .groupBy(utilisateur.genre)

    // === 4. Répartition par tranche d'âge ===
    const parAge = await db.select({
      tranche: sql<string>`CASE
        WHEN ${utilisateur.age} < 18 THEN 'moins_18'
        WHEN ${utilisateur.age} BETWEEN 18 AND 25 THEN '18_25'
        WHEN ${utilisateur.age} BETWEEN 26 AND 45 THEN '26_45'
        WHEN ${utilisateur.age} > 45 THEN 'plus_45'
        ELSE 'inconnu'
      END`,
      count: sql<number>`COUNT(*)`,
    }).from(priseEnCharge)
      .innerJoin(referral, eq(priseEnCharge.referralId, referral.id))
      .innerJoin(utilisateur, eq(referral.utilisateurId, utilisateur.id))
      .where(structureFilter)
      .groupBy(sql`1`)

    // === 5. Répartition par niveau de qualification ===
    const parQualification = await db.select({
      niveau: utilisateur.niveauQualification,
      count: sql<number>`COUNT(*)`,
    }).from(priseEnCharge)
      .innerJoin(referral, eq(priseEnCharge.referralId, referral.id))
      .innerJoin(utilisateur, eq(referral.utilisateurId, utilisateur.id))
      .where(structureFilter)
      .groupBy(utilisateur.niveauQualification)

    // === 6. Répartition par situation marché emploi ===
    const parSituation = await db.select({
      situation: utilisateur.situationMarcheEmploi,
      count: sql<number>`COUNT(*)`,
    }).from(priseEnCharge)
      .innerJoin(referral, eq(priseEnCharge.referralId, referral.id))
      .innerJoin(utilisateur, eq(referral.utilisateurId, utilisateur.id))
      .where(structureFilter)
      .groupBy(utilisateur.situationMarcheEmploi)

    // === 7. Répartition par type de sortie ===
    const parTypeSortie = await db.select({
      type: priseEnCharge.typeSortie,
      count: sql<number>`COUNT(*)`,
    }).from(priseEnCharge)
      .where(and(structureFilter, sql`${priseEnCharge.typeSortie} IS NOT NULL`))
      .groupBy(priseEnCharge.typeSortie)

    // === 8. Répartition par type de contrat ===
    const parTypeContrat = await db.select({
      type: priseEnCharge.typeContrat,
      count: sql<number>`COUNT(*)`,
    }).from(priseEnCharge)
      .where(and(structureFilter, sql`${priseEnCharge.typeContrat} IS NOT NULL`))
      .groupBy(priseEnCharge.typeContrat)

    // === 9. Moyenne entretiens par participant ===
    const moyenneEntretiens = await db.select({
      avg: sql<number>`COALESCE(AVG(${priseEnCharge.nbEntretiens}), 0)`,
    }).from(priseEnCharge)
      .where(and(structureFilter, sql`${priseEnCharge.statut} NOT IN ('annulee')`))

    // === 10. Moyenne messages par accompagnement ===
    const moyenneMessages = await db.select({
      avg: sql<number>`COALESCE(AVG(msg_count), 0)`,
    }).from(sql`(
      SELECT ${priseEnCharge.id}, COUNT(${messageDirect.id}) as msg_count
      FROM ${priseEnCharge}
      LEFT JOIN ${messageDirect} ON ${messageDirect.priseEnChargeId} = ${priseEnCharge.id}
      WHERE ${structureFilter}
      GROUP BY ${priseEnCharge.id}
    ) sub`)

    // === 11. Publics spécifiques ===
    const handicap = await db.select({ count: sql<number>`COUNT(*)` }).from(priseEnCharge)
      .innerJoin(referral, eq(priseEnCharge.referralId, referral.id))
      .innerJoin(utilisateur, eq(referral.utilisateurId, utilisateur.id))
      .where(and(structureFilter, eq(utilisateur.handicap, 1)))

    const rsa = await db.select({ count: sql<number>`COUNT(*)` }).from(priseEnCharge)
      .innerJoin(referral, eq(priseEnCharge.referralId, referral.id))
      .innerJoin(utilisateur, eq(referral.utilisateurId, utilisateur.id))
      .where(and(structureFilter, eq(utilisateur.allocataireRsa, 1)))

    const qpv = await db.select({ count: sql<number>`COUNT(*)` }).from(priseEnCharge)
      .innerJoin(referral, eq(priseEnCharge.referralId, referral.id))
      .innerJoin(utilisateur, eq(referral.utilisateurId, utilisateur.id))
      .where(and(structureFilter, eq(utilisateur.quartierPrioritaire, 1)))

    // === 12. Délai moyen prise en charge ===
    const delaiMoyen = await db.select({
      avg: sql<number>`COALESCE(AVG(
        EXTRACT(EPOCH FROM (${priseEnCharge.premiereActionLe}::timestamp - ${referral.creeLe}::timestamp)) / 3600
      ), 0)`,
    }).from(priseEnCharge)
      .innerJoin(referral, eq(priseEnCharge.referralId, referral.id))
      .where(and(structureFilter, sql`${priseEnCharge.premiereActionLe} IS NOT NULL`))

    // === 13. Suivi J+30 ===
    const suiviJ30Fait = await db.select({ count: sql<number>`COUNT(*)` }).from(priseEnCharge)
      .where(and(structureFilter, sql`${priseEnCharge.dateSuiviSortie} IS NOT NULL`))

    const suiviJ30EnAttente = await db.select({ count: sql<number>`COUNT(*)` }).from(priseEnCharge)
      .where(and(
        structureFilter,
        sql`${priseEnCharge.statut} = 'terminee'`,
        sql`${priseEnCharge.dateSuiviSortie} IS NULL`
      ))

    return jsonSuccess({
      fileActive: fileActive[0]?.count ?? 0,
      sorties: {
        positives: sortiesPositives[0]?.count ?? 0,
        total: sortiesTotal[0]?.count ?? 0,
        tauxPositif: tauxSortiePositive,
      },
      repartition: {
        genre: parGenre,
        age: parAge,
        qualification: parQualification,
        situation: parSituation,
        typeSortie: parTypeSortie,
        typeContrat: parTypeContrat,
      },
      moyennes: {
        entretiensParParticipant: Math.round((moyenneEntretiens[0]?.avg ?? 0) * 10) / 10,
        messagesParAccompagnement: Math.round((moyenneMessages[0]?.avg ?? 0) * 10) / 10,
        delaiPriseEnChargeHeures: Math.round(delaiMoyen[0]?.avg ?? 0),
      },
      publicsSpecifiques: {
        handicap: handicap[0]?.count ?? 0,
        allocatairesRsa: rsa[0]?.count ?? 0,
        quartiersPrioritaires: qpv[0]?.count ?? 0,
      },
      suiviSortie: {
        fait: suiviJ30Fait[0]?.count ?? 0,
        enAttente: suiviJ30EnAttente[0]?.count ?? 0,
      },
    })
  } catch (error) {
    console.error('[Dashboard Impact]', error)
    return jsonError('Erreur serveur', 500)
  }
}
