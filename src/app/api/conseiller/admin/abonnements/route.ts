// GET + POST /api/conseiller/admin/abonnements
// Gestion des abonnements (super_admin)

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { abonnement, structure, usageStructure } from '@/data/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { PLAN_LIMITS } from '@/lib/usage-guard'
import { createBillingCustomer, createBillingSubscription } from '@/lib/stripe'

export async function GET(_request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'super_admin')) return jsonError('Acces refuse', 403)

    const mois = new Date().toISOString().slice(0, 7)

    const abonnements = await db
      .select({
        id: abonnement.id,
        structureId: abonnement.structureId,
        structureNom: structure.nom,
        plan: abonnement.plan,
        montantMensuelHtCentimes: abonnement.montantMensuelHtCentimes,
        limiteConversations: abonnement.limiteConversations,
        limiteSms: abonnement.limiteSms,
        limiteBeneficiaires: abonnement.limiteBeneficiaires,
        limiteConseillers: abonnement.limiteConseillers,
        dateDebut: abonnement.dateDebut,
        statut: abonnement.statut,
        // Usage du mois courant
        conversationsIa: sql<number>`COALESCE((SELECT conversations_ia FROM usage_structure WHERE structure_id = ${abonnement.structureId} AND mois = ${mois}), 0)`,
        smsEnvoyes: sql<number>`COALESCE((SELECT sms_envoyes FROM usage_structure WHERE structure_id = ${abonnement.structureId} AND mois = ${mois}), 0)`,
        beneficiairesActifs: sql<number>`COALESCE((SELECT beneficiaires_actifs FROM usage_structure WHERE structure_id = ${abonnement.structureId} AND mois = ${mois}), 0)`,
      })
      .from(abonnement)
      .innerJoin(structure, eq(abonnement.structureId, structure.id))
      .orderBy(desc(abonnement.creeLe))

    return jsonSuccess({ data: abonnements })
  } catch (error) {
    console.error('[Abonnements GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'super_admin')) return jsonError('Acces refuse', 403)

    const body = await request.json()
    const { structureId, plan, email } = body

    if (!structureId || !plan) return jsonError('structureId et plan requis', 400)

    const validPlans = ['starter', 'pro', 'premium', 'pay_per_outcome']
    if (!validPlans.includes(plan)) return jsonError('Plan invalide', 400)

    // Verifier structure
    const structures = await db.select().from(structure).where(eq(structure.id, structureId))
    if (structures.length === 0) return jsonError('Structure non trouvee', 404)

    // Verifier pas d'abonnement existant actif
    const existing = await db.select().from(abonnement)
      .where(eq(abonnement.structureId, structureId))
    if (existing.some(a => a.statut === 'active')) {
      return jsonError('Cette structure a deja un abonnement actif', 409)
    }

    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]

    // Creer client Stripe si email fourni
    let stripeCustomerId: string | null = null
    if (email) {
      try {
        stripeCustomerId = await createBillingCustomer(structureId, email, structures[0].nom)
      } catch (e) {
        console.warn('[Abonnement] Stripe customer creation failed:', e)
      }
    }

    const now = new Date().toISOString()
    const newAbo = {
      id: uuidv4(),
      structureId,
      plan,
      conventionId: null,
      stripeSubscriptionId: null,
      stripeCustomerId,
      stripePriceId: null,
      montantMensuelHtCentimes: limits.prixMensuelHt,
      limiteConseillers: limits.conseillers,
      limiteBeneficiaires: limits.beneficiaires,
      limiteConversations: limits.conversations,
      limiteSms: limits.sms,
      socleInclus: plan === 'pay_per_outcome' ? 1 : 0,
      prixDepassementConversation: 2,
      prixDepassementSms: 8,
      dateDebut: now,
      dateFin: null,
      periodeEssai: 0,
      statut: 'active',
      creeLe: now,
      misAJourLe: now,
    }

    await db.insert(abonnement).values(newAbo)
    await logAudit(ctx.id, 'create_abonnement', 'abonnement', newAbo.id, { plan, structureId })

    return jsonSuccess({ abonnement: newAbo }, 201)
  } catch (error) {
    console.error('[Abonnements POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
