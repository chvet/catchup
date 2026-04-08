# 10 — Pages parents & prescripteurs

> **Statut :** Non implémenté (les pages `/parents` et `/pro` n'existent pas dans l'app router — le concept de prescripteur a évolué vers le système de Structures avec l'Espace Conseiller, cf. specs 15 et 22)  
> **Dernière mise à jour spec :** 2026-04-07  
> **Note :** La table `sourceCaptation` est implémentée pour le tracking. Les structures ont un `slug` et un QR code (cf. spec 22). L'accès prescripteur se fait via l'Espace Conseiller (`pro.catchup.jaeprive.fr`).

## Principe directeur
**Le jeune est le bénéficiaire, mais il n'arrive pas toujours seul.** Deux publics-relais jouent un rôle clé dans l'acquisition : les parents (qui s'inquiètent) et les prescripteurs professionnels (qui accompagnent). Chaque public a besoin de sa propre porte d'entrée, avec un ton et un contenu adaptés.

**Le parent doit être rassuré. Le prescripteur doit être convaincu.**

---

## 1. Page parents — `/parents`

### Objectif
Un parent cherche "mon fils ne sait pas quoi faire" sur Google, ou reçoit un lien d'un conseiller. Il tombe sur cette page. Il doit :
1. Comprendre ce qu'est Catch'Up en 10 secondes
2. Être rassuré (gratuit, anonyme, pas dangereux)
3. Envoyer le lien à son enfant

### Ton
- **Vouvoiement** (contrairement au reste de l'app qui tutoie)
- Rassurant, factuel, bienveillant
- Pas de jargon technique, pas de sigles (RIASEC, IA, PWA...)
- Pas infantilisant non plus — le parent est un allié, pas un obstacle

### Structure de la page

```
┌────────────────────────────────────────────┐
│  [Logo Catch'Up]              [Menu]       │
│                                            │
│  ── Section héro ──────────────────────    │
│                                            │
│  Votre enfant ne sait pas                  │
│  quoi faire ? C'est normal.                │
│                                            │
│  Catch'Up est un compagnon d'orientation   │
│  gratuit et bienveillant qui aide les      │
│  jeunes à se découvrir et à trouver       │
│  leur voie — à leur rythme.               │
│                                            │
│  ┌──────────────────────────────┐          │
│  │  Envoyer le lien à mon       │          │
│  │  enfant →                    │          │
│  └──────────────────────────────┘          │
│                                            │
│  ── Comment ça marche ─────────────────    │
│                                            │
│  1️⃣  Votre enfant discute avec Catch'Up   │
│     comme il parlerait à un grand frère.   │
│     Pas de formulaire, pas d'inscription.  │
│                                            │
│  2️⃣  Au fil de la conversation, Catch'Up   │
│     identifie ses centres d'intérêt,       │
│     ses forces et ses envies.              │
│                                            │
│  3️⃣  Catch'Up lui propose des pistes       │
│     métiers et formations adaptées.        │
│     Et peut le mettre en relation avec     │
│     un conseiller professionnel.           │
│                                            │
│  ── Vos questions ─────────────────────    │
│                                            │
│  ▸ C'est vraiment gratuit ?                │
│  ▸ Qui est derrière Catch'Up ?             │
│  ▸ Les données de mon enfant sont-elles    │
│    protégées ?                             │
│  ▸ Mon enfant est mineur, c'est adapté ?   │
│  ▸ Ça remplace un conseiller humain ?      │
│  ▸ Comment ça marche techniquement ?       │
│                                            │
│  ── Envoyez le lien ──────────────────     │
│                                            │
│  ┌──────────────────────────────┐          │
│  │  📱 Par SMS                  │          │
│  └──────────────────────────────┘          │
│  ┌──────────────────────────────┐          │
│  │  💬 Par WhatsApp             │          │
│  └──────────────────────────────┘          │
│  ┌──────────────────────────────┐          │
│  │  ✉️  Par email                │          │
│  └──────────────────────────────┘          │
│  ┌──────────────────────────────┐          │
│  │  📋 Copier le lien           │          │
│  └──────────────────────────────┘          │
│                                            │
│  ── Pied de page ─────────────────────     │
│  Un projet de la Fondation JAE             │
│  Mentions légales · Politique de           │
│  confidentialité                           │
│                                            │
└────────────────────────────────────────────┘
```

### FAQ détaillée

**C'est vraiment gratuit ?**
> Oui, entièrement. Catch'Up est un projet de la Fondation JAE, une fondation reconnue d'utilité publique spécialisée dans l'orientation professionnelle. Il n'y a aucun coût caché, aucun abonnement, aucune publicité.

**Qui est derrière Catch'Up ?**
> La Fondation JAE, fondée en 1991, accompagne chaque année des centaines de milliers de jeunes dans leur orientation. Catch'Up est un outil complémentaire à nos dispositifs existants (Parcoureo, Inforizon...).

**Les données de mon enfant sont-elles protégées ?**
> Oui. Votre enfant peut utiliser Catch'Up de façon totalement anonyme. Aucune donnée personnelle n'est collectée sans son accord. Nous respectons le RGPD et ne transmettons jamais de données à des tiers. Votre enfant peut supprimer ses données à tout moment.

**Mon enfant est mineur, c'est adapté ?**
> Oui. Catch'Up est conçu pour les 16-25 ans. Les contenus sont adaptés, bienveillants, et un système de détection de fragilité oriente automatiquement vers des professionnels en cas de besoin. Aucune donnée personnelle n'est exigée pour les mineurs.

**Ça remplace un conseiller humain ?**
> Non. Catch'Up prépare le terrain : il aide votre enfant à se connaître et à identifier des pistes. Quand c'est pertinent, il propose une mise en relation avec un vrai conseiller professionnel qui prendra le relais.

**Comment ça marche techniquement ?**
> Catch'Up utilise l'intelligence artificielle pour mener une conversation naturelle. C'est comme discuter par message avec un ami qui connaît bien l'orientation. Votre enfant accède à Catch'Up depuis son navigateur — rien à installer.

### Mécanisme d'envoi du lien

Le bouton "Envoyer le lien à mon enfant" ouvre les options de partage :

**Par SMS :**
- Ouvre l'app SMS native avec un message pré-rempli :
  > "Salut ! Essaie ça, c'est pour t'aider à trouver ce qui te plaît → catchup.jaeprive.fr 😊"
- Utilise le protocole `sms:?body=...`

**Par WhatsApp :**
- Ouvre WhatsApp avec un message pré-rempli via `https://wa.me/?text=...`

**Par email :**
- Ouvre le client email natif via `mailto:?subject=...&body=...`
- Objet : "Un truc qui pourrait t'aider pour ton orientation"
- Corps : texte simple avec le lien

**Copier le lien :**
- Copie `catchup.jaeprive.fr` dans le presse-papier
- Confirmation : "Lien copié ✓"

**Tracking :** Tous les liens envoyés depuis `/parents` incluent `?src=parents` pour mesurer l'efficacité de cette page.

---

## 2. Pages prescripteurs — `/pro`

### Objectif
Les prescripteurs (conseillers Mission Locale, CIO, E2C, CIDJ, psyEN...) ont besoin de :
1. Comprendre ce que fait Catch'Up et en quoi c'est utile pour eux
2. S'inscrire pour obtenir leur lien de suivi personnalisé
3. Accéder à leurs statistiques (combien de jeunes via leur lien)
4. Télécharger le kit de communication (flyers, QR codes, affiches)

### Ton
- **Vouvoiement** professionnel
- Factuel, orienté résultats
- Langage métier (on peut dire "RIASEC", "profil d'orientation", "mise en relation")
- Pas de jargon technique (pas de "API", "webhook", "PWA")

### Pages

#### `/pro` — Page d'accueil prescripteur

```
┌────────────────────────────────────────────┐
│  [Logo Catch'Up]     [Espace pro]          │
│                                            │
│  ── Section héro ──────────────────────    │
│                                            │
│  Aidez vos jeunes à se découvrir           │
│  entre deux rendez-vous.                   │
│                                            │
│  Catch'Up accompagne les jeunes dans       │
│  leur orientation via une conversation     │
│  IA bienveillante. Vous recevez le profil  │
│  RIASEC du jeune, prêt à exploiter.        │
│                                            │
│  ┌──────────────────────────────┐          │
│  │  Créer mon espace pro →      │          │
│  └──────────────────────────────┘          │
│                                            │
│  ── Ce que Catch'Up apporte ───────────    │
│                                            │
│  📊 Un profil RIASEC fiable                │
│  Le jeune discute avec Catch'Up, et vous   │
│  recevez un profil complet avec traits,    │
│  intérêts, forces et pistes évoquées.      │
│                                            │
│  ⏱️ Du temps gagné                          │
│  Le jeune arrive à votre RDV avec un       │
│  profil déjà construit. Vous pouvez        │
│  passer directement aux pistes concrètes.  │
│                                            │
│  🤝 Une mise en relation fluide            │
│  Quand Catch'Up détecte que le jeune a     │
│  besoin d'un humain, il vous transmet      │
│  le dossier automatiquement.               │
│                                            │
│  🔒 Conforme RGPD                          │
│  Le jeune donne son consentement           │
│  explicite avant toute transmission.        │
│  Données hébergées en France.              │
│                                            │
│  ── Comment ça marche ─────────────────    │
│                                            │
│  1. Vous créez votre espace pro            │
│  2. Vous recevez votre QR code et lien     │
│     personnalisé                           │
│  3. Vous diffusez le lien aux jeunes       │
│  4. Les jeunes discutent avec Catch'Up     │
│  5. Vous recevez les profils et demandes   │
│     de mise en relation                    │
│                                            │
│  ── Ils utilisent déjà Catch'Up ───────    │
│                                            │
│  [Logos : Mission Locale, CIDJ, E2C...]    │
│  (à remplir quand on aura des partenaires) │
│                                            │
│  ── Témoignages ───────────────────────    │
│                                            │
│  "Mes jeunes arrivent en entretien avec    │
│  une idée plus claire. Ça change tout."    │
│  — Conseillère, Mission Locale Paris 15    │
│                                            │
│  ── FAQ pro ───────────────────────────    │
│                                            │
│  ▸ C'est compatible avec Parcoureo ?       │
│  ▸ Quel est le coût ?                      │
│  ▸ Puis-je voir la conversation ?          │
│  ▸ Comment le jeune donne son accord ?     │
│                                            │
└────────────────────────────────────────────┘
```

#### FAQ pro

**C'est compatible avec Parcoureo ?**
> Oui. Catch'Up utilise le même modèle RIASEC que Parcoureo. Le profil généré par Catch'Up peut être importé dans Parcoureo (intégration en cours). Les scores sont sur la même échelle 0-100.

**Quel est le coût ?**
> Gratuit. Catch'Up est un outil de la Fondation JAE, financé par la fondation. Aucun coût pour les structures ni pour les jeunes.

**Puis-je voir la conversation du jeune ?**
> Non. Vous recevez un résumé généré par l'IA et le profil RIASEC, mais pas la conversation intégrale. C'est un choix de respect de la confidentialité du jeune.

**Comment le jeune donne son accord ?**
> Catch'Up propose la mise en relation dans la conversation. Le jeune accepte explicitement et fournit son moyen de contact. Sans son accord, rien ne vous est transmis.

---

#### `/pro/inscription` — Inscription prescripteur

Formulaire simple :

```
┌──────────────────────────────────┐
│  Créer votre espace Catch'Up     │
│                                  │
│  Prénom *         [          ]   │
│  Nom *            [          ]   │
│  Email pro *      [          ]   │
│  Structure *      [▾ déroulant]  │
│    · Mission Locale              │
│    · CIO                         │
│    · E2C                         │
│    · CIDJ                        │
│    · Éducation nationale         │
│    · Association                 │
│    · Cabinet privé               │
│    · Autre                       │
│  Ville *          [          ]   │
│  Nom de la structure [        ]  │
│    ex: "Mission Locale Paris 15" │
│                                  │
│  [Créer mon espace →]            │
│                                  │
└──────────────────────────────────┘
```

**Après inscription :**
1. Email de confirmation avec magic link
2. Accès au tableau de bord prescripteur (`/pro/tableau-de-bord`)
3. Génération automatique du code personnalisé (ex: `ML-PARIS15`)

---

#### `/pro/tableau-de-bord` — Tableau de bord prescripteur

```
┌──────────────────────────────────────────────┐
│  Bonjour Marie 👋                            │
│  Mission Locale Paris 15                      │
│                                              │
│  ── Votre lien ───────────────────────────   │
│                                              │
│  catchup.jaeprive.fr/r/ML-PARIS15            │
│  [📋 Copier]  [📥 QR code]  [📄 Flyer PDF]  │
│                                              │
│  ── Statistiques ─────────────────────────   │
│                                              │
│  Ce mois-ci          Depuis le début         │
│  ┌──────────┐        ┌──────────┐            │
│  │    47     │        │   312    │            │
│  │  visites  │        │  visites │            │
│  └──────────┘        └──────────┘            │
│  ┌──────────┐        ┌──────────┐            │
│  │    23     │        │   145    │            │
│  │   quiz    │        │   quiz   │            │
│  │ complétés │        │ complétés│            │
│  └──────────┘        └──────────┘            │
│  ┌──────────┐        ┌──────────┐            │
│  │    12     │        │    67    │            │
│  │  chats    │        │  chats   │            │
│  │  ouverts  │        │  ouverts │            │
│  └──────────┘        └──────────┘            │
│  ┌──────────┐        ┌──────────┐            │
│  │     3     │        │    18    │            │
│  │ mises en  │        │ mises en │            │
│  │ relation  │        │ relation │            │
│  └──────────┘        └──────────┘            │
│                                              │
│  ── Demandes en cours ────────────────────   │
│                                              │
│  🟠 Lucas D. · Artiste-Social · J+1         │
│     "Profil clair, souhaite explorer le      │
│      design graphique"                       │
│     [Voir le dossier →] [Marquer recontacté] │
│                                              │
│  🔴 Fatou M. · Priorité haute · J+0         │
│     "Exprime du découragement, besoin        │
│      d'accompagnement renforcé"              │
│     [Voir le dossier →] [Marquer recontacté] │
│                                              │
│  ✅ Romain K. · Recontacté · 12 mars        │
│     "Piste : formation technicien réseau"    │
│                                              │
│  ── Kit de communication ─────────────────   │
│                                              │
│  [📥 Télécharger le flyer A5 (PDF)]         │
│  [📥 Télécharger l'affiche A3 (PDF)]        │
│  [📥 Télécharger le QR code (PNG)]          │
│  [📥 Télécharger le kit complet (ZIP)]      │
│                                              │
└──────────────────────────────────────────────┘
```

### Fonctionnalités du tableau de bord

**Lien personnalisé :**
- URL unique par prescripteur : `catchup.jaeprive.fr/r/{CODE}`
- Le code est généré à l'inscription (initiales structure + ville, ex: `ML-PARIS15`, `CIO-LYON3`, `E2C-MARSEILLE`)
- Ce lien redirige vers la page d'accueil Catch'Up normale avec le paramètre `?src={CODE}` en `localStorage`

**QR code :**
- Généré côté serveur (bibliothèque `qrcode`)
- Format PNG haute résolution (300 DPI pour impression)
- Inclut le logo Catch'Up au centre
- Téléchargeable en un clic

**Statistiques :**
- Mises à jour en temps réel (ou toutes les heures en MVP)
- 4 compteurs : visites, quiz complétés, chats ouverts, mises en relation
- Période : ce mois-ci + depuis le début
- Futur : graphique d'évolution par semaine

**Demandes en cours :**
- Liste des jeunes ayant accepté une mise en relation via le lien du prescripteur
- Triées par priorité (🔴 haute en premier, puis 🟠 normale, puis ✅ terminées)
- Chaque demande affiche : prénom + initiale nom, profil dominant, priorité, ancienneté
- Bouton "Voir le dossier" → ouvre le dossier de transmission complet (cf. spec 02)
- Bouton "Marquer recontacté" → met à jour le statut et envoie une confirmation au jeune

---

## 3. Lien prescripteur — `/r/{CODE}`

### Fonctionnement

```
Le jeune scanne le QR code ou clique le lien
  │
  ▼
catchup.jaeprive.fr/r/ML-PARIS15
  │
  ▼
Le serveur enregistre la visite :
  - Incrémente nb_visites de la source ML-PARIS15
  - Stocke src=ML-PARIS15 dans le localStorage du jeune
  │
  ▼
Redirection vers catchup.jaeprive.fr (page d'accueil normale)
  │
  ▼
Le jeune utilise Catch'Up normalement
  │
  ▼
Si mise en relation → le dossier est routé vers le prescripteur ML-PARIS15
```

### Règles
- La redirection est **instantanée** (pas de page intermédiaire)
- Le code source est stocké en `localStorage` pour toute la session
- Si le jeune revient plus tard sans le lien, la source est conservée (localStorage persiste)
- Si le jeune arrive via 2 sources différentes → la première source gagne (attribution premier contact)

---

## 4. Kit de communication prescripteur

### Contenu du kit (ZIP téléchargeable)

| Document | Format | Contenu |
|----------|--------|---------|
| Flyer A5 | PDF (recto-verso) | Recto : accroche jeune + QR code. Verso : explications courtes |
| Affiche A3 | PDF | Visuel attractif + QR code + "Scanne, parle, découvre ton profil" |
| QR code seul | PNG (300 DPI) | QR code personnalisé avec logo Catch'Up |
| Carte de visite | PDF (85×55mm) | Recto : nom du conseiller + structure. Verso : QR code Catch'Up |
| Email type | TXT | Modèle d'email à envoyer au jeune après un entretien |
| SMS type | TXT | Modèle de SMS court avec le lien |
| Guide conseiller | PDF (2 pages) | Comment présenter Catch'Up, quoi dire, FAQ rapide |

### Flyer A5 — Contenu

**Recto :**
```
┌─────────────────────────┐
│                         │
│  T'as pas d'idée pour   │
│  plus tard ?             │
│                         │
│  C'est normal. 😊       │
│                         │
│  Discute avec Catch'Up, │
│  découvre ce qui te     │
│  correspond.            │
│                         │
│  [QR CODE]              │
│                         │
│  Scanne et parle.       │
│  C'est gratuit.         │
│                         │
└─────────────────────────┘
```

**Verso :**
```
┌─────────────────────────┐
│                         │
│  Catch'Up, c'est quoi ? │
│                         │
│  → Une conversation     │
│    pour découvrir tes   │
│    forces et tes envies │
│                         │
│  → Des pistes métiers   │
│    personnalisées       │
│                         │
│  → Un lien vers un      │
│    conseiller si besoin │
│                         │
│  Pas de formulaire,     │
│  pas d'inscription.     │
│  Tu parles, c'est tout. │
│                         │
│  catchup.jaeprive.fr    │
│                         │
│  [Logo Fondation JAE]   │
│  [Logo Mission Locale   │
│   ou structure locale]  │
│                         │
└─────────────────────────┘
```

### Email type (envoyé par le conseiller au jeune)

> **Objet :** Un outil pour t'aider à y voir plus clair
>
> Salut {prénom} !
>
> Suite à notre échange, je te propose d'essayer Catch'Up : c'est une conversation en ligne pour t'aider à découvrir ce qui te correspond. C'est gratuit et tu n'as rien à installer.
>
> 👉 catchup.jaeprive.fr/r/{CODE}
>
> Quand tu auras discuté un peu, on pourra en reparler ensemble au prochain rendez-vous.
>
> À bientôt !
> {nom du conseiller}

### SMS type

> Hey {prénom} ! Essaie ça → catchup.jaeprive.fr/r/{CODE} 😊 C'est gratuit. On en reparle au prochain RDV !

---

## 5. Génération des supports imprimés

### Approche technique

Les supports PDF (flyer, affiche, carte de visite) sont **générés dynamiquement** avec le QR code du prescripteur incrusté :

1. **Gabarits** : fichiers PDF de base stockés côté serveur (design fixe, zones vides pour le QR code et le nom de la structure)
2. **Génération** : bibliothèque `pdf-lib` (JavaScript) pour incruster le QR code + nom de la structure
3. **QR code** : généré avec `qrcode` (JavaScript), incrusté dans le PDF à la position prévue
4. **Cache** : le PDF est généré une fois puis mis en cache (le QR code ne change pas)

```typescript
// src/services/generateur-kit.ts

async function genererFlyer(prescripteur: Prescripteur): Promise<Buffer> {
  // 1. Charger le gabarit PDF
  // 2. Générer le QR code PNG
  // 3. Incruster le QR code à la position définie
  // 4. Incruster le nom de la structure
  // 5. Retourner le PDF final
}
```

---

## 6. Modèle de données (complément spec 07)

### Table `prescripteur`

```sql
CREATE TABLE prescripteur (
  id                TEXT PRIMARY KEY,          -- UUID v4
  prenom            TEXT NOT NULL,
  nom               TEXT NOT NULL,
  email             TEXT NOT NULL UNIQUE,
  email_verifie     INTEGER DEFAULT 0,
  type_structure    TEXT NOT NULL,             -- 'mission_locale', 'cio', 'e2c', 'cidj', 'education_nationale', 'association', 'prive', 'autre'
  nom_structure     TEXT,                      -- "Mission Locale Paris 15"
  ville             TEXT,
  code_prescripteur TEXT NOT NULL UNIQUE,      -- "ML-PARIS15"
  actif             INTEGER DEFAULT 1,         -- 0 = désactivé
  cree_le           TEXT NOT NULL,
  derniere_connexion TEXT,
);
```

### Lien avec les tables existantes

- `source_captation.code` → correspond au `prescripteur.code_prescripteur`
- `referral.utilisateur_id` → le jeune qui a accepté la mise en relation
- Le routage du referral vers le bon prescripteur se fait via le `source_detail` de l'utilisateur (qui contient le code prescripteur)

---

## 7. SEO des pages

### `/parents`

| Balise | Contenu |
|--------|---------|
| `<title>` | Mon enfant ne sait pas quoi faire — Catch'Up, orientation gratuite |
| `<meta description>` | Votre enfant ne sait pas quoi faire plus tard ? Catch'Up l'aide à se découvrir gratuitement via une conversation bienveillante. Envoyez-lui le lien. |
| `<h1>` | Votre enfant ne sait pas quoi faire ? C'est normal. |
| Mots-clés visés | "mon fils ne sait pas quoi faire", "orientation enfant", "aide orientation gratuite" |

### `/pro`

| Balise | Contenu |
|--------|---------|
| `<title>` | Catch'Up pour les professionnels de l'orientation — Outil RIASEC gratuit |
| `<meta description>` | Proposez Catch'Up à vos jeunes : conversation IA, profil RIASEC automatique, mise en relation fluide. Gratuit pour les structures. |
| `<h1>` | Aidez vos jeunes à se découvrir entre deux rendez-vous |
| Mots-clés visés | "outil orientation professionnel", "RIASEC en ligne", "orientation mission locale" |

---

## 8. Métriques

### Page parents

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Visiteurs /parents | Nombre de visiteurs uniques | 200/mois (mois 1) → 2 000 (mois 6) |
| Taux de partage | % visiteurs qui cliquent un bouton d'envoi | > 30% |
| Taux de conversion | % de jeunes arrivant via src=parents qui font le quiz | > 40% |
| Canal préféré | Répartition SMS / WhatsApp / email / copier | Indicateur |

### Page prescripteur

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Inscriptions prescripteurs | Nombre de comptes pro créés | 20 (mois 1) → 200 (mois 6) |
| Prescripteurs actifs | % ayant au moins 1 jeune via leur lien ce mois | > 50% |
| Jeunes par prescripteur | Nombre moyen de jeunes via un lien prescripteur | > 5/mois |
| Taux de recontact | % de mises en relation marquées "recontacté" | > 80% |
| Kits téléchargés | Nombre de téléchargements du kit PDF | Indicateur |
| Délai moyen de recontact | Temps entre la demande et le "marqué recontacté" | < 48h |
