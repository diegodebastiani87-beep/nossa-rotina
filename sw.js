// sw.js — Service Worker do "Nossa Rotina"
const CACHE_NOME = 'nossa-rotina-v1';
const ARQUIVOS_CACHE = ['./', './index.html', './manifest.json'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(ARQUIVOS_CACHE).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NOME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('google') ||
    url.hostname.includes('gstatic') ||
    event.request.method !== 'GET'
  ) return;

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((resp) => {
      return resp || fetch(event.request).then((res) => {
        if (res && res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE_NOME).then((c) => c.put(event.request, clone));
        }
        return res;
      }).catch(() => resp);
    })
  );
});

self.addEventListener('message', (event) => {
  const data = event.data || {};

  if (data.type === 'show-notification') {
    const { title, options } = data;
    event.waitUntil(
      self.registration.showNotification(title, options || {})
    );
    return;
  }

  if (data.type === 'ping') {
    if (event.source) event.source.postMessage({ type: 'pong' });
    return;
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const eventoId = (event.notification.data && event.notification.data.eventoId) || '';
  const urlParaAbrir = './#agenda';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const client of lista) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({ type: 'open-evento', eventoId });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlParaAbrir);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notificação fechada:', event.notification.tag);
});
