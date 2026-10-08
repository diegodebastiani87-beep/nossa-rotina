self.addEventListener('install', (event) => { self.skipWaiting(); });
self.addEventListener('activate', (event) => { event.waitUntil(self.clients.claim()); });

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.hostname.includes('firebase') || url.hostname.includes('google') ||
      url.hostname.includes('gstatic') || event.request.method !== 'GET') return;
});

self.addEventListener('message', (event) => {
  const data = event.data || {};
  if (data.type === 'show-notification') {
    event.waitUntil(self.registration.showNotification(data.title, data.options || {}));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const eventoId = (event.notification.data && event.notification.data.eventoId) || '';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const client of lista) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'open-evento', eventoId });
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow('./#agenda');
    })
  );
});
