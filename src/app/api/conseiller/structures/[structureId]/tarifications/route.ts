// GET + POST /api/conseiller/structures/[structureId]/tarifications
// CRUD tarifications pour structures lucratives

import { getConseillerFromHeaders, hasRole, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { db } from '@/data/db'
import { tarification, structure } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

type Params = { params: Promise<{ structureId: string }> }

export async function GET(_request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { structureId } = await params

    if (!hasRole(ctx, 'super_admin') && ctx.structureId !== structureId) {
      return jsonError('Acces refuse', 403)
    }

    const tarifs = await db
      .select()
      .from(tarification)
      .where(eq(tarification.structureId, structureId))

    return jsonSuccess({ data: tarifs })
  } catch (error) {
    console.error('[Tarifications GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { structureId } = await params

    if (!hasRole(ctx, 'admin_structure')) {
      return jsonError('Acces refuse', 403)
    }
    if (!hasRole(ctx, 'super_admin') && ctx.structureId !== structureId) {
      return jsonError('Acces refuse', 403)
    }

    // Vérifier que la structure existe et est lucrative
    const structures = await db.select().from(structure).where(eq(structure.id, structureId))
    if (structures.length === 0) return jsonError('Structure non trouvee', 404)
    if (structures[0].statut !== 'lucratif') {
      return jsonError('La tarification n\'est disponible que pour les structures lucratives', 400)
    }

    const body = await request.json()
    const { libelle, description, montantHtCentimes, devise, dureeJours } = body

    if (!libelle || typeof libelle !== 'string' || libelle.trim().length === 0) {
      return jsonError('Le libelle est requis', 400)
    }
    if (!montantHtCentimes || typeof montantHtCentimes !== 'number' || montantHtCentimes <= 0) {
      return jsonError('Le montant HT doit etre un nombre positif (en centimes)', 400)
    }

    // Calculer le TTC via le taux de TVA de la structure
    const tauxTva = structures[0].tauxTva ?? 20.0
    const montantTtcCentimes = Math.round(montantHtCentimes * (1 + tauxTva / 100))

    const now = new Date().toISOString()
    const newTarif = {
      id: uuidv4(),
      structureId,
      libelle: libelle.trim(),
      description: description || null,
      montantHtCentimes,
      montantTtcCentimes,
      montantCentimes: montantTtcCentimes, // Alias TTC
      devise: devise || 'EUR',
      dureeJours: dureeJours || null,
      actif: 1,
      creeLe: now,
      misAJourLe: now,
    }

    await db.insert(tarification).values(newTarif)
    await logAudit(ctx.id, 'create_tarification', 'tarification', newTarif.id)

    return jsonSuccess({ tarification: newTarif }, 201)
  } catch (error) {
    console.error('[Tarifications POST]', error)
    return jsonError('Erreur serveur', 500)
  }
}
