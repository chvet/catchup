# 07 — Modèle de données

## Principe directeur
**Les données appartiennent au jeune.** Tout est stocké localement d'abord (`localStorage`), synchronisé en base ensuite (si le jeune s'authentifie). Le jeune peut utiliser Catch'Up indéfiniment sans jamais créer de compte — ses données vivent dans son navigateur.

**La base de données sert à :** la persistance long terme, la synchronisation multi-appareils, le dossier de transmission au conseiller, et les analytics agrégées.

---

## Choix technique

### Turso (LibSQL) + Drizzle ORM

| Critère | Choix | Justification |
|---------|-------|---------------|
| Base de données | **Turso** (LibSQL hébergé) | SQLite en edge, gratuit (500 bases, 9 Go), latence < 10ms |
| ORM | **Drizzle** | Typage TypeScript natif, requêtes SQL lisibles, migrations automatiques |
| Stockage local | **localStorage** (MVP) → **SQLite embarqué** (app native) | Zéro dépendance côté client, fonctionne offline |
| Synchronisation | Locale → serveur quand connecté | Le jeune ne perd rien s'il est offline |

### Pourquoi pas les alternatives ?

| Alternative | Pourquoi non |
|-------------|-------------|
| PostgreSQL (Supabase, Neon) | Plus lourd, gratuit limité, pas de compatibilité native SQLite |
| Firebase/Firestore | Vendor lock-in Google, NoSQL moins adapté aux requêtes relationnelles |
| MongoDB | Pas de typage fort, over-engineering pour ce cas d'usage |
| Prisma | Plus lent que Drizzle, bundle plus lourd, moins de contrôle SQL |

---

## Schéma complet

### Vue d'ensemble des tables

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────┐
│  utilisateur │────<│   conversation   │────<│   message    │
└──────────────┘     └──────────────────┘     └──────────────┘
       │                     │
       │              ┌──────┴───────┐
       │              │              │
       ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌─────────────────┐
│ profil_riasec│ │ referral │ │instantane_profil │
└──────────────┘ └──────────┘ └─────────────────┘
       │
       ▼
┌──────────────────┐
│ indice_confiance  │
└──────────────────┘

┌──────────────────┐     ┌──────────────────┐
│ evenement_quiz   │     │ source_captation │
└──────────────────┘     └──────────────────┘

┌──────────────────┐
│ session_magic_link│
└──────────────────┘
```

---

### Table `utilisateur`

L'entité centrale. Représente un jeune, qu'il soit anonyme ou authentifié.

```sql
CREATE TABLE utilisateur (
  id                TEXT PRIMARY KEY,          -- UUID v4, généré côté client
  prenom            TEXT,                      -- collecté dans la conversation (optionnel)
  email             TEXT UNIQUE,               -- NULL si anonyme, rempli après magic link
  email_verifie     INTEGER DEFAULT 0,         -- 0 = non, 1 = oui (après clic magic link)
  telephone         TEXT,                      -- optionnel, pour mise en relation conseiller
  age               INTEGER,                   -- estimé ou déclaré dans la conversation
  situation         TEXT,                       -- 'lyceen', 'etudiant', 'decrocheur', 'emploi', 'recherche', 'autre'
  code_parrainage   TEXT UNIQUE,               -- code court 6 chars (ex: LUCAS7) pour le partage
  parraine_par      TEXT,                      -- code_parrainage de celui qui l'a invité (ref)
  source            TEXT,                      -- canal d'arrivée : 'direct', 'quiz', 'prescripteur', 'parrainage', 'pub'
  source_detail     TEXT,                      -- détail : code prescripteur (ML-PARIS15), ref, utm_source
  plateforme        TEXT DEFAULT 'web',        -- 'web', 'pwa', 'ios', 'android'
  preferences       TEXT,                      -- JSON : {"tts": false, "rgaa": false, "theme": "auto", "langue": "fr"}
  cree_le           TEXT NOT NULL,             -- ISO 8601
  mis_a_jour_le     TEXT NOT NULL,             -- ISO 8601
  derniere_visite   TEXT,                      -- ISO 8601
  supprime_le       TEXT                       -- soft delete (RGPD)
);
```

**Règles :**
- L'`id` est le même UUID généré côté client en `localStorage` (cf. spec 01)
- Le `prenom` est extrait de la conversation par l'IA (pas un formulaire)
- L'`email` passe de NULL à une valeur quand le jeune accepte la sauvegarde (phase 2)
- `supprime_le` : soft delete pour respecter le droit à l'oubli RGPD (les données sont marquées, puis purgées après 30 jours)
- `preferences` est un champ JSON (Turso/SQLite supporte JSON nativement)

---

### Table `conversation`

Une session de discussion entre le jeune et Catch'Up.

```sql
CREATE TABLE conversation (
  id                TEXT PRIMARY KEY,          -- UUID v4
  utilisateur_id    TEXT NOT NULL,             -- FK → utilisateur.id
  titre             TEXT,                      -- généré automatiquement ("Conversation du 20 mars")
  statut            TEXT DEFAULT 'active',     -- 'active', 'archivee', 'supprimee'
  origine           TEXT DEFAULT 'direct',     -- 'direct', 'quiz', 'prescripteur', 'retour'
  nb_messages       INTEGER DEFAULT 0,         -- compteur dénormalisé pour performance
  phase             TEXT DEFAULT 'accroche',   -- 'accroche', 'decouverte', 'exploration', 'projection', 'action'
  duree_secondes    INTEGER DEFAULT 0,         -- durée totale estimée de la conversation
  cree_le           TEXT NOT NULL,
  mis_a_jour_le     TEXT NOT NULL,

  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);
```

**Règles :**
- Un utilisateur peut avoir **plusieurs conversations** (une par session ou par thème)
- Le `titre` est auto-généré : "Conversation du {date}" ou résumé IA si dispo
- La `phase` est mise à jour en fonction du `nb_messages` (cf. spec 04)
- `duree_secondes` est calculée : dernier message timestamp - premier message timestamp

---

### Table `message`

Chaque message échangé dans une conversation.

```sql
CREATE TABLE message (
  id                TEXT PRIMARY KEY,          -- UUID v4
  conversation_id   TEXT NOT NULL,             -- FK → conversation.id
  role              TEXT NOT NULL,             -- 'utilisateur' ou 'assistant'
  contenu           TEXT NOT NULL,             -- texte affiché (nettoyé, sans bloc PROFILE)
  contenu_brut      TEXT,                      -- texte original avec bloc <!--PROFILE:...--> (pour debug/replay)
  url_audio         TEXT,                      -- URL du fichier audio si message vocal
  fragilite_detectee INTEGER DEFAULT 0,        -- 0 = non, 1 = oui
  niveau_fragilite  TEXT,                      -- 'faible', 'moyen', 'eleve' (NULL si pas détecté)
  profil_extrait    INTEGER DEFAULT 0,         -- 1 si un bloc PROFILE a été extrait de ce message
  horodatage        TEXT NOT NULL,             -- ISO 8601

  FOREIGN KEY (conversation_id) REFERENCES conversation(id)
);
```

**Règles :**
- `contenu` = ce qui est affiché au jeune (nettoyé par `nettoyerContenuMessage()`)
- `contenu_brut` = la réponse complète de l'IA incluant le bloc `<!--PROFILE:...-->` (utile pour le debug et la reprise de conversation)
- Les messages sont **ordonnés par `horodatage`** (pas par un index numérique)
- On ne supprime jamais un message (soft delete au niveau conversation)

---

### Table `profil_riasec`

Le profil RIASEC courant du jeune. Une seule ligne par utilisateur (mise à jour à chaque extraction).

```sql
CREATE TABLE profil_riasec (
  id                TEXT PRIMARY KEY,          -- = utilisateur_id (1 profil par utilisateur)
  utilisateur_id    TEXT NOT NULL UNIQUE,      -- FK → utilisateur.id
  r                 INTEGER DEFAULT 0,         -- score Réaliste (0-100)
  i                 INTEGER DEFAULT 0,         -- score Investigateur (0-100)
  a                 INTEGER DEFAULT 0,         -- score Artiste (0-100)
  s                 INTEGER DEFAULT 0,         -- score Social (0-100)
  e                 INTEGER DEFAULT 0,         -- score Entreprenant (0-100)
  c                 INTEGER DEFAULT 0,         -- score Conventionnel (0-100)
  dimensions_dominantes TEXT,                  -- JSON : ["Artiste", "Social"]
  traits            TEXT,                      -- JSON : ["créatif", "empathique", "rêveur"]
  interets          TEXT,                      -- JSON : ["musique", "dessin", "jeux vidéo"]
  forces            TEXT,                      -- JSON : ["imagination", "écoute"]
  suggestion        TEXT,                      -- dernière piste métier/domaine suggérée
  source            TEXT DEFAULT 'conversation', -- 'quiz', 'conversation', 'parcoureo'
  est_stable        INTEGER DEFAULT 0,         -- 1 si le profil est stabilisé (cf. spec 06)
  coherence_signaux TEXT DEFAULT 'mixte',      -- 'contradictoire', 'mixte', 'convergent'
  mis_a_jour_le     TEXT NOT NULL,

  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);
```

**Règles :**
- Un seul profil actif par utilisateur (l'historique est dans `instantane_profil`)
- Les scores sont des entiers 0-100 (pas de décimales)
- `traits`, `interets`, `forces` sont des tableaux JSON stockés en TEXT
- `source` indique d'où vient le score actuel : le quiz initial, la conversation, ou un import Parcoureo (futur)
- `est_stable` est calculé selon les règles de la spec 06

---

### Table `instantane_profil`

Historique des extractions de profil. Permet de visualiser l'évolution et de calculer l'indice de confiance.

```sql
CREATE TABLE instantane_profil (
  id                TEXT PRIMARY KEY,          -- UUID v4
  utilisateur_id    TEXT NOT NULL,             -- FK → utilisateur.id
  conversation_id   TEXT NOT NULL,             -- FK → conversation.id
  index_message     INTEGER NOT NULL,          -- numéro du message qui a déclenché cet instantané
  r                 INTEGER DEFAULT 0,
  i                 INTEGER DEFAULT 0,
  a                 INTEGER DEFAULT 0,
  s                 INTEGER DEFAULT 0,
  e                 INTEGER DEFAULT 0,
  c                 INTEGER DEFAULT 0,
  coherence_signaux TEXT,                      -- 'contradictoire', 'mixte', 'convergent'
  horodatage        TEXT NOT NULL,

  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
  FOREIGN KEY (conversation_id) REFERENCES conversation(id)
);
```

**Règles :**
- On garde les **20 derniers instantanés** par conversation (purge automatique des plus anciens)
- Chaque message IA contenant un bloc PROFILE génère un instantané
- Utilisé par `calculerIndiceConfiance()` pour le facteur stabilité (cf. spec 06)

---

### Table `indice_confiance`

L'indice de confiance courant du profil. Mis à jour à chaque extraction.

```sql
CREATE TABLE indice_confiance (
  id                TEXT PRIMARY KEY,          -- = utilisateur_id
  utilisateur_id    TEXT NOT NULL UNIQUE,      -- FK → utilisateur.id
  score_global      REAL NOT NULL DEFAULT 0,   -- 0.0 à 1.0
  niveau            TEXT DEFAULT 'debut',      -- 'debut', 'emergent', 'precis', 'fiable'
  volume            REAL DEFAULT 0,            -- facteur volume (0-1)
  stabilite         REAL DEFAULT 0,            -- facteur stabilité (0-1)
  differenciation   REAL DEFAULT 0,            -- facteur différenciation (0-1)
  coherence         REAL DEFAULT 0,            -- facteur cohérence (0-1)
  nb_messages       INTEGER DEFAULT 0,
  nb_instantanes    INTEGER DEFAULT 0,
  mis_a_jour_le     TEXT NOT NULL,

  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);
```

---

### Table `referral` (mise en relation conseiller)

Chaque demande de mise en relation avec un conseiller humain.

```sql
CREATE TABLE referral (
  id                TEXT PRIMARY KEY,          -- UUID v4
  utilisateur_id    TEXT NOT NULL,             -- FK → utilisateur.id
  conversation_id   TEXT NOT NULL,             -- FK → conversation.id
  priorite          TEXT NOT NULL,             -- 'normale', 'haute', 'critique'
  niveau_detection  INTEGER NOT NULL,          -- 1, 2, ou 3 (cf. spec 02)
  motif             TEXT,                      -- résumé du motif (généré par IA)
  resume_conversation TEXT,                    -- résumé complet (généré par IA)
  moyen_contact     TEXT,                      -- email ou téléphone du jeune
  type_contact      TEXT,                      -- 'email' ou 'telephone'
  statut            TEXT DEFAULT 'en_attente', -- 'en_attente', 'envoye', 'recontacte', 'echoue', 'refuse'
  webhook_envoye    INTEGER DEFAULT 0,         -- 1 si le webhook a été envoyé avec succès
  webhook_reponse   TEXT,                      -- code HTTP + body de la réponse webhook
  relance_envoyee   INTEGER DEFAULT 0,         -- 1 si une relance a été envoyée
  cree_le           TEXT NOT NULL,
  mis_a_jour_le     TEXT NOT NULL,
  recontacte_le     TEXT,                      -- date effective du recontact (rempli par le conseiller via API)

  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id),
  FOREIGN KEY (conversation_id) REFERENCES conversation(id)
);
```

**Règles :**
- Maximum **2 referrals par session** (pas de harcèlement, cf. spec 02)
- Le `statut` évolue : en_attente → envoyé → recontacté (ou échoué)
- `webhook_reponse` stocke le retour du système externe pour debug
- `recontacte_le` est rempli quand le conseiller confirme avoir recontacté le jeune

---

### Table `evenement_quiz`

Chaque quiz complété. Pour l'analytics et le tracking de conversion.

```sql
CREATE TABLE evenement_quiz (
  id                TEXT PRIMARY KEY,          -- UUID v4
  utilisateur_id    TEXT,                      -- FK → utilisateur.id (peut être NULL si pas encore créé)
  reponses          TEXT NOT NULL,             -- JSON : [0, 1, 1] (0=gauche, 1=droite)
  resultat          TEXT NOT NULL,             -- ex: "A-S"
  duree_ms          INTEGER,                   -- temps total du quiz en millisecondes
  code_parrainage   TEXT,                      -- ref entrant (qui a partagé le lien)
  source_prescripteur TEXT,                    -- code prescripteur entrant (ML-PARIS15)
  a_partage         INTEGER DEFAULT 0,         -- 1 si le jeune a partagé son résultat
  a_continue_chat   INTEGER DEFAULT 0,         -- 1 si le jeune a cliqué "Découvre tes métiers"
  horodatage        TEXT NOT NULL,

  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);
```

---

### Table `source_captation`

Suivi des canaux d'acquisition. Permet de mesurer l'efficacité de chaque source.

```sql
CREATE TABLE source_captation (
  id                TEXT PRIMARY KEY,          -- UUID v4
  code              TEXT NOT NULL UNIQUE,      -- ex: "ML-PARIS15", "TIKTOK-03", "LUCAS7"
  type              TEXT NOT NULL,             -- 'prescripteur', 'parrainage', 'pub', 'organique'
  nom               TEXT,                      -- nom lisible : "Mission Locale Paris 15"
  nb_visites        INTEGER DEFAULT 0,         -- compteur de visites via ce code
  nb_quiz_completes INTEGER DEFAULT 0,         -- compteur de quiz terminés
  nb_chats_ouverts  INTEGER DEFAULT 0,         -- compteur de conversations ouvertes
  nb_emails_collectes INTEGER DEFAULT 0,       -- compteur d'emails récupérés
  cree_le           TEXT NOT NULL,
  mis_a_jour_le     TEXT NOT NULL
);
```

**Règles :**
- Les compteurs sont incrémentés à chaque événement (dénormalisés pour performance)
- Permet au prescripteur de voir ses stats : "12 jeunes ont utilisé Catch'Up via votre lien"

---

### Table `session_magic_link`

Gestion des magic links pour l'authentification sans mot de passe.

```sql
CREATE TABLE session_magic_link (
  id                TEXT PRIMARY KEY,          -- UUID v4
  utilisateur_id    TEXT NOT NULL,             -- FK → utilisateur.id
  email             TEXT NOT NULL,             -- email cible
  jeton             TEXT NOT NULL UNIQUE,      -- token unique dans l'URL du magic link
  utilise           INTEGER DEFAULT 0,         -- 1 si le lien a été cliqué (usage unique)
  expire_le         TEXT NOT NULL,             -- ISO 8601 (15 minutes après création)
  cree_le           TEXT NOT NULL,
  utilise_le        TEXT,                      -- date d'utilisation effective

  FOREIGN KEY (utilisateur_id) REFERENCES utilisateur(id)
);
```

**Règles :**
- Le `jeton` est un UUID v4 ou un token cryptographiquement sûr (32 bytes hex)
- Expiration : **15 minutes** après création
- Usage unique : après clic, `utilise = 1` → le lien ne fonctionne plus
- Rate limiting : **max 3 magic links par email par heure** (cf. spec 01)
- Purge automatique : les liens expirés sont supprimés après 24h

---

## Schéma Drizzle (implémentation)

```typescript
// src/data/schema.ts

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const utilisateur = sqliteTable('utilisateur', {
  id: text('id').primaryKey(),
  prenom: text('prenom'),
  email: text('email').unique(),
  emailVerifie: integer('email_verifie').default(0),
  telephone: text('telephone'),
  age: integer('age'),
  situation: text('situation'),
  codeParrainage: text('code_parrainage').unique(),
  parrainePar: text('parraine_par'),
  source: text('source'),
  sourceDetail: text('source_detail'),
  plateforme: text('plateforme').default('web'),
  preferences: text('preferences'),              // JSON sérialisé
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
  derniereVisite: text('derniere_visite'),
  supprimeLe: text('supprime_le'),
})

export const conversation = sqliteTable('conversation', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').notNull().references(() => utilisateur.id),
  titre: text('titre'),
  statut: text('statut').default('active'),
  origine: text('origine').default('direct'),
  nbMessages: integer('nb_messages').default(0),
  phase: text('phase').default('accroche'),
  dureeSecondes: integer('duree_secondes').default(0),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const message = sqliteTable('message', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversation.id),
  role: text('role').notNull(),                   // 'utilisateur' | 'assistant'
  contenu: text('contenu').notNull(),
  contenuBrut: text('contenu_brut'),
  urlAudio: text('url_audio'),
  fragiliteDetectee: integer('fragilite_detectee').default(0),
  niveauFragilite: text('niveau_fragilite'),
  profilExtrait: integer('profil_extrait').default(0),
  horodatage: text('horodatage').notNull(),
})

export const profilRiasec = sqliteTable('profil_riasec', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').notNull().unique().references(() => utilisateur.id),
  r: integer('r').default(0),
  i: integer('i').default(0),
  a: integer('a').default(0),
  s: integer('s').default(0),
  e: integer('e').default(0),
  c: integer('c').default(0),
  dimensionsDominantes: text('dimensions_dominantes'),  // JSON
  traits: text('traits'),                                // JSON
  interets: text('interets'),                            // JSON
  forces: text('forces'),                                // JSON
  suggestion: text('suggestion'),
  source: text('source').default('conversation'),
  estStable: integer('est_stable').default(0),
  coherenceSignaux: text('coherence_signaux').default('mixte'),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const instantaneProfil = sqliteTable('instantane_profil', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').notNull().references(() => utilisateur.id),
  conversationId: text('conversation_id').notNull().references(() => conversation.id),
  indexMessage: integer('index_message').notNull(),
  r: integer('r').default(0),
  i: integer('i').default(0),
  a: integer('a').default(0),
  s: integer('s').default(0),
  e: integer('e').default(0),
  c: integer('c').default(0),
  coherenceSignaux: text('coherence_signaux'),
  horodatage: text('horodatage').notNull(),
})

export const indiceConfiance = sqliteTable('indice_confiance', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').notNull().unique().references(() => utilisateur.id),
  scoreGlobal: real('score_global').default(0),
  niveau: text('niveau').default('debut'),
  volume: real('volume').default(0),
  stabilite: real('stabilite').default(0),
  differenciation: real('differenciation').default(0),
  coherence: real('coherence').default(0),
  nbMessages: integer('nb_messages').default(0),
  nbInstantanes: integer('nb_instantanes').default(0),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const referral = sqliteTable('referral', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').notNull().references(() => utilisateur.id),
  conversationId: text('conversation_id').notNull().references(() => conversation.id),
  priorite: text('priorite').notNull(),
  niveauDetection: integer('niveau_detection').notNull(),
  motif: text('motif'),
  resumeConversation: text('resume_conversation'),
  moyenContact: text('moyen_contact'),
  typeContact: text('type_contact'),
  statut: text('statut').default('en_attente'),
  webhookEnvoye: integer('webhook_envoye').default(0),
  webhookReponse: text('webhook_reponse'),
  relanceEnvoyee: integer('relance_envoyee').default(0),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
  recontacteLe: text('recontacte_le'),
})

export const evenementQuiz = sqliteTable('evenement_quiz', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').references(() => utilisateur.id),
  reponses: text('reponses').notNull(),           // JSON
  resultat: text('resultat').notNull(),
  dureeMs: integer('duree_ms'),
  codeParrainage: text('code_parrainage'),
  sourcePrescripteur: text('source_prescripteur'),
  aPartage: integer('a_partage').default(0),
  aContinueChat: integer('a_continue_chat').default(0),
  horodatage: text('horodatage').notNull(),
})

export const sourceCaptation = sqliteTable('source_captation', {
  id: text('id').primaryKey(),
  code: text('code').notNull().unique(),
  type: text('type').notNull(),
  nom: text('nom'),
  nbVisites: integer('nb_visites').default(0),
  nbQuizCompletes: integer('nb_quiz_completes').default(0),
  nbChatsOuverts: integer('nb_chats_ouverts').default(0),
  nbEmailsCollectes: integer('nb_emails_collectes').default(0),
  creeLe: text('cree_le').notNull(),
  misAJourLe: text('mis_a_jour_le').notNull(),
})

export const sessionMagicLink = sqliteTable('session_magic_link', {
  id: text('id').primaryKey(),
  utilisateurId: text('utilisateur_id').notNull().references(() => utilisateur.id),
  email: text('email').notNull(),
  jeton: text('jeton').notNull().unique(),
  utilise: integer('utilise').default(0),
  expireLe: text('expire_le').notNull(),
  creeLe: text('cree_le').notNull(),
  utiliseLe: text('utilise_le'),
})
```

---

## Stockage local (localStorage)

### Structure MVP

Avant que le jeune ne s'authentifie, tout vit dans le `localStorage` du navigateur :

```typescript
// Clés localStorage utilisées

localStorage['catchup_id']           // UUID v4 de l'utilisateur anonyme
localStorage['catchup_profil']       // JSON : profil RIASEC courant
localStorage['catchup_confiance']    // JSON : indice de confiance courant
localStorage['catchup_conversations'] // JSON : tableau des conversations
localStorage['catchup_messages_{id}'] // JSON : messages de la conversation {id}
localStorage['catchup_instantanes']  // JSON : 20 derniers instantanés de profil
localStorage['catchup_preferences']  // JSON : paramètres (TTS, RGAA, thème)
localStorage['catchup_quiz']         // JSON : profil issu du quiz (si arrivée par /quiz)
localStorage['catchup_source']       // JSON : { ref, src } paramètres d'acquisition
localStorage['catchup_banner']       // JSON : état de la bannière app (dismissedAt)
```

### Limite du localStorage
- **5 Mo par domaine** sur la plupart des navigateurs
- Estimation pour 20 conversations de 50 messages : ~500 Ko → largement suffisant
- Si le stockage est plein : archiver les anciennes conversations (supprimer les messages, garder les métadonnées)

### Migration locale → base

Quand le jeune s'authentifie par email (phase 2, cf. spec 01) :
1. Toutes les données `localStorage` sont envoyées au serveur en un seul POST
2. Le serveur les insère en base Turso
3. Le `localStorage` est conservé comme cache (pas vidé)
4. Les écritures suivantes vont en local ET en base (double écriture)
5. En cas de conflit : la version la plus récente gagne (`mis_a_jour_le`)

---

## Connexion à Turso

### Configuration

```typescript
// src/data/db.ts

import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema'

const client = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
})

export const db = drizzle(client, { schema })
```

### Variables d'environnement

```
TURSO_DATABASE_URL=libsql://catchup-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbGci...
```

### Configuration Drizzle

```typescript
// drizzle.config.ts

import type { Config } from 'drizzle-kit'

export default {
  schema: './src/data/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
} satisfies Config
```

---

## Index et performances

```sql
-- Recherche de conversations par utilisateur (le plus fréquent)
CREATE INDEX idx_conversation_utilisateur ON conversation(utilisateur_id);

-- Recherche de messages par conversation (chargement du chat)
CREATE INDEX idx_message_conversation ON message(conversation_id);

-- Tri des messages par date
CREATE INDEX idx_message_horodatage ON message(conversation_id, horodatage);

-- Recherche de profil par utilisateur
CREATE INDEX idx_profil_utilisateur ON profil_riasec(utilisateur_id);

-- Recherche d'instantanés par conversation (calcul indice confiance)
CREATE INDEX idx_instantane_conversation ON instantane_profil(conversation_id);

-- Recherche de magic link par jeton (validation au clic)
CREATE INDEX idx_magic_link_jeton ON session_magic_link(jeton);

-- Recherche d'utilisateur par email (reconnexion)
CREATE INDEX idx_utilisateur_email ON utilisateur(email);

-- Recherche de source par code (tracking prescripteurs)
CREATE INDEX idx_source_code ON source_captation(code);
```

---

## Purges et rétention

| Donnée | Durée de rétention | Déclencheur de purge |
|--------|-------------------|---------------------|
| Utilisateur anonyme sans activité | 6 mois | Tâche cron hebdomadaire |
| Utilisateur supprimé (soft delete) | 30 jours après suppression | Tâche cron quotidienne |
| Magic links expirés | 24h après expiration | Tâche cron quotidienne |
| Instantanés de profil | 20 derniers par conversation | À chaque nouvelle extraction |
| Messages de conversations archivées | 1 an | Tâche cron mensuelle |
| Événements quiz sans utilisateur lié | 90 jours | Tâche cron mensuelle |

---

## Sécurité des données

### Chiffrement
- **En transit** : HTTPS obligatoire (TLS 1.3)
- **Au repos** : Turso chiffre les données sur disque (AES-256)
- **Côté client** : localStorage n'est PAS chiffré (acceptable pour le MVP, chiffrement AES-GCM en v2)

### Accès
- L'API n'expose **jamais** les données d'un utilisateur à un autre
- Chaque requête API vérifie que l'`utilisateur_id` correspond à la session
- Le dossier de transmission au conseiller nécessite le **consentement explicite** du jeune

### RGPD
- **Droit d'accès** : le jeune peut exporter toutes ses données (bouton "Mes données" dans les paramètres)
- **Droit à l'oubli** : suppression complète (soft delete → purge 30 jours)
- **Droit de portabilité** : export JSON de tout le profil
- **Minimisation** : on ne collecte que ce qui est nécessaire (pas de géolocalisation, pas de fingerprinting)
- **Mineurs** : pas de collecte d'email obligatoire pour les < 18 ans (cf. spec 01)

---

## Métriques liées aux données

| Métrique | Requête | Fréquence |
|----------|---------|-----------|
| Nombre d'utilisateurs actifs | `WHERE derniere_visite > date(-7 jours)` | Quotidienne |
| Taux de conversion anonyme → authentifié | `COUNT(email IS NOT NULL) / COUNT(*)` | Hebdomadaire |
| Nombre moyen de messages par conversation | `AVG(nb_messages) FROM conversation` | Hebdomadaire |
| Taux de mise en relation acceptée | `COUNT(referral) / COUNT(conversation WHERE nb_messages > 8)` | Hebdomadaire |
| Volume de stockage par utilisateur | Somme des tailles des messages et profils | Mensuelle |
| Efficacité par canal | `GROUP BY source ORDER BY nb_emails_collectes` | Hebdomadaire |
