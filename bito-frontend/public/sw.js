/* ═══════════════════════════════════════════
   Bito Service Worker — Push Notifications
   ═══════════════════════════════════════════ */

// Listen for push events from the server
self.addEventListener('push', (event) => {
  let data = { title: 'Bito', body: 'You have a new notification' };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    // If payload isn't JSON, use text
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/android-chrome-192x192.png',
    badge: data.badge || '/favicon-32x32.png',
    tag: data.tag || 'bito-notification',
    renotify: true,
    vibrate: [100, 50, 100],
    data: data.data || { url: '/app/dashboard' },
    actions: [
      { action: 'open', title: 'Open Bito' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Bito', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/app/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if found
      for (const client of windowClients) {
        if (client.url.includes('/app') && 'focus' in client) {
          return client.focus().then((c) => c.navigate(url));
        }
      }
      // Otherwise open new tab
      return clients.openWindow(url);
    })
  );
});

// Activate immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
