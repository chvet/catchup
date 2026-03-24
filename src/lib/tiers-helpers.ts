// Helper — Authentification des tiers intervenants par token
// (même pattern que accompagnement-helpers.ts, pour les routes /api/tiers/*)

import { db } from '@/data/db'
import { codeVerification, tiersIntervenant, priseEnCharge } from '@/data/schema'
import { eq, and } from 'drizzle-orm'

interface TiersContext {
  tiersId: string
  priseEnChargeId: string
  conseillerId: string
  nom: string
  prenom: string
  role: string
}

export async function getTiersFromToken(request: Request): Promise<TiersContext> {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    throw new Error('Token manquant')
  }
  return getTiersFromTokenString(authHeader.replace('Bearer ', ''))
}

export async function getTiersFromTokenString(token: string): Promise<TiersContext> {
  // Chercher le code de vérification avec ce token
  const codes = await db
    .select()
    .from(codeVerification)
    .where(and(eq(codeVerification.token, token), eq(codeVerification.verifie, 1)))

  if (codes.length === 0) throw new Error('Token invalide ou expiré')

  const code = codes[0]

  // Le utilisateurId contient le tiersIntervenant.id pour les tiers
  const tiers = await db
    .select()
    .from(tiersIntervenant)
    .where(and(eq(tiersIntervenant.id, code.utilisateurId), eq(tiersIntervenant.statut, 'approuve')))

  if (tiers.length === 0) throw new Error('Tiers non trouvé ou non approuvé')

  const t = tiers[0]

  // Récupérer la prise en charge pour avoir le conseiller
  const pecs = await db
    .select()
    .from(priseEnCharge)
    .where(eq(priseEnCharge.id, t.priseEnChargeId))

  if (pecs.length === 0) throw new Error('Prise en charge non trouvée')

  return {
    tiersId: t.id,
    priseEnChargeId: t.priseEnChargeId,
    conseillerId: pecs[0].conseillerId,
    nom: t.nom,
    prenom: t.prenom,
    role: t.role,
  }
}
