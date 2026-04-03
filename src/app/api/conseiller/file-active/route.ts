// GET /api/conseiller/file-active
// Règles de visibilité :
// - Tous les cas en_attente / nouvelle → visibles par tous les conseillers
// - Mes propres prises en charge → toujours visibles
// - Cas de ma structure → visibles avec filtre ?scope=structure
// - Super admin → tout visible
// Filtre source :
// - source=sourcee → cas envoyés à ma structure (structureSuggereId = ma structure)
// - source=generique → cas génériques (source = 'generique')
// - source=tous → pas de filtre source (défaut)

import { getConseillerFromHeaders, hasRole, jsonError } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { referral, utilisateur, profilRiasec, priseEnCharge, structure } from '@/data/schema'
import { eq, and, or, desc, sql, inArray } from 'drizzle-orm'
import { matcherStructures, type MatchingCriteria, type StructureData } from '@/core/matching'

export async function GET(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    const url = new URL(request.url)

    // Filtres
    const statut = url.searchParams.get('statut')
    const urgence = url.searchParams.get('urgence')
    const scope = url.searchParams.get('scope') || 'default' // default | structure | all
    const sourceFilter = url.searchParams.get('source') || 'tous' // sourcee | generique | tous
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // ── Construire les conditions de visibilité ──
    const conditions = []

    if (hasRole(ctx, 'super_admin')) {
      // Super admin voit tout — pas de filtre de visibilité
    } else {
      // Règle : le conseiller voit :
      // 1. Tous les cas en attente (pas encore pris en charge)
      // 2. Ses propres prises en charge
      // 3. (optionnel) Les cas de sa structure

      if (scope === 'structure' && ctx.structureId) {
        // Vue "Ma structure" : tous les cas liés à ma structure
        conditions.push(
          or(
            // Cas en attente (tous)
            inArray(referral.statut, ['en_attente', 'nouvelle']),
            // Cas pris en charge par un conseiller de ma structure
            sql`${referral.id} IN (
              SELECT ${priseEnCharge.referralId} FROM ${priseEnCharge}
              WHERE ${priseEnCharge.structureId} = ${ctx.structureId}
            )`,
            // Cas suggérés à ma structure
            eq(referral.structureSuggereId, ctx.structureId!)
          )
        )
      } else {
        // Vue par défaut : cas en attente + mes propres cas
        conditions.push(
          or(
            // Tous les cas en attente (file active globale)
            inArray(referral.statut, ['en_attente', 'nouvelle']),
            // Mes propres prises en charge (quel que soit le statut)
            sql`${referral.id} IN (
              SELECT ${priseEnCharge.referralId} FROM ${priseEnCharge}
              WHERE ${priseEnCharge.conseillerId} = ${ctx.id}
            )`
          )
        )
      }
    }

    // Filtre source (double file active)
    if (sourceFilter === 'sourcee' && ctx.structureId) {
      conditions.push(eq(referral.source, 'sourcee'))
      conditions.push(eq(referral.structureSuggereId, ctx.structureId))
    } else if (sourceFilter === 'generique') {
      conditions.push(eq(referral.source, 'generique'))
    }
    // source=tous → pas de filtre supplémentaire

    // Exclure les annulés sauf si filtre explicite
    if (!statut || statut !== 'annulee') {
      conditions.push(sql`${referral.statut} != 'annulee'`)
    }

    // Filtre statut
    if (statut) {
      conditions.push(eq(referral.statut, statut))
    }

    // Filtre urgence
    if (urgence) {
      conditions.push(eq(referral.priorite, urgence))
    }

    const whereClause = conditions.length > 0
      ? and(...conditions)
      : undefined

    // Récupérer les referrals avec profil et utilisateur
    const referrals = await db
      .select({
        id: referral.id,
        prenom: utilisateur.prenom,
        age: referral.ageBeneficiaire,
        genre: referral.genre,
        localisation: referral.localisation,
        priorite: referral.priorite,
        niveauDetection: referral.niveauDetection,
        statut: referral.statut,
        source: referral.source,
        motif: referral.motif,
        moyenContact: referral.moyenContact,
        campagneId: referral.campagneId,
        creeLe: referral.creeLe,
        // Profil RIASEC
        r: profilRiasec.r,
        i: profilRiasec.i,
        a: profilRiasec.a,
        s: profilRiasec.s,
        e: profilRiasec.e,
        c: profilRiasec.c,
        dimensionsDominantes: profilRiasec.dimensionsDominantes,
      })
      .from(referral)
      .leftJoin(utilisateur, eq(referral.utilisateurId, utilisateur.id))
      .leftJoin(profilRiasec, eq(referral.utilisateurId, profilRiasec.utilisateurId))
      .where(whereClause)
      .orderBy(
        // Mes propres PEC en premier (pour que "Mes accompagnements" les trouve toujours)
        sql`CASE WHEN ${referral.id} IN (
          SELECT ${priseEnCharge.referralId} FROM ${priseEnCharge}
          WHERE ${priseEnCharge.conseillerId} = ${ctx.id}
          AND ${priseEnCharge.statut} = 'prise_en_charge'
        ) THEN 0 ELSE 1 END`,
        sql`CASE ${referral.priorite}
          WHEN 'critique' THEN 0
          WHEN 'haute' THEN 1
          ELSE 2
        END`,
        desc(referral.creeLe)
      )
      .limit(limit)
      .offset(offset)

    // Compter le total
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(referral)
      .where(whereClause)

    const total = countResult[0]?.count || 0

    // ── Charger la structure du conseiller pour le matching ──
    let conseillerStructureData: StructureData | null = null
    if (ctx.structureId) {
      const structRows = await db
        .select()
        .from(structure)
        .where(eq(structure.id, ctx.structureId))
        .limit(1)

      if (structRows.length > 0) {
        const s = structRows[0]
        // Compter les cas actifs de la structure
        const casActifsResult = await db
          .select({ count: sql<number>`count(*)` })
          .from(priseEnCharge)
          .where(
            and(
              eq(priseEnCharge.structureId, s.id),
              sql`${priseEnCharge.statut} NOT IN ('terminee', 'annulee')`
            )
          )

        conseillerStructureData = {
          id: s.id,
          nom: s.nom,
          departements: JSON.parse(s.departements || '[]'),
          regions: JSON.parse(s.regions || '[]'),
          ageMin: s.ageMin ?? 16,
          ageMax: s.ageMax ?? 25,
          specialites: JSON.parse(s.specialites || '[]'),
          genrePreference: s.genrePreference ?? null,
          capaciteMax: s.capaciteMax ?? 50,
          casActifs: casActifsResult[0]?.count ?? 0,
          actif: true,
        }
      }
    }

    // Ajouter les infos de prise en charge + matching
    const enriched = await Promise.all(
      referrals.map(async (r) => {
        const pecs = await db
          .select({
            id: priseEnCharge.id,
            statut: priseEnCharge.statut,
            conseillerId: priseEnCharge.conseillerId,
            premiereActionLe: priseEnCharge.premiereActionLe,
          })
          .from(priseEnCharge)
          .where(eq(priseEnCharge.referralId, r.id))

        const pec = pecs[0] || null

        // Calcul du temps d'attente
        const attenteMs = Date.now() - new Date(r.creeLe).getTime()
        const attenteHeures = Math.round(attenteMs / (1000 * 60 * 60))
        const attenteLabel = attenteHeures < 1
          ? '< 1h'
          : attenteHeures < 24
            ? `${attenteHeures}h`
            : `${Math.round(attenteHeures / 24)}j`

        // ── Matching avec la structure du conseiller ──
        let matchScore = 0
        let horsChamp = false
        let raisonsHorsChamp: string[] = []
        let raisonsMatch: string[] = []

        if (conseillerStructureData) {
          const riasecDominant: string[] = r.dimensionsDominantes
            ? JSON.parse(r.dimensionsDominantes)
            : []

          const matchingCriteria: MatchingCriteria = {
            age: r.age ?? null,
            genre: r.genre ?? null,
            departement: r.localisation ?? null,
            situation: null,
            riasecDominant,
            urgence: r.priorite === 'critique' ? 'critique' : r.priorite === 'haute' ? 'haute' : 'normale',
            fragilite: r.niveauDetection >= 3 ? 'high' : r.niveauDetection >= 2 ? 'medium' : r.niveauDetection >= 1 ? 'low' : 'none',
          }

          const matchResults = matcherStructures(matchingCriteria, [conseillerStructureData])

          if (matchResults.length > 0) {
            matchScore = matchResults[0].score
            raisonsMatch = matchResults[0].raisons
          } else {
            // Structure eliminated by filters
            horsChamp = true
            // Determine why
            if (r.localisation && !conseillerStructureData.departements.includes(r.localisation)) {
              raisonsHorsChamp.push('hors zone géographique')
            }
            if (r.age !== null) {
              if (r.age < conseillerStructureData.ageMin - 2 || r.age > conseillerStructureData.ageMax + 2) {
                raisonsHorsChamp.push('hors tranche d\'âge')
              }
            }
            if (matchingCriteria.urgence !== 'critique' && conseillerStructureData.casActifs >= conseillerStructureData.capaciteMax) {
              raisonsHorsChamp.push('capacité maximale atteinte')
            }
            if (raisonsHorsChamp.length === 0) {
              raisonsHorsChamp.push('critères éliminatoires non remplis')
            }
          }
        }

        return {
          ...r,
          priseEnCharge: pec,
          isMine: pec?.conseillerId === ctx.id,
          attente: {
            heures: attenteHeures,
            label: attenteLabel,
          },
          matchScore,
          horsChamp,
          raisonsHorsChamp,
          raisonsMatch,
        }
      })
    )

    return Response.json({
      data: enriched,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[File Active]', error)
    return jsonError('Erreur serveur', 500)
  }
}
