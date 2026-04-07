// GET /api/cron/facturation
// Facturation Pay-per-Outcome : detecte les evenements facturables

import { NextResponse } from 'next/server'
import { db } from '@/data/db'
import { abonnement, evenementFacturable, priseEnCharge, rendezVous, indiceConfiance, enqueteSatisfaction, referral } from '@/data/schema'
import { eq, and, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export async function GET() {
  try {
    const mois = new Date().toISOString().slice(0, 7)
    const debutMois = `${mois}-01T00:00:00.000Z`
    const now = new Date().toISOString()
    let created = 0

    // Trouver les abonnements pay_per_outcome actifs
    const ppoAbos = await db.select().from(abonnement)
      .where(and(eq(abonnement.plan, 'pay_per_outcome'), eq(abonnement.statut, 'active')))

    for (const abo of ppoAbos) {
      // 1. Accompagnements termines (+15 EUR)
      const termines = await db.select({ id: priseEnCharge.id })
        .from(priseEnCharge)
        .where(and(
          eq(priseEnCharge.structureId, abo.structureId),
          eq(priseEnCharge.statut, 'terminee'),
          sql`${priseEnCharge.termineeLe} >= ${debutMois}`
        ))

      for (const pec of termines) {
        const exists = await db.select({ id: evenementFacturable.id }).from(evenementFacturable)
          .where(and(
            eq(evenementFacturable.referenceId, pec.id),
            eq(evenementFacturable.type, 'accompagnement_termine'),
            eq(evenementFacturable.mois, mois)
          ))
        if (exists.length === 0) {
          await db.insert(evenementFacturable).values({
            id: uuidv4(), structureId: abo.structureId, abonnementId: abo.id,
            type: 'accompagnement_termine', montantCentimes: 1500,
            referenceId: pec.id, referenceType: 'prise_en_charge',
            mois, facture: 0, creeLe: now,
          })
          created++
        }
      }

      // 2. Profils RIASEC fiables (score > 0.7) (+2 EUR)
      const profils = await db.select({ id: indiceConfiance.id, utilisateurId: indiceConfiance.utilisateurId })
        .from(indiceConfiance)
        .innerJoin(referral, eq(indiceConfiance.utilisateurId, referral.utilisateurId))
        .where(and(
          eq(referral.structureSuggereId, abo.structureId),
          sql`${indiceConfiance.scoreGlobal} > 0.7`,
          sql`${indiceConfiance.misAJourLe} >= ${debutMois}`
        ))

      for (const p of profils) {
        const exists = await db.select({ id: evenementFacturable.id }).from(evenementFacturable)
          .where(and(
            eq(evenementFacturable.referenceId, p.id),
            eq(evenementFacturable.type, 'profil_riasec_fiable'),
            eq(evenementFacturable.mois, mois)
          ))
        if (exists.length === 0) {
          await db.insert(evenementFacturable).values({
            id: uuidv4(), structureId: abo.structureId, abonnementId: abo.id,
            type: 'profil_riasec_fiable', montantCentimes: 200,
            referenceId: p.id, referenceType: 'indice_confiance',
            mois, facture: 0, creeLe: now,
          })
          created++
        }
      }

      // 3. Satisfaction elevee (NPS > 8) (+1 EUR)
      const satisfaits = await db.select({ id: enqueteSatisfaction.id })
        .from(enqueteSatisfaction)
        .innerJoin(priseEnCharge, eq(enqueteSatisfaction.priseEnChargeId, priseEnCharge.id))
        .where(and(
          eq(priseEnCharge.structureId, abo.structureId),
          sql`${enqueteSatisfaction.noteRecommandation} > 8`,
          sql`${enqueteSatisfaction.creeLe} >= ${debutMois}`
        ))

      for (const s of satisfaits) {
        const exists = await db.select({ id: evenementFacturable.id }).from(evenementFacturable)
          .where(and(
            eq(evenementFacturable.referenceId, s.id),
            eq(evenementFacturable.type, 'satisfaction_elevee'),
            eq(evenementFacturable.mois, mois)
          ))
        if (exists.length === 0) {
          await db.insert(evenementFacturable).values({
            id: uuidv4(), structureId: abo.structureId, abonnementId: abo.id,
            type: 'satisfaction_elevee', montantCentimes: 100,
            referenceId: s.id, referenceType: 'enquete_satisfaction',
            mois, facture: 0, creeLe: now,
          })
          created++
        }
      }
    }

    return NextResponse.json({ ok: true, mois, eventsCreated: created })
  } catch (error) {
    console.error('[Cron facturation]', error)
    return NextResponse.json({ error: 'Erreur cron facturation' }, { status: 500 })
  }
}
