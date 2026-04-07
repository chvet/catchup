// GET /api/conseiller/abonnement
// Mon abonnement + usage (admin_structure)

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { abonnement, usageStructure } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { getCustomerInvoices } from '@/lib/stripe'

export async function GET(_request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!ctx.structureId) return jsonError('Structure manquante', 400)

    const abos = await db.select().from(abonnement)
      .where(and(eq(abonnement.structureId, ctx.structureId), eq(abonnement.statut, 'active')))
      .limit(1)

    if (abos.length === 0) {
      return jsonSuccess({ abonnement: null, usage: null, factures: [] })
    }

    const abo = abos[0]
    const mois = new Date().toISOString().slice(0, 7)

    const usage = await db.select().from(usageStructure)
      .where(and(eq(usageStructure.structureId, ctx.structureId), eq(usageStructure.mois, mois)))
      .limit(1)

    const u = usage[0] || { conversationsIa: 0, smsEnvoyes: 0, beneficiairesActifs: 0, conseillersActifs: 0 }

    // Factures Stripe
    let factures: unknown[] = []
    if (abo.stripeCustomerId) {
      try {
        factures = await getCustomerInvoices(abo.stripeCustomerId, 10)
      } catch { /* ignore */ }
    }

    return jsonSuccess({
      abonnement: {
        plan: abo.plan,
        montantMensuelHtCentimes: abo.montantMensuelHtCentimes,
        dateDebut: abo.dateDebut,
        statut: abo.statut,
        limiteConversations: abo.limiteConversations,
        limiteSms: abo.limiteSms,
        limiteBeneficiaires: abo.limiteBeneficiaires,
        limiteConseillers: abo.limiteConseillers,
      },
      usage: {
        conversations: { used: u.conversationsIa, limit: abo.limiteConversations },
        sms: { used: u.smsEnvoyes, limit: abo.limiteSms },
        beneficiaires: { used: u.beneficiairesActifs, limit: abo.limiteBeneficiaires },
        conseillers: { used: u.conseillersActifs, limit: abo.limiteConseillers },
      },
      factures,
    })
  } catch (error) {
    console.error('[Mon abonnement GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}
