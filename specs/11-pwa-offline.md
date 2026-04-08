# 11 — PWA & Offline

> **Statut :** Implémenté  
> **Dernière mise à jour spec :** 2026-04-07  
> **Fichiers clés :** `public/manifest.json`, `public/sw.js`, `src/app/offline/page.tsx`, `src/components/InstallBanner.tsx`, `src/components/UpdateBanner.tsx`, `src/hooks/useVersionCheck.ts`

## Principe directeur
**Le jeune ne devrait jamais voir une page blanche.** Qu'il soit dans le métro sans réseau, dans une zone rurale avec une connexion instable, ou sur un vieux téléphone Android — Catch'Up doit rester accessible. La PWA est le pont entre le web (zéro installation) et l'app native (expérience fluide).

**La PWA n'est pas un compromis. C'est la version principale pour 80% des utilisateurs.**

---

## Qu'est-ce qu'une PWA ?

Une Progressive Web App, c'est un site web qui se comporte comme une application native :
- Installable sur l'écran d'accueil (icône comme une vraie app)
- Fonctionne hors connexion (grâce au Service Worker)
- Peut envoyer des notifications push
- Se lance en plein écran (sans barre d'adresse du navigateur)
- Se met à jour automatiquement en arrière-plan

**Pour le jeune :** il clique "Ajouter à l'écran d'accueil" et il a Catch'Up sur son téléphone. Pas de Play Store, pas de téléchargement de 50 Mo, pas de compte Google nécessaire.

---

## Manifest — `public/manifest.json`

Le fichier manifest indique au navigateur comment afficher l'app quand elle est installée.

```json
{
  "name": "Catch'Up — Ton compagnon d'orientation",
  "short_name": "Catch'Up",
  "description": "Découvre ce qui te correspond. Discute, explore, trouve ta voie.",
  "start_url": "/?source=pwa",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#7C3AED",
  "theme_color": "#7C3AED",
  "lang": "fr-FR",
  "categories": ["education", "lifestyle"],
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/chat.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Conversation avec Catch'Up"
    },
    {
      "src": "/screenshots/profil.png",
      "sizes": "1080x1920",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Mon profil orientation"
    }
  ],
  "shortcuts": [
    {
      "name": "Reprendre la discussion",
      "url": "/?source=pwa-shortcut",
      "icon": "/icons/chat-shortcut.png"
    },
    {
      "name": "Mon profil",
      "url": "/?source=pwa-shortcut&panel=profil",
      "icon": "/icons/profil-shortcut.png"
    }
  ]
}
```

### Paramètres clés

| Paramètre | Valeur | Pourquoi |
|-----------|--------|----------|
| `display: standalone` | Plein écran sans barre d'URL | Expérience app native |
| `orientation: portrait` | Verrouillé en portrait | Mobile-first, le chat est vertical |
| `background_color` | Violet Catch'Up | Écran de splash au lancement |
| `theme_color` | Violet Catch'Up | Barre de statut Android |
| `start_url: /?source=pwa` | Tracking de la source | Savoir combien de jeunes lancent via PWA |
| `shortcuts` | Reprendre + Mon profil | Raccourcis appui long sur l'icône (Android) |
| `screenshots` | Chat + Profil | Affichées dans l'invite d'installation (Chrome Android) |

### Icônes

- **192×192** : icône dans le tiroir d'apps Android
- **512×512** : splash screen et icône haute résolution
- **Maskable** : s'adapte aux formes d'icônes (rond, carré arrondi, squircle) selon le thème Android
- Format PNG avec fond violet (pas de fond transparent — sinon c'est moche sur certains lanceurs)

---

## Service Worker — `public/sw.js`

Le Service Worker est le cœur de la PWA. C'est un script qui tourne en arrière-plan et intercepte les requêtes réseau.

### Stratégie de cache

```
┌──────────────────────────────────────────┐
│           Requête du navigateur           │
│                    │                      │
│         ┌─────────┴──────────┐           │
│         │                    │           │
│    Pages HTML           Assets statiques  │
│    (/, /quiz)           (JS, CSS, images) │
│         │                    │           │
│    Réseau d'abord       Cache d'abord    │
│    (network-first)      (cache-first)    │
│         │                    │           │
│    ┌────┴────┐          ┌────┴────┐      │
│    │ Réseau  │          │ Cache   │      │
│    │  OK ?   │          │ trouvé? │      │
│    └────┬────┘          └────┬────┘      │
│    Oui  │  Non          Oui  │  Non      │
│    │    │               │    │           │
│    │    ▼               │    ▼           │
│    │  Cache             │  Réseau        │
│    │  (fallback)        │  (+ mise en    │
│    │                    │   cache)       │
│    │    │               │    │           │
│    │    ▼               │    ▼           │
│    │  Page offline      │  Cache pour    │
│    │  (si rien)         │  la prochaine  │
│    │                    │  fois          │
│    ▼                    ▼                │
│  Affichage            Affichage          │
└──────────────────────────────────────────┘

         API (chat, profil)
              │
         Réseau uniquement
         (network-only)
              │
         ┌────┴────┐
         │ Réseau  │
         │  OK ?   │
         └────┬────┘
         Oui  │  Non
         │    │
         │    ▼
         │  File d'attente
         │  offline
         │  (stocké, envoyé
         │   au retour du réseau)
         ▼
       Affichage
```

### Les 3 stratégies

**1. Cache d'abord (cache-first)** — pour les assets statiques
- Fichiers JS, CSS, polices, images, icônes
- Rapide : toujours servi depuis le cache si disponible
- Mis à jour en arrière-plan quand le réseau est dispo

**2. Réseau d'abord (network-first)** — pour les pages HTML
- Pages `/`, `/quiz`, `/parents`, `/pro`
- Garantit le contenu le plus frais
- Si pas de réseau → sert la version en cache
- Si rien en cache → page offline

**3. Réseau uniquement (network-only)** — pour les API
- `/api/chat` (streaming IA)
- `/api/groups`, `/api/referrals`
- Pas de cache (les réponses IA sont uniques)
- Si pas de réseau → file d'attente offline

### Implémentation

```javascript
// public/sw.js

const NOM_CACHE = 'catchup-v1'

const ASSETS_A_PRECACHER = [
  '/',
  '/quiz',
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

// Installation : pré-cacher les assets essentiels
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(NOM_CACHE).then((cache) => {
      return cache.addAll(ASSETS_A_PRECACHER)
    })
  )
  self.skipWaiting()
})

// Activation : nettoyer les anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((noms) => {
      return Promise.all(
        noms
          .filter((nom) => nom !== NOM_CACHE)
          .map((nom) => caches.delete(nom))
      )
    })
  )
  self.clients.claim()
})

// Interception des requêtes
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // API → réseau uniquement
  if (url.pathname.startsWith('/api/')) {
    return // pas d'interception, le navigateur gère
  }

  // Assets statiques → cache d'abord
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(js|css|png|jpg|svg|woff2?)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((reponseCache) => {
        if (reponseCache) return reponseCache

        return fetch(event.request).then((reponseReseau) => {
          const copie = reponseReseau.clone()
          caches.open(NOM_CACHE).then((cache) => {
            cache.put(event.request, copie)
          })
          return reponseReseau
        })
      })
    )
    return
  }

  // Pages HTML → réseau d'abord
  event.respondWith(
    fetch(event.request)
      .then((reponseReseau) => {
        const copie = reponseReseau.clone()
        caches.open(NOM_CACHE).then((cache) => {
          cache.put(event.request, copie)
        })
        return reponseReseau
      })
      .catch(() => {
        return caches.match(event.request).then((reponseCache) => {
          return reponseCache || caches.match('/offline')
        })
      })
  )
})

// Notifications push
self.addEventListener('push', (event) => {
  const donnees = event.data ? event.data.json() : {}

  event.waitUntil(
    self.registration.showNotification(donnees.titre || "Catch'Up", {
      body: donnees.corps || '',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      data: { url: donnees.url || '/' },
      vibrate: [200, 100, 200],
    })
  )
})

// Clic sur notification → ouvrir l'app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((fenetres) => {
      // Si l'app est déjà ouverte, la focus
      for (const fenetre of fenetres) {
        if (fenetre.url.includes('catchup') && 'focus' in fenetre) {
          return fenetre.focus()
        }
      }
      // Sinon, ouvrir un nouvel onglet
      return clients.openWindow(event.notification.data.url)
    })
  )
})
```

---

## Page offline — `/offline`

Quand le jeune n'a pas de réseau et qu'aucune page n'est en cache :

```
┌──────────────────────────────────┐
│                                  │
│         📡                       │
│                                  │
│  Pas de connexion                │
│                                  │
│  Catch'Up a besoin d'internet    │
│  pour discuter avec toi.         │
│                                  │
│  En attendant, tu peux :         │
│                                  │
│  📊 Voir ton profil              │
│     (données locales)            │
│                                  │
│  🔄 Réessayer                    │
│                                  │
│  Dès que le réseau revient,      │
│  on reprend où on en était 😊    │
│                                  │
└──────────────────────────────────┘
```

**Règles :**
- La page offline est **toujours en cache** (pré-cachée à l'installation du SW)
- Le bouton "Voir ton profil" lit le `localStorage` (disponible offline)
- Le bouton "Réessayer" recharge la page
- Ton bienveillant, pas d'erreur technique visible

---

## Mode dégradé (réseau instable)

Quand le réseau est lent ou intermittent, le chat doit rester utilisable :

### Envoi de message sans réseau

```
Le jeune tape un message et appuie sur Envoyer
  │
  ▼
Le message est affiché immédiatement dans le chat
  (avec un indicateur ⏳ "envoi en cours...")
  │
  ▼
Tentative d'envoi à l'API
  │
  ├── Succès → ⏳ disparaît, réponse IA affichée
  │
  └── Échec (pas de réseau)
      │
      ▼
  Le message est stocké dans la file d'attente offline
  L'indicateur passe à 🔄 "sera envoyé dès que possible"
      │
      ▼
  Quand le réseau revient (détecté par navigator.onLine + fetch test)
      │
      ▼
  Les messages en attente sont envoyés dans l'ordre
  Les réponses IA arrivent normalement
```

### File d'attente offline

```typescript
// Stockée dans localStorage

interface MessageEnAttente {
  id: string
  contenu: string
  horodatage: number
  tentatives: number     // nombre de tentatives d'envoi
  dernierEssai: number   // timestamp du dernier essai
}
```

**Règles :**
- Maximum **10 messages en file d'attente** (au-delà : "Trop de messages en attente, connecte-toi pour continuer")
- 3 tentatives max par message (ensuite marqué en erreur)
- Les messages sont envoyés dans l'ordre chronologique
- L'interface affiche clairement quels messages sont en attente

### Détection du réseau

```typescript
// Écouter les changements de connectivité

window.addEventListener('online', () => {
  // Réseau de retour → vider la file d'attente
  envoyerMessagesEnAttente()
})

window.addEventListener('offline', () => {
  // Réseau perdu → activer le mode dégradé
  afficherIndicateurOffline()
})
```

**Indicateur réseau :** Petite barre en haut du chat quand offline :
```
┌──────────────────────────────────┐
│ 📡 Hors connexion — tes messages │
│    seront envoyés au retour      │
└──────────────────────────────────┘
```

---

## Installation de la PWA

### Invitation à installer (adaptée à l'OS)

**Quand proposer l'installation :**
- Le jeune a échangé au moins 5 messages (engagement suffisant)
- ET il n'a pas déjà installé la PWA (détection mode standalone)
- ET il n'a pas refusé dans les 24 dernières heures
- Maximum 3 propositions au total. Après 3 refus → ne plus proposer.

**Détection automatique de l'OS :**
Le composant `InstallBanner` détecte automatiquement la plateforme (iOS, Android, Desktop) et adapte :
- Le message de la bannière
- Les instructions d'installation
- Le mécanisme d'installation (natif ou guidé)

**Bannière compacte (non bloquante, en bas du chat) :**

| Plateforme | Message |
|---|---|
| iPhone/iPad | "Ajoute Catch'Up sur ton iPhone" |
| Android | "Installe Catch'Up sur ton téléphone" |
| Desktop | "Installe Catch'Up sur ton ordi" |

Boutons : [Installer] + [✕ Plus tard]

**Instructions détaillées (modale si clic sur "Installer") :**

**iOS (Safari obligatoire) :**
1. Ouvre cette page dans Safari
2. Appuie sur le bouton Partager (📤)
3. Fais défiler → "Sur l'écran d'accueil"
4. Appuie sur "Ajouter"

**Android (Chrome) :**
1. Appuie sur les 3 points (⋮) en haut à droite
2. "Installer l'application" ou "Ajouter à l'écran d'accueil"
3. Confirme avec "Installer"
→ Sur Android, si `beforeinstallprompt` est disponible, le prompt natif Chrome est déclenché directement.

**Desktop (Chrome/Edge) :**
1. Clique sur l'icône d'installation (📥) dans la barre d'adresse
2. Clique sur "Installer"

**"Plus tard"** → bannière disparaît, repropose après 24h. Après 3 refus → ne plus proposer.

### Détection de l'installation

```typescript
// Écouter l'événement d'installation

window.addEventListener('appinstalled', () => {
  // Le jeune a installé la PWA
  // → Mettre à jour localStorage : catchup_plateforme = 'pwa'
  // → Enregistrer l'événement en analytics
  // → Ne plus afficher la bannière d'installation
})
```

### Compatibilité

| Navigateur | Installation PWA | Notifications push | Service Worker |
|------------|-----------------|-------------------|----------------|
| Chrome Android | ✅ | ✅ | ✅ |
| Samsung Internet | ✅ | ✅ | ✅ |
| Firefox Android | ✅ | ✅ | ✅ |
| Safari iOS 16.4+ | ✅ (depuis 2023) | ✅ (depuis iOS 16.4) | ✅ |
| Safari iOS < 16.4 | ✅ (Ajouter à l'écran) | ❌ | ✅ (limité) |
| Chrome desktop | ✅ | ✅ | ✅ |

**Point d'attention iOS :** Sur iOS < 16.4, les notifications push ne fonctionnent pas en PWA. Le fallback est l'email. Sur iOS 16.4+, tout fonctionne.

---

## Pré-cache et taille du cache

### Ce qui est pré-caché à l'installation

| Ressource | Taille estimée | Pourquoi |
|-----------|---------------|----------|
| Page d'accueil (/) | ~50 Ko | Accès immédiat au chat |
| Page quiz (/quiz) | ~30 Ko | Le quiz fonctionne offline |
| Page offline (/offline) | ~5 Ko | Fallback si rien d'autre |
| Manifest + icônes | ~100 Ko | Identité visuelle |
| CSS principal | ~30 Ko | Mise en page |
| JS principal | ~200 Ko | Logique de l'app |
| **Total pré-caché** | **~415 Ko** | **Rapide à installer** |

### Ce qui est caché au fil de l'utilisation

| Ressource | Stratégie | Durée |
|-----------|-----------|-------|
| Pages visitées | Réseau d'abord, cache en fallback | Jusqu'à mise à jour du SW |
| Polices de caractères | Cache d'abord | 1 an |
| Images de contenu | Cache d'abord | 30 jours |
| Réponses API | Jamais cachées | — |

### Limite de cache
- Objectif : < 5 Mo de cache total (navigateurs limitent à 50 Mo en général)
- Nettoyage automatique à chaque activation d'un nouveau Service Worker

---

## Mise à jour de la PWA

### Stratégie

Quand une nouvelle version est déployée :

1. Le Service Worker détecte qu'il y a une nouvelle version (comparaison du fichier `sw.js`)
2. Le nouveau SW s'installe en arrière-plan
3. Une bannière discrète s'affiche en haut du chat :

```
┌──────────────────────────────────────────┐
│  ✨ Nouvelle version disponible           │
│  [Mettre à jour]                         │
└──────────────────────────────────────────┘
```

4. Le jeune clique "Mettre à jour" → la page recharge avec la nouvelle version
5. S'il ignore → la mise à jour s'applique automatiquement au prochain lancement

**Règles :**
- Jamais de rechargement forcé (le jeune peut être en train d'écrire)
- La bannière est discrète, pas bloquante
- Pas de "version X.Y.Z" (le jeune s'en fiche)

---

## Enregistrement du Service Worker

```typescript
// src/app/layout.tsx ou src/lib/register-sw.ts

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const inscription = await navigator.serviceWorker.register('/sw.js')

      // Vérifier les mises à jour toutes les heures
      setInterval(() => {
        inscription.update()
      }, 60 * 60 * 1000)

      // Détecter quand une mise à jour est prête
      inscription.addEventListener('updatefound', () => {
        const nouveauSW = inscription.installing
        if (!nouveauSW) return

        nouveauSW.addEventListener('statechange', () => {
          if (nouveauSW.state === 'activated') {
            // Afficher la bannière "Nouvelle version disponible"
            afficherBanniereMiseAJour()
          }
        })
      })
    } catch (erreur) {
      console.error('Erreur enregistrement Service Worker:', erreur)
    }
  })
}
```

---

## Intégration Next.js

### Configuration `next.config.js`

```javascript
const nextConfig = {
  output: 'standalone',

  // Headers pour le Service Worker
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ]
  },
}
```

**Pourquoi `no-cache` sur le SW ?** Pour que le navigateur vérifie toujours s'il y a une nouvelle version du Service Worker. Sans ça, les mises à jour ne se propagent pas.

---

## Métriques

| Métrique | Description | Objectif |
|----------|-------------|----------|
| Taux d'installation PWA | % de visiteurs récurrents qui installent | > 15% |
| Utilisation depuis PWA | % de sessions lancées depuis la PWA | > 30% (après 3 mois) |
| Taux de cache hit | % de requêtes servies depuis le cache | > 60% des assets |
| Messages envoyés offline | Nombre de messages passés par la file d'attente | Indicateur |
| Taux de récupération offline | % de messages en file d'attente envoyés avec succès au retour réseau | > 95% |
| Taille moyenne du cache | Volume moyen de cache par utilisateur | < 3 Mo |
| Taux d'acceptation notifications | % de jeunes PWA qui acceptent les push | > 40% |
| Temps de chargement PWA | Temps entre le tap sur l'icône et l'affichage du chat | < 1.5s |
