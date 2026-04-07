// Helpers Stripe Connect — paiement pour structures privées
// Utilise Stripe Connect Standard (la structure gère son propre dashboard Stripe)

import Stripe from 'stripe'

// Initialisation lazy (évite crash si les variables d'env ne sont pas configurées)
let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) throw new Error('STRIPE_SECRET_KEY non configurée')
    _stripe = new Stripe(key)
  }
  return _stripe
}

// Commission plateforme (en %)
function getPlatformFeePercent(): number {
  return parseInt(process.env.STRIPE_PLATFORM_FEE_PERCENT || '5', 10)
}

/**
 * Crée un compte Stripe Connect Standard pour une structure
 * Retourne l'URL d'onboarding à rediriger
 */
export async function createConnectAccount(
  structureId: string,
  structureNom: string,
  returnUrl: string,
  refreshUrl: string,
): Promise<{ accountId: string; onboardingUrl: string }> {
  const stripe = getStripe()

  const account = await stripe.accounts.create({
    type: 'standard',
    country: 'FR',
    metadata: { structureId },
    business_profile: {
      name: structureNom,
    },
  })

  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    return_url: returnUrl,
    refresh_url: refreshUrl,
    type: 'account_onboarding',
  })

  return {
    accountId: account.id,
    onboardingUrl: accountLink.url,
  }
}

/**
 * Vérifie le statut d'un compte Connect
 */
export async function getConnectAccountStatus(stripeAccountId: string): Promise<{
  chargesEnabled: boolean
  detailsSubmitted: boolean
  payoutsEnabled: boolean
}> {
  const stripe = getStripe()
  const account = await stripe.accounts.retrieve(stripeAccountId)
  return {
    chargesEnabled: account.charges_enabled,
    detailsSubmitted: account.details_submitted,
    payoutsEnabled: account.payouts_enabled,
  }
}

/**
 * Crée une session Stripe Checkout pour un paiement vers une structure
 */
export async function createCheckoutSession(params: {
  acceptationTarifId: string
  stripeAccountId: string
  montantCentimes: number
  devise: string
  libelle: string
  structureNom: string
  successUrl: string
  cancelUrl: string
}): Promise<{ sessionId: string; sessionUrl: string }> {
  const stripe = getStripe()
  const feePercent = getPlatformFeePercent()
  const applicationFee = Math.round(params.montantCentimes * feePercent / 100)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{
      price_data: {
        currency: params.devise.toLowerCase(),
        product_data: {
          name: params.libelle,
          description: `Accompagnement par ${params.structureNom}`,
        },
        unit_amount: params.montantCentimes,
      },
      quantity: 1,
    }],
    payment_intent_data: {
      application_fee_amount: applicationFee,
    },
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      acceptationTarifId: params.acceptationTarifId,
    },
  }, {
    stripeAccount: params.stripeAccountId,
  })

  return {
    sessionId: session.id,
    sessionUrl: session.url!,
  }
}

/**
 * Vérifie la signature d'un webhook Stripe et parse l'événement
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string,
  isConnect: boolean = false,
): Stripe.Event {
  const stripe = getStripe()
  const secret = isConnect
    ? process.env.STRIPE_CONNECT_WEBHOOK_SECRET
    : process.env.STRIPE_WEBHOOK_SECRET

  if (!secret) throw new Error(`Webhook secret non configuré (connect=${isConnect})`)

  return stripe.webhooks.constructEvent(payload, signature, secret)
}

/**
 * Retourne la clé publique Stripe pour le client
 */
export function getPublishableKey(): string {
  return process.env.STRIPE_PUBLISHABLE_KEY || ''
}

// === STRIPE BILLING (abonnements recurrents) ===

/**
 * Cree un client Stripe pour une structure (facturation)
 */
export async function createBillingCustomer(
  structureId: string,
  email: string,
  nom: string,
): Promise<string> {
  const stripe = getStripe()
  const customer = await stripe.customers.create({
    email,
    name: nom,
    metadata: { structureId },
  })
  return customer.id
}

/**
 * Cree un abonnement Stripe pour un plan
 */
export async function createBillingSubscription(
  customerId: string,
  priceId: string,
): Promise<{ subscriptionId: string; status: string }> {
  const stripe = getStripe()
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  })
  return {
    subscriptionId: subscription.id,
    status: subscription.status,
  }
}

/**
 * Rapporte l'usage metered a Stripe (depassements)
 */
export async function reportMeteredUsage(
  subscriptionItemId: string,
  quantity: number,
): Promise<void> {
  const stripe = getStripe()
  // Usage records are created via the meter events API or subscription items
  await (stripe.subscriptionItems as unknown as { createUsageRecord: (id: string, params: { quantity: number; action: string }) => Promise<unknown> })
    .createUsageRecord(subscriptionItemId, { quantity, action: 'set' })
}

/**
 * Annule un abonnement Stripe
 */
export async function cancelBillingSubscription(
  subscriptionId: string,
): Promise<void> {
  const stripe = getStripe()
  await stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Retourne l'URL du portail client Stripe (self-service)
 */
export async function getCustomerPortalUrl(
  customerId: string,
  returnUrl: string,
): Promise<string> {
  const stripe = getStripe()
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })
  return session.url
}

/**
 * Recupere les factures d'un client
 */
export async function getCustomerInvoices(
  customerId: string,
  limit = 10,
) {
  const stripe = getStripe()
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  })
  return invoices.data.map(inv => ({
    id: inv.id,
    montantCentimes: inv.amount_due,
    statut: inv.status,
    date: inv.created,
    pdfUrl: inv.invoice_pdf,
    hostedUrl: inv.hosted_invoice_url,
  }))
}
