# 09 — Base de données (Turso + Drizzle)

> Contexte : voir `00-architecture.md`. Prérequis : `01` à `08` exécutés.
> Ce prompt branche la persistance. Avant ça, tout est en mémoire côté client.

## Objectif
Connecter Turso (SQLite edge) avec Drizzle ORM pour persister les conversations, messages, profils et paramètres. Préparer la couche data pour la synchronisation future avec l'app native.

## 1. Configuration Turso

### Créer la base (à faire manuellement avant)
```bash
# Installer Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Se connecter
turso auth login

# Créer la base
turso db create catchup

# Récupérer l'URL et le token
turso db show catchup --url
turso db tokens create catchup
```

### .env.local
```
TURSO_DATABASE_URL=libsql://catchup-xxx.turso.io
TURSO_AUTH_TOKEN=eyJhbG...
```

## 2. Schema Drizzle

### src/data/schema.ts

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default('Nouvelle conversation'),
  startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
  lastMessageAt: integer('last_message_at', { mode: 'timestamp_ms' }).notNull(),
  status: text('status', { enum: ['active', 'archived'] }).notNull().default('active'),
  messageCount: integer('message_count').notNull().default(0),
})

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  conversationId: text('conversation_id').notNull().references(() => conversations.id),
  role: text('role', { enum: ['user', 'assistant'] }).notNull(),
  content: text('content').notNull(),
  rawContent: text('raw_content'),    // Contenu brut avec <!--PROFILE:...-->
  audioUrl: text('audio_url'),
  timestamp: integer('timestamp', { mode: 'timestamp_ms' }).notNull(),
  fragilityDetected: integer('fragility_detected', { mode: 'boolean' }).default(false),
  fragilityLevel: text('fragility_level', { enum: ['none', 'low', 'medium', 'high'] }),
})

export const userProfile = sqliteTable('user_profile', {
  id: text('id').primaryKey().default('default'),
  name: text('name'),
  R: integer('r').notNull().default(0),
  I: integer('i').notNull().default(0),
  A: integer('a').notNull().default(0),
  S: integer('s').notNull().default(0),
  E: integer('e').notNull().default(0),
  C: integer('c').notNull().default(0),
  traits: text('traits').default('[]'),           // JSON array
  interests: text('interests').default('[]'),     // JSON array
  strengths: text('strengths').default('[]'),     // JSON array
  suggestion: text('suggestion'),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

export const appSettings = sqliteTable('app_settings', {
  id: text('id').primaryKey().default('default'),
  ttsEnabled: integer('tts_enabled', { mode: 'boolean' }).default(false),
  rgaaMode: integer('rgaa_mode', { mode: 'boolean' }).default(false),
  locale: text('locale').default('fr'),
  bannerDismissed: integer('banner_dismissed', { mode: 'boolean' }).default(false),
  bannerDismissedAt: integer('banner_dismissed_at', { mode: 'timestamp_ms' }),
  sessionCount: integer('session_count').default(0),
  interstitialShown: integer('interstitial_shown', { mode: 'boolean' }).default(false),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
})

export const offlineQueue = sqliteTable('offline_queue', {
  id: text('id').primaryKey(),
  action: text('action', { enum: ['create', 'update', 'delete'] }).notNull(),
  tableName: text('table_name').notNull(),
  payload: text('payload').notNull(),        // JSON
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  syncedAt: integer('synced_at', { mode: 'timestamp_ms' }),
  retries: integer('retries').default(0),
})
```

### drizzle.config.ts
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/data/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  },
})
```

### Migrer
```bash
npx drizzle-kit push
```

## 3. Adapter de connexion

### src/data/adapters/db.interface.ts
```typescript
import { DrizzleConfig } from 'drizzle-orm'

export interface IDbAdapter {
  getDb(): ReturnType<typeof import('drizzle-orm/libsql').drizzle>
}
```

### src/data/adapters/turso.adapter.ts
Connexion Turso HTTP (pour le web / API routes Next.js) :
```typescript
import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from '../schema'

let db: ReturnType<typeof drizzle> | null = null

export function getTursoDb() {
  if (db) return db

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  })

  db = drizzle(client, { schema })
  return db
}
```

## 4. Repositories

Pattern : un fichier par entité, avec des fonctions CRUD simples.

### src/data/repositories/conversation.repo.ts
- `createConversation(id, title?)` → INSERT
- `getConversation(id)` → SELECT
- `listConversations(limit?)` → SELECT ORDER BY lastMessageAt DESC
- `updateLastMessage(id, timestamp, messageCount)` → UPDATE

### src/data/repositories/message.repo.ts
- `createMessage(msg)` → INSERT
- `getMessagesByConversation(conversationId, limit?)` → SELECT ORDER BY timestamp
- `getLatestMessages(limit?)` → SELECT ORDER BY timestamp DESC

### src/data/repositories/profile.repo.ts
- `getProfile()` → SELECT WHERE id = 'default' (singleton)
- `upsertProfile(profile)` → INSERT OR REPLACE
- JSON parse/stringify pour traits, interests, strengths

### src/data/repositories/settings.repo.ts
- `getSettings()` → SELECT WHERE id = 'default'
- `upsertSettings(settings)` → INSERT OR REPLACE

## 5. Intégration dans l'API

### src/app/api/chat/route.ts
Modifier pour :
1. Charger le profil depuis Turso (`getProfile()`)
2. Après streaming, sauvegarder les messages (user + assistant) dans Turso
3. Si profil extrait de la réponse, le sauvegarder (`upsertProfile()`)

**Important** : ne PAS bloquer le streaming pour la sauvegarde. Sauvegarder en arrière-plan (`Promise` non awaité ou `waitUntil` si dispo).

### Nouvel endpoint : GET /api/history
- Query param : `conversationId`
- Retourne les messages de la conversation
- Utilisé au chargement initial pour restaurer l'historique

### Nouvel endpoint : GET /api/profile
- Retourne le profil actuel
- Utilisé au chargement initial

### Nouvel endpoint : PUT /api/profile
- Met à jour le profil
- Appelé quand le client extrait un nouveau profil

## 6. Offline Queue (pour le futur natif)

La table `offline_queue` est créée mais pas utilisée pour le web MVP.
Elle sera utilisée dans l'app native pour queuer les écritures quand il n'y a pas de réseau.

Structure prête pour :
1. Écrire en local + ajouter à la queue
2. Quand réseau disponible → dépiler la queue et envoyer à Turso
3. Marquer `syncedAt` une fois synchronisé
4. Retry avec backoff si échec (champ `retries`)

## Vérification
- [ ] `npx drizzle-kit push` crée les tables sans erreur
- [ ] Envoyer un message → sauvegardé dans Turso (vérifiable via `turso db shell catchup`)
- [ ] Recharger la page → l'historique est restauré
- [ ] Le profil RIASEC persiste entre les rechargements
- [ ] Les settings (TTS, RGAA) persistent entre les sessions
- [ ] La sauvegarde ne ralentit pas le streaming
