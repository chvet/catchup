# 18 — Sécurité de la plateforme Catch'Up

> Version : 1.0.0
> Date : 2026-03-23

---

## Vue d'ensemble

Catch'Up traite des données sensibles (jeunes en fragilité, données RIASEC, conversations privées). La sécurité est une priorité absolue, couvrant les axes suivants :

1. **Authentification & sessions** — JWT httpOnly, sessions révocables
2. **Protection brute force** — Rate limiting double couche (Nginx + middleware)
3. **Headers HTTP** — CSP, HSTS, X-Frame-Options, etc.
4. **Validation des entrées** — Sanitization anti-XSS, validation serveur
5. **Infrastructure Nginx** — TLS 1.2+, rate limiting, blocage bots
6. **Audit RGPD** — Traçabilité complète des accès

---

## 1. Authentification

### Conseiller (JWT)
- Hash bcrypt (12 rounds) pour les mots de passe
- JWT signé HS256 via `jose` (edge-compatible)
- Durée de session : **8 heures**
- Stockage cookie : `httpOnly`, `secure` (prod), `sameSite: lax`
- Session stockée en DB (`session_conseiller`) pour révocation
- Payload JWT : `sub`, `email`, `role`, `structureId`, `jti`

### Bénéficiaire (Token PIN)
- Code PIN 6 chiffres, envoyé par email/SMS
- Expiration : 24h
- Max 5 tentatives de vérification
- Token UUID stocké côté client (localStorage)

### Tiers intervenant (Token PIN)
- Code PIN 6 chiffres, envoyé par SMS
- Expiration : 48h
- Max 5 tentatives
- Token UUID stocké côté client

---

## 2. Rate Limiting (double couche)

### Couche Nginx (1ère ligne de défense)

| Zone | Limite | Burst | Cible |
|------|--------|-------|-------|
| `login` | 5 req/min | 3 | `/api/conseiller/auth/login`, `/api/*/verify` |
| `api` | 30 req/s | 50 | `/api/*` |
| `general` | 10 req/s | 20 | Toutes les routes |
| `addr` | 50 conn | — | Connexions simultanées par IP |

### Couche middleware Next.js (2ème ligne)

| Endpoint | Limite | Fenêtre |
|----------|--------|---------|
| Login conseiller | 5 tentatives / IP | 15 min |
| Vérification PIN | 5 tentatives / IP | 15 min |
| API générale | 200 req / IP | 1 min |

Le rate limiter middleware est en mémoire (Map), nettoyé périodiquement. En cas de scaling multi-instance, migrer vers Redis.

---

## 3. Headers de sécurité HTTP

Appliqués à **toutes les réponses** via le middleware Next.js :

| Header | Valeur | Protection |
|--------|--------|------------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Force HTTPS 1 an |
| `Content-Security-Policy` | Voir détail ci-dessous | XSS, injection |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Fuite de données |
| `Permissions-Policy` | Camera/micro self, reste désactivé | Surface d'attaque |
| `X-DNS-Prefetch-Control` | `off` | Fuite DNS |
| `X-Download-Options` | `noopen` | Exécution auto IE |
| `X-Permitted-Cross-Domain-Policies` | `none` | Flash/PDF |

### Détail CSP

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self' https://api.openai.com wss://*.jitsi.net https://*.jitsi.net;
frame-src https://*.jitsi.net;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests
```

---

## 4. Validation & sanitization des entrées

### Fichier `src/lib/sanitize.ts`

- `sanitizeHtml()` — Échappe les balises HTML (anti-XSS stocké)
- `sanitizeMessage()` — Supprime les balises `<script>`, event handlers `onclick=`, protocoles `javascript:`
- `isValidEmail()` — Validation regex stricte
- `isValidFrenchPhone()` — Validation numéro FR (0X XX XX XX XX ou +33)
- `isValidDepartement()` — Validation département FR (01-976)
- `hasSqlInjection()` — Détection de patterns SQL suspects (couche complémentaire à Drizzle ORM)
- `sanitizePagination()` — Limite page/limit aux bornes acceptables
- `validateLength()` — Vérifie la longueur min/max des champs

### Protection SQL
Drizzle ORM utilise des **requêtes paramétrées** nativement — pas d'injection SQL possible via l'ORM. La fonction `hasSqlInjection()` est une couche de défense en profondeur.

---

## 5. Infrastructure Nginx

### TLS
- Certificat Let's Encrypt (renouvellement auto Certbot)
- TLS 1.2 / 1.3 uniquement (pas de TLS 1.0/1.1)
- Ciphers modernes (ECDHE, CHACHA20, AES-GCM)
- OCSP Stapling activé
- DH params 2048 bits

### Protections
- `server_tokens off` — Masque la version Nginx
- Blocage user-agents malveillants (Scrapy, Nikto, sqlmap, etc.)
- Blocage méthodes HTTP inutilisées (seuls GET/POST/PUT/PATCH/DELETE/OPTIONS/HEAD)
- Blocage accès fichiers cachés (`.env`, `.git`, etc.)
- Blocage fichiers sensibles (`.sql`, `.log`, `.yml`, etc.)
- `client_max_body_size 10m` — Limite taille upload
- Timeouts serrés (body 10s, header 10s, send 30s)

### SSE (Server-Sent Events)
- Pas de rate limiting sur les streams `/stream`
- `proxy_buffering off` + `X-Accel-Buffering no`
- Timeout lecture : 24h (pour les connexions longue durée)

---

## 6. Audit RGPD

Toutes les actions sensibles sont tracées dans `evenement_audit` :

| Action | Description |
|--------|------------|
| `login` | Connexion d'un conseiller |
| `logout` | Déconnexion |
| `view_profile` | Consultation d'un profil bénéficiaire |
| `view_conversation` | Consultation de l'historique IA |
| `claim_case` | Prise en charge d'un cas |
| `status_change` | Changement de statut |
| `send_direct_message` | Envoi d'un message direct |
| `invite_tiers` | Invitation d'un tiers |
| `bris_de_glace` | Accès d'urgence aux échanges |

Rétention : **2 ans** (conformité RGPD).

---

## 7. Checklist sécurité

- [x] JWT httpOnly + secure + sameSite
- [x] Hashing bcrypt 12 rounds
- [x] Rate limiting double couche (Nginx + middleware)
- [x] Headers CSP, HSTS, X-Frame, nosniff
- [x] Sanitization des entrées (XSS, injection)
- [x] TLS 1.2+ avec ciphers modernes
- [x] OCSP Stapling
- [x] Blocage bots et scanners
- [x] Blocage fichiers sensibles
- [x] Audit trail RGPD
- [x] Sessions révocables côté serveur
- [x] Tokens PIN avec expiration et limite de tentatives
- [ ] WAF (Web Application Firewall) — futur
- [ ] DMARC/SPF pour les emails — futur
- [ ] Tests de pénétration externes — futur
- [ ] CSP nonce au lieu de unsafe-inline — futur (quand Next.js le supportera proprement)
