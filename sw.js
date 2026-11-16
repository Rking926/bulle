/* Bulle (version test) — service worker : rend l'app installable et la fait marcher hors ligne.
   Chemins relatifs : marche à la racine d'un site comme dans un sous-dossier. */
const VERSION = 'bulle-test-v7';
const SHELL = ['./', 'index.html', 'app.css', 'app.js', 'local-api.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png', 'icons/logo-mask.png', 'cgu.html', 'confidentialite.html', 'legal.css'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION && k !== 'bulle-fonts').map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open('bulle-fonts').then((c) => c.match(req).then((hit) => hit || fetch(req).then((r) => { c.put(req, r.clone()); return r; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  if (req.mode === 'navigate') {
    // chaque page est gardée sous sa propre adresse (l'app, les CGU…), sans les paramètres
    const key = new URL(req.url); key.search = '';
    e.respondWith(fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(key.href, copy)); } return r; })
      .catch(() => caches.match(key.href).then((hit) => hit || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.open(VERSION).then((c) => c.match(req, { ignoreSearch: true }).then((hit) => {
    const net = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  })));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const chatId = e.notification.data && e.notification.data.chatId, moment = e.notification.data && e.notification.data.moment;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
    for (const c of list) { c.postMessage(moment ? { type: 'moment' } : { type: 'open-chat', chatId }); return c.focus(); }
    return self.clients.openWindow(moment ? './?moment=1' : './?chat=' + encodeURIComponent(chatId || ''));
  }));
});
