// GET + POST /api/conseiller/admin/conventions
// Gestion des conventions territoriales (super_admin)

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { conventionTerritoriale, conventionStructure } from '@/data/schema'
import { eq, desc, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function GET(_request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'super_admin')) return jsonError('Acces refuse', 403)

    const conventions = await db
      .select({
        id: conventionTerritoriale.id,
        type: conventionTerritoriale.type,
        nom: conventionTerritoriale.nom,
        montantAnnuelHtCentimes: conventionTerritoriale.montantAnnuelHtCentimes,
        limiteStructures: conventionTerritoriale.limiteStructures,
        limiteBeneficiaires: conventionTerritoriale.limiteBeneficiaires,
        dateDebut: conventionTerritoriale.dateDebut,
        dateFin: conventionTerritoriale.dateFin,
        statut: conventionTerritoriale.statut,
        nbStructures: sql<number>`(SELECT COUNT(*) FROM convention_structure WHERE convention_id = ${conventionTerritoriale.id} AND statut = 'active')`,
      })
      .from(conventionTerritoriale)
      .orderBy(desc(conventionTerritoriale.creeLe))

    return jsonSuccess({ data: conventions })
  } catch (error) {
    console.error('[Conventions GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await getConseillerFromHeaders()
    if (!hasRole(ctx, 'super_admin')) return jsonError('Acces refuse', 403)

    const body = await request.json()
    const { type, nom, departements, regions, contactNom, contactEmail, contactTelephone, dateDebut, dateFin } = body

    if (!type || !['departement', 'region'].includes(type)) return jsonError('Type invalide (departement|region)', 400)
    if (!nom) return jsonError('Nom requis', 400)
    if (!dateDebut || !dateFin) return jsonError('Dates requises', 400)

    const limites = type === 'departement'
      ? { structures: 15, beneficiaires: 2000, conversations: 12000, sms: 8000, montant: 1800000 }
      : { structures: 60, beneficiaires: 10000, conversations: 60000, sms: 40000, montant: 6500000 }

    const now = new Date().toISOString()
    const newConv = {
      id: uuidv4(),
      type,
      nom: nom.trim(),
      departements: departements ? JSON.stringify(departements) : null,
      regions: regions ? JSON.stringify(regions) : null,
      montantAnnuelHtCentimes: limites.montant,
      stripeSubscriptionId: null,
      stripeCustomerId: null,
      limiteStructures: limites.structures,
      limiteBeneficiaires: limites.beneficiaires,
      limiteConversations: limites.conversations,
      limiteSms: limites.sms,
      contactNom: contactNom || null,
      contactEmail: contactEmail || null,
      contactTelephone: contactTelephone || null,
      dateDebut,
      dateFin,
      statut: 'active',
      creeLe: now,
      misAJourLe: now,
    }

    await db.insert(conventionTerritoriale).values(newConv)
    await logAudit(ctx.id, 'create_convention', 'convention_territoriale', newConv.id)

    return jsonSuccess({ convention: newConv }, 201)
  } catch (error) {
    console.error('[Conventions POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
