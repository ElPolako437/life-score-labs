/**
 * CALINESS Service Worker
 * Handles background push notification display.
 */

self.addEventListener('install', function (event) {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

// Listen for messages from the main app
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

// Handle notification click
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  var url = '/app/home';
  if (event.notification.data && event.notification.data.url) {
    url = event.notification.data.url;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clients) {
      // Focus existing window if available
      for (var i = 0; i < clients.length; i++) {
        var client = clients[i];
        if (client.url.includes('/app') && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      // Open new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});
