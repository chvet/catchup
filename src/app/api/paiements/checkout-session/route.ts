// POST /api/paiements/checkout-session
// Crée une session Stripe Checkout pour le paiement d'un tarif accepté

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/data/db'
import { acceptationTarif, tarification, stripeCompteStructure, paiement } from '@/data/schema'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { createCheckoutSession } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { acceptationTarifId } = body

    if (!acceptationTarifId) {
      return NextResponse.json({ error: 'acceptationTarifId requis' }, { status: 400 })
    }

    // Vérifier l'acceptation
    const acceptations = await db.select().from(acceptationTarif)
      .where(eq(acceptationTarif.id, acceptationTarifId))
    if (acceptations.length === 0) {
      return NextResponse.json({ error: 'Acceptation non trouvee' }, { status: 404 })
    }
    const acc = acceptations[0]

    if (acc.statut !== 'acceptee') {
      return NextResponse.json({ error: 'Cette acceptation n\'est plus valide' }, { status: 400 })
    }

    // Récupérer le tarif pour le libellé
    const tarifs = await db.select().from(tarification).where(eq(tarification.id, acc.tarificationId))
    if (tarifs.length === 0) {
      return NextResponse.json({ error: 'Tarification non trouvee' }, { status: 404 })
    }

    // Récupérer le compte Stripe Connect de la structure
    const comptes = await db.select().from(stripeCompteStructure)
      .where(eq(stripeCompteStructure.structureId, acc.structureId))
    if (comptes.length === 0 || comptes[0].statut !== 'actif') {
      return NextResponse.json({ error: 'La structure n\'a pas de compte de paiement actif' }, { status: 400 })
    }

    const { origin } = new URL(request.url)
    const successUrl = `${origin}/accompagnement?payment=success&ref=${acc.referralId}`
    const cancelUrl = `${origin}/accompagnement?payment=cancelled&ref=${acc.referralId}`

    const { sessionId, sessionUrl } = await createCheckoutSession({
      acceptationTarifId,
      stripeAccountId: comptes[0].stripeAccountId,
      montantCentimes: acc.montantCentimes,
      devise: 'EUR',
      libelle: tarifs[0].libelle,
      structureNom: '', // Will be enriched by Stripe from the account
      successUrl,
      cancelUrl,
    })

    // Créer l'enregistrement paiement en attente
    const now = new Date().toISOString()
    await db.insert(paiement).values({
      id: uuidv4(),
      acceptationTarifId,
      priseEnChargeId: null,
      stripePaymentIntentId: null,
      stripeCheckoutSessionId: sessionId,
      montantCentimes: acc.montantCentimes,
      devise: 'EUR',
      statut: 'en_attente',
      methode: null,
      recuUrl: null,
      erreur: null,
      paieLe: null,
      creeLe: now,
      misAJourLe: now,
    })

    return NextResponse.json({ sessionUrl })
  } catch (error) {
    console.error('[Checkout session POST]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
