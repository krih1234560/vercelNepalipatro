// sw.js - Service Worker for Nepali Patro PWA

const CACHE_NAME = 'nepali-patro-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/calendar-2083.html',
  '/nepalsambat.html',
  '/unicode.html',
  '/dateconverter.html',
  '/date-difference.html',
  '/age-calculator.html',
  '/ nepali-festivals.html',
  '/nepali-holidays.html',
  '/rashifal.html',
  '/weather.html',
  '/goldsilver.html',
  '/kundali-generator.html',
  '/exchange-rate.html',
  '/nepali_fuel_rates.html',
  '/manifest.json',
  '/offline.html',
  '/event-remainder.html',
  '/quiz-scheduler.html',
  '/kundli-milan.html'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const request = event.request;

  // Skip cross-origin requests
  if (!request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(request)
          .then(networkResponse => {
            // Cache successful responses for HTML and CSS/JS
            if (networkResponse.status === 200) {
              const clone = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(request, clone);
                });
            }
            return networkResponse;
          })
          .catch(() => {
            // If offline, serve offline page for HTML requests
            if (request.headers.get('Accept').includes('text/html')) {
              return caches.match('/offline.html');
            }
            // For other resources, return a simple error response
            return new Response('Offline - Please check your connection', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});
