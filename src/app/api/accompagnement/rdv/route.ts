// GET /api/accompagnement/rdv — Liste des RDV futurs du bénéficiaire authentifié

import { getBeneficiaireFromToken } from '@/lib/accompagnement-helpers'
import { db } from '@/data/db'
import { rendezVous, priseEnCharge, conseiller } from '@/data/schema'
import { eq, and, gte, asc } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const beneficiaire = await getBeneficiaireFromToken(request)
    if (!beneficiaire) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    const now = new Date().toISOString()

    // Récupérer les RDV futurs liés à la prise en charge du bénéficiaire
    const rdvs = await db
      .select()
      .from(rendezVous)
      .where(
        and(
          eq(rendezVous.priseEnChargeId, beneficiaire.priseEnChargeId),
          gte(rendezVous.dateHeure, now)
        )
      )
      .orderBy(asc(rendezVous.dateHeure))

    // Récupérer les infos du conseiller référent
    const pecs = await db
      .select({ conseillerId: priseEnCharge.conseillerId })
      .from(priseEnCharge)
      .where(eq(priseEnCharge.id, beneficiaire.priseEnChargeId))

    let conseillerPrenom: string | null = null
    if (pecs.length > 0) {
      const conseillers = await db
        .select({ prenom: conseiller.prenom })
        .from(conseiller)
        .where(eq(conseiller.id, pecs[0].conseillerId))

      conseillerPrenom = conseillers[0]?.prenom || null
    }

    const enriched = rdvs.map(rdv => ({
      id: rdv.id,
      titre: rdv.titre,
      dateHeure: rdv.dateHeure,
      dureeMinutes: rdv.dureeMinutes,
      lieu: rdv.lieu,
      lienVisio: rdv.lienVisio,
      statut: rdv.statut,
      conseiller: { prenom: conseillerPrenom },
    }))

    return Response.json({ rdvs: enriched })
  } catch (error) {
    console.error('[Accompagnement RDV GET]', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
