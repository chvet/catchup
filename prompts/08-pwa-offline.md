# 08 — PWA et Mode Offline

> Contexte : voir `00-architecture.md`. Prérequis : `01` à `07` exécutés.

## Objectif
Transformer l'app en PWA installable avec un service worker pour le cache et un mode offline basique.

## 1. Manifest PWA

**public/manifest.json** (déjà créé dans 01, compléter si besoin) :
```json
{
  "name": "Catch'Up",
  "short_name": "Catch'Up",
  "description": "Ton guide orientation alimenté par l'IA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#F0F2F5",
  "theme_color": "#6C63FF",
  "orientation": "portrait",
  "categories": ["education"],
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

## 2. Icônes PWA

Créer des icônes placeholder (carrés violets #6C63FF avec "C" blanc au centre) :
- `public/icons/icon-192.png` (192×192)
- `public/icons/icon-512.png` (512×512)

Pour le MVP, utiliser un SVG converti ou un simple canvas export. L'important est que les fichiers existent pour que le manifest soit valide.

## 3. Service Worker

**public/sw.js** :

Stratégie de cache :
- **App shell** (Cache First) : `/`, CSS, JS, fonts, images statiques
- **API chat** (Network First) : `/api/chat` → tenter le réseau, fallback sur une réponse cached ou un message d'erreur
- **Google Fonts** (Cache First) : fonts.googleapis.com, fonts.gstatic.com

```javascript
const CACHE_NAME = 'catchup-v1'
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
]

// Install : pre-cache app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

// Activate : clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  )
})

// Fetch : stratégie par type de requête
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)

  // API : Network First
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ error: 'Pas de connexion. Tes conversations sont sauvées, réessaie quand tu auras du réseau.' }), {
          headers: { 'Content-Type': 'application/json' }
        })
      )
    )
    return
  }

  // Fonts : Cache First
  if (url.hostname.includes('fonts.g')) {
    event.respondWith(
      caches.match(event.request).then(cached =>
        cached || fetch(event.request).then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone))
          return response
        })
      )
    )
    return
  }

  // Static : Cache First, fallback Network
  event.respondWith(
    caches.match(event.request).then(cached => cached || fetch(event.request))
  )
})
```

## 4. Enregistrement du Service Worker

**src/app/layout.tsx** — ajouter un script d'enregistrement :

```tsx
<script dangerouslySetInnerHTML={{ __html: `
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
    })
  }
`}} />
```

## 5. Mode offline dans le chat

Quand le réseau est indisponible, l'utilisateur doit avoir un feedback clair.

**Détection** : `navigator.onLine` + événements `online`/`offline`

**Dans ChatApp** :
- State `isOffline`
- Listener sur `window.addEventListener('offline', ...)` et `online`
- Si offline : afficher une bannière en haut de la zone chat :
  ```
  ⚡ Pas de connexion — tes messages seront envoyés quand le réseau reviendra
  ```
  Fond jaune-50, texte jaune-800, petite, dismissable

**Comportement** :
- Les messages passés restent visibles (déjà en mémoire React)
- Envoyer un message → le montrer en bulle avec un indicateur ⏳ (en attente)
- Quand le réseau revient → renvoyer automatiquement

Pour le MVP, on peut simplement bloquer l'envoi avec un message "Pas de connexion" et le débloquer quand le réseau revient.

## 6. Meta tags pour PWA (dans layout.tsx)

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Catch'Up" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
```

## Vérification
- [ ] Lighthouse PWA score > 80
- [ ] L'app est installable (bouton "Ajouter à l'écran d'accueil" visible)
- [ ] Après installation, l'app s'ouvre en standalone (pas de barre navigateur)
- [ ] En mode avion : l'app s'ouvre, les messages passés sont visibles
- [ ] En mode avion : envoyer un message → feedback "pas de connexion"
- [ ] Retour en ligne → l'app fonctionne normalement
