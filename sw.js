const CACHE_NAME = 'drkz-tools-v3';

// Les fichiers strictement nécessaires au démarrage hors-ligne
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/tools.json',
  '/manifest.json'
];

// 1. INSTALLATION : Forcer la mise en cache immédiate
self.addEventListener('install', (event) => {
  self.skipWaiting(); // N'attend pas que l'ancien SW se ferme
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Mise en cache des fichiers de base...');
      return cache.addAll(CORE_ASSETS);
    })
  );
});

// 2. ACTIVATION : Nettoyer les vieux caches (v1, v2...)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Suppression de l\'ancien cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Prendre le contrôle de la page tout de suite
});

// 3. INTERCEPTION (Le mode Hors-Ligne)
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET et les requêtes d'extensions Chrome
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) return;

  event.respondWith(
    // On essaie d'abord d'aller sur Internet (pour avoir la dernière version)
    fetch(event.request)
      .then((response) => {
        // Si on a du réseau, on met à jour le cache silencieusement
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // SI PAS D'INTERNET -> On cherche dans le cache
        console.log('[SW] Mode hors-ligne ! Recherche en cache pour:', event.request.url);
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse; // On renvoie la page sauvegardée !
          }
          console.warn('[SW] Page non trouvée dans le cache !');
        });
      })
  );
});
