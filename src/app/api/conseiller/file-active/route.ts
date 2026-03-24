// GET /api/conseiller/file-active
// Règles de visibilité :
// - Tous les cas en_attente / nouvelle → visibles par tous les conseillers
// - Mes propres prises en charge → toujours visibles
// - Cas de ma structure → visibles avec filtre ?scope=structure
// - Super admin → tout visible

import { getConseillerFromHeaders, hasRole, jsonError } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { referral, utilisateur, profilRiasec, priseEnCharge } from '@/data/schema'
import { eq, and, or, desc, sql, inArray } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    const url = new URL(request.url)

    // Filtres
    const statut = url.searchParams.get('statut')
    const urgence = url.searchParams.get('urgence')
    const scope = url.searchParams.get('scope') || 'default' // default | structure | all
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
        motif: referral.motif,
        moyenContact: referral.moyenContact,
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

    // Ajouter les infos de prise en charge
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

        return {
          ...r,
          priseEnCharge: pec,
          isMine: pec?.conseillerId === ctx.id,
          attente: {
            heures: attenteHeures,
            label: attenteLabel,
          },
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
