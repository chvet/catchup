// Helpers pour l'espace accompagnement bénéficiaire
// Vérification du token Bearer pour les routes accompagnement

import { db } from '@/data/db'
import { codeVerification, referral, priseEnCharge } from '@/data/schema'
import { eq, and } from 'drizzle-orm'

/**
 * Resolve a verified token string to beneficiary context.
 * Accepts either a raw token string or a Request (extracts Bearer token).
 */
export async function getBeneficiaireFromToken(tokenOrRequest: string | Request) {
  const token = typeof tokenOrRequest === 'string'
    ? tokenOrRequest
    : tokenOrRequest.headers.get('Authorization')?.replace('Bearer ', '') ?? ''

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

/**
 * @deprecated Use getBeneficiaireFromToken(tokenString) instead
 */
export const getBeneficiaireFromTokenString = getBeneficiaireFromToken
