// Helpers pour l'espace accompagnement bénéficiaire
// Vérification du token Bearer pour les routes accompagnement

import { db } from '@/data/db'
import { codeVerification, referral, priseEnCharge } from '@/data/schema'
import { eq, and } from 'drizzle-orm'

export async function getBeneficiaireFromToken(request: Request) {
  const auth = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!auth) return null

  const codes = await db
    .select()
    .from(codeVerification)
    .where(and(eq(codeVerification.token, auth), eq(codeVerification.verifie, 1)))

  if (codes.length === 0) return null
  const code = codes[0]

  // Find the prise en charge via referral
  const refs = await db
    .select()
    .from(referral)
    .where(eq(referral.id, code.referralId))

  if (refs.length === 0) return null

  const pecs = await db
    .select()
    .from(priseEnCharge)
    .where(eq(priseEnCharge.referralId, code.referralId))

  if (pecs.length === 0) return null

  return {
    utilisateurId: code.utilisateurId,
    referralId: code.referralId,
    priseEnChargeId: pecs[0].id,
    conseillerId: pecs[0].conseillerId,
  }
}

/**
 * Variante qui accepte un token string directement (pour SSE/query params)
 */
export async function getBeneficiaireFromTokenString(token: string) {
  if (!token) return null

  const codes = await db
    .select()
    .from(codeVerification)
    .where(and(eq(codeVerification.token, token), eq(codeVerification.verifie, 1)))

  if (codes.length === 0) return null
  const code = codes[0]

  const refs = await db
    .select()
    .from(referral)
    .where(eq(referral.id, code.referralId))

  if (refs.length === 0) return null

  const pecs = await db
    .select()
    .from(priseEnCharge)
    .where(eq(priseEnCharge.referralId, code.referralId))

  if (pecs.length === 0) return null

  return {
    utilisateurId: code.utilisateurId,
    referralId: code.referralId,
    priseEnChargeId: pecs[0].id,
    conseillerId: pecs[0].conseillerId,
  }
}
