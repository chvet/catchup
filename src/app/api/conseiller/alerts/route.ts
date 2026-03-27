// GET /api/conseiller/alerts — Compteurs d'alerte pour la sidebar/topbar
// Retourne : nombre de bénéficiaires en attente + nombre de nouveaux (< 1h)
// (permet au conseiller de voir en temps réel la charge de la file active)

import { getConseillerFromHeaders, jsonError, jsonSuccess } from '@/lib/api-helpers'
import { db } from '@/data/db'
import { referral, priseEnCharge } from '@/data/schema'
import { eq, and, sql, not, inArray } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ctx = await getConseillerFromHeaders()

    // 1. Bénéficiaires en attente de prise en charge (statut = 'en_attente' ou 'nouvelle')
    const enAttente = await db
      .select({ count: sql<number>`count(*)` })
      .from(referral)
      .where(
        and(
          sql`${referral.statut} IN ('en_attente', 'nouvelle')`,
          // Exclure ceux déjà pris en charge
          not(inArray(referral.id, db.select({ id: priseEnCharge.referralId }).from(priseEnCharge)))
        )
      )

    const totalEnAttente = enAttente[0]?.count ?? 0

    // 2. Nouveaux arrivés (créés il y a moins de 1 heure)
    const uneHeureAvant = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const nouveaux = await db
      .select({ count: sql<number>`count(*)` })
      .from(referral)
      .where(
        and(
          sql`${referral.statut} IN ('en_attente', 'nouvelle')`,
          sql`${referral.creeLe} > ${uneHeureAvant}`,
          not(inArray(referral.id, db.select({ id: priseEnCharge.referralId }).from(priseEnCharge)))
        )
      )

    const totalNouveaux = nouveaux[0]?.count ?? 0

    // 3. Cas critiques/haute priorité non pris en charge
    const urgents = await db
      .select({ count: sql<number>`count(*)` })
      .from(referral)
      .where(
        and(
          sql`${referral.statut} IN ('en_attente', 'nouvelle')`,
          sql`${referral.priorite} IN ('critique', 'haute')`,
          not(inArray(referral.id, db.select({ id: priseEnCharge.referralId }).from(priseEnCharge)))
        )
      )

    const totalUrgents = urgents[0]?.count ?? 0

    // 4. Cas en attente depuis longtemps (> 24h)
    const vingtQuatreHeures = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const enRetard = await db
      .select({ count: sql<number>`count(*)` })
      .from(referral)
      .where(
        and(
          sql`${referral.statut} IN ('en_attente', 'nouvelle')`,
          sql`${referral.creeLe} < ${vingtQuatreHeures}`,
          not(inArray(referral.id, db.select({ id: priseEnCharge.referralId }).from(priseEnCharge)))
        )
      )

    const totalEnRetard = enRetard[0]?.count ?? 0

    // 5. Piggyback : declencher la verification des rappels (non bloquant)
    // Cela permet de verifier les beneficiaires inactifs a chaque polling des alertes
    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000'
      fetch(`${baseUrl}/api/cron/reminders`).catch(() => {})
    } catch {
      // Non bloquant — si le cron echoue, les alertes fonctionnent quand meme
    }

    return jsonSuccess({
      enAttente: totalEnAttente,
      nouveaux: totalNouveaux,
      urgents: totalUrgents,
      enRetard: totalEnRetard,
    })
  } catch (error) {
    console.error('[Alerts]', error)
    return jsonError('Erreur serveur', 500)
  }
}
