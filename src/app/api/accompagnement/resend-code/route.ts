// POST /api/accompagnement/resend-code
// Renvoie un nouveau code PIN au bénéficiaire (quand l'ancien a expiré)

import { db } from '@/data/db'
import { referral, codeVerification, priseEnCharge, conseiller, utilisateur } from '@/data/schema'
import { eq, and } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { NextResponse } from 'next/server'
import { sendPinCode } from '@/lib/sms'
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit'

export async function POST(request: Request) {
  try {
    // Rate limit : 3 renvois / 15 min / IP
    const ip = getClientIP(request)
    const rl = checkRateLimit(ip, { maxRequests: 10, windowSeconds: 900, prefix: 'resend_pin' })
    if (!rl.allowed) return rateLimitResponse(rl.retryAfterSeconds)

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email ou telephone requis' }, { status: 400 })
    }

    const contact = email.toLowerCase().trim()

    // Trouver le referral avec prise_en_charge active
    const refs = await db
      .select()
      .from(referral)
      .where(eq(referral.moyenContact, contact))

    const activeRef = refs.find(r => r.statut === 'prise_en_charge') || refs.find(r => r.statut === 'en_attente')

    if (!activeRef) {
      // Message générique pour ne pas révéler l'existence du dossier
      return NextResponse.json({ sent: true, message: 'Si un dossier existe, un nouveau code a ete envoye.' })
    }

    // Invalider les anciens codes non vérifiés
    const oldCodes = await db
      .select()
      .from(codeVerification)
      .where(
        and(
          eq(codeVerification.referralId, activeRef.id),
          eq(codeVerification.verifie, 0)
        )
      )

    const now = new Date().toISOString()
    for (const old of oldCodes) {
      await db
        .update(codeVerification)
        .set({ expireLe: now })
        .where(eq(codeVerification.id, old.id))
    }

    // Générer un nouveau code
    const randomBytes = new Uint32Array(1)
    crypto.getRandomValues(randomBytes)
    const code = String(100000 + (randomBytes[0] % 900000))
    const token = uuidv4()
    const expireLe = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    await db.insert(codeVerification).values({
      id: uuidv4(),
      referralId: activeRef.id,
      utilisateurId: activeRef.utilisateurId,
      code,
      token,
      verifie: 0,
      tentatives: 0,
      expireLe,
      creeLe: now,
    })

    // Récupérer le prénom du bénéficiaire et le nom du conseiller
    let beneficiairePrenom: string | undefined
    const users = await db.select().from(utilisateur).where(eq(utilisateur.id, activeRef.utilisateurId))
    if (users.length > 0) beneficiairePrenom = users[0].prenom || undefined

    let conseillerPrenom: string | undefined
    const pecs = await db.select().from(priseEnCharge).where(eq(priseEnCharge.referralId, activeRef.id))
    if (pecs.length > 0) {
      const conseillers = await db.select().from(conseiller).where(eq(conseiller.id, pecs[0].conseillerId))
      if (conseillers.length > 0) conseillerPrenom = conseillers[0].prenom || undefined
    }

    // Envoyer le code
    await sendPinCode(contact, code, {
      type: 'beneficiaire',
      prenom: beneficiairePrenom,
      conseillerPrenom,
    })

    console.log(`[PIN RESEND BENEF] Code renvoyé à ${contact}`)

    return NextResponse.json({ sent: true, message: 'Un nouveau code a ete envoye.' })
  } catch (error) {
    console.error('[Resend Code Benef]', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
