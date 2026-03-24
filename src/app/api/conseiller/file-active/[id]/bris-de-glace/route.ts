// POST /api/conseiller/file-active/[id]/bris-de-glace — Accès d'urgence aux échanges tiers ↔ bénéficiaire
// (le conseiller doit fournir une justification, l'accès est loggé dans l'audit RGPD)

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { logAudit } from '@/lib/auth'
import { logJournal } from '@/lib/journal'
import { db } from '@/data/db'
import { brisDeGlace, priseEnCharge, tiersIntervenant, messageDirect } from '@/data/schema'
import { eq, and, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await getConseillerFromHeaders()

    const body = await request.json()
    const { tiersId, justification } = body

    if (!tiersId || !justification?.trim()) {
      return jsonError('tiersId et justification requis', 400)
    }

    if (justification.trim().length < 10) {
      return jsonError('La justification doit contenir au moins 10 caractères', 400)
    }

    // Vérifier la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))

    if (pecs.length === 0) return jsonError('Prise en charge non trouvée', 404)
    const pec = pecs[0]

    // Vérifier que le tiers existe et est lié à cette prise en charge
    const tiers = await db
      .select()
      .from(tiersIntervenant)
      .where(and(eq(tiersIntervenant.id, tiersId), eq(tiersIntervenant.priseEnChargeId, pec.id)))

    if (tiers.length === 0) return jsonError('Tiers non trouvé', 404)

    const now = new Date().toISOString()

    // Créer l'enregistrement de bris de glace
    const bdgId = uuidv4()
    await db.insert(brisDeGlace).values({
      id: bdgId,
      conseillerId: ctx.id,
      priseEnChargeId: pec.id,
      tiersId,
      justification: justification.trim(),
      ip: null,
      horodatage: now,
    })

    // Log audit RGPD
    await logAudit(ctx.id, 'bris_de_glace', 'tiers', tiersId)

    // Log journal
    await logJournal(pec.id, 'bris_de_glace', 'conseiller', ctx.id,
      `Bris de glace activé pour ${tiers[0].prenom} ${tiers[0].nom}`,
      { cibleType: 'tiers', cibleId: tiersId, details: { justification: justification.trim() } }
    )

    return jsonSuccess({ id: bdgId, message: 'Accès d\'urgence accordé' }, 201)
  } catch (error) {
    console.error('[Bris de glace]', error)
    return jsonError('Erreur serveur', 500)
  }
}

// GET — Lire les messages tiers ↔ bénéficiaire (nécessite un bris de glace actif < 24h)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ctx = await getConseillerFromHeaders()

    const url = new URL(request.url)
    const tiersId = url.searchParams.get('tiersId')

    if (!tiersId) return jsonError('tiersId requis', 400)

    // Vérifier la prise en charge
    const pecs = await db
      .select()
      .from(priseEnCharge)
      .where(eq(priseEnCharge.referralId, id))

    if (pecs.length === 0) return jsonError('Prise en charge non trouvée', 404)
    const pec = pecs[0]

    // Vérifier qu'un bris de glace existe pour ce tiers, < 24h
    const vingtQuatreHeures = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const bdg = await db
      .select()
      .from(brisDeGlace)
      .where(
        and(
          eq(brisDeGlace.conseillerId, ctx.id),
          eq(brisDeGlace.priseEnChargeId, pec.id),
          eq(brisDeGlace.tiersId, tiersId),
          sql`${brisDeGlace.horodatage} > ${vingtQuatreHeures}`
        )
      )

    if (bdg.length === 0) {
      return jsonError('Aucun bris de glace actif. Vous devez d\'abord activer l\'accès d\'urgence.', 403)
    }

    // Log l'accès aux messages dans l'audit
    await logAudit(ctx.id, 'read_tiers_messages', 'tiers', tiersId)

    // Récupérer les messages tiers ↔ bénéficiaire
    const messages = await db
      .select()
      .from(messageDirect)
      .where(
        and(
          eq(messageDirect.priseEnChargeId, pec.id),
          eq(messageDirect.conversationType, 'tiers_beneficiaire'),
          sql`(
            (${messageDirect.expediteurType} = 'tiers' AND ${messageDirect.expediteurId} = ${tiersId})
            OR ${messageDirect.expediteurType} = 'beneficiaire'
          )`
        )
      )
      .orderBy(messageDirect.horodatage)

    return jsonSuccess({ messages })
  } catch (error) {
    console.error('[Bris de glace GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}
