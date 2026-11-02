/* Retentio Service Worker — Native Push & Mobile Notifications */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// 1. Handle incoming Web Push from server (even when tab/app is closed)
self.addEventListener('push', (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch {
      data = { title: 'Retentio Notification', body: event.data.text() };
    }
  }

  const title = data.title || 'Retentio Notification';
  const options = {
    body: data.body || '',
    icon: data.icon || '/retentio-icon.png',
    badge: data.badge || '/retentio-icon.png',
    vibrate: [200, 100, 200],
    tag: data.tag || `notif_${Date.now()}`,
    renotify: true,
    data: {
      url: data.data?.url || data.url || '/',
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Handle user tapping / clicking notification on mobile or desktop
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a tab is already open, focus it and navigate
      for (const client of clientList) {
        if ('focus' in client) {
          if (targetUrl && targetUrl !== '/') {
            try {
              client.navigate(targetUrl);
            } catch {}
          }
          return client.focus();
        }
      }
      // If no tab is open, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

// 3. Receive direct notification requests from foreground / background web pages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
    const { title, options } = event.data;
    const finalOptions = {
      icon: '/retentio-icon.png',
      badge: '/retentio-icon.png',
      vibrate: [200, 100, 200],
      renotify: true,
      tag: `local_${Date.now()}`,
      ...options,
    };
    self.registration.showNotification(title, finalOptions);
  }
});

