// Rate limiter en mémoire (adapté au mono-instance — pas de Redis nécessaire)
// Protège contre le brute force sur les endpoints sensibles (login, vérification PIN, etc.)
//
// MIGRATION MULTI-INSTANCE :
// Si le serveur passe en multi-instance (load balancer), remplacer le Map en mémoire
// par un store Redis partagé. L'interface RateLimitEntry et checkRateLimit() restent identiques,
// seul le backend de stockage change. Installer ioredis et remplacer store.get/set/delete
// par des commandes Redis INCR + EXPIRE. Voir aussi RATE_LIMITS pour les fenêtres.

interface RateLimitEntry {
  count: number
  resetAt: number
}

// Stockage en mémoire — réinitialisé au restart du serveur
// En production multi-instance : utiliser Redis ou un store partagé
const store = new Map<string, RateLimitEntry>()

// Nettoyage périodique des entrées expirées (évite les fuites mémoire)
const CLEANUP_INTERVAL = 60_000 // 1 minute
setInterval(() => {
  const now = Date.now()
  const keys = Array.from(store.keys())
  for (let i = 0; i < keys.length; i++) {
    const entry = store.get(keys[i])
    if (entry && now > entry.resetAt) {
      store.delete(keys[i])
    }
  }
}, CLEANUP_INTERVAL)

interface RateLimitConfig {
  /** Nombre max de requêtes dans la fenêtre */
  maxRequests: number
  /** Durée de la fenêtre en secondes */
  windowSeconds: number
  /** Préfixe pour isoler les différents endpoints */
  prefix: string
}

/** Configurations prédéfinies pour les différents endpoints */
export const RATE_LIMITS = {
  // Login conseiller : 5 tentatives par IP / 15 min (brute force)
  LOGIN: { maxRequests: 5, windowSeconds: 900, prefix: 'login' },

  // Login conseiller par email : 10 tentatives / 30 min (credential stuffing)
  LOGIN_EMAIL: { maxRequests: 10, windowSeconds: 1800, prefix: 'login_email' },

  // Vérification PIN bénéficiaire : 5 tentatives / 15 min
  VERIFY_PIN: { maxRequests: 5, windowSeconds: 900, prefix: 'verify_pin' },

  // Vérification PIN tiers : 5 tentatives / 15 min
  VERIFY_TIERS: { maxRequests: 5, windowSeconds: 900, prefix: 'verify_tiers' },

  // API générale (par IP) : 100 requêtes / minute
  API_GENERAL: { maxRequests: 100, windowSeconds: 60, prefix: 'api' },

  // Création de referral : 3 / heure / IP (anti-spam)
  REFERRAL_CREATE: { maxRequests: 3, windowSeconds: 3600, prefix: 'referral' },

  // Envoi de messages : 30 / minute (anti-flood)
  MESSAGE_SEND: { maxRequests: 30, windowSeconds: 60, prefix: 'message' },
} as const

/**
 * Vérifie si une requête est autorisée par le rate limiter.
 * @param identifier - Identifiant unique (IP, email, etc.)
 * @param config - Configuration du rate limit
 * @returns { allowed, remaining, retryAfterSeconds }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const key = `${config.prefix}:${identifier}`
  const now = Date.now()

  const entry = store.get(key)

  // Pas d'entrée ou fenêtre expirée → autoriser
  if (!entry || now > entry.resetAt) {
    store.set(key, {
      count: 1,
      resetAt: now + config.windowSeconds * 1000,
    })
    return { allowed: true, remaining: config.maxRequests - 1, retryAfterSeconds: 0 }
  }

  // Incrémentation
  entry.count++

  if (entry.count > config.maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  return { allowed: true, remaining: config.maxRequests - entry.count, retryAfterSeconds: 0 }
}

/**
 * Extrait l'IP du client depuis les headers (compatibilité avec Nginx reverse proxy).
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    // Prendre la première IP (celle du client réel)
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return '127.0.0.1'
}

/**
 * Retourne une réponse 429 (Too Many Requests) formatée.
 */
export function rateLimitResponse(retryAfterSeconds: number): Response {
  return new Response(
    JSON.stringify({
      error: 'Trop de tentatives. Veuillez réessayer plus tard.',
      retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
        // Headers de rate limit standard (RFC draft)
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + retryAfterSeconds),
      },
    }
  )
}
