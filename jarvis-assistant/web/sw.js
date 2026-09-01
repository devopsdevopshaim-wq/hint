// Minimal service worker — exists mainly so Android/Chrome treats this
// site as an installable app (its "Add to Home screen" → full install
// prompt requires a registered service worker + manifest, served over
// HTTPS). It also gives the app-shell a stale-while-revalidate cache so
// it opens instantly and still works on a flaky connection.
//
// Deliberately narrow scope: only same-origin GET requests are touched.
// n8n webhooks (chat, DiraFinder listings) and CDN scripts always go
// straight to the network — this must never serve stale live data.

const CACHE_NAME = 'jarvis-hub-v1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/tools/astrology.html',
  '/tools/hebrew-calendar.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch(() => {}) // offline-first install shouldn't hard-fail
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
