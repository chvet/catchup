// POST /api/webhooks/stripe
// Gère les événements Stripe (paiements, comptes Connect)

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/data/db'
import { paiement, stripeCompteStructure, referral, acceptationTarif } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { constructWebhookEvent } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json({ error: 'Signature manquante' }, { status: 400 })
    }

    // Essayer d'abord comme webhook Connect, puis comme webhook standard
    let event
    try {
      event = constructWebhookEvent(body, signature, true)
    } catch {
      try {
        event = constructWebhookEvent(body, signature, false)
      } catch (err) {
        console.error('[Stripe Webhook] Signature invalide:', err)
        return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
      }
    }

    const now = new Date().toISOString()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as { id: string; payment_intent: string; metadata?: { acceptationTarifId?: string } }
        const acceptationId = session.metadata?.acceptationTarifId

        if (acceptationId) {
          // Mettre à jour le paiement
          await db.update(paiement).set({
            statut: 'reussi',
            stripePaymentIntentId: typeof session.payment_intent === 'string' ? session.payment_intent : null,
            paieLe: now,
            misAJourLe: now,
          }).where(eq(paiement.stripeCheckoutSessionId, session.id))

          // Mettre à jour le referral associé
          const acc = await db.select().from(acceptationTarif).where(eq(acceptationTarif.id, acceptationId))
          if (acc.length > 0) {
            await db.update(referral).set({
              statut: 'paiement_recu',
              misAJourLe: now,
            }).where(eq(referral.id, acc[0].referralId))
          }

          console.log(`[Stripe Webhook] Paiement réussi pour acceptation ${acceptationId}`)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const pi = event.data.object as { id: string; last_payment_error?: { message?: string } }
        await db.update(paiement).set({
          statut: 'echoue',
          erreur: pi.last_payment_error?.message || 'Paiement echoue',
          misAJourLe: now,
        }).where(eq(paiement.stripePaymentIntentId, pi.id))

        console.log(`[Stripe Webhook] Paiement echoue: ${pi.id}`)
        break
      }

      case 'account.updated': {
        const account = event.data.object as { id: string; charges_enabled: boolean; details_submitted: boolean }
        await db.update(stripeCompteStructure).set({
          statut: account.charges_enabled ? 'actif' : 'en_cours',
          chargesActives: account.charges_enabled ? 1 : 0,
          detailsComplets: account.details_submitted ? 1 : 0,
          misAJourLe: now,
        }).where(eq(stripeCompteStructure.stripeAccountId, account.id))

        console.log(`[Stripe Webhook] Compte ${account.id} mis a jour: charges=${account.charges_enabled}`)
        break
      }

      default:
        console.log(`[Stripe Webhook] Event non gere: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('[Stripe Webhook]', error)
    return NextResponse.json({ error: 'Erreur webhook' }, { status: 500 })
  }
}
