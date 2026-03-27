// Intégration API Parcoureo (Fondation JAE)
// SSO + synchronisation bidirectionnelle des profils bénéficiaires
//
// Architecture stub : toutes les fonctions retournent null/false quand
// PARCOUREO_API_KEY n'est pas configuré. Remplacer les TODO par les
// vrais appels API quand l'accès sera disponible.

// ── Configuration ──

const PARCOUREO_API_URL = process.env.PARCOUREO_API_URL || 'https://api.parcoureo.fr'
const PARCOUREO_API_KEY = process.env.PARCOUREO_API_KEY || ''

/** Vérifie si l'intégration Parcoureo est configurée */
export function isParcoureoConfigured(): boolean {
  return !!PARCOUREO_API_KEY && !!PARCOUREO_API_URL
}

/** Retourne l'URL de la page de login Parcoureo */
export function getParcoureoLoginUrl(redirectUri: string): string {
  return `${PARCOUREO_API_URL}/auth/login?redirect=${encodeURIComponent(redirectUri)}`
}

/** Retourne l'URL de base Parcoureo (pour l'affichage) */
export function getParcoureoBaseUrl(): string {
  return PARCOUREO_API_URL
}

// ── Types ──

export interface ParcoureoUser {
  email: string
  prenom: string
  nom: string
  role: 'conseiller' | 'admin'
  structureExterne?: string
  parcoureoId?: string
}

export interface BeneficiaireProfile {
  prenom: string
  email?: string
  age?: number
  riasec?: { r: number; i: number; a: number; s: number; e: number; c: number }
  interets?: string[]
  traits?: string[]
}

// ── SSO : Validation du token Parcoureo ──

/**
 * Valide un token SSO Parcoureo et retourne les informations utilisateur.
 * Retourne null si l'intégration n'est pas configurée ou si le token est invalide.
 */
export async function validateParcoureoToken(token: string): Promise<ParcoureoUser | null> {
  if (!isParcoureoConfigured()) {
    console.log('[Parcoureo] Integration non configuree (PARCOUREO_API_KEY manquant)')
    return null
  }

  try {
    // TODO: Remplacer par le vrai appel API
    // const response = await fetch(`${PARCOUREO_API_URL}/api/auth/validate`, {
    //   method: 'GET',
    //   headers: {
    //     'Authorization': `Bearer ${token}`,
    //     'X-API-Key': PARCOUREO_API_KEY,
    //     'Accept': 'application/json',
    //   },
    // })
    //
    // if (!response.ok) return null
    //
    // const data = await response.json()
    // return {
    //   email: data.email,
    //   prenom: data.prenom,
    //   nom: data.nom,
    //   role: data.role === 'admin' ? 'admin' : 'conseiller',
    //   structureExterne: data.structureId || undefined,
    //   parcoureoId: data.id || undefined,
    // }

    console.log('[Parcoureo] Stub: validateParcoureoToken() — token recu, pas de validation reelle')
    void token // empêcher le warning unused
    return null
  } catch (error) {
    console.error('[Parcoureo] Erreur validation token:', error)
    return null
  }
}

// ── Sync : Envoyer un profil bénéficiaire vers Parcoureo ──

/**
 * Synchronise un profil bénéficiaire vers Parcoureo (push).
 * Retourne true si la sync a réussi, false sinon.
 */
export async function syncBeneficiaireToParcoureo(profile: BeneficiaireProfile): Promise<boolean> {
  if (!isParcoureoConfigured()) return false

  try {
    // TODO: Remplacer par le vrai appel API
    // const response = await fetch(`${PARCOUREO_API_URL}/api/beneficiaires/sync`, {
    //   method: 'POST',
    //   headers: {
    //     'X-API-Key': PARCOUREO_API_KEY,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify(profile),
    // })
    //
    // return response.ok

    console.log('[Parcoureo] Stub: syncBeneficiaireToParcoureo()', profile.prenom || 'anonyme')
    return false
  } catch (error) {
    console.error('[Parcoureo] Erreur sync beneficiaire (push):', error)
    return false
  }
}

// ── Sync : Récupérer un profil bénéficiaire depuis Parcoureo ──

/**
 * Récupère un profil bénéficiaire depuis Parcoureo par email (pull).
 * Retourne null si non trouvé ou si l'intégration n'est pas configurée.
 */
export async function getBeneficiaireFromParcoureo(email: string): Promise<BeneficiaireProfile | null> {
  if (!isParcoureoConfigured()) return null

  try {
    // TODO: Remplacer par le vrai appel API
    // const response = await fetch(
    //   `${PARCOUREO_API_URL}/api/beneficiaires?email=${encodeURIComponent(email)}`,
    //   {
    //     headers: {
    //       'X-API-Key': PARCOUREO_API_KEY,
    //       'Accept': 'application/json',
    //     },
    //   }
    // )
    //
    // if (!response.ok) return null
    //
    // const data = await response.json()
    // return {
    //   prenom: data.prenom,
    //   email: data.email,
    //   age: data.age,
    //   riasec: data.riasec,
    //   interets: data.interets,
    //   traits: data.traits,
    // }

    console.log('[Parcoureo] Stub: getBeneficiaireFromParcoureo()', email)
    return null
  } catch (error) {
    console.error('[Parcoureo] Erreur recuperation beneficiaire (pull):', error)
    return null
  }
}
