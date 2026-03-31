# 18 — Securite de la plateforme Catch'Up

> Version : 2.0.0
> Date : 2026-03-31
> Derniere revue securite : 2026-03-31

---

## Vue d'ensemble

Catch'Up traite des donnees sensibles (jeunes en fragilite, donnees RIASEC, conversations privees). La securite est une priorite absolue, couvrant les axes suivants :

1. **Authentification & sessions** — JWT httpOnly, sessions revocables, pas de secret hardcode
2. **Protection brute force** — Rate limiting double couche (Nginx + middleware)
3. **Protection CSRF** — Verification Origin sur tous les endpoints mutants
4. **Headers HTTP** — CSP, HSTS, X-Frame-Options, etc.
5. **Validation des entrees** — Sanitization anti-XSS, validation serveur, magic bytes pour uploads
6. **Anti prompt-injection** — Sanitisation des inputs utilisateur dans les prompts IA
7. **Autorisation** — Verification d'appartenance sur les endpoints sensibles
8. **Infrastructure Nginx** — TLS 1.2+, rate limiting, blocage bots
9. **Audit RGPD** — Tracabilite complete des acces

---

## 1. Authentification

### Conseiller (JWT)
- Hash bcrypt (12 rounds) pour les mots de passe
- JWT signe HS256 via `jose` (edge-compatible)
- **JWT_SECRET sans fallback** : le serveur refuse de demarrer si la variable d'environnement n'est pas definie (pas de secret hardcode)
- Duree de session : **8 heures**
- Stockage cookie : `httpOnly`, `secure` (prod), `sameSite: lax`
- Session stockee en DB (`session_conseiller`) pour revocation
- Payload JWT : `sub`, `email`, `role`, `structureId`, `jti`

### Beneficiaire (Token PIN)
- Code PIN 6 chiffres, envoye par email/SMS
- Expiration : 24h
- Max 5 tentatives de verification
- Token UUID stocke cote client (localStorage)

### Tiers intervenant (Token PIN)
- Code PIN 6 chiffres, envoye par SMS
- Expiration : 48h
- Max 5 tentatives
- Token UUID stocke cote client

---

## 2. Rate Limiting (double couche)

### Couche Nginx (1ere ligne de defense)

| Zone | Limite | Burst | Cible |
|------|--------|-------|-------|
| `login` | 5 req/min | 3 | `/api/conseiller/auth/login`, `/api/*/verify` |
| `api` | 30 req/s | 50 | `/api/*` |
| `general` | 10 req/s | 20 | Toutes les routes |
| `addr` | 50 conn | — | Connexions simultanees par IP |

### Couche middleware Next.js (2eme ligne)

| Endpoint | Limite | Fenetre |
|----------|--------|---------|
| Login conseiller | 50 tentatives / IP | 15 min |
| Verification PIN | 5 tentatives / IP | 15 min |
| API generale | 200 req / IP | 1 min |

Le rate limiter middleware est en memoire (Map), nettoye periodiquement. En cas de scaling multi-instance, migrer vers Redis.

---

## 3. Protection CSRF

- **Verification de l'en-tete Origin** sur toutes les requetes POST/PUT/PATCH/DELETE vers `/api/`
- Seules les origines autorisees sont acceptees (domaines catchup.jaeprive.fr et pro.catchup.jaeprive.fr)
- Les requetes cross-origin sans Origin valide sont bloquees avec HTTP 403
- Exception : les endpoints SSE `/stream` (GET long-polling)
- En dev (localhost) : la verification est desactivee

---

## 4. Headers de securite HTTP

Appliques a **toutes les reponses** via le middleware Next.js :

| Header | Valeur | Protection |
|--------|--------|------------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Force HTTPS 1 an |
| `Content-Security-Policy` | Voir detail ci-dessous | XSS, injection |
| `X-Frame-Options` | `DENY` | Clickjacking |
| `X-Content-Type-Options` | `nosniff` | MIME sniffing |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Fuite de donnees |
| `Permissions-Policy` | Camera/micro self, reste desactive | Surface d'attaque |
| `X-DNS-Prefetch-Control` | `off` | Fuite DNS |
| `X-Download-Options` | `noopen` | Execution auto IE |
| `X-Permitted-Cross-Domain-Policies` | `none` | Flash/PDF |

### Detail CSP

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

## 5. Validation & sanitization des entrees

### Anti prompt-injection (v2.0)
- `userName` dans le system prompt : sanitise (lettres/espaces/tirets uniquement, max 50 chars)
- `structurePrompt` : tronque a 1000 chars, suppression des commentaires HTML `<!-- -->`
- Les inputs utilisateur ne sont jamais interpoles directement dans les prompts systeme

### Validation des uploads audio
- **Verification des magic bytes** du fichier (pas seulement le MIME type client)
- Formats acceptes : WebM (0x1A45DFA3), OGG (OggS), WAV (RIFF), MP4/M4A (ftyp), MP3 (ID3/sync)
- Taille max : 10 Mo (reduit de 25 Mo)
- Les fichiers non reconnus sont rejetes avec HTTP 400

### Fichier `src/lib/sanitize.ts`
- `sanitizeHtml()` — Echappe les balises HTML (anti-XSS stocke)
- `sanitizeMessage()` — Supprime les balises `<script>`, event handlers `onclick=`, protocoles `javascript:`
- `isValidEmail()` — Validation regex stricte
- `isValidFrenchPhone()` — Validation numero FR (0X XX XX XX XX ou +33)
- `isValidDepartement()` — Validation departement FR (01-976)
- `hasSqlInjection()` — Detection de patterns SQL suspects (couche complementaire a Drizzle ORM)
- `sanitizePagination()` — Limite page/limit aux bornes acceptables
- `validateLength()` — Verifie la longueur min/max des champs

### Protection SQL
Drizzle ORM utilise des **requetes parametrees** nativement. La fonction `hasSqlInjection()` est une couche de defense en profondeur.

---

## 6. Autorisation & controle d'acces (v2.0)

### Verification d'appartenance sur les endpoints sensibles
- **Direct messages** (`/api/conseiller/file-active/[id]/direct-messages`) : verification que le conseiller est bien assigne a la prise en charge (`pec.conseillerId === ctx.id`) ou est `super_admin`
- **Referral status** (`/api/referrals/[id]/status`) : validation du format UUID, reponses generiques pour ne pas reveler l'existence d'un referral
- **Signup beneficiaire** (`/api/beneficiaire/auth`) : verification que le `utilisateurId` fourni correspond bien a un utilisateur sans mot de passe ET qu'une conversation existe pour cet utilisateur

### Matrice des roles

| Action | `conseiller` | `admin_structure` | `super_admin` |
|--------|:---:|:---:|:---:|
| Lire ses propres PEC | OK | OK | OK |
| Lire les PEC de sa structure | - | OK | OK |
| Lire toutes les PEC | - | - | OK |
| Envoyer un message direct | PEC assignee | PEC assignee | Toutes |
| Gerer les conseillers | - | Sa structure | Toutes |
| Gerer les structures | - | - | OK |

---

## 7. Infrastructure Nginx

### TLS
- Certificat Let's Encrypt (renouvellement auto Certbot)
- TLS 1.2 / 1.3 uniquement (pas de TLS 1.0/1.1)
- Ciphers modernes (ECDHE, CHACHA20, AES-GCM)
- OCSP Stapling active
- DH params 2048 bits

### Protections
- `server_tokens off` — Masque la version Nginx
- Blocage user-agents malveillants (Scrapy, Nikto, sqlmap, etc.)
- Blocage methodes HTTP inutilisees (seuls GET/POST/PUT/PATCH/DELETE/OPTIONS/HEAD)
- Blocage acces fichiers caches (`.env`, `.git`, etc.)
- Blocage fichiers sensibles (`.sql`, `.log`, `.yml`, etc.)
- `client_max_body_size 10m` — Limite taille upload
- Timeouts serres (body 10s, header 10s, send 30s)

### SSE (Server-Sent Events)
- Pas de rate limiting sur les streams `/stream`
- `proxy_buffering off` + `X-Accel-Buffering no`
- Timeout lecture : 24h (pour les connexions longue duree)

---

## 8. Audit RGPD

Toutes les actions sensibles sont tracees dans `evenement_audit` :

| Action | Description |
|--------|------------|
| `login` | Connexion d'un conseiller |
| `logout` | Deconnexion |
| `view_profile` | Consultation d'un profil beneficiaire |
| `view_conversation` | Consultation de l'historique IA |
| `claim_case` | Prise en charge d'un cas |
| `status_change` | Changement de statut |
| `send_direct_message` | Envoi d'un message direct |
| `invite_tiers` | Invitation d'un tiers |
| `bris_de_glace` | Acces d'urgence aux echanges |

Retention : **2 ans** (conformite RGPD).

---

## 9. Checklist securite

- [x] JWT httpOnly + secure + sameSite
- [x] JWT_SECRET sans fallback hardcode (crash si absent)
- [x] Hashing bcrypt 12 rounds
- [x] Rate limiting double couche (Nginx + middleware)
- [x] Protection CSRF (verification Origin)
- [x] Headers CSP, HSTS, X-Frame, nosniff
- [x] Sanitization des entrees (XSS, injection)
- [x] Anti prompt-injection (sanitisation userName, structurePrompt)
- [x] Validation magic bytes sur les uploads audio
- [x] Verification d'appartenance sur les endpoints sensibles
- [x] Securisation du signup beneficiaire (verification conversationId)
- [x] TLS 1.2+ avec ciphers modernes
- [x] OCSP Stapling
- [x] Blocage bots et scanners
- [x] Blocage fichiers sensibles
- [x] Audit trail RGPD
- [x] Sessions revocables cote serveur
- [x] Tokens PIN avec expiration et limite de tentatives
- [ ] Expiration des tokens beneficiaire (sessionToken) — a implementer
- [ ] Migration vers crypto.getRandomValues() pour les PIN — a implementer
- [ ] WAF (Web Application Firewall) — futur
- [ ] DMARC/SPF pour les emails — futur
- [ ] Tests de penetration externes — futur
- [ ] CSP nonce au lieu de unsafe-inline — futur
- [ ] Rate limiting distribue (Redis) — futur si multi-instance
