// Headers de sécurité HTTP appliqués à toutes les réponses
// Protège contre : XSS, clickjacking, MIME sniffing, injection, etc.

import { NextResponse } from 'next/server'

/**
 * Applique les headers de sécurité à une réponse NextResponse.
 * Appelé depuis le middleware sur chaque requête.
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  // ── HSTS — Force HTTPS pendant 1 an, inclut les sous-domaines ──
  // (empêche les attaques MITM via downgrade HTTP)
  response.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // ── CSP — Content Security Policy ──
  // (empêche l'injection de scripts malveillants, XSS, data exfiltration)
  const cspDirectives = [
    "default-src 'self'",
    // Scripts : self + inline (React/Next.js en ont besoin) + eval pour les chunks dynamiques
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    // Styles : self + inline (Tailwind génère des styles inline)
    "style-src 'self' 'unsafe-inline' https://unpkg.com",
    // Images : self + data URIs (avatars, icônes) + blob (previews)
    "img-src 'self' data: blob: https://api.qrserver.com https://*.tile.openstreetmap.org",
    // Fonts : self
    "font-src 'self' data:",
    // Connexions API : self + visio WebSocket + OpenAI (chat IA)
    "connect-src 'self' https://api.openai.com wss://visio.catchup.jaeprive.fr ws://localhost:3003 https://geo.api.gouv.fr https://api-adresse.data.gouv.fr",
    // Frames : self uniquement (visio intégrée en composant React)
    "frame-src 'self'",
    // Media : self + blob (visio audio/video playback)
    "media-src 'self' blob:",
    // Objets/embeds : aucun (bloque Flash, PDF embeds, etc.)
    "object-src 'none'",
    // Base URI : self uniquement (empêche le détournement de balise <base>)
    "base-uri 'self'",
    // Form action : self uniquement (empêche la soumission vers un domaine externe)
    "form-action 'self'",
    // Frame ancestors : none (même effet que X-Frame-Options DENY, mais plus moderne)
    "frame-ancestors 'none'",
    // Upgrade insecure requests (force HTTPS pour les sous-ressources)
    'upgrade-insecure-requests',
  ]
  response.headers.set('Content-Security-Policy', cspDirectives.join('; '))

  // ── X-Frame-Options — Anti-clickjacking ──
  // (empêche l'embarquement du site dans une iframe)
  response.headers.set('X-Frame-Options', 'DENY')

  // ── X-Content-Type-Options — Anti-MIME sniffing ──
  // (empêche le navigateur de deviner le type MIME)
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // ── Referrer-Policy — Contrôle des informations envoyées via le header Referer ──
  // (empêche la fuite d'URLs internes vers des sites tiers)
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // ── Permissions-Policy — Désactive les fonctionnalités navigateur inutilisées ──
  // (limite la surface d'attaque : pas de géoloc, pas de micro sauf visio, etc.)
  response.headers.set(
    'Permissions-Policy',
    'camera=(self), microphone=(self), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
  )

  // ── X-DNS-Prefetch-Control — Désactive le DNS prefetch ──
  // (empêche la résolution DNS anticipée qui peut fuiter des informations)
  response.headers.set('X-DNS-Prefetch-Control', 'off')

  // ── X-Download-Options — IE spécifique ──
  // (empêche IE d'ouvrir les téléchargements directement)
  response.headers.set('X-Download-Options', 'noopen')

  // ── X-Permitted-Cross-Domain-Policies — Bloque Flash/PDF cross-domain ──
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none')

  // ── Cache-Control sur les pages dynamiques (pas sur les assets statiques) ──
  // (empêche le cache de données sensibles dans le navigateur)
  const url = response.headers.get('x-middleware-request-url') || ''
  if (url.includes('/api/') || url.includes('/conseiller')) {
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    response.headers.set('Pragma', 'no-cache')
  }

  return response
}
