# 15 — Espace Conseiller (Plateforme de mise en relation)

## Principe directeur
**Le conseiller a une vue claire et actionnable.** L'Espace Conseiller est l'interface où les professionnels de l'orientation gèrent les demandes de prise en charge issues de Catch'Up. Il doit être simple, rapide, et intégrable dans l'écosystème Parcoureo de la Fondation JAE.

**L'objectif :** Réduire le temps entre la demande du bénéficiaire et le premier contact avec un conseiller humain. Chaque minute compte — surtout pour les urgences.

---

## Utilisateurs cibles

| Rôle | Description | Accès |
|------|-------------|-------|
| **Conseiller** | Professionnel d'une structure (Mission Locale, CIO, E2C…). Voit la file active de sa structure, prend en charge des cas. | File active, détail cas, ses prises en charge |
| **Admin structure** | Responsable d'une structure. Gère les conseillers, voit les stats de sa structure. | Tout ce que voit le conseiller + gestion conseillers + stats structure |
| **Super admin** | Équipe Fondation JAE. Voit tout, gère toutes les structures. | Accès complet |

---

## Authentification

### MVP — Email / mot de passe
- Le conseiller se connecte avec email + mot de passe
- Mot de passe hashé avec **bcrypt** (coût 12)
- Session via **JWT** stocké dans un cookie `httpOnly` (sécurité XSS)
- Durée de session : **8 heures** (journée de travail)
- Déconnexion : révocation du JWT côté serveur (table `session_conseiller`)

### Structure du JWT
```json
{
  "sub": "uuid-conseiller",
  "email": "conseiller@mission-locale.fr",
  "role": "conseiller",
  "structureId": "uuid-structure",
  "iat": 1711100000,
  "exp": 1711128800,
  "jti": "uuid-session"
}
```

### Futur — SSO Parcoureo
- Route `/api/conseiller/auth/sso` prête pour un échange de tokens
- Le conseiller se connecte via Parcoureo → token Parcoureo échangé contre JWT Catch'Up local
- Mapping par `parcoureo_id` dans la table `structure`

---

## Accès et sous-domaine

### Séparation des espaces

L'application est servie sur deux sous-domaines distincts pour isoler les publics :

| Sous-domaine | Public | Usage |
|-------------|--------|-------|
| `catchup.jaeprive.fr` | Bénéficiaires | App mobile-first (chat IA, quiz) |
| `pro.catchup.jaeprive.fr` | Conseillers | Espace de gestion (file active, dashboard) |

### Routage

- Un **seul conteneur Docker** sert les deux sous-domaines
- **Nginx** reverse proxy route les deux vers le même port (3002)
- Le **middleware Next.js** isole les routes selon le hostname :
  - Sur `pro.*` : la racine `/` redirige vers `/conseiller` ; les routes bénéficiaire (`/quiz`, etc.) redirigent vers `catchup.jaeprive.fr`
  - Sur `catchup.*` : les routes `/conseiller/*` redirigent vers `pro.catchup.jaeprive.fr`
- En **développement local** (localhost) : pas de restriction, les deux espaces sont accessibles

### Accès conseiller
1. Le conseiller accède à `https://pro.catchup.jaeprive.fr`
2. Il est automatiquement redirigé vers `/conseiller` (login si non authentifié)
3. Un lien discret "Espace professionnel" existe en bas de l'app bénéficiaire

---

## Pages de l'application

### Architecture des routes

```
https://pro.catchup.jaeprive.fr/
  /conseiller/login              → Page de connexion
  /conseiller                    → Dashboard (page par défaut après login)
  /conseiller/file-active        → File active (liste des demandes)
  /conseiller/file-active/[id]   → Détail d'un cas
  /conseiller/structures         → Gestion des structures (admin uniquement)
  /conseiller/structures/[id]    → Détail d'une structure + conseillers rattachés
  /conseiller/conseillers        → Gestion des conseillers (admin uniquement)
  /conseiller/parametres         → Profil et préférences du conseiller
```

### Layout
- **Desktop-first** (les conseillers travaillent sur ordinateur)
- **Responsive** (consultable sur tablette en déplacement)
- Sidebar de navigation à gauche (rétractable)
- Topbar avec nom du conseiller, bouton déconnexion, **bandeau d'alerte file active**
- Zone principale avec fil d'Ariane

### Système d'alertes conseiller

Alertes en temps réel affichées simultanément dans la sidebar et la topbar, rafraîchies toutes les 30 secondes.

**Sidebar :**
- Badge sur l'item "File active" : **nombre en attente (nouveaux)** — ex : `12 (3)`
- Rouge clignotant si cas urgents (priorité critique/haute), orange sinon
- Quand la sidebar est réduite : pastille rouge sur l'icône avec le compteur

**Topbar :**
- Bandeau cliquable (lien vers file active) avec :
  - Pastille colorée (rouge clignotante si urgents, orange si en retard, bleu sinon)
  - Texte : `X en attente (Y nouveaux)` (nouveaux = créés il y a moins de 1h)
  - Badge additionnel si cas urgents : `Z urgents`

**Niveaux d'urgence visuels :**

| Couleur | Condition |
|---------|-----------|
| 🔴 Rouge (pulse) | Cas critique ou haute priorité non pris en charge |
| 🟠 Orange | Cas en attente depuis > 24h |
| 🔵 Bleu | Cas en attente normaux |

**API :**
- `GET /api/conseiller/alerts` — retourne `{ enAttente, nouveaux, urgents, enRetard }`
- Polling client toutes les 30s (pas de WebSocket pour le MVP)

---

## File active

### Vue d'ensemble
La file active est le coeur de l'application. Elle affiche toutes les demandes de prise en charge (referrals) destinées à la structure du conseiller.

### Règles de visibilité

| Rôle | Vue "Tous + mes cas" (défaut) | Vue "Ma structure" |
|------|-------------------------------|-------------------|
| **Conseiller** | Tous les cas en attente/nouvelle + ses propres prises en charge | Tous les cas en attente + cas pris en charge par sa structure + cas suggérés à sa structure |
| **Admin structure** | Idem conseiller | Idem + gestion complète |
| **Super admin** | Tous les cas, tous les statuts | Tous les cas |

Le toggle "Tous + mes cas / Ma structure" permet au conseiller de basculer entre les deux vues.

Les cas annulés sont masqués par défaut (sauf filtre explicite sur le statut "Annulée").

### Tableau filtrable et triable

| Colonne | Description | Tri |
|---------|-------------|-----|
| **Urgence** | Pastille colorée (🟢 normale, 🟠 haute, 🔴 critique) | Oui |
| **Bénéficiaire** | Prénom + initiale nom (si connu) | Oui |
| **Âge** | Âge déclaré ou estimé | Oui |
| **Date demande** | Date et heure de création (ex: "23/03 14h30") | Oui |
| **Localisation** | Département du bénéficiaire | Oui |
| **Profil RIASEC** | Mini badge des 2 dimensions dominantes | Non |
| **Attente** | Temps écoulé depuis la demande (ex: "2h", "1j", "3j") | Oui |
| **Statut** | Badge coloré (nouvelle, en attente, prise en charge, terminée) | Oui |
| **Actions** | Bouton "Voir" (lien vers détail du cas) | — |

**Tri par clic sur en-tête :**
- Clic sur une colonne triable → tri ascendant
- Clic à nouveau → tri descendant
- Indicateur visuel ▲/▼ sur la colonne active
- Tri client-side sur les données chargées (rapide, pas de re-fetch API)

### Filtres

Deux niveaux : filtres principaux (toujours visibles) + filtres avancés (toggle dépliable).

**Filtres principaux :**

| Filtre | Options |
|--------|---------|
| Recherche | Texte libre sur prénom/localisation |
| Urgence | Toutes, Normale, Haute, Critique |
| Statut | Tous, Nouvelle, En attente, Prise en charge, Terminée, Abandonnée |

**Filtres avancés (panneau dépliable) :**

| Filtre | Options |
|--------|---------|
| Localisation | Saisie libre de département |
| Âge min / max | Inputs numériques |
| Date du / au | Sélecteurs de date (HTML date input) |

### Rafraîchissement
- **Polling toutes les 30 secondes** (pas de WebSocket pour le MVP)
- Indicateur visuel "Dernière mise à jour il y a Xs"
- Futur : Server-Sent Events pour les notifications en temps réel

---

## Détail d'un cas

Quand le conseiller clique sur un cas dans la file active, il accède à une vue détaillée.

### Organisation en onglets

La colonne principale (2/3 de l'écran) est organisée en **4 onglets** :

| Onglet | Contenu | Badge |
|--------|---------|-------|
| **Résumé** | Résumé IA, motif, métadonnées conversation | — |
| **Conversation** | Historique complet des messages IA ↔ bénéficiaire (lecture seule, style chat) | Nombre de messages |
| **Profil RIASEC** | Radar chart, dimensions dominantes, traits, intérêts, confiance | — |
| **Notes** | Notes horodatées du conseiller + formulaire d'ajout | Nombre de notes |

La colonne latérale (1/3) reste fixe et affiche : Contact, Structures suggérées (matching), Chronologie.

### Informations affichées

#### Bloc identité
- Prénom, âge, genre (si connu)
- Moyen de contact (email ou téléphone)
- Localisation (département/ville si connu)
- Date de la demande + temps d'attente

#### Bloc profil RIASEC
- **Radar chart** des 6 dimensions (réutilisation du composant existant)
- Top 3 dimensions avec labels et scores
- Traits de personnalité détectés
- Centres d'intérêt
- Points forts
- Piste métier/domaine suggérée par l'IA
- Indice de confiance du profil (avec niveau : début/émergent/précis/fiable)

#### Bloc conversation (onglet "Résumé")
- **Résumé IA** de la conversation (3-5 phrases, généré automatiquement)
- Motif de la mise en relation
- Nombre de messages échangés
- Durée de la conversation
- Niveau de fragilité détecté
- Phase atteinte (accroche/découverte/exploration/projection/action)
- Bouton d'accès rapide vers l'historique complet

#### Historique de conversation (onglet "Conversation")

Fonctionnalité clé permettant au conseiller de **relire l'intégralité de la conversation entre le bénéficiaire et l'IA** avant de décider d'une prise en charge.

**Affichage :**
- Interface style **chat / WhatsApp** en lecture seule
- Bulles colorées : bénéficiaire (violet, aligné à droite) / IA (gris, aligné à gauche)
- Nom de l'expéditeur au-dessus de chaque bulle
- Horodatage discret sous chaque message
- Séparateurs temporels si plus de 5 min entre deux messages
- **Indicateur visuel de fragilité** (contour orange + badge ⚠️) sur les messages où une fragilité a été détectée
- En-tête avec métadonnées : nombre de messages, durée, phase atteinte
- Footer avec compteur total et alerte si fragilité détectée dans la conversation

**Chargement :**
- **Lazy loading** : les messages ne sont chargés que quand le conseiller clique sur l'onglet "Conversation" (économie de bande passante)
- Auto-scroll vers le dernier message à l'ouverture
- Spinner pendant le chargement

**Audit RGPD :**
- Chaque consultation de l'historique est tracée (`view_conversation`) dans `evenement_audit`
- Le conseiller doit être authentifié

**API :**
- `GET /api/conseiller/file-active/[id]/conversation` — retourne la liste ordonnée des messages (id, role, contenu, fragilité, horodatage) + métadonnées de la conversation

#### Bloc matching
- Structure(s) suggérée(s) avec score de matching et raisons
- Possibilité de réassigner à une autre structure (override manuel)

#### Bloc actions

| Action | Description | Rôle requis |
|--------|-------------|-------------|
| **Prendre en charge** | Le conseiller s'assigne le cas. Statut → "prise_en_charge" | Conseiller |
| **Ajouter une note** | Note horodatée visible uniquement par les conseillers | Conseiller |
| **Changer le statut** | Passer à "en_attente", "terminée", "abandonnée" | Conseiller |
| **Réassigner** | Transférer à un autre conseiller de la structure | Admin structure |
| **Réassigner à une autre structure** | Transférer si mauvais matching | Admin structure / Super admin |

#### Bloc historique
- Timeline des actions : création, assignation, changements de statut, notes
- Horodatage de chaque action
- Nom du conseiller ayant effectué l'action

---

## Workflow des statuts

```
                    ┌──────────────┐
                    │   NOUVELLE   │
                    │ (auto-créé)  │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
     ┌────────────────┐       ┌─────────────────────┐
     │  EN_ATTENTE    │       │  PRISE_EN_CHARGE    │
     │ (vue, pas      │──────>│  (conseiller assigné)│
     │  encore pris)  │       └─────────┬───────────┘
     └────────────────┘                 │
                               ┌────────┴────────┐
                               │                 │
                               ▼                 ▼
                      ┌─────────────┐   ┌──────────────┐
                      │  TERMINÉE   │   │  ABANDONNÉE  │
                      │ (succès)    │   │ (perdu de vue│
                      └─────────────┘   │  ou refus)   │
                                        └──────────────┘
```

### Règles de transition
- `nouvelle` → `en_attente` : automatique quand un conseiller consulte le détail
- `nouvelle` ou `en_attente` → `prise_en_charge` : action manuelle du conseiller
- `prise_en_charge` → `terminée` : le conseiller confirme que le suivi est conclu
- `prise_en_charge` → `abandonnée` : le bénéficiaire ne répond pas après 3 tentatives
- Toute transition est loggée dans `evenement_audit`

---

## Notifications conseiller

### MVP — Indicateurs visuels
- Badge numérique sur "File active" dans la sidebar (nombre de nouvelles demandes)
- Pastille rouge sur les cas urgents
- Ligne surlignée pour les cas en attente > 48h

### Futur — Notifications push
- Notification navigateur pour les nouvelles demandes urgentes
- Email quotidien récapitulatif si des cas sont en attente

---

## Intégration Parcoureo

### Principes
- L'Espace Conseiller doit pouvoir s'intégrer dans Parcoureo **sans friction**
- Deux modes d'intégration prévus :
  1. **Iframe** : la page `/conseiller/file-active` est embeddable dans Parcoureo
  2. **API REST** : Parcoureo consomme les données via des endpoints authentifiés

### Iframe
- Headers `X-Frame-Options: ALLOW-FROM parcoureo.fr` (ou `Content-Security-Policy: frame-ancestors`)
- Layout adapté (sans sidebar si paramètre `?embed=true`)
- Communication parent ↔ iframe via `postMessage` si nécessaire

### API externe

```
GET  /api/conseiller/external/referrals           → Liste des referrals
GET  /api/conseiller/external/referrals/[id]      → Détail d'un referral
GET  /api/conseiller/external/profile/[id]        → Profil RIASEC du bénéficiaire
POST /api/conseiller/external/referrals/[id]/claim → Prendre en charge
PATCH /api/conseiller/external/referrals/[id]/status → Changer le statut
```

- Authentification : `Authorization: Bearer <JWT>` (même format que la session interne)
- Format de réponse : JSON standardisé avec pagination
- Rate limiting : 100 requêtes/minute par token

### Mapping des données
- `structure.parcoureo_id` permet de lier une structure Catch'Up à son équivalent Parcoureo
- Les referrals transmis contiennent l'identifiant Parcoureo de la structure pour faciliter le routage

---

## Gestion des structures (admin)

### Page `/conseiller/structures`
- Liste des structures avec : nom, type, départements couverts, capacité, nombre de cas actifs
- Création / édition / désactivation d'une structure
- Vue de la capacité restante (barre de remplissage)

### Champs d'une structure

| Champ | Type | Description |
|-------|------|-------------|
| Nom | Texte | "Mission Locale Paris 15" |
| Type | Sélection | mission_locale, cio, e2c, cidj, privee, autre |
| Départements couverts | Multi-sélection | ["75", "92", "93"] |
| Régions couvertes | Multi-sélection | ["ile-de-france"] |
| Tranche d'âge | Min-Max | 16-25 |
| Spécialités | Tags | décrochage, insertion, handicap, orientation, reconversion |
| Préférence genre | Sélection | Aucune, Masculin, Féminin |
| Capacité max | Nombre | 50 cas simultanés |
| Webhook URL | URL | Pour notification externe (optionnel) |
| ID Parcoureo | Texte | Identifiant dans Parcoureo (optionnel) |

---

## Gestion des conseillers (admin structure)

### Page `/conseiller/parametres` (admin)
- Liste des conseillers de la structure
- Création / édition / désactivation
- Attribution du rôle (conseiller ou admin_structure)

### Champs d'un conseiller

| Champ | Type | Description |
|-------|------|-------------|
| Prénom | Texte | Obligatoire |
| Nom | Texte | Obligatoire |
| Email | Email | Unique, sert d'identifiant |
| Mot de passe | Texte | Hashé bcrypt (min 8 caractères) |
| Rôle | Sélection | conseiller, admin_structure |
| Structure | Sélection | Rattachement (obligatoire sauf super_admin) |
| Actif | Boolean | Désactivation sans suppression |

---

## Audit et traçabilité (RGPD)

Chaque action sensible est loggée dans la table `evenement_audit` :

| Action | Données loggées |
|--------|----------------|
| Connexion | IP, horodatage |
| Consultation d'un cas | ID du referral consulté |
| Prise en charge | ID du referral, ID du conseiller |
| Changement de statut | Ancien statut → nouveau statut |
| Ajout de note | ID du referral (pas le contenu de la note) |
| Export de données | Type d'export, périmètre |
| Création/modification conseiller | ID du conseiller modifié |
| Création/modification structure | ID de la structure modifiée |

Les logs d'audit sont conservés **2 ans** (obligation légale).

---

## Sécurité

### Protection des routes
- Middleware Next.js intercepte toutes les routes `/conseiller/*`
- JWT vérifié à chaque requête (cookie `httpOnly` ou header `Authorization`)
- Redirection vers `/conseiller/login` si non authentifié

### Contrôle d'accès par rôle

| Action | Conseiller | Admin structure | Super admin |
|--------|:----------:|:---------------:|:-----------:|
| Voir la file active de sa structure | ✅ | ✅ | ✅ |
| Voir la file active d'une autre structure | ❌ | ❌ | ✅ |
| Prendre en charge un cas | ✅ | ✅ | ✅ |
| Réassigner dans la structure | ❌ | ✅ | ✅ |
| Réassigner à une autre structure | ❌ | ❌ | ✅ |
| Gérer les conseillers | ❌ | ✅ | ✅ |
| Gérer les structures | ❌ | ❌ | ✅ |
| Voir le dashboard global | ❌ | ❌ | ✅ |
| Voir le dashboard de sa structure | ❌ | ✅ | ✅ |

### Protection des données bénéficiaire
- Le conseiller ne voit **que** les données que le bénéficiaire a consenti à transmettre
- Le contenu complet de la conversation n'est **jamais** visible — uniquement le résumé IA
- Les données sont pseudonymisées dans les exports (prénom + initiale, pas de nom complet)

---

## Stack technique

| Composant | Technologie | Justification |
|-----------|-------------|---------------|
| Auth | `jose` (JWT) + `bcryptjs` | Léger, edge-compatible, zéro dépendance native |
| Layout | Next.js App Router (route group `(conseiller)`) | Séparation totale de l'app bénéficiaire |
| Graphiques | `recharts` | React-natif, tree-shakeable, radar chart pour RIASEC |
| BDD | Drizzle + Turso (mêmes tables) | Continuité avec le modèle de données existant |
| Polling | `setInterval` + fetch | Simple, suffisant pour le MVP |

---

## Métriques spécifiques à l'Espace Conseiller

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Temps moyen de première action | Délai entre création du referral et première consultation par un conseiller | < 4h |
| Temps moyen de prise en charge | Délai entre création et passage en "prise_en_charge" | < 24h (normale), < 4h (haute), < 1h (critique) |
| Taux de prise en charge | % des referrals effectivement pris en charge | > 90% |
| Taux d'abandon | % des prises en charge passées en "abandonnée" | < 20% |
| Nombre de cas par conseiller | Charge moyenne par conseiller actif | < 15 simultanés |
| Taux de remplissage des structures | Cas actifs / capacité max | Alerte si > 80% |

---

## Gestion des structures et conseillers (CRUD)

### Page structures (`/conseiller/structures`)

- **Grille de cartes** avec recherche par nom
- Chaque carte affiche : nom, type (badge), départements, spécialités, capacité, nb conseillers, nb cas actifs
- Clic sur une carte → page détail `/conseiller/structures/[id]`
- Bouton "Nouvelle structure" → modale de création
- Bouton modifier/supprimer sur chaque carte

### Page détail structure (`/conseiller/structures/[id]`)

- **Fiche structure** éditable en ligne (tous les champs)
- **Stats** : nb conseillers rattachés, nb cas actifs
- **Tableau des conseillers** rattachés avec : nom, email, rôle (badge), dernière connexion, statut actif
- Clic sur un conseiller → `/conseiller/conseillers/[id]`
- Bouton "Ajouter un conseiller" → création rapide

### Page conseillers (`/conseiller/conseillers`)

- **Barre de filtres** : recherche intelligente (nom/email), filtre par rôle, par structure (super_admin), par statut actif/inactif
- **Double affichage** : mode tableau ou mode fiches (toggle)
- **Mode tableau** : colonnes triables (nom, email, rôle, structure, dernière connexion, actif)
- **Mode fiches** : grille de cartes avec avatar (initiales), infos, badges
- **Création** via modale : prénom, nom, email, mot de passe, rôle, structure
- **Édition inline** ou modale : mêmes champs (mot de passe optionnel)
- **Suppression** : désactivation douce (actif=0, confirm dialog)

### APIs CRUD

| Route | Méthodes | Description |
|-------|----------|-------------|
| `/api/conseiller/structures` | GET, POST | Liste (avec stats) + création |
| `/api/conseiller/structures/[id]` | GET, PUT, DELETE | Détail + mise à jour + désactivation |
| `/api/conseiller/conseillers` | GET, POST | Liste (avec filtres) + création |
| `/api/conseiller/conseillers/[id]` | GET, PUT, DELETE | Détail + mise à jour + désactivation |

### Règles d'accès

| Action | Conseiller | Admin structure | Super admin |
|--------|-----------|----------------|-------------|
| Voir les structures | ❌ | Sa structure uniquement | Toutes |
| Créer/modifier une structure | ❌ | ❌ | ✅ |
| Supprimer une structure | ❌ | ❌ | ✅ |
| Voir les conseillers | ❌ | Sa structure | Tous |
| Créer un conseiller | ❌ | Dans sa structure (rôle ≤ conseiller) | Partout, tout rôle |
| Modifier un conseiller | ❌ | Dans sa structure | Partout |
| Désactiver un conseiller | ❌ | Dans sa structure | Partout |

---

## Accompagnement à distance — Chat groupe, Visio, Agenda

### Chat groupe avec tiers intervenants

Le conseiller référent peut inviter des **intervenants externes** (employeur, éducateur, formateur, assistant social, psychologue) dans l'accompagnement d'un bénéficiaire.

**Flux de consentement double :**
1. Le conseiller clique "Inviter un intervenant" et remplit : nom, prénom, téléphone, rôle
2. Une **carte de consentement** apparaît dans le chat des deux côtés (conseiller + bénéficiaire)
3. Le conseiller approuve automatiquement (il est l'initiateur)
4. Le **bénéficiaire doit accepter** via un bouton dans le chat
5. Si les deux acceptent → un code PIN est généré pour le tiers
6. Le tiers se connecte sur `/tiers` avec son téléphone + PIN (même pattern que le bénéficiaire)

**Échanges tiers ↔ bénéficiaire :**
- Le tiers peut discuter directement avec le bénéficiaire **sans que le conseiller soit présent**
- Les messages sont stockés avec `conversationType='tiers_beneficiaire'`
- Le bénéficiaire peut basculer entre les conversations via un **switcher d'onglets** (Conseiller / Intervenant X)

**Tables :** `tiers_intervenant`, `participant_conversation`, `demande_consentement`

**APIs :**
- `POST/GET /api/conseiller/file-active/[id]/tiers` — inviter/lister les tiers
- `PATCH /api/conseiller/file-active/[id]/tiers/[tiersId]/consentement` — consentement conseiller
- `GET/PATCH /api/accompagnement/consentements` — consentements côté bénéficiaire
- `POST /api/tiers/verify` — vérification PIN tiers
- `GET/POST /api/tiers/messages` — messages tiers ↔ bénéficiaire
- `GET /api/tiers/messages/stream` — SSE temps réel tiers

---

### Journal des événements

Le conseiller référent a accès à un **journal complet** de tous les événements liés à l'accompagnement, dans un onglet dédié "Journal" de la page détail cas.

**Types d'événements tracés :**
- Messages envoyés (par qui, quand)
- Participants rejoint / parti
- Consentements demandés / acceptés / refusés
- Appels vidéo proposés / acceptés / refusés
- RDV planifiés
- Bris de glace

**Table :** `evenement_journal`
**API :** `GET /api/conseiller/file-active/[id]/journal`

---

### Bris de glace

Mécanisme d'accès d'urgence permettant au conseiller référent de **lire les messages échangés entre le bénéficiaire et un tiers** en cas de suspicion d'échanges douteux.

**Fonctionnement :**
1. Le conseiller clique sur le bouton 🔓 à côté du tiers dans la sidebar
2. Une modale lui demande une **justification obligatoire** (min. 10 caractères)
3. L'accès est accordé pour **24 heures**
4. Les messages sont affichés en **lecture seule** dans la modale
5. **Chaque accès est tracé** dans l'audit RGPD (`evenement_audit`) et dans le journal

**Table :** `bris_de_glace`
**APIs :**
- `POST /api/conseiller/file-active/[id]/bris-de-glace` — activer (justification requise)
- `GET /api/conseiller/file-active/[id]/bris-de-glace?tiersId=xxx` — lire les messages (nécessite accès actif < 24h)

---

### Visioconférence (Jitsi Meet)

Tout participant peut proposer un appel vidéo. L'autre partie accepte ou refuse via un bouton dans le chat.

- **Aucun compte requis** — Jitsi Meet crée le salon automatiquement à l'ouverture de l'URL
- L'URL est générée côté serveur : `{JITSI_BASE_URL}/catchup-{pecId}-{random}`
- L'appel s'ouvre dans un **nouvel onglet** (plus fiable que iframe, surtout sur mobile)
- Env var configurable : `JITSI_BASE_URL` (défaut: `https://meet.jit.si`)

**APIs :**
- `POST /api/conseiller/file-active/[id]/video` — proposer un appel
- `POST /api/accompagnement/video/reponse` — bénéficiaire accepte/refuse

**Composant :** `VideoCallCard.tsx` — carte dans le chat avec boutons Accepter/Refuser/Rejoindre

---

### Planification de rendez-vous

Le conseiller peut planifier un RDV depuis le chat. Une carte est affichée avec des liens directs vers les agendas.

**Liens générés :**
- **Google Calendar** — URL pré-remplie (`calendar.google.com/calendar/render?action=TEMPLATE&...`)
- **Outlook / iCal** — fichier `.ics` téléchargeable (compatible Apple Calendar, Thunderbird, etc.)

**APIs :**
- `POST /api/conseiller/file-active/[id]/rdv` — créer un RDV
- `GET /api/conseiller/file-active/[id]/rdv/[rdvId]/ics` — télécharger le .ics

**Composants :**
- `PlanifierRdvModal.tsx` — date/heure/description
- `RdvCard.tsx` — carte avec les 2 boutons d'agenda
