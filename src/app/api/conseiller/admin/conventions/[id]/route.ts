// GET + PATCH /api/conseiller/admin/conventions/[id]

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { conventionTerritoriale, conventionStructure, structure, usageStructure } from '@/data/schema'
import { eq, and, sql } from 'drizzle-orm'

type Params = { params: Promise<{ id: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'super_admin')) return jsonError('Acces refuse', 403)
    const { id } = await params

    const convs = await db.select().from(conventionTerritoriale).where(eq(conventionTerritoriale.id, id))
    if (convs.length === 0) return jsonError('Convention non trouvee', 404)

    // Structures membres
    const membres = await db
      .select({
        structureId: conventionStructure.structureId,
        structureNom: structure.nom,
        dateAjout: conventionStructure.dateAjout,
        statut: conventionStructure.statut,
      })
      .from(conventionStructure)
      .innerJoin(structure, eq(conventionStructure.structureId, structure.id))
      .where(eq(conventionStructure.conventionId, id))

    // Usage agrege du mois
    const mois = new Date().toISOString().slice(0, 7)
    const structureIds = membres.filter(m => m.statut === 'active').map(m => m.structureId)
    let usageAgrege = { conversations: 0, sms: 0, beneficiaires: 0 }
    if (structureIds.length > 0) {
      const usage = await db.select({
        conversations: sql<number>`COALESCE(SUM(conversations_ia), 0)`,
        sms: sql<number>`COALESCE(SUM(sms_envoyes), 0)`,
        beneficiaires: sql<number>`COALESCE(SUM(beneficiaires_actifs), 0)`,
      }).from(usageStructure)
        .where(and(
          sql`${usageStructure.structureId} IN (${sql.raw(structureIds.map(id => `'${id}'`).join(','))})`,
          eq(usageStructure.mois, mois)
        ))
      if (usage[0]) usageAgrege = { conversations: usage[0].conversations, sms: usage[0].sms, beneficiaires: usage[0].beneficiaires }
    }

    return jsonSuccess({
      convention: convs[0],
      structures: membres,
      usage: usageAgrege,
    })
  } catch (error) {
    console.error('[Convention GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'super_admin')) return jsonError('Acces refuse', 403)
    const { id } = await params

    const existing = await db.select().from(conventionTerritoriale).where(eq(conventionTerritoriale.id, id))
    if (existing.length === 0) return jsonError('Convention non trouvee', 404)

    const body = await request.json()
    const allowed = ['nom', 'contactNom', 'contactEmail', 'contactTelephone', 'dateFin', 'statut',
      'limiteStructures', 'limiteBeneficiaires', 'limiteConversations', 'limiteSms']
    const updateData: Record<string, unknown> = { misAJourLe: new Date().toISOString() }
    for (const f of allowed) {
      if (body[f] !== undefined) updateData[f] = body[f]
    }

    await db.update(conventionTerritoriale).set(updateData).where(eq(conventionTerritoriale.id, id))
    const updated = await db.select().from(conventionTerritoriale).where(eq(conventionTerritoriale.id, id))
    return jsonSuccess({ convention: updated[0] })
  } catch (error) {
    console.error('[Convention PATCH]', error)
    return jsonError('Erreur serveur', 500)
  }
}
