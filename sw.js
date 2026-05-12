/* ============================================================
   GroceryBill Pro — Service Worker
   App-shell strategy: cache static assets on install,
   serve from cache first, fall back to network.
   ============================================================ */

const CACHE_NAME = 'grocerybill-v1';

const APP_SHELL = [
  '/',
  '/index.html',
  '/src/style.css',
  '/src/utils.js',
  '/src/db.js',
  '/src/invoice.js',
  '/src/main.js',
  '/src/supabase.js',
  '/src/pages/dashboard.js',
  '/src/pages/billing.js',
  '/src/pages/products.js',
  '/src/pages/history.js',
  '/src/pages/reports.js',
  '/src/pages/customers.js',
  '/src/pages/settings.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap',
];

// Install — cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Cache local assets; ignore failures for external CDN resources
      return Promise.allSettled(
        APP_SHELL.map(url => cache.add(url).catch(() => null))
      );
    }).then(() => self.skipWaiting())
  );
});

// Activate — delete old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — cache-first for local assets, network-first for external
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') return;

  // Network-first for CDN/API requests
  if (!url.origin.includes(self.location.origin)) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for local files
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(request, clone));
        }
        return response;
      }).catch(() => caches.match('/index.html')); // fallback to app shell
    })
  );
});
