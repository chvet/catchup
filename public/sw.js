// Service Worker Catch'Up
// Gestion du cache, notifications push, et détection de mises à jour

const CACHE_NAME = 'catchup-v3';
const API_CACHE_NAME = 'catchup-api-v1';

// Ressources à pré-cacher lors de l'installation
const PRE_CACHE_URLS = [
  '/',
  '/quiz',
  '/offline',
];

// --- Installation ---
// Pré-cache des ressources essentielles
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRE_CACHE_URLS);
    })
  );
  // Activer immédiatement sans attendre la fermeture des onglets
  self.skipWaiting();
});

// --- Activation ---
// Nettoyage des anciens caches + notification aux clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== API_CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      // Notifier tous les clients qu'une mise à jour est disponible
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED' });
        });
      });
    })
  );
  // Prendre le contrôle de tous les clients ouverts
  self.clients.claim();
});

// --- Stratégies de fetch ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // JAMAIS cacher version.json ni sw.js — toujours réseau
  if (url.pathname === '/version.json' || url.pathname === '/sw.js') {
    event.respondWith(fetch(request));
    return;
  }

  // Stale-while-revalidate pour les API fiches (données métiers cachéables)
  if (url.pathname.startsWith('/api/fiches') && request.method === 'GET') {
    event.respondWith(staleWhileRevalidate(request, API_CACHE_NAME));
    return;
  }

  // Stale-while-revalidate pour les infos structure (rarement modifiées)
  if (url.pathname.startsWith('/api/structures/') && request.method === 'GET') {
    event.respondWith(staleWhileRevalidate(request, API_CACHE_NAME));
    return;
  }

  // Réseau uniquement pour les autres appels API (chat, referrals, etc.)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkOnly(request));
    return;
  }

  // Cache d'abord pour les ressources statiques (JS, CSS, images, polices)
  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Réseau d'abord pour les pages HTML
  event.respondWith(networkFirst(request));
});

// --- Helpers de stratégie ---

// Vérifie si la ressource est un asset statique
function isStaticAsset(pathname) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|webp|avif|woff|woff2|ttf|eot|ico)$/.test(pathname)
    || pathname.startsWith('/_next/static/');
}

// Stratégie : stale-while-revalidate — sert le cache instantanément et met à jour en arrière-plan
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Revalider en arrière-plan (fire-and-forget)
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  // Retourner le cache immédiatement s'il existe, sinon attendre le réseau
  if (cached) {
    return cached;
  }

  const networkResponse = await fetchPromise;
  if (networkResponse) return networkResponse;

  return new Response(JSON.stringify({ error: 'Hors connexion' }), {
    status: 503,
    headers: { 'Content-Type': 'application/json' },
  });
}

// Stratégie : cache d'abord, puis réseau en fallback
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    // Mettre en cache la réponse pour la prochaine fois
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Pas de cache et pas de réseau
    return new Response('Ressource indisponible', { status: 503 });
  }
}

// Stratégie : réseau d'abord, cache en fallback, page offline en dernier recours
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    // Mettre à jour le cache avec la réponse fraîche
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // En cas d'échec réseau, chercher dans le cache
    const cached = await caches.match(request);
    if (cached) return cached;

    // Dernier recours : afficher la page hors-ligne
    if (request.mode === 'navigate') {
      return caches.match('/offline');
    }

    return new Response('Hors connexion', { status: 503 });
  }
}

// Stratégie : réseau uniquement (pas de cache)
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Pas de connexion réseau' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// --- Notifications Push ---
// Réception et affichage des notifications push
self.addEventListener('push', (event) => {
  const data = event.data
    ? (() => {
        try { return event.data.json(); }
        catch { return { title: "Catch'Up", body: event.data.text() }; }
      })()
    : { title: "Catch'Up", body: 'Nouvelle notification' };

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon.svg',
      badge: '/icons/icon.svg',
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
      actions: data.actions || [],
    })
  );
});

// --- Clic sur notification ---
// Ouvrir l'app ou mettre le focus sur l'onglet existant
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Chercher un onglet déjà ouvert sur l'app
      const existingClient = clientList.find((client) => {
        return new URL(client.url).origin === self.location.origin;
      });

      if (existingClient) {
        existingClient.navigate(url);
        return existingClient.focus();
      }

      return self.clients.openWindow(url);
    })
  );
});
