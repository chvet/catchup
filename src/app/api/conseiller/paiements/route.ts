// GET /api/conseiller/paiements
// Liste des paiements pour la structure du conseiller

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { paiement, acceptationTarif, tarification, utilisateur, referral } from '@/data/schema'
import { eq, and, desc, sql } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.structureId) return jsonError('Structure manquante', 400)

    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50)
    const offset = parseInt(searchParams.get('offset') || '0')

    // Requête jointe : paiement → acceptationTarif → tarification + utilisateur
    const paiements = await db
      .select({
        id: paiement.id,
        montantCentimes: paiement.montantCentimes,
        devise: paiement.devise,
        statut: paiement.statut,
        methode: paiement.methode,
        recuUrl: paiement.recuUrl,
        paieLe: paiement.paieLe,
        creeLe: paiement.creeLe,
        tarifLibelle: tarification.libelle,
        beneficiairePrenom: utilisateur.prenom,
        beneficiaireEmail: utilisateur.email,
      })
      .from(paiement)
      .innerJoin(acceptationTarif, eq(paiement.acceptationTarifId, acceptationTarif.id))
      .innerJoin(tarification, eq(acceptationTarif.tarificationId, tarification.id))
      .innerJoin(referral, eq(acceptationTarif.referralId, referral.id))
      .innerJoin(utilisateur, eq(referral.utilisateurId, utilisateur.id))
      .where(eq(acceptationTarif.structureId, ctx.structureId))
      .orderBy(desc(paiement.creeLe))
      .limit(limit)
      .offset(offset)

    // Total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(paiement)
      .innerJoin(acceptationTarif, eq(paiement.acceptationTarifId, acceptationTarif.id))
      .where(eq(acceptationTarif.structureId, ctx.structureId))

    return jsonSuccess({
      data: paiements,
      total: countResult[0]?.count ?? 0,
    })
  } catch (error) {
    console.error('[Paiements GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}
