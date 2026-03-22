# 14 — Sécurité & RGPD

## Principe directeur
**Protéger sans compliquer.** Le jeune ne doit jamais se sentir fliqué ni submergé par des bannières légales. La sécurité et la conformité RGPD sont intégrées dans l'architecture technique, pas plaquées en surcouche. Le jeune est protégé par défaut, même s'il ne lit jamais les CGU.

**Deux engagements non négociables :**
1. Les données du jeune ne sont jamais vendues, jamais partagées avec des tiers
2. Le jeune peut tout supprimer en un clic, à tout moment

---

## 1. Sécurité technique

### 1.1 HTTPS et transport

| Mesure | Implémentation | Pourquoi |
|--------|---------------|----------|
| HTTPS obligatoire | Let's Encrypt + Nginx redirect 80→443 | Chiffrement de toutes les communications |
| TLS 1.3 minimum | Configuration Nginx : `ssl_protocols TLSv1.3;` | Protocole le plus récent et sûr |
| HSTS | `Strict-Transport-Security: max-age=31536000; includeSubDomains` | Empêche le downgrade vers HTTP |
| Certificat auto-renouvelé | Cron Certbot toutes les 12h | Jamais d'expiration accidentelle |

### 1.2 En-têtes de sécurité HTTP

Configurés dans Nginx pour toutes les réponses :

```nginx
# Empêche l'embarquement dans un iframe tiers (anti-clickjacking)
add_header X-Frame-Options "SAMEORIGIN" always;

# Empêche le navigateur de deviner le type MIME (anti-sniffing)
add_header X-Content-Type-Options "nosniff" always;

# Active la protection XSS du navigateur
add_header X-XSS-Protection "1; mode=block" always;

# Politique de référent : ne pas fuiter l'URL complète vers des sites tiers
add_header Referrer-Policy "strict-origin-when-cross-origin" always;

# Politique de permissions : désactive les APIs inutiles
add_header Permissions-Policy "camera=(), microphone=(self), geolocation=(), payment=()" always;

# Content Security Policy : contrôle strict des sources autorisées
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://plausible.io;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self';
  connect-src 'self' https://api.openai.com https://plausible.io;
  media-src 'self' blob:;
  frame-src 'none';
" always;
```

### 1.3 Cookies

| Cookie | Type | Durée | Attributs |
|--------|------|-------|-----------|
| `catchup_session` | Session authentifiée | 90 jours (web), 1 an (app) | `HttpOnly; Secure; SameSite=Strict; Path=/` |
| Aucun cookie tiers | — | — | Catch'Up n'utilise aucun cookie tiers |
| Aucun cookie analytics | — | — | Plausible fonctionne sans cookies |

**`HttpOnly`** : le cookie n'est pas accessible par JavaScript (protection XSS)
**`Secure`** : le cookie n'est envoyé que sur HTTPS
**`SameSite=Strict`** : le cookie n'est pas envoyé lors de requêtes cross-site (protection CSRF)

### 1.4 Protection contre les attaques courantes

#### Injection SQL
- **Protection :** Drizzle ORM utilise des requêtes paramétrées par défaut
- **Règle :** Jamais de concaténation de chaînes dans les requêtes SQL
- **Vérification :** Revue de code systématique sur les routes API

#### Cross-Site Scripting (XSS)
- **Protection :** React échappe automatiquement le contenu rendu
- **Règle :** Jamais de `dangerouslySetInnerHTML` sauf pour le markdown contrôlé
- **CSP :** La Content Security Policy bloque les scripts non autorisés
- **Nettoyage :** Les messages du jeune sont nettoyés avant affichage (pas de HTML interprété)

#### Cross-Site Request Forgery (CSRF)
- **Protection :** Cookie `SameSite=Strict` + vérification de l'en-tête `Origin`
- **API :** Les routes POST vérifient que la requête vient du même domaine

#### Déni de service (rate limiting)

| Endpoint | Limite | Fenêtre | Action si dépassé |
|----------|--------|---------|------------------|
| `/api/chat` | 30 requêtes | par minute par IP | Réponse 429 + attente 60s |
| `/api/magic-link` | 3 requêtes | par email par heure | Réponse 429 + message "Trop de tentatives" |
| `/api/referrals` | 5 requêtes | par utilisateur par heure | Réponse 429 |
| `/api/evenements` | 60 requêtes | par minute par IP | Réponse 429 |
| `/api/admin/*` | 10 requêtes | par minute par IP | Réponse 429 + log |

**Implémentation :** Middleware `rate-limiter` basé sur l'IP (en mémoire pour le MVP, Redis si besoin de montée en charge).

```typescript
// src/middleware/rate-limit.ts

interface LimiteDebit {
  maxRequetes: number
  fenetreMs: number
}

const LIMITES: Record<string, LimiteDebit> = {
  '/api/chat': { maxRequetes: 30, fenetreMs: 60_000 },
  '/api/magic-link': { maxRequetes: 3, fenetreMs: 3_600_000 },
  '/api/referrals': { maxRequetes: 5, fenetreMs: 3_600_000 },
}
```

#### Abus de l'IA
- **Contenu inapproprié :** Le prompt système interdit à l'IA de répondre à des sujets hors orientation
- **Injection de prompt :** Le message du jeune est envoyé dans le rôle `user`, jamais dans le `system` prompt
- **Boucle infinie :** Maximum 100 messages par conversation (au-delà : "On a bien discuté ! Pour aller plus loin, parle à un conseiller 😊")
- **Coût :** Suivi quotidien de la consommation OpenAI, alerte si > seuil journalier

---

### 1.5 Sécurité des clés et secrets

| Secret | Stockage | Accès |
|--------|----------|-------|
| `OPENAI_API_KEY` | Variable d'environnement serveur | Jamais dans le code, jamais côté client |
| `TURSO_AUTH_TOKEN` | Variable d'environnement serveur | Idem |
| `VAPID_PRIVATE_KEY` | Variable d'environnement serveur | Idem |
| `EMAIL_API_KEY` | Variable d'environnement serveur | Idem |
| `REFERRAL_WEBHOOK_TOKEN` | Variable d'environnement serveur | Idem |
| `ADMIN_MOT_DE_PASSE_HASH` | Variable d'environnement serveur | Hashé (bcrypt), jamais en clair |

**Règles :**
- Le fichier `.env` est dans `.gitignore` (jamais versionné)
- Les clés API ne sont JAMAIS exposées côté client (pas dans le bundle JS)
- Rotation des clés API tous les 6 mois
- Si une clé est compromise : révocation immédiate + rotation

### 1.6 Sécurité du serveur (Hetzner)

| Mesure | Configuration |
|--------|--------------|
| Pare-feu (UFW) | Ports 22 (SSH), 80 (HTTP), 443 (HTTPS) uniquement |
| SSH | Clé SSH uniquement (pas de mot de passe), port 22 |
| Docker | L'app tourne dans un conteneur isolé |
| Mises à jour | `unattended-upgrades` activé (patches de sécurité automatiques) |
| Sauvegardes | Snapshot Hetzner hebdomadaire + export Turso quotidien |
| Monitoring | Surveillance CPU/RAM/disque (alerte si > 80%) |
| Accès root | Désactivé pour SSH, utilisation d'un compte sudo |

---

## 2. RGPD — Conformité

### 2.1 Base légale par traitement

| Traitement | Données concernées | Base légale | Justification |
|------------|-------------------|-------------|---------------|
| Navigation anonyme | ID anonyme, messages, profil RIASEC | Intérêt légitime | Le service ne fonctionne pas sans (pas de collecte excessive) |
| Analytics (Plausible) | Pages visitées (sans IP, sans cookies) | Intérêt légitime | Données agrégées, pas de suivi individuel |
| Collecte email | Adresse email | Consentement explicite | Le jeune fournit son email volontairement dans la conversation |
| Envoi de relances | Email | Intérêt légitime (transactionnel) / Consentement (contenu) | Relances liées au service = intérêt légitime. Newsletter = consentement |
| Mise en relation conseiller | Prénom, contact, profil, résumé | Consentement explicite | Le jeune accepte la transmission dans la conversation |
| Inscription prescripteur | Nom, email pro, structure | Exécution du contrat | Le prescripteur s'inscrit pour utiliser le service |
| Détection de fragilité | Analyse du contenu des messages | Intérêt vital | Protection de la personne (prévention du suicide) |

### 2.2 Minimisation des données

**Principe :** Ne collecter que ce qui est strictement nécessaire au fonctionnement du service.

| Donnée | Collectée ? | Pourquoi |
|--------|------------|----------|
| Prénom | Oui (dans la conversation) | Personnalisation du chat |
| Nom de famille | Non | Pas nécessaire |
| Adresse postale | Non | Pas nécessaire |
| Numéro de téléphone | Seulement si le jeune le donne pour le referral | Mise en relation conseiller |
| Adresse email | Seulement si le jeune accepte la sauvegarde | Persistance et reconnexion |
| Date de naissance | Non | Pas nécessaire (l'âge est estimé dans la conversation) |
| Géolocalisation | Non | Pas nécessaire |
| Adresse IP | Non (Plausible ne la stocke pas) | Pas nécessaire |
| Photo / image | Non | Pas nécessaire |
| Contacts du téléphone | Non | Pas nécessaire |

### 2.3 Droits des personnes

#### Droit d'accès (article 15)
Le jeune peut consulter toutes ses données à tout moment :
- **Comment :** Bouton "Mes données" dans les paramètres de l'app
- **Contenu :** Export JSON de tout le profil (profil RIASEC, messages, préférences, badges)
- **Délai :** Instantané (généré côté client depuis le localStorage + requête serveur si authentifié)

#### Droit de rectification (article 16)
Le jeune peut modifier ses données :
- **Comment :** Dans les paramètres : modifier son prénom, email
- **Profil RIASEC :** Le profil évolue naturellement avec la conversation — le jeune peut aussi le réinitialiser

#### Droit à l'effacement (article 17)
Le jeune peut supprimer toutes ses données :
- **Comment :** Bouton "Supprimer mes données" dans les paramètres
- **Confirmation :** Double confirmation ("Es-tu sûr ? Cette action est irréversible")
- **Effet immédiat :**
  1. `localStorage` vidé côté client
  2. Requête API de suppression côté serveur
  3. Toutes les données en base passent en soft delete (`supprime_le = maintenant`)
  4. Purge définitive après 30 jours (délai légal de rétractation)
- **Ce qui est supprimé :** Utilisateur, conversations, messages, profil, instantanés, badges, progression, referrals, notifications
- **Ce qui est conservé (anonymisé) :** Statistiques agrégées (compteurs dans `source_captation`), événements quiz anonymisés

#### Droit à la portabilité (article 20)
Le jeune peut exporter ses données dans un format réutilisable :
- **Format :** JSON structuré
- **Contenu :** Profil complet, historique des conversations, profil RIASEC avec historique d'évolution
- **Comment :** Bouton "Exporter mes données" dans les paramètres → téléchargement d'un fichier `.json`

#### Droit d'opposition (article 21)
Le jeune peut s'opposer à certains traitements :
- **Relances par email :** Lien de désinscription dans chaque email
- **Notifications push :** Désactivables dans les paramètres
- **Analytics :** Plausible respecte le header `Do-Not-Track` du navigateur

### 2.4 Consentement

#### Quand on demande le consentement

| Moment | Ce qu'on demande | Comment |
|--------|-----------------|---------|
| Collecte email | "Tu veux que je retienne tout ça ? Il me faut juste ton email 😊" | Dans la conversation (pas un popup) |
| Mise en relation conseiller | "Je peux lui envoyer ton profil pour que tu n'aies pas à tout répéter. Tu veux ?" | Dans la conversation |
| Newsletter / contenu récurrent | "Tu veux recevoir des actus orientation chaque semaine ?" | Opt-in explicite dans les paramètres |
| Notifications push | Invite native du navigateur | API `Notification.requestPermission()` |

#### Quand on ne demande PAS le consentement

| Traitement | Pourquoi pas de consentement |
|------------|------------------------------|
| Stockage local (localStorage) | Nécessaire au fonctionnement, pas des cookies |
| Analyse Plausible | Sans cookies, sans données personnelles, intérêt légitime |
| Détection de fragilité | Intérêt vital (protection de la personne) |
| Relances transactionnelles | Intérêt légitime (liées au service utilisé) |

### 2.5 Mineurs (< 18 ans)

**Cadre légal :** Le RGPD (article 8) et la loi française fixent à **15 ans** l'âge à partir duquel un mineur peut consentir seul au traitement de ses données pour un service en ligne.

| Situation | Règle Catch'Up |
|-----------|---------------|
| 16-17 ans | Peut utiliser Catch'Up sans restriction (> 15 ans, consentement valide) |
| 15 ans | Idem |
| < 15 ans | En théorie, consentement parental nécessaire. En pratique : Catch'Up fonctionne en mode anonyme sans collecte de données personnelles → pas besoin de consentement |

**Mesures spécifiques :**
- Pas de collecte d'email imposée (le mode anonyme est pleinement fonctionnel)
- Pas de vérification d'âge (on n'est pas un réseau social)
- Si un parent demande la suppression des données de son enfant → suppression immédiate sur preuve de parentalité (email à `rgpd@fondation-jae.org`)
- Langage des CGU adapté : version simplifiée pour les jeunes ("En gros, tes données t'appartiennent et on ne les vend à personne")

### 2.6 Durées de conservation

| Donnée | Durée | Déclencheur de purge |
|--------|-------|---------------------|
| Utilisateur anonyme sans activité | 6 mois après dernière visite | Tâche cron hebdomadaire |
| Utilisateur supprimé (soft delete) | 30 jours après demande | Tâche cron quotidienne |
| Conversations d'utilisateurs supprimés | Avec l'utilisateur (30 jours) | Idem |
| Magic links expirés | 24h après expiration | Tâche cron quotidienne |
| Instantanés de profil | 20 derniers par conversation | À chaque nouvelle extraction |
| Logs serveur (accès Nginx) | 90 jours | Rotation logrotate |
| Sauvegardes Turso | 30 jours | Rotation automatique |
| Événements quiz anonymes | 2 ans | Tâche cron annuelle |
| Données prescripteur | Tant que le compte est actif + 1 an après désactivation | Sur demande ou inactivité |

### 2.7 Sous-traitants

| Sous-traitant | Service | Données concernées | Localisation | Garanties |
|---------------|---------|-------------------|-------------|-----------|
| OpenAI | API GPT-4o (conversation IA) | Messages de la conversation | États-Unis | DPA signé, données non utilisées pour l'entraînement (option API) |
| Hetzner | Hébergement serveur | Toutes les données en base | Allemagne (UE) | Conforme RGPD, certifié ISO 27001 |
| Turso | Base de données | Toutes les données en base | UE (configurable) | Conforme RGPD |
| Resend (ou Brevo) | Envoi d'emails | Adresses email | UE / États-Unis | DPA signé |
| Plausible | Analytics | Aucune donnée personnelle | UE | Conforme RGPD par conception |

**Point d'attention OpenAI :**
- Les données envoyées à l'API OpenAI ne sont **pas utilisées pour entraîner** les modèles (option désactivée via les paramètres du compte API)
- Les messages sont transmis pour générer la réponse, puis supprimés par OpenAI après 30 jours (politique de rétention API)
- Pour une conformité maximale : envisager un hébergement EU de l'IA (Azure OpenAI en région Europe, ou modèle open source auto-hébergé) en v2

---

## 3. Pages légales

### 3.1 Mentions légales — `/mentions-legales`

Contenu obligatoire :
- Éditeur : Fondation JAE, [adresse], [SIRET]
- Directeur de publication : [nom]
- Hébergeur : Hetzner Online GmbH, Industriestr. 25, 91710 Gunzenhausen, Allemagne
- Contact : contact@fondation-jae.org

### 3.2 Politique de confidentialité — `/confidentialite`

Contenu structuré :
1. Qui sommes-nous (Fondation JAE)
2. Quelles données collectons-nous (tableau clair)
3. Pourquoi (finalités et bases légales)
4. Combien de temps (durées de conservation)
5. Avec qui partageons-nous (sous-traitants)
6. Vos droits (accès, rectification, effacement, portabilité, opposition)
7. Comment exercer vos droits (email `rgpd@fondation-jae.org` + boutons in-app)
8. Cookies (on n'en utilise qu'un seul, technique, httpOnly)
9. Modifications de cette politique (date de dernière mise à jour)

**Ton :** Clair et accessible. Pas de jargon juridique inutile. Version "en langage simple" en haut, version juridique complète en dessous.

**Exemple d'introduction :**
> **En bref :** Tes données t'appartiennent. On ne les vend pas, on ne les partage pas. Tu peux tout supprimer quand tu veux. On utilise tes messages uniquement pour t'aider à t'orienter.
>
> _Pour les détails juridiques, lis la suite._

### 3.3 Conditions Générales d'Utilisation — `/cgu`

Contenu :
1. Objet du service
2. Accès au service (gratuit, ouvert à tous)
3. Utilisation acceptable (pas de contenu illégal, pas d'abus de l'IA)
4. Propriété intellectuelle (le contenu IA n'est pas garanti, pas de conseil professionnel)
5. Limitation de responsabilité (Catch'Up ne remplace pas un professionnel de santé ou d'orientation)
6. Données personnelles (renvoi vers la politique de confidentialité)
7. Modification des CGU
8. Droit applicable (droit français, tribunaux de [ville du siège JAE])

### 3.4 Déclaration d'accessibilité — `/accessibilite`

Cf. spec 12. Obligatoire pour un service d'intérêt public.

---

## 4. Registre des traitements

**Obligatoire** pour la Fondation JAE (organisme de plus de 250 salariés, ou traitement de données sensibles).

| Traitement | Responsable | Finalité | Catégories de données | Destinataires | Durée | Mesures de sécurité |
|------------|------------|----------|----------------------|---------------|-------|-------------------|
| Conversation IA | Fondation JAE | Accompagnement orientation | Messages, profil RIASEC | OpenAI (sous-traitant) | 6 mois (anonyme), sur demande (authentifié) | Chiffrement TLS, accès restreint |
| Mise en relation | Fondation JAE | Orientation vers un conseiller | Prénom, contact, profil, résumé | Conseiller (avec consentement) | Durée de l'accompagnement + 1 an | Chiffrement, consentement explicite |
| Analytics | Fondation JAE | Amélioration du service | Pages visitées (agrégées) | Plausible (sous-traitant) | 2 ans | Pas de données personnelles |
| Gestion prescripteurs | Fondation JAE | Outil professionnel | Nom, email, structure | Fondation JAE uniquement | Durée du compte + 1 an | Accès authentifié |
| Détection fragilité | Fondation JAE | Protection des personnes | Analyse sémantique des messages | Conseillers (si urgence) | Durée de la conversation | Accès restreint, alertes sécurisées |

---

## 5. Procédures d'incident

### Violation de données (data breach)

**Procédure en cas de fuite de données :**

```
Détection de l'incident
  │
  ▼
Évaluation de la gravité (< 1h)
  │
  ├── Données anonymes uniquement → Log interne, correction, pas de notification
  │
  └── Données personnelles (emails, profils nominatifs)
      │
      ▼
  Notification à la CNIL dans les 72h
  (formulaire en ligne sur cnil.fr)
      │
      ▼
  Si risque élevé pour les personnes :
  Notification aux personnes concernées
  (email individuel + bannière sur le site)
      │
      ▼
  Correction technique + rapport post-incident
```

**Contact DPO :** `rgpd@fondation-jae.org`
**Contact CNIL :** [notifications.cnil.fr](https://notifications.cnil.fr)

### Demande de suppression d'un parent

```
Le parent envoie un email à rgpd@fondation-jae.org
  │
  ▼
Vérification de l'identité du parent
  (pièce d'identité + livret de famille ou tout document prouvant la parentalité)
  │
  ▼
Identification du compte de l'enfant
  (par email si connu, sinon difficile — le compte est peut-être anonyme)
  │
  ├── Compte identifié → suppression dans les 72h + confirmation au parent
  │
  └── Compte non identifiable (anonyme, pas d'email)
      → Informer le parent que sans email associé, les données sont déjà anonymes
         et seront purgées automatiquement après 6 mois d'inactivité
```

---

## 6. Checklist de sécurité avant mise en production

| Vérification | Statut | Responsable |
|-------------|--------|-------------|
| HTTPS actif avec TLS 1.3 | ☐ | DevOps |
| En-têtes de sécurité configurés (CSP, HSTS, X-Frame) | ☐ | DevOps |
| Cookie de session HttpOnly + Secure + SameSite | ☐ | Développeur |
| Clés API dans les variables d'environnement (pas dans le code) | ☐ | Développeur |
| `.env` dans `.gitignore` | ☐ | Développeur |
| Rate limiting sur toutes les routes API | ☐ | Développeur |
| Requêtes SQL paramétrées (pas de concaténation) | ☐ | Développeur |
| Pas de `dangerouslySetInnerHTML` non contrôlé | ☐ | Développeur |
| Pare-feu serveur (UFW : 22, 80, 443 uniquement) | ☐ | DevOps |
| Sauvegardes automatiques configurées | ☐ | DevOps |
| Mises à jour de sécurité automatiques | ☐ | DevOps |
| Option "données non utilisées pour l'entraînement" activée chez OpenAI | ☐ | Admin |
| Page mentions légales publiée | ☐ | Juridique |
| Page politique de confidentialité publiée | ☐ | Juridique |
| Page CGU publiée | ☐ | Juridique |
| Page déclaration d'accessibilité publiée | ☐ | Accessibilité |
| Registre des traitements rédigé | ☐ | DPO |
| DPA signé avec OpenAI | ☐ | Juridique |
| DPA signé avec Resend/Brevo | ☐ | Juridique |
| Bouton "Supprimer mes données" fonctionnel | ☐ | Développeur |
| Bouton "Exporter mes données" fonctionnel | ☐ | Développeur |
| Lien de désinscription fonctionnel dans les emails | ☐ | Développeur |
| Test d'intrusion réalisé (ou prévu à M+3) | ☐ | Sécurité |

---

## 7. Métriques de sécurité

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Tentatives bloquées par rate limiting | Nombre de requêtes 429 par jour | Monitoring |
| Certificat SSL valide | Jours restants avant expiration | > 30 jours en permanence |
| Temps de réponse aux demandes RGPD | Délai entre la demande et la réponse | < 72h |
| Demandes de suppression | Nombre par mois | Indicateur |
| Demandes d'export | Nombre par mois | Indicateur |
| Incidents de sécurité | Nombre par trimestre | 0 |
| Score d'en-têtes de sécurité | securityheaders.com | A+ |
| Vulnérabilités npm | `npm audit` : vulnérabilités critiques/élevées | 0 |
