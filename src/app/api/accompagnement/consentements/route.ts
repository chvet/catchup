// GET /api/accompagnement/consentements
// Liste les demandes de consentement en attente pour le bénéficiaire

import { getBeneficiaireFromToken } from '@/lib/accompagnement-helpers'
import { db } from '@/data/db'
import { demandeConsentement, tiersIntervenant } from '@/data/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(request: Request) {
  try {
    const auth = await getBeneficiaireFromToken(request)
    if (!auth) {
      return Response.json({ error: 'Non autorisé' }, { status: 401 })
    }

    // Récupérer les demandes de consentement en attente pour cette prise en charge
    const consentements = await db
      .select()
      .from(demandeConsentement)
      .where(and(
        eq(demandeConsentement.priseEnChargeId, auth.priseEnChargeId),
        eq(demandeConsentement.statut, 'en_attente')
      ))

    // Enrichir avec les infos du tiers
    const result = await Promise.all(
      consentements.map(async (c) => {
        const tiersRows = await db
          .select()
          .from(tiersIntervenant)
          .where(eq(tiersIntervenant.id, c.tiersId))

        const tiers = tiersRows.length > 0 ? tiersRows[0] : null

        return {
          id: c.id,
          tiersId: c.tiersId,
          tiersNom: tiers?.nom ?? null,
          tiersPrenom: tiers?.prenom ?? null,
          tiersRole: tiers?.role ?? null,
          conseillerApprouve: c.conseillerApprouve,
          creeLe: c.creeLe,
        }
      })
    )

    return Response.json({ consentements: result })
  } catch (error) {
    console.error('[Consentements GET]', error)
    return Response.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
