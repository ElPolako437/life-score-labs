/**
 * CALINESS Service Worker
 * Cache-first offline support + push notification handling.
 */

const CACHE_NAME = 'caliness-reset-v1';

// On install: cache the app shell (root HTML)
self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(['/']);
    })
  );
});

// On activate: clean up old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys
          .filter(function (key) { return key !== CACHE_NAME; })
          .map(function (key) { return caches.delete(key); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

// Fetch strategy:
// - Navigation requests (HTML): network-first, fall back to cached root → enables offline SPA routing
// - Static assets (JS/CSS/images with hashes): cache-first (immutable files)
// - Everything else: network-first
self.addEventListener('fetch', function (event) {
  var request = event.request;

  // Skip non-GET and cross-origin requests
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Navigation: serve cached root as fallback (SPA offline support)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(function () {
        return caches.match('/');
      })
    );
    return;
  }

  // Static assets with content hash in URL: cache-first
  if (request.url.match(/\.(js|css|woff2?|png|jpg|svg|ico)(\?.*)?$/)) {
    event.respondWith(
      caches.match(request).then(function (cached) {
        if (cached) return cached;
        return fetch(request).then(function (response) {
          if (response.ok) {
            var clone = response.clone();
            caches.open(CACHE_NAME).then(function (cache) {
              cache.put(request, clone);
            });
          }
          return response;
        });
      })
    );
    return;
  }
});

// Push notification display
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    var payload = event.data.payload;
    event.waitUntil(
      self.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/favicon-512.png',
        badge: payload.badge || '/favicon-512.png',
        tag: payload.tag,
        data: payload.data,
      })
    );
  }
});

// Notification click → open app
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var url = '/week';
  if (event.notification.data && event.notification.data.url) {
    url = event.notification.data.url;
  }
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
      for (var i = 0; i < clients.length; i++) {
        if ('focus' in clients[i]) {
          clients[i].focus();
          clients[i].navigate(url);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});
