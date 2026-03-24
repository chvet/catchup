// Utilitaires de validation et nettoyage des entrées utilisateur
// Protège contre : XSS, injection SQL (complémentaire à Drizzle ORM), spam

/**
 * Nettoie une chaîne de caractères des balises HTML et scripts.
 * (Anti-XSS de base — les frameworks React échappent déjà le rendu,
 *  mais on protège aussi les données stockées en DB)
 */
export function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Nettoie un texte de message (conserve les sauts de ligne, supprime les balises).
 */
export function sanitizeMessage(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Supprime les balises <script>
    .replace(/<[^>]*>/g, '') // Supprime toutes les balises HTML
    .replace(/javascript:/gi, '') // Supprime les protocoles javascript:
    .replace(/on\w+\s*=/gi, '') // Supprime les event handlers (onclick=, onerror=, etc.)
    .trim()
}

/**
 * Valide un email professionnel.
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRegex.test(email)
}

/**
 * Valide un numéro de téléphone français.
 */
export function isValidFrenchPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s.-]/g, '')
  return /^(0[1-9]|(\+33|0033)[1-9])\d{8}$/.test(cleaned)
}

/**
 * Valide un département français (01 à 976).
 */
export function isValidDepartement(dep: string): boolean {
  return /^(0[1-9]|[1-9]\d|2[AB]|97[1-6])$/.test(dep)
}

/**
 * Vérifie qu'une chaîne ne contient pas d'injection SQL courante.
 * Note : Drizzle ORM utilise des requêtes paramétrées, donc ce n'est qu'une couche supplémentaire.
 */
export function hasSqlInjection(input: string): boolean {
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|CREATE|EXEC|EXECUTE|UNION)\b)/i,
    /(--|#|\/\*|\*\/)/,
    /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/i, // OR 1=1, AND 1=1
    /(';|";|`)/,  // Quote + semicolon
  ]
  return patterns.some(p => p.test(input))
}

/**
 * Valide et nettoie les paramètres de pagination.
 */
export function sanitizePagination(page: unknown, limit: unknown): { page: number; limit: number } {
  const p = Math.max(1, Math.min(1000, Number(page) || 1))
  const l = Math.max(1, Math.min(100, Number(limit) || 20))
  return { page: p, limit: l }
}

/**
 * Valide la longueur d'un champ texte.
 */
export function validateLength(input: string, min: number, max: number): boolean {
  return input.length >= min && input.length <= max
}

/**
 * Génère un token CSRF.
 */
export function generateCsrfToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('')
}
