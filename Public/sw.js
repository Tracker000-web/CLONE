const CACHE_NAME = 'my-app-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './script.js',
  './manifest.json'
];

// 1. Install - Caches the files and forces the new worker to take over
self.addEventListener('install', (event) => {
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets');
      return cache.addAll(ASSETS);
    })
  );
});

// 2. Activate - Cleans up old versions of the cache
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim()); 
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', (event) => {
    // BYPASS FOR BACKEND: If the URL has port 5000, don't use the cache!
    if (event.request.url.includes(':5000')) {
        return; 
    }

    // Your existing cache code below...
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});

// 3. Fetch - This "Network First" strategy helps you see updates immediately
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request).catch(() => {
            // This is the safety net! 
            // If the network fails, you MUST return a valid Response 
            // or match it from the cache.
            return caches.match(event.request) || new Response("Network error occurred", {
                status: 408,
                headers: { 'Content-Type': 'text/plain' }
            });
        })
    );
});

self.addEventListener("fetch", event => {
  if (!navigator.onLine) {
    event.respondWith(
      caches.match(event.request)
    );
  }

});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
});
