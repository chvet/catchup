// Service Worker Catch'Up
// Gestion du cache et des notifications push

const CACHE_NAME = 'catchup-v1';

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
// Nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  // Prendre le contrôle de tous les clients ouverts
  self.clients.claim();
});

// --- Stratégies de fetch ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Réseau uniquement pour les appels API
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
  return /\.(js|css|png|jpg|jpeg|gif|svg|webp|woff|woff2|ttf|eot|ico)$/.test(pathname)
    || pathname.startsWith('/_next/static/');
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
// Gestion de la réception des notifications push (pour usage futur)
self.addEventListener('push', (event) => {
  // Données par défaut si le payload est vide
  const defaultData = {
    title: "Catch'Up",
    body: "Tu as une nouvelle suggestion !",
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    tag: 'catchup-notification',
  };

  let data = defaultData;

  if (event.data) {
    try {
      data = { ...defaultData, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      tag: data.tag,
      data: data.url || '/',
      // Vibrer sur mobile
      vibrate: [100, 50, 100],
    })
  );
});

// --- Clic sur notification ---
// Ouvrir l'app ou mettre le focus sur l'onglet existant
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      // Chercher un onglet déjà ouvert sur l'app
      const existingClient = clients.find((client) => {
        return new URL(client.url).origin === self.location.origin;
      });

      if (existingClient) {
        // Naviguer vers l'URL cible et donner le focus
        existingClient.navigate(targetUrl);
        return existingClient.focus();
      }

      // Sinon, ouvrir un nouvel onglet
      return self.clients.openWindow(targetUrl);
    })
  );
});
