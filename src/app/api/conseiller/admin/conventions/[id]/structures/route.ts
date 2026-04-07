// POST + DELETE /api/conseiller/admin/conventions/[id]/structures
// Ajouter/retirer une structure d'une convention

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { conventionTerritoriale, conventionStructure, structure, abonnement } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { PLAN_LIMITS } from '@/lib/usage-guard'

type Params = { params: Promise<{ id: string }> }

export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'super_admin')) return jsonError('Acces refuse', 403)
    const { id: conventionId } = await params

    const body = await request.json()
    const { structureId } = body
    if (!structureId) return jsonError('structureId requis', 400)

    // Verifier convention
    const convs = await db.select().from(conventionTerritoriale).where(eq(conventionTerritoriale.id, conventionId))
    if (convs.length === 0) return jsonError('Convention non trouvee', 404)

    // Verifier structure
    const structures = await db.select().from(structure).where(eq(structure.id, structureId))
    if (structures.length === 0) return jsonError('Structure non trouvee', 404)

    // Verifier pas deja membre
    const existing = await db.select().from(conventionStructure)
      .where(and(eq(conventionStructure.conventionId, conventionId), eq(conventionStructure.structureId, structureId)))
    if (existing.length > 0 && existing[0].statut === 'active') {
      return jsonError('Structure deja membre de cette convention', 409)
    }

    const now = new Date().toISOString()

    // Creer le lien convention-structure
    if (existing.length > 0) {
      await db.update(conventionStructure).set({ statut: 'active', dateAjout: now }).where(eq(conventionStructure.id, existing[0].id))
    } else {
      await db.insert(conventionStructure).values({
        id: uuidv4(),
        conventionId,
        structureId,
        dateAjout: now,
        statut: 'active',
        creeLe: now,
      })
    }

    // Creer un abonnement "convention" pour la structure si pas deja un actif
    const plan = convs[0].type === 'departement' ? 'pro' : 'premium'
    const limits = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS]
    const existingAbo = await db.select().from(abonnement)
      .where(and(eq(abonnement.structureId, structureId), eq(abonnement.statut, 'active')))
    if (existingAbo.length === 0) {
      await db.insert(abonnement).values({
        id: uuidv4(),
        structureId,
        plan,
        conventionId,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        stripePriceId: null,
        montantMensuelHtCentimes: 0, // Inclus dans la convention
        limiteConseillers: limits.conseillers,
        limiteBeneficiaires: Math.round(convs[0].limiteBeneficiaires / convs[0].limiteStructures),
        limiteConversations: Math.round(convs[0].limiteConversations / convs[0].limiteStructures),
        limiteSms: Math.round(convs[0].limiteSms / convs[0].limiteStructures),
        socleInclus: 0,
        prixDepassementConversation: 2,
        prixDepassementSms: 8,
        dateDebut: now,
        dateFin: convs[0].dateFin,
        periodeEssai: 0,
        statut: 'active',
        creeLe: now,
        misAJourLe: now,
      })
    }

    await logAudit(ctx.id, 'add_convention_structure', 'convention_structure', conventionId, { structureId })

    return jsonSuccess({ message: 'Structure ajoutee a la convention' }, 201)
  } catch (error) {
    console.error('[Convention structures POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'super_admin')) return jsonError('Acces refuse', 403)
    const { id: conventionId } = await params

    const body = await request.json()
    const { structureId } = body
    if (!structureId) return jsonError('structureId requis', 400)

    await db.update(conventionStructure).set({ statut: 'retiree' })
      .where(and(eq(conventionStructure.conventionId, conventionId), eq(conventionStructure.structureId, structureId)))

    await logAudit(ctx.id, 'remove_convention_structure', 'convention_structure', conventionId, { structureId })

    return jsonSuccess({ message: 'Structure retiree de la convention' })
  } catch (error) {
    console.error('[Convention structures DELETE]', error)
    return jsonError('Erreur serveur', 500)
  }
}
