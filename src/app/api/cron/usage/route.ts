// GET /api/cron/usage
// Agregation mensuelle des metriques par structure → usageStructure

import { NextResponse } from 'next/server'
import { db } from '@/data/db'
import { usageStructure, structure, priseEnCharge, conseiller, referral } from '@/data/schema'
import { eq, and, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const mois = new Date().toISOString().slice(0, 7)
    const now = new Date().toISOString()
    const debutMois = `${mois}-01T00:00:00.000Z`

    // Toutes les structures actives
    const structures = await db.select({ id: structure.id }).from(structure).where(eq(structure.actif, 1))

    let updated = 0

    for (const s of structures) {
      // Beneficiaires actifs (prises en charge actives)
      const benefResult = await db.select({ count: sql<number>`COUNT(DISTINCT ${priseEnCharge.id})` })
        .from(priseEnCharge)
        .where(and(
          eq(priseEnCharge.structureId, s.id),
          sql`${priseEnCharge.statut} NOT IN ('terminee', 'annulee')`
        ))
      const beneficiairesActifs = benefResult[0]?.count ?? 0

      // Conseillers actifs
      const consResult = await db.select({ count: sql<number>`COUNT(*)` })
        .from(conseiller)
        .where(and(eq(conseiller.structureId, s.id), eq(conseiller.actif, 1)))
      const conseillersActifs = consResult[0]?.count ?? 0

      // Conversations IA du mois (referrals sources vers cette structure)
      const convResult = await db.select({ count: sql<number>`COUNT(*)` })
        .from(referral)
        .where(and(
          eq(referral.structureSuggereId, s.id),
          sql`${referral.creeLe} >= ${debutMois}`
        ))
      const conversationsIa = convResult[0]?.count ?? 0

      // SMS du mois (via notification_log join)
      const smsResult = await db.select({ count: sql<number>`
        COALESCE((SELECT COUNT(*) FROM notification_log nl
          INNER JOIN prise_en_charge pec ON nl.prise_en_charge_id = pec.id
          WHERE pec.structure_id = ${s.id}
          AND nl.canal = 'sms'
          AND nl.cree_le >= ${debutMois}
        ), 0)
      `}).from(sql`(SELECT 1) as dummy`)
      const smsEnvoyes = smsResult[0]?.count ?? 0

      // Upsert usageStructure
      const existing = await db.select().from(usageStructure)
        .where(and(eq(usageStructure.structureId, s.id), eq(usageStructure.mois, mois)))

      if (existing.length > 0) {
        await db.update(usageStructure).set({
          beneficiairesActifs,
          conseillersActifs,
          conversationsIa,
          smsEnvoyes,
          misAJourLe: now,
        }).where(eq(usageStructure.id, existing[0].id))
      } else {
        await db.insert(usageStructure).values({
          id: uuidv4(),
          structureId: s.id,
          mois,
          conversationsIa,
          smsEnvoyes,
          beneficiairesActifs,
          conseillersActifs,
          conseillersSurplus: 0,
          conversationsDepassement: 0,
          smsDepassement: 0,
          montantDepassementCentimes: 0,
          stripeUsageRecordId: null,
          rapporteLe: null,
          creeLe: now,
          misAJourLe: now,
        })
      }

      updated++
    }

    return NextResponse.json({ ok: true, mois, structuresUpdated: updated })
  } catch (error) {
    console.error('[Cron usage]', error)
    return NextResponse.json({ error: 'Erreur cron usage' }, { status: 500 })
  }
}
