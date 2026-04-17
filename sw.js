const CACHE_NAME = 'drkz-tools-v1';

// 1. Installation du Service Worker (Met en cache l'accueil immédiatement)
self.addEventListener('install', (event) => {
  self.skipWaiting(); //json'
];

// 1. INSTALLATION : On met en cache les fichiers de base
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    })
  );
});

// 2. ACTIVATION : On nettoie les vieux caches si on a fait une mise à jour
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then Force l'activation immédiate
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // On sauvegarde l'accueil et la liste des outils pour qu'ils marchent tout de suite hors-ligne
      return cache.addAll([
        '/',
        '/index.html',
        '/tools.json',
        '/manifest.json'
      ]);
    })
  );
});

// 2. Activation (Nettoie les anciens caches si on met à jour la version)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. INTERCEPTION DES REQUÊTES (Le coeur du mode Hors-ligne)
self.addEventListener('fetch', (event) => {
  // On ignore les requêtes non-GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // Stratégie "Network First, fallback to Cache"
    // On essaie d().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim(); // Prend le contrôle immédiat de la page
});

// 3. Interception des requêtes (Le coeur du mode Hors-ligne)
self.addEventListener('fetch', (event) => {
  // On ne gère que les requêtes GET (on ignore les formulaires POST etc.)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    // Stratégie "Network First" : On essaie TOUJOURS d'avoir la version la plus récente sur internet
    fetch(event.request)
      .then((response) => {
        // Si ça marche (on a internet), on fait une copie silencieuse dans le téléphone pour la prochaine fois
        if ('abord d'aller chercher la version la plus récente sur internet
    fetch(event.request)
      .then((response) => {
        // Si on a du réseau, on met la page visitée dans le cache "au cas où" pour plus tard
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        // SI COUPURE INTERNET, on va chercher dans le cache du téléphone !
        return caches.match(event.request);
      })
  );
});
