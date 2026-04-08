// POST /api/conseiller/file-active/[id]/transfer — Transférer un referral entre files
// GET  /api/conseiller/file-active/[id]/transfer — Lister les structures disponibles

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { referral, structure, evenementAudit, priseEnCharge } from '@/data/schema'
import { eq, and, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { logJournal } from '@/lib/journal'
import { safeJsonParse } from '@/core/constants'

interface TransferBody {
  destination: 'generique' | 'structure'
  structureId?: string
  motif: string
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getConseillerFromHeaders()
    const { id: referralId } = await params

    const body = (await request.json()) as TransferBody
    const { destination, structureId, motif } = body

    // Validations
    if (!destination || !['generique', 'structure'].includes(destination)) {
      return jsonError('destination doit etre "generique" ou "structure"', 400)
    }

    if (!motif || motif.trim().length === 0) {
      return jsonError('Le motif est obligatoire', 400)
    }

    // Vérifier que le referral existe
    const refRows = await db
      .select()
      .from(referral)
      .where(eq(referral.id, referralId))
      .limit(1)

    if (refRows.length === 0) {
      return jsonError('Referral introuvable', 404)
    }

    const ref = refRows[0]
    const now = new Date().toISOString()

    if (destination === 'generique') {
      // Transférer vers la file générique
      await db.update(referral).set({
        source: 'generique',
        structureSuggereId: null,
        misAJourLe: now,
      }).where(eq(referral.id, referralId))

      // Log journal si une prise en charge existe
      const pecRows = await db
        .select({ id: priseEnCharge.id })
        .from(priseEnCharge)
        .where(eq(priseEnCharge.referralId, referralId))
        .limit(1)

      if (pecRows.length > 0) {
        await logJournal(
          pecRows[0].id,
          'transfert_generique',
          'conseiller',
          ctx.id,
          `Transfert vers la file générique. Motif : ${motif.trim()}`,
          { details: { motif: motif.trim(), ancienneSource: ref.source, ancienneStructure: ref.structureSuggereId } }
        )
      }

      // Log audit
      await db.insert(evenementAudit).values({
        id: uuidv4(),
        conseillerId: ctx.id,
        action: 'transfert_generique',
        cibleType: 'referral',
        cibleId: referralId,
        details: JSON.stringify({ motif: motif.trim(), ancienneSource: ref.source, ancienneStructure: ref.structureSuggereId }),
        horodatage: now,
      })

      return jsonSuccess({
        success: true,
        referralId,
        source: 'generique',
        structureSuggereId: null,
      })
    } else {
      // destination === 'structure'
      if (!structureId) {
        return jsonError('structureId est requis pour un transfert vers une structure', 400)
      }

      // Vérifier que la structure existe et est active
      const structRows = await db
        .select({ id: structure.id, nom: structure.nom })
        .from(structure)
        .where(and(eq(structure.id, structureId), eq(structure.actif, 1)))
        .limit(1)

      if (structRows.length === 0) {
        return jsonError('Structure introuvable ou inactive', 404)
      }

      // Mettre à jour le referral
      await db.update(referral).set({
        source: 'sourcee',
        structureSuggereId: structureId,
        misAJourLe: now,
      }).where(eq(referral.id, referralId))

      // Log journal si une prise en charge existe
      const pecRows = await db
        .select({ id: priseEnCharge.id })
        .from(priseEnCharge)
        .where(eq(priseEnCharge.referralId, referralId))
        .limit(1)

      if (pecRows.length > 0) {
        await logJournal(
          pecRows[0].id,
          'transfert_structure',
          'conseiller',
          ctx.id,
          `Transfert vers ${structRows[0].nom}. Motif : ${motif.trim()}`,
          {
            cibleType: 'structure',
            cibleId: structureId,
            details: { motif: motif.trim(), ancienneSource: ref.source, ancienneStructure: ref.structureSuggereId, nouvelleStructure: structureId },
          }
        )
      }

      // Log audit
      await db.insert(evenementAudit).values({
        id: uuidv4(),
        conseillerId: ctx.id,
        action: 'transfert_structure',
        cibleType: 'referral',
        cibleId: referralId,
        details: JSON.stringify({ motif: motif.trim(), structureId, structureNom: structRows[0].nom, ancienneSource: ref.source, ancienneStructure: ref.structureSuggereId }),
        horodatage: now,
      })

      return jsonSuccess({
        success: true,
        referralId,
        source: 'sourcee',
        structureSuggereId: structureId,
        structureNom: structRows[0].nom,
      })
    }
  } catch (error) {
    console.error('[Transfer]', error)
    return jsonError('Erreur serveur', 500)
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await getConseillerFromHeaders()

    // Retourner toutes les structures actives sauf celle du conseiller
    const conditions = [eq(structure.actif, 1)]
    if (ctx.structureId) {
      conditions.push(sql`${structure.id} != ${ctx.structureId}`)
    }

    const structures = await db
      .select({
        id: structure.id,
        nom: structure.nom,
        slug: structure.slug,
        departements: structure.departements,
      })
      .from(structure)
      .where(and(...conditions))
      .orderBy(structure.nom)

    // Parser les departements JSON
    const parsed = structures.map((s) => ({
      ...s,
      departements: safeJsonParse<string[]>(s.departements, []),
    }))

    return jsonSuccess({ structures: parsed })
  } catch (error) {
    console.error('[Transfer GET]', error)
    return jsonError('Erreur serveur', 500)
  }
}
