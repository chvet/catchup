# 09 — Gamification

## Principe directeur
**Motiver sans manipuler.** La gamification dans Catch'Up sert à encourager le jeune à avancer dans sa réflexion, pas à le rendre dépendant. Chaque mécanisme a une finalité éducative ou motivationnelle claire. On s'inspire de Duolingo (progression douce) et Spotify Wrapped (valorisation personnelle), pas de jeux d'argent ou de mécaniques addictives.

**Jamais de :**
- Classement entre jeunes (pas de compétition)
- Perte de progression (pas de punition)
- Récompense monétaire ou matérielle
- Pression temporelle ("fais-le avant minuit !")
- Dark patterns (fausse rareté, FOMO artificiel)

---

## Les 5 mécaniques de gamification

### 1. Jauge de découverte de soi

**Concept :** Une barre de progression qui monte au fil de la conversation. Elle visualise le chemin parcouru, pas un score à maximiser.

**Étapes de la jauge :**

```
░░░░░░░░░░ 0%   "Prêt à démarrer 🚀"
██░░░░░░░░ 20%  "Premiers échanges"
████░░░░░░ 40%  "Je commence à te cerner"
██████░░░░ 60%  "Ton profil se dessine 🎯"
████████░░ 80%  "Presque complet"
██████████ 100% "Je te connais bien ! 🎉"
```

**Ce qui fait monter la jauge :**

| Action | Points | Pourquoi |
|--------|--------|----------|
| Premier message envoyé | +10 | Briser la glace |
| Donner son prénom | +5 | Lien de confiance |
| Répondre à 5 messages | +10 | Engagement |
| Profil RIASEC > 2 dimensions actives | +15 | Le profil prend forme |
| Indice de confiance > 50% | +15 | Profil fiable |
| Explorer une piste métier | +10 | Projection concrète |
| Partager son profil | +10 | Viralité |
| Revenir une 2ème fois | +10 | Rétention |
| Donner son email | +10 | Engagement fort |
| Profil stabilisé | +5 | Objectif atteint |

**Total possible : 100 points = 100%**

**Affichage :** Petite barre discrète en haut du panel profil, sous l'indice de confiance. Pas dans le chat (ne pas interrompre la conversation).

**Animation :** Quand la jauge franchit un palier (20%, 40%, etc.), une micro-animation de célébration (confettis légers, 1 seconde) et le label change.

**Ce que la jauge n'est PAS :**
- Un objectif imposé ("atteins 100% !")
- Un bloqueur ("tu dois atteindre 40% pour accéder à...")
- Visible publiquement

---

### 2. Série de jours (streak)

**Concept :** Compteur de jours consécutifs où le jeune a échangé avec Catch'Up. Inspiré de Duolingo mais sans la pression.

**Affichage :**

```
🔥 3 jours de suite !
```

Affiché dans le header du chat, à côté du nom "Catch'Up", quand le streak est ≥ 2 jours.

**Règles :**
- Un "jour actif" = au moins 1 message envoyé dans la journée (pas juste ouvrir l'app)
- Le streak se casse si le jeune ne revient pas pendant 48h (pas 24h — on est tolérant)
- **Pas de notification "tu vas perdre ton streak !"** (c'est du dark pattern)
- Pas de récompense liée au streak (c'est juste un indicateur motivationnel)
- Le streak maximum est affiché dans le profil : "Record : 🔥 7 jours"
- Si le streak se casse, **aucun message culpabilisant** — il repart simplement à 0

**Pourquoi 48h et pas 24h :** Un jeune de 16-25 ans peut facilement sauter un jour (cours, travail, flemme). Casser le streak pour 1 jour d'absence c'est frustrant et injuste.

---

### 3. Badges de progression

**Concept :** Des badges débloqués en accomplissant des étapes naturelles du parcours. Pas des trophées à collectionner compulsivement — des marqueurs de progression.

**Les badges :**

| Badge | Nom | Condition | Emoji |
|-------|-----|-----------|-------|
| Premier pas | "Premier pas" | Envoyer le 1er message | 👣 |
| Curieux | "Curieux" | Poser 3 questions à Catch'Up | 🔍 |
| Ouvert | "Ouvert" | Partager un centre d'intérêt | 💡 |
| Connecté | "Connecté" | Donner son email | 🔗 |
| Profil esquissé | "Esquissé" | Profil RIASEC avec 2+ dimensions > 30 | ✏️ |
| Profil précis | "Précis" | Indice de confiance > 50% | 🎯 |
| Profil complet | "Complet" | Indice de confiance > 75% | ⭐ |
| Explorateur | "Explorateur" | Avoir exploré 3+ pistes métiers | 🧭 |
| Partageur | "Partageur" | Partager son profil ou un résultat de quiz | 📢 |
| Fidèle | "Fidèle" | Revenir 3 fois | 🏠 |
| Ambassadeur | "Ambassadeur" | Un ami a fait le quiz via son lien de parrainage | 🌟 |
| Accompagné | "Accompagné" | Accepter une mise en relation conseiller | 🤝 |

**Affichage :** Section "Mes badges" en bas du panel profil. Les badges non débloqués apparaissent en gris avec un cadenas, sans condition affichée (pour éviter le gaming). Quand un badge est débloqué :
- Notification in-app discrète : "Nouveau badge : Explorateur 🧭"
- Le badge passe en couleur dans le panel
- Pas de fanfare excessive

**Ce que les badges ne sont PAS :**
- Obligatoires pour accéder à des fonctionnalités
- Visibles par d'autres utilisateurs (sauf si le jeune choisit de partager)
- Liés à un classement quelconque

---

### 4. Métier du jour

**Concept :** Chaque jour, Catch'Up met en avant un métier adapté au profil du jeune. C'est du contenu récurrent qui donne une raison de revenir.

**Affichage (écran d'accueil ou début de conversation) :**

```
┌──────────────────────────────────┐
│  💡 Métier du jour               │
│                                  │
│  🎮 Game Designer                │
│  "Celui qui invente les règles   │
│   du jeu et l'expérience du     │
│   joueur"                        │
│                                  │
│  🎨 Artiste 72% · 🔬 Invest. 58% │
│                                  │
│  [En savoir plus →]              │
│  [Pas pour moi ✕]               │
└──────────────────────────────────┘
```

**Logique de sélection :**
1. Filtrer les métiers compatibles avec les 2 dimensions RIASEC dominantes du jeune
2. Exclure les métiers déjà proposés (pas de répétition)
3. Varier les niveaux de diplôme (pas que bac+5)
4. Mélanger métiers connus et métiers surprenants (découverte)

**Interaction :**
- **"En savoir plus"** → Catch'Up démarre une mini-conversation sur ce métier : "Le game designer, c'est celui qui... Tu veux que je t'en dise plus ?"
- **"Pas pour moi"** → Stocké comme signal négatif (le métier ne sera plus proposé, et ça affine la suggestion)

**Source des métiers :** Base ROME (Pôle Emploi) ou base Parcoureo (Fondation JAE), chaque métier ayant un code RIASEC.

**Fréquence :** 1 métier par jour, renouvelé à minuit. Si le jeune n'a pas de profil, proposer un métier aléatoire populaire.

---

### 5. Défi entre amis

**Concept :** Le jeune peut inviter un ami à faire le quiz et comparer leurs profils. Mécanique virale légère, sans compétition.

**Parcours :**

```
Le jeune ouvre son profil
  │
  ▼
Bouton "Compare avec un pote 👀"
  │
  ▼
Génère un lien unique : catchup.jaeprive.fr/quiz?defi={CODE}
  │
  ▼
Le jeune envoie le lien (Web Share API)
  │
  ▼
L'ami fait le quiz (3 questions, 30 secondes)
  │
  ▼
Écran de comparaison :
┌──────────────────────────────────┐
│  👥 Toi vs {Ami}                 │
│                                  │
│  🎨 Artiste    ████░ vs ██░░░   │
│  🤝 Social     ███░░ vs ████░   │
│  🔬 Invest.    ██░░░ vs █░░░░   │
│                                  │
│  "Vous êtes compatibles à 72% !"│
│                                  │
│  [Partager le résultat 📱]      │
│  [Défier un autre pote 🔄]      │
│  [Découvre tes métiers →]        │
└──────────────────────────────────┘
```

**Calcul de compatibilité :**
- Corrélation entre les 6 scores RIASEC des deux profils
- Formule : `100 - (distance euclidienne normalisée × 100)`
- Résultat entre 0% (profils opposés) et 100% (profils identiques)
- On affiche toujours un pourcentage > 20% (jamais "0% compatible" — c'est blessant)

**Règles :**
- L'ami n'a PAS besoin de créer un compte
- Le profil de l'ami n'est stocké que temporairement (24h) pour la comparaison
- Le jeune ne voit que le résultat du quiz de l'ami, pas sa conversation
- Pas de classement entre amis
- Maximum 10 comparaisons actives (pour éviter l'abus)

---

## Récapitulatif des mécaniques

| Mécanique | Objectif principal | Risque si mal dosé | Notre garde-fou |
|-----------|-------------------|--------------------|-----------------|
| Jauge de découverte | Visualiser la progression | Obsession du 100% | Pas de blocage, pas de récompense au 100% |
| Streak | Revenir régulièrement | Culpabilité si cassé | 48h de tolérance, pas de notification |
| Badges | Marquer les étapes | Collection compulsive | Badges cachés, pas de classement |
| Métier du jour | Raison de revenir | Surcharge d'info | 1 seul métier, skip possible |
| Défi entre amis | Viralité | Comparaison toxique | Jamais < 20%, pas de classement |

---

## Ce qu'on ne fera PAS

Pour être explicite sur les mécaniques qu'on refuse :

| Mécanique refusée | Pourquoi |
|-------------------|----------|
| Classement / leaderboard | Crée de la compétition et de l'exclusion |
| Points échangeables | Transforme l'orientation en jeu marchand |
| Lootbox / récompense aléatoire | Mécanique addictive, éthiquement inacceptable pour des mineurs |
| Compte à rebours | Crée de la pression artificielle (FOMO) |
| Pénalité d'absence | Culpabilise le jeune qui a besoin de temps |
| Niveaux bloquants | Transforme l'exploration en parcours imposé |
| Monnaie virtuelle | Détourne de l'objectif (s'orienter, pas farmer des coins) |
| Streak visible par d'autres | Pression sociale toxique |

---

## Modèle de données (complément spec 07)

### Table `progression`

```sql
CREATE TABLE progression (
  utilisateur_id    TEXT PRIMARY KEY,          -- FK → utilisateur.id
  jauge             INTEGER DEFAULT 0,         -- 0-100
  streak_actuel     INTEGER DEFAULT 0,         -- jours consécutifs
  streak_record     INTEGER DEFAULT 0,         -- record personnel
  dernier_jour_actif TEXT,                     -- ISO 8601 (date, pas datetime)
  nb_metiers_explores INTEGER DEFAULT 0,       -- compteur
  nb_defis_envoyes  INTEGER DEFAULT 0,         -- compteur
  nb_defis_completes INTEGER DEFAULT 0,        -- compteur
  mis_a_jour_le     TEXT NOT NULL,

  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);
```

### Table `badge`

```sql
CREATE TABLE badge (
  id                TEXT PRIMARY KEY,          -- UUID v4
  utilisateur_id    TEXT NOT NULL,             -- FK → utilisateur.id
  code_badge        TEXT NOT NULL,             -- 'premier_pas', 'curieux', 'ouvert', etc.
  debloque_le       TEXT NOT NULL,             -- ISO 8601

  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
  UNIQUE(utilisateur_id, code_badge)           -- pas de doublon
);
```

### Table `metier_du_jour`

```sql
CREATE TABLE metier_du_jour (
  id                TEXT PRIMARY KEY,          -- UUID v4
  utilisateur_id    TEXT NOT NULL,             -- FK → utilisateur.id
  code_metier       TEXT NOT NULL,             -- code ROME ou Parcoureo
  nom_metier        TEXT NOT NULL,
  description       TEXT,
  scores_riasec     TEXT,                      -- JSON : {"R": 20, "A": 80, ...}
  reaction          TEXT,                      -- 'interesse', 'pas_pour_moi', NULL (pas vu)
  propose_le        TEXT NOT NULL,             -- ISO 8601 (date)

  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);
```

### Table `defi`

```sql
CREATE TABLE defi (
  id                TEXT PRIMARY KEY,          -- UUID v4
  createur_id       TEXT NOT NULL,             -- FK → utilisateur.id (celui qui envoie)
  code_defi         TEXT NOT NULL UNIQUE,      -- code court dans l'URL
  profil_ami        TEXT,                      -- JSON : scores RIASEC de l'ami (temporaire)
  compatibilite     REAL,                      -- 0-100%
  statut            TEXT DEFAULT 'en_attente', -- 'en_attente', 'complete', 'expire'
  cree_le           TEXT NOT NULL,
  complete_le       TEXT,
  expire_le         TEXT NOT NULL,             -- +24h après création

  FOREIGN KEY (createur_id) REFERENCES utilisateur(id)
);
```

---

## Métriques

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Jauge moyenne | Niveau moyen de la jauge chez les utilisateurs actifs | > 50% |
| Taux de badge "Profil complet" | % d'utilisateurs ayant débloqué ce badge | > 20% |
| Streak moyen | Durée moyenne des streaks | > 3 jours |
| Taux d'engagement métier du jour | % de "En savoir plus" cliqués | > 25% |
| Taux de conversion défi | % de liens défi envoyés qui sont complétés | > 30% |
| K-factor défis | Nombre de nouveaux utilisateurs générés par défi | > 0.2 |
| Rétention J+7 avec gamification | % de retour à J+7 pour les jeunes ayant atteint jauge > 40% | > 35% |
| Impact badges sur rétention | Comparaison rétention avec/sans badges | +10% minimum |
