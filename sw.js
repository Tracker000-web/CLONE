/* ---------- sw.js ---------- */
const CACHE_NAME = 'manager-app-v2'; // Increment version to force update
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './state.js',
    './api.js',
    './auth.js',
    './spreadsheet.js',
    './manifest.json',
    './ui.js',
    './4840719.jpg'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});

// 1. Install - Caches the files
self.addEventListener('install', (event) => {
    self.skipWaiting(); 
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Service Worker: Caching Assets');
            // Fixed: Changed ASSETS to ASSETS_TO_CACHE
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

// 2. Activate - Cleanup old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim()); 
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Deleting Old Cache', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// 3. Fetch - Network First Strategy with Backend Bypass
self.addEventListener('fetch', (event) => {
    // BYPASS FOR BACKEND: Don't cache API calls
    if (event.request.url.includes(':5000') || event.request.url.includes('/api/')) {
        return; 
    }

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // If network is successful, return the response
                return response;
            })
            .catch(() => {
                // If network fails (offline), look in cache
                return caches.match(event.request).then((match) => {
                    return match || new Response("Offline: Resource not available", {
                        status: 503,
                        headers: { 'Content-Type': 'text/plain' }
                    });
                });
            })
    );
});