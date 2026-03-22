# Architecture Catch'Up — Fondation JAE

---

## 1. Choix de stack

### Framework web : **Next.js 14 (App Router, TypeScript)**
- SSR/SSG pour le SEO de la landing page
- API routes pour le backend (streaming OpenAI)
- Déployable sur Vercel en 1 clic
- Écosystème React → compétences réutilisables pour React Native
- **Alternative écartée** : Nuxt.js (Vue) — moins de synergie avec React Native

### Styling : **Tailwind CSS**
- Utility-first, rapide à itérer, mobile-first natif
- Même logique mentale que NativeWind (Tailwind pour React Native)
- **Alternative écartée** : CSS Modules (plus verbeux), Chakra UI (trop lourd)

### IA : **Vercel AI SDK + OpenAI GPT-4o**
- `useChat()` gère le streaming côté client out-of-the-box
- `streamText()` côté serveur, protocole standard
- Abstrait le provider → switching vers Anthropic/Mistral possible
- **Alternative écartée** : LangChain (overkill pour du chat simple)

### Base de données : **Turso (SQLite edge) + Drizzle ORM**
- Turso free : 9 Go, 500M lectures/mois, 25M écritures/mois
- SQLite embedded = 0ms lectures locales (embedded replicas)
- SQLite est NATIF sur iOS et Android → même moteur partout
- Drizzle : TypeScript-first, léger (7kb), supporte SQLite/Turso
- **Alternatives écartées** :
  - Supabase/PostgreSQL : bon mais pas de réplica locale, pas natif sur device
  - Firebase : vendor lock-in Google, modèle NoSQL moins adapté
  - PlanetScale : plus de free tier
  - localStorage seul : pas de sync, pas de requêtes SQL

### Migration native : **React Native + Expo (recommandé)**

| Critère | React Native + Expo | Capacitor | Flutter | PWA seule |
|---------|-------------------|-----------|---------|-----------|
| Partage code logique | 95% (JS/TS partagé) | 80% (web wrappé) | 0% (Dart) | 100% |
| Partage code UI | 30% (composants similaires) | 90% (même HTML) | 0% | 100% |
| Accéléromètre/Gyro | ✅ expo-sensors | ✅ plugin | ✅ natif | ⚠️ DeviceMotion API |
| Caméra/AR | ✅ expo-camera, ViroReact | ⚠️ plugin limité | ✅ ARCore/ARKit | ❌ |
| Haptics | ✅ expo-haptics | ✅ plugin | ✅ natif | ❌ |
| Géolocalisation | ✅ expo-location | ✅ plugin | ✅ natif | ⚠️ Geolocation API |
| Notifs push | ✅ expo-notifications | ✅ plugin | ✅ natif | ⚠️ Web Push limité |
| Widget home | ✅ expo-widget (beta) | ❌ | ✅ natif | ❌ |
| Biométrie | ✅ expo-local-auth | ✅ plugin | ✅ natif | ❌ |
| Siri/Google Asst | ✅ Shortcuts/Actions | ❌ | ✅ natif | ❌ |
| Performance perçue | ⚡⚡⚡ natif | ⚡⚡ web-view | ⚡⚡⚡ natif | ⚡ web |
| Effort migration | Moyen (UI à adapter) | Faible (wrapping) | Très élevé (réécriture) | Zéro |
| Présence stores | ✅ | ✅ | ✅ | ❌ (sauf PWA installable) |

**Verdict : React Native + Expo**
- Le code Core/Data/API (70% du projet) est réutilisé tel quel (TypeScript)
- Seule la couche UI est réécrite avec des composants React Native
- Expo donne accès à TOUS les capteurs listés via des packages maintenus
- La communauté React est la même
- NativeWind permet de garder la logique Tailwind

**Capacitor écarté** car : les features device (AR, widget, Siri) sont très limitées via des plugins web-view. On veut du VRAI natif pour justifier le téléchargement.

**Flutter écarté** car : réécriture totale en Dart, aucun partage de code avec le web Next.js.

---

## 2. Architecture en 7 couches

```
┌─────────────────────────────────────────────────────┐
│                    PROMOTION (web-only)              │
│  Smart banner, interstitiel, QR, teasing features   │
├─────────────────────────────────────────────────────┤
│                    UI (par plateforme)               │
│  Web: React/Next.js │ Natif: React Native/Expo      │
├─────────────────────────────────────────────────────┤
│              DEVICE (adapters + fallback)            │
│  Accéléro, AR, Haptics, Géoloc, Biométrie, Widget   │
├─────────────────────────────────────────────────────┤
│             PLATFORM (adapters par env)              │
│  Micro/STT, Caméra, TTS, Notifications, Stockage    │
├─────────────────────────────────────────────────────┤
│                  API (abstraite)                     │
│  OpenAI streaming, endpoints REST                   │
├─────────────────────────────────────────────────────┤
│                DATA (Drizzle + adapters)             │
│  Schema partagé │ Web: Turso HTTP │ Natif: SQLite    │
├─────────────────────────────────────────────────────┤
│               CORE (100% partagé)                   │
│  Logique RIASEC, parsing profil, conversation,      │
│  system prompt, détection fragilité                  │
└─────────────────────────────────────────────────────┘
```

### Règle d'or
Chaque couche ne dépend QUE des couches en dessous. Jamais vers le haut.
Core ne connaît ni React ni Expo ni Turso.

---

## 3. Arborescence fichiers

```
catchup/
├── src/
│   ├── core/                          # 🧠 Logique métier (100% partagé web+natif)
│   │   ├── riasec.ts                  #   Calcul et interprétation des scores RIASEC
│   │   ├── profile-parser.ts          #   Extraction profil depuis réponses IA (<!--PROFILE:...-->)
│   │   ├── system-prompt.ts           #   Construction du system prompt dynamique
│   │   ├── fragility-detector.ts      #   Détection mots-clés de fragilité
│   │   ├── suggestions.ts             #   Génération des suggestion chips contextuelles
│   │   └── types.ts                   #   Interfaces TypeScript partagées (Message, Profile...)
│   │
│   ├── data/                          # 💾 Couche données (Drizzle, partagé)
│   │   ├── schema.ts                  #   Schéma Drizzle (tables, relations, index)
│   │   ├── repositories/
│   │   │   ├── conversation.repo.ts   #   CRUD conversations
│   │   │   ├── message.repo.ts        #   CRUD messages
│   │   │   ├── profile.repo.ts        #   CRUD profil utilisateur
│   │   │   └── settings.repo.ts       #   CRUD paramètres app
│   │   ├── adapters/
│   │   │   ├── turso.adapter.ts       #   Connexion Turso HTTP (web)
│   │   │   ├── sqlite.adapter.ts      #   Connexion SQLite local (natif)
│   │   │   └── db.interface.ts        #   Interface abstraite de connexion
│   │   └── sync/
│   │       ├── sync-engine.ts         #   Moteur de synchronisation offline→server
│   │       └── offline-queue.ts       #   Queue d'écritures en attente
│   │
│   ├── api/                           # 🌐 Couche réseau (abstraite)
│   │   ├── chat.service.ts            #   Appel streaming OpenAI (abstrait du transport)
│   │   └── api.interface.ts           #   Interface abstraite (web: fetch, natif: fetch)
│   │
│   ├── platform/                      # 📱 Adapters plateforme
│   │   ├── interfaces/
│   │   │   ├── tts.interface.ts       #   Interface Text-to-Speech
│   │   │   ├── stt.interface.ts       #   Interface Speech-to-Text
│   │   │   ├── camera.interface.ts    #   Interface Caméra
│   │   │   ├── storage.interface.ts   #   Interface Stockage local
│   │   │   └── notifications.interface.ts
│   │   ├── web/
│   │   │   ├── web-tts.ts             #   Implémentation Web Speech API
│   │   │   ├── web-stt.ts             #   Implémentation Web Speech Recognition
│   │   │   ├── web-camera.ts          #   Implémentation MediaDevices
│   │   │   └── web-storage.ts         #   Implémentation localStorage/IndexedDB
│   │   └── native/                    #   (créé lors de la migration)
│   │       ├── native-tts.ts          #   expo-speech
│   │       ├── native-stt.ts          #   expo-speech (ou Whisper)
│   │       ├── native-camera.ts       #   expo-camera
│   │       └── native-storage.ts      #   expo-secure-store / AsyncStorage
│   │
│   ├── device/                        # 🎮 Adapters capteurs device
│   │   ├── interfaces/
│   │   │   ├── motion.interface.ts    #   Accéléromètre + Gyroscope
│   │   │   ├── haptics.interface.ts   #   Retour haptique
│   │   │   ├── location.interface.ts  #   Géolocalisation
│   │   │   ├── ar.interface.ts        #   Réalité augmentée
│   │   │   ├── biometrics.interface.ts#   Empreinte / Face ID
│   │   │   ├── calendar.interface.ts  #   Calendrier natif
│   │   │   ├── contacts.interface.ts  #   Contacts & partage
│   │   │   └── capabilities.ts        #   Feature detection + DeviceCapabilities type
│   │   ├── web/
│   │   │   ├── web-motion.ts          #   DeviceMotionEvent (limité) + fallback
│   │   │   ├── web-haptics.ts         #   navigator.vibrate() (limité) + fallback
│   │   │   ├── web-location.ts        #   Geolocation API
│   │   │   └── web-fallbacks.ts       #   Retourne "feature locked" pour AR, bio, etc.
│   │   └── native/                    #   (créé lors de la migration)
│   │       ├── native-motion.ts       #   expo-sensors (Accelerometer, Gyroscope)
│   │       ├── native-haptics.ts      #   expo-haptics
│   │       ├── native-location.ts     #   expo-location
│   │       ├── native-ar.ts           #   ViroReact / expo-gl
│   │       ├── native-biometrics.ts   #   expo-local-authentication
│   │       ├── native-calendar.ts     #   expo-calendar
│   │       └── native-contacts.ts     #   expo-contacts
│   │
│   ├── promotion/                     # 📢 Web-only : pousser vers l'app native
│   │   ├── SmartBanner.tsx            #   Bannière iOS/Android adaptive
│   │   ├── AppInterstitial.tsx        #   Écran plein après X conversations
│   │   ├── FeatureTeaser.tsx          #   Cadenas "Disponible dans l'app"
│   │   ├── QRDownload.tsx             #   QR code pour desktop
│   │   ├── deep-link.ts              #   Génération liens universels
│   │   └── promotion-logic.ts        #   Arbre de décision affichage promo
│   │
│   ├── app/                           # 🖥️ Next.js App Router (UI web)
│   │   ├── layout.tsx                 #   HTML root, meta, viewport, fonts
│   │   ├── page.tsx                   #   Page principale → <ChatApp />
│   │   ├── globals.css                #   Tailwind + animations custom
│   │   ├── manifest.json              #   PWA manifest
│   │   ├── sw.ts                      #   Service Worker (offline + cache)
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts           #   POST streaming (OpenAI + Turso save)
│   │
│   └── components/                    # 🎨 Composants UI web (React)
│       ├── ChatApp.tsx                #   Orchestrateur principal, state management
│       ├── ChatHeader.tsx             #   Titre, avatar, boutons TTS/RGAA/Profil
│       ├── ChatInput.tsx              #   Textarea + emoji + fichier + micro + envoi
│       ├── MessageBubble.tsx          #   Bulle message + horodatage + bouton écouter
│       ├── SuggestionChips.tsx        #   Chips cliquables (envoient directement)
│       ├── TypingIndicator.tsx        #   Animation 3 dots
│       ├── ProfilePanel.tsx           #   Panneau RIASEC slide-in (barres, traits...)
│       ├── EmojiPicker.tsx            #   Wrapper emoji-picker-react
│       ├── VoiceRecorder.tsx          #   Bouton micro + enregistrement + waveform
│       ├── FileAttachment.tsx         #   Upload photo/fichier + preview
│       └── AccessibilityToggle.tsx    #   Switch mode RGAA
│
├── public/
│   ├── icons/                         #   Icônes PWA (192, 512)
│   ├── splash/                        #   Splash screens
│   └── sounds/                        #   Sons UI (message envoyé, reçu)
│
├── drizzle/                           #   Migrations Drizzle
│   └── 0000_initial.sql
│
├── .env.local                         #   OPENAI_API_KEY, TURSO_URL, TURSO_AUTH_TOKEN
├── drizzle.config.ts                  #   Config Drizzle (SQLite/Turso)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Matrice de features web vs natif

| Feature | Web (PWA) | App native | API web | API native | Fallback web |
|---------|-----------|------------|---------|------------|-------------|
| Chat IA streaming | ✅ | ✅ | Vercel AI SDK | fetch + streaming | — |
| Profil RIASEC | ✅ | ✅ | Core partagé | Core partagé | — |
| TTS (lecture vocale) | ✅ | ✅ | Web Speech API | expo-speech | Voix synthétique |
| STT (dictée vocale) | ⚠️ dégradé | ✅ | SpeechRecognition | expo-speech / Whisper | Clavier |
| Emoji picker | ✅ | ✅ | emoji-picker-react | emoji-picker-react-native | — |
| Upload photo | ✅ | ✅ | File API | expo-image-picker | — |
| Upload fichier | ✅ | ✅ | File API | expo-document-picker | — |
| Accéléromètre | ⚠️ limité | ✅ | DeviceMotionEvent | expo-sensors | Message "dispo app" |
| Gyroscope | ⚠️ limité | ✅ | DeviceOrientationEvent | expo-sensors | Message "dispo app" |
| AR (réalité augmentée) | 🔒 app only | ✅ | — | ViroReact / ARKit | Cadenas + teasing |
| Haptics | ⚠️ vibrate() | ✅ | navigator.vibrate() | expo-haptics | Pas de retour |
| Géolocalisation | ⚠️ permission | ✅ | Geolocation API | expo-location | Saisie manuelle |
| Notifs push | ⚠️ limité | ✅ | Web Push API | expo-notifications | Pas de notif |
| Widget home | 🔒 app only | ✅ | — | expo-widget | Cadenas + teasing |
| Biométrie | 🔒 app only | ✅ | — | expo-local-auth | Cadenas + teasing |
| Calendrier natif | 🔒 app only | ✅ | — | expo-calendar | Lien .ics |
| Contacts (partage) | 🔒 app only | ✅ | — | expo-contacts | Lien partage |
| Siri/Google Asst | 🔒 app only | ✅ | — | Shortcuts/Actions | Cadenas + teasing |
| Offline | ⚠️ service worker | ✅ | Cache API | SQLite local | Limité |
| Mode RGAA | ✅ | ✅ | CSS + ARIA | AccessibilityInfo | — |
| QR Code download | ✅ desktop | — | — | — | — |
| Smart banner | ✅ mobile | — | meta tag + JS | — | — |

---

## 5. Architecture data (Drizzle + Turso)

### 5.1 Schéma Drizzle

```
┌──────────────────────┐       ┌──────────────────────────────┐
│   conversations      │       │         messages              │
├──────────────────────┤       ├──────────────────────────────┤
│ id         TEXT PK   │◄──┐   │ id            TEXT PK        │
│ title      TEXT      │   │   │ conversationId TEXT FK ──────┘
│ startedAt  INTEGER   │   │   │ role          TEXT (user|assistant)
│ lastMsgAt  INTEGER   │       │ content       TEXT            │
│ status     TEXT      │       │ audioUrl      TEXT?           │
│ msgCount   INTEGER   │       │ timestamp     INTEGER         │
└──────────────────────┘       │ metadata      TEXT (JSON)?    │
                               └──────────────────────────────┘

┌──────────────────────────────┐   ┌──────────────────────────┐
│       user_profile           │   │      app_settings        │
├──────────────────────────────┤   ├──────────────────────────┤
│ id         TEXT PK           │   │ id         TEXT PK       │
│ name       TEXT?             │   │ ttsEnabled BOOLEAN       │
│ R          INTEGER (0-100)   │   │ ttsVoice   TEXT          │
│ I          INTEGER (0-100)   │   │ rgaaMode   BOOLEAN       │
│ A          INTEGER (0-100)   │   │ locale     TEXT           │
│ S          INTEGER (0-100)   │   │ bannerDismissed BOOLEAN  │
│ E          INTEGER (0-100)   │   │ bannerDismissAt INTEGER? │
│ C          INTEGER (0-100)   │   │ sessionCount INTEGER     │
│ traits     TEXT (JSON array) │   │ interstitialShown BOOLEAN│
│ interests  TEXT (JSON array) │   │ updatedAt  INTEGER       │
│ strengths  TEXT (JSON array) │   └──────────────────────────┘
│ suggestion TEXT?             │
│ updatedAt  INTEGER           │   ┌──────────────────────────┐
└──────────────────────────────┘   │    offline_queue         │
                                   ├──────────────────────────┤
                                   │ id        TEXT PK        │
                                   │ action    TEXT           │
                                   │ table     TEXT           │
                                   │ payload   TEXT (JSON)    │
                                   │ createdAt INTEGER        │
                                   │ syncedAt  INTEGER?       │
                                   │ retries   INTEGER        │
                                   └──────────────────────────┘
```

### 5.2 Index
- `messages.conversationId` — requêtes par conversation
- `messages.timestamp` — tri chronologique
- `conversations.lastMsgAt` — liste récente
- `offline_queue.syncedAt` — items non synchronisés (WHERE syncedAt IS NULL)

### 5.3 Pattern Repository

```
                    ┌──────────────────────┐
                    │   IMessageRepo       │
                    │ ─────────────────    │
                    │ + create(msg)        │
                    │ + findByConv(id)     │
                    │ + getLatest(n)       │
                    └──────────┬───────────┘
                               │ implements
              ┌────────────────┴────────────────┐
              │                                 │
   ┌──────────▼──────────┐          ┌──────────▼──────────┐
   │  DrizzleMessageRepo │          │  DrizzleMessageRepo │
   │  (Turso HTTP)       │          │  (SQLite local)     │
   │  ───────────────    │          │  ───────────────    │
   │  db = tursoClient   │          │  db = sqliteClient  │
   └─────────────────────┘          └─────────────────────┘
         WEB                              NATIVE
```

Le repository est **identique** (même code Drizzle), seul le `db` client injecté change.

### 5.4 Adapter de connexion

```typescript
// db.interface.ts
interface IDatabase {
  getClient(): DrizzleInstance
}

// turso.adapter.ts (web)
// → createClient({ url: TURSO_URL, authToken: TURSO_AUTH_TOKEN })
// → drizzle(tursoClient)

// sqlite.adapter.ts (natif)
// → expo-sqlite open("catchup.db")
// → drizzle(sqliteClient)
// → sync avec Turso via embedded replica
```

### 5.5 Stratégie de sync offline

```
┌─────────┐   write    ┌──────────────┐   sync    ┌───────────┐
│  App    ├────────────►│ SQLite local ├──────────►│  Turso    │
│  (user) │            │ + offline    │  (quand   │  (edge)   │
│         │◄───────────┤   queue      │◄──────────┤           │
│         │   read     │              │  réseau)  │           │
└─────────┘            └──────────────┘           └───────────┘
```

- **Lecture** : toujours depuis la réplica locale (0ms)
- **Écriture** : écrit en local + ajoute à `offline_queue`
- **Sync** : quand réseau disponible, dépile la queue vers Turso
- **Conflit** : last-write-wins (suffisant pour un utilisateur unique sans auth)
- **Embedded replica Turso** : sync automatique server→local en background

---

## 6. Diagramme de flux message

```
Utilisateur tape "J'aime bricoler"
         │
         ▼
┌─────────────────┐
│   ChatInput     │ Enter ou clic Envoyer
│   (composant)   │
└────────┬────────┘
         │ append({ role: 'user', content })
         ▼
┌─────────────────┐
│   useChat()     │ Vercel AI SDK (client)
│   (hook React)  │
└────────┬────────┘
         │ POST /api/chat { messages[] }
         ▼
┌─────────────────────────────────────────────┐
│   /api/chat/route.ts  (serveur Next.js)     │
│                                             │
│  1. Charge le profil depuis Turso           │
│  2. Construit le system prompt (core/)      │
│  3. streamText({ model: gpt-4o, messages }) │
│  4. Sauvegarde messages (user+assistant)    │
│     dans Turso                              │
└────────┬────────────────────────────────────┘
         │ ReadableStream (SSE)
         ▼
┌─────────────────┐
│   useChat()     │ Reçoit les tokens un par un
│   (client)      │ Met à jour messages[]
└────────┬────────┘
         │ onFinish(message)
         ▼
┌─────────────────────────────────────────────┐
│   ChatApp.tsx                               │
│                                             │
│  1. extractProfileFromMessage(content)      │
│     → Parse <!--PROFILE:{...}-->            │
│  2. Si profil extrait → setProfile(new)     │
│     → Sauvegarde dans Turso (profile.repo)  │
│  3. cleanMessageContent(content)            │
│     → Supprime le bloc <!--PROFILE-->       │
│  4. Si TTS activé → speakText(clean)        │
│  5. Re-focus sur l'input                    │
└────────┬────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  MessageBubble  │ Affiche la bulle avec animation
│  ProfilePanel   │ Met à jour les barres RIASEC
└─────────────────┘
```

**Éléments partagés web/natif** : tout sauf `/api/chat/route.ts` (qui devient un appel direct à OpenAI depuis le natif via `chat.service.ts`) et les composants React (remplacés par React Native).

---

## 7. Diagramme de flux promotion

```
Utilisateur arrive sur le site web
         │
         ▼
┌─────────────────────┐
│ Détecter le contexte │
└────────┬────────────┘
         │
    ┌────▼────┐
    │ App     │──── OUI ──► Ne rien afficher (déjà dans l'app)
    │ native? │
    └────┬────┘
         │ NON
    ┌────▼────┐
    │ PWA     │──── OUI ──► Bannière légère "Passe à l'app complète"
    │ install?│              (features exclusives : AR, widget, haptics)
    └────┬────┘
         │ NON
    ┌────▼────┐
    │ Mobile? │──── OUI ─┐
    └────┬────┘          │
         │ NON           │
         ▼               ▼
   ┌──────────┐   ┌──────────────────┐
   │ DESKTOP  │   │ MOBILE BROWSER   │
   └────┬─────┘   └────┬─────────────┘
        │               │
        ▼               ▼
   QR Code         Smart Banner
   en bas de        ┌─────────────────────┐
   l'écran          │ Banner déjà fermée? │
                    └────┬───────┬────────┘
                         │ NON   │ OUI
                         ▼       ▼
                    Afficher   ┌──────────────────┐
                    le banner  │ > 5 sessions     │
                               │ depuis fermeture?│
                               └───┬────────┬─────┘
                                   │ NON    │ OUI
                                   ▼        ▼
                              Rien       Ré-afficher banner

         ┌────────────────────────────────────┐
         │ Après 3-5 conversations complètes: │
         │ Écran interstitiel (1 seule fois)  │
         │                                    │
         │ "Passe à l'app pour débloquer :"   │
         │ 🔒 Secoue pour un métier surprise  │
         │ 🔒 Métiers autour de toi (carte)   │
         │ 🔒 Filtre AR "moi en [métier]"     │
         │ 🔒 Widget motivation quotidien      │
         │ 🔒 Mode offline complet            │
         │                                    │
         │ [Télécharger]  [Plus tard]         │
         └────────────────────────────────────┘

Feature teasers dans le chat :
─────────────────────────────
Quand l'IA suggère un métier → afficher sous le message :
  🔒 "Voir les formations à proximité" → dispo dans l'app
  🔒 "Essayer le filtre AR" → dispo dans l'app
```

---

## 8. Modèle de données (interfaces TypeScript)

```typescript
// === core/types.ts === (100% partagé)

interface Message {
  id: string
  conversationId: string
  role: 'user' | 'assistant'
  content: string                  // Contenu affiché (sans <!--PROFILE-->)
  rawContent?: string              // Contenu brut (avec <!--PROFILE-->)
  audioUrl?: string                // Si message vocal
  timestamp: number
  metadata?: MessageMetadata
}

interface MessageMetadata {
  fragilityDetected?: boolean
  fragilityLevel?: 'low' | 'medium' | 'high'
  profileExtracted?: boolean
}

interface UserProfile {
  id: string
  name?: string
  R: number                        // 0-100 Réaliste
  I: number                        // 0-100 Investigateur
  A: number                        // 0-100 Artiste
  S: number                        // 0-100 Social
  E: number                        // 0-100 Entreprenant
  C: number                        // 0-100 Conventionnel
  traits: string[]                 // ex: ["créatif", "sociable"]
  interests: string[]              // ex: ["musique", "cuisine"]
  strengths: string[]              // ex: ["écoute", "imagination"]
  suggestion: string               // ex: "design graphique"
  updatedAt: number
}

interface ConversationState {
  id: string
  title: string
  messages: Message[]
  status: 'active' | 'archived'
  startedAt: number
  lastMessageAt: number
  messageCount: number
}

interface AppSettings {
  ttsEnabled: boolean
  ttsVoice: 'male' | 'female'
  rgaaMode: boolean
  locale: 'fr'
  theme: 'light' | 'dark' | 'auto'
}

interface PromotionState {
  bannerDismissed: boolean
  bannerDismissedAt?: number
  interstitialShown: boolean
  sessionCount: number
  conversationCount: number
  lastVisit: number
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
  context: 'browser' | 'pwa' | 'native'
}

interface DeviceCapabilities {
  hasMotion: boolean               // Accéléromètre/Gyroscope
  hasHaptics: boolean              // Retour haptique
  hasLocation: boolean             // Géolocalisation
  hasAR: boolean                   // Réalité augmentée
  hasBiometrics: boolean           // Empreinte/Face ID
  hasCamera: boolean               // Caméra
  hasContacts: boolean             // Accès contacts
  hasCalendar: boolean             // Accès calendrier
  hasWidget: boolean               // Widget home screen
  hasVoiceAssistant: boolean       // Siri/Google Assistant
  hasPushNotifications: boolean    // Notifs push fiables
  isNative: boolean                // true si app native
}

interface OfflineQueueItem {
  id: string
  action: 'create' | 'update' | 'delete'
  table: string
  payload: string                  // JSON
  createdAt: number
  syncedAt?: number
  retries: number
}
```

---

## 9. Pattern adapter device

```
┌──────────────────────────┐
│   IMotionAdapter         │
│ ─────────────────────    │
│ + isAvailable(): bool    │
│ + onShake(cb): unsub     │
│ + onTilt(cb): unsub      │
│ + getAcceleration(): xyz │
└────────────┬─────────────┘
             │ implements
     ┌───────┴───────────┐
     │                   │
┌────▼─────────┐  ┌──────▼──────────┐
│ WebMotion    │  │ NativeMotion    │
│              │  │                 │
│ DeviceMotion │  │ expo-sensors    │
│ Event API   │  │ Accelerometer   │
│              │  │ Gyroscope       │
│ ⚠️ Limité:   │  │                 │
│ HTTPS only,  │  │ ✅ Complet:     │
│ permission   │  │ temps réel,     │
│ requise,     │  │ précis,         │
│ pas tous     │  │ background      │
│ navigateurs  │  │                 │
│              │  │                 │
│ Fallback:    │  │                 │
│ showFeature  │  │                 │
│ Teaser()     │  │                 │
└──────────────┘  └─────────────────┘
```

### Feature detection au boot

```
async function detectCapabilities(): DeviceCapabilities {
  return {
    hasMotion:    isNative ? true : 'DeviceMotionEvent' in window,
    hasHaptics:   isNative ? true : 'vibrate' in navigator,
    hasLocation:  isNative ? true : 'geolocation' in navigator,
    hasAR:        isNative ? true : false,    // AR = natif uniquement
    hasBiometrics:isNative ? true : false,    // Bio = natif uniquement
    hasCamera:    isNative ? true : 'mediaDevices' in navigator,
    hasContacts:  isNative ? true : false,
    hasCalendar:  isNative ? true : false,
    hasWidget:    isNative ? true : false,
    hasVoiceAssistant: isNative ? true : false,
    hasPushNotifications: isNative ? true : 'PushManager' in window,
    isNative,
  }
}
```

Quand `capability === false` sur le web → le composant affiche `<FeatureTeaser feature="ar" />` au lieu de la vraie fonctionnalité.

---

## 10. System prompt et profil RIASEC

### Construction du prompt

```
SYSTEM PROMPT = base_persona
             + riasec_instructions
             + current_profile (si existant)
             + conversation_stage (découverte / exploration / décision)
             + fragility_rules
```

**Base persona** : Catch'Up, tutoiement, chaleureux, emojis modérés, 3-4 phrases max.

**RIASEC instructions** : L'IA évalue chaque réponse sur les 6 dimensions. Après 4-6 échanges, elle commence à insérer le bloc `<!--PROFILE:{"R":40,"I":70,...}-->` en fin de message. Le bloc est mis à jour à CHAQUE message suivant.

**Adaptation par stage** :
- **Découverte** (0-3 messages) : questions ouvertes, apprendre à connaître
- **Exploration** (4-8 messages) : questions ciblées RIASEC, creuser les centres d'intérêt
- **Décision** (9+ messages) : proposer des pistes métiers/formations concrètes

**Détection fragilité** : mots-clés (découragement, isolement, détresse) → ton encore plus bienveillant, validation émotionnelle, orientation vers ressources.

### Extraction du profil (core/profile-parser.ts)

```
Message IA reçu
  │
  ▼
Regex: /<!--PROFILE:(.*?)-->/
  │
  ├── Match trouvé → JSON.parse → UserProfile
  │   → Sauvegarder en DB (profile.repo)
  │   → Mettre à jour le ProfilePanel
  │   → Supprimer le bloc du contenu affiché
  │
  └── Pas de match → Pas de mise à jour profil
```

---

## 11. Continuité web → app

### Sans authentification (MVP)

```
WEB                              APP NATIVE
 │                                │
 │  Profil + conversations        │
 │  stockés dans Turso            │
 │  (identifié par deviceId)      │
 │                                │
 │  Clic "Télécharger l'app"      │
 │         │                      │
 │         ▼                      │
 │  Génère un TOKEN TEMPORAIRE    │
 │  (UUID, valide 24h, stocké     │
 │   en DB avec le deviceId)      │
 │         │                      │
 │         ▼                      │
 │  Deep link :                   │
 │  catchup://transfer?token=XXX  │
 │  ou QR code contenant ce lien  │
 │                                │
 │                           ─────▼─────
 │                           App ouverte
 │                           avec token
 │                                │
 │                           Appel API :
 │                           GET /api/transfer?token=XXX
 │                                │
 │                           Récupère profil +
 │                           conversations depuis Turso
 │                                │
 │                           Stocke en SQLite local
 │                           Invalide le token
 │                                │
 │                           L'utilisateur retrouve
 │                           sa conversation en cours ✅
```

### Avec authentification (futur)
- Login sur le web → même compte dans l'app
- Sync automatique via Turso (même userId)

---

## 12. Stratégie offline

### Web (Service Worker)

```
┌─────────────────────────────────────┐
│ Service Worker                      │
│                                     │
│ Cache : app shell, CSS, JS, fonts   │
│ Runtime cache : réponses API        │
│                                     │
│ Stratégie :                         │
│ - Static assets → Cache First       │
│ - API chat → Network First          │
│   (fallback: message "pas de réseau,│
│    tes conversations sont sauvées") │
│ - DB reads → Turso embedded replica │
│   (lectures locales si configuré)   │
└─────────────────────────────────────┘
```

### Natif (SQLite + queue)

```
┌─────────────────────────────────────┐
│ Mode offline complet                │
│                                     │
│ ✅ Lire les conversations passées   │
│    (SQLite local)                   │
│ ✅ Mini exercices hors ligne :      │
│    - Quiz RIASEC rapide             │
│    - Classement d'activités         │
│    - Exploration des fiches métiers │
│    (données embarquées dans l'app)  │
│                                     │
│ ⏳ Envoyer un message au chat       │
│    → stocké dans offline_queue      │
│    → envoyé dès retour réseau       │
│    → réponse IA reçue en différé    │
│                                     │
│ 🔄 Sync au retour réseau :         │
│    1. Dépiler offline_queue → Turso │
│    2. Pull nouvelles données Turso  │
│    3. Résolution conflits :         │
│       last-write-wins (1 user)      │
└─────────────────────────────────────┘
```

---

## 13. Points d'extension

| Extension | Où brancher | Impact |
|-----------|------------|--------|
| **Authentification** | Nouveau `auth/` dans `platform/`. Web: NextAuth. Natif: expo-auth-session. Le userId remplace le deviceId dans Turso. | Faible — ajouter un middleware, pas de refacto |
| **Multi-conversations** | Déjà prévu dans le schéma (table `conversations`). Ajouter un ChatList dans l'UI. | Faible — UI seulement |
| **Upload fichiers** | `platform/web/web-camera.ts` existe déjà. Stocker sur Turso (blob) ou S3/R2. | Moyen — ajout storage externe |
| **Vocal STT amélioré** | Remplacer Web Speech API par Whisper API (OpenAI) côté serveur. | Faible — nouveau endpoint API |
| **Accessibilité RGAA** | CSS + ARIA dans chaque composant. Natif: AccessibilityInfo React Native. | Moyen — audit composant par composant |
| **Notifs push** | Web: web-push + vapid. Natif: expo-notifications + APNs/FCM. | Moyen — infra serveur |
| **Analytics** | Ajouter Mixpanel/PostHog dans `core/`. Événements: message_sent, profile_updated, suggestion_clicked. | Faible |
| **Suivi conseiller** | Dashboard admin (nouvelle route Next.js). Lit les profils/conversations depuis Turso. | Moyen — nouvelle UI |
| **A/B testing promo** | Variantes dans `promotion-logic.ts`. Stocker la variante dans `app_settings`. | Faible |
| **Nouveaux capteurs** | Nouveau adapter dans `device/interfaces/` + implémentation `web/` et `native/`. | Faible — pattern établi |
| **Évolution schéma DB** | `drizzle-kit push` ou `drizzle-kit generate`. Turso supporte les migrations. | Faible — Drizzle gère |

---

## 14. Risques et arbitrages

### Risque 1 — Divergence web / natif
**Impact** : Élevé. Deux codebases UI à maintenir.
**Mitigation** :
- Couche Core/Data/API = 100% partagée (70% du code)
- NativeWind sur React Native pour garder la logique Tailwind
- Tests E2E partagés (Detox natif, Playwright web, mêmes scénarios)
- Feature flags pour désactiver des features par plateforme

### Risque 2 — Friction de la promotion app
**Impact** : Élevé. Trop agressive = perte d'utilisateurs web. Pas assez = personne ne télécharge.
**Mitigation** :
- Bannière non intrusive, mémorise la fermeture
- Interstitiel 1 seule fois, skippable, après 3-5 conversations (user engagé)
- Teasing par cadenas = crée le désir sans bloquer l'usage
- A/B tester chaque format de promo
- **KPI** : taux de clic banner, taux de conversion interstitiel, taux de rétention post-install

### Risque 3 — RGPD et public mineur
**Impact** : Critique. Géolocalisation + contacts + conversations IA sur des mineurs potentiels.
**Mitigation** :
- Consentement explicite pour chaque capteur (permission dialog clair en français)
- Données de géoloc jamais stockées côté serveur (traitement local uniquement)
- Pas d'accès contacts sans action explicite de l'utilisateur
- Conversations stockées avec TTL (suppression auto après X mois)
- Conformité RGPD : droit à l'effacement, export des données
- Mentionner la politique dans les CGU et l'onboarding

### Risque 4 — Continuité de session web → app
**Impact** : Moyen. Si le transfert échoue, l'utilisateur perd sa conversation.
**Mitigation** :
- Token de transfert avec retry (valide 24h, régénérable)
- QR code comme fallback visuel
- Message clair si le transfert échoue ("tes données sont toujours sur le site web")
- Avec auth (futur) : sync automatique, le problème disparaît

### Risque 5 — Limites du tier gratuit Turso
**Impact** : Moyen. 500M lectures/mois = ~16M/jour = ~190/seconde.
**Mitigation** :
- Embedded replicas réduisent les lectures serveur (lectures locales)
- Lectures serveur uniquement pour sync et API admin
- Monitoring via dashboard Turso
- Plan de passage au tier payant ($29/mois) si dépassement
- Estimation : 1000 utilisateurs actifs × 50 messages/jour × 5 reads/message = 250K reads/jour → très loin de la limite

### Risque 6 — Rejet Apple/Google Store
**Impact** : Élevé. Apple est strict sur les apps "wrapper web" et les contenus IA.
**Mitigation** :
- App VRAIMENT native (React Native, pas Capacitor) → Apple OK
- Features device exclusives (AR, haptics, widget) = valeur ajoutée native prouvée
- Modération des réponses IA (pas de contenu inapproprié)
- Politique de confidentialité claire (obligatoire pour les stores)
- Review guidelines : bien documenter le rôle éducatif de l'IA

### Risque 7 — Performance streaming sur connexion faible
**Impact** : Moyen. Public jeune parfois sur forfait limité / WiFi instable.
**Mitigation** :
- Streaming (tokens un par un) = le user voit quelque chose immédiatement
- max_tokens: 500 = réponses courtes
- Service Worker cache l'app shell (pas de rechargement)
- Mode offline : exercices jouables sans réseau
- Détection qualité réseau → message adapté ("connexion lente, patiente...")
- Compression gzip/brotli sur toutes les réponses API

---

*Architecture Catch'Up v5 — Fondation JAE — Mars 2026*
