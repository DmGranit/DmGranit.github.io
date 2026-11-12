/* Offline cache for the deck. Everything (images, fonts) lives inside index.html. */
const CACHE = 'perelman-people-202611121537';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
/* network first (fresh version when online), cache when offline */
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  const cached = () => caches.match(e.request, { ignoreSearch: true }).then(m => m || caches.match('./index.html'));
  const net = fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return r;
  });
  /* weak mobile signal: after 4 s show the saved copy, the fresh one is still stored for next time */
  const slow = new Promise(res => setTimeout(res, 4000)).then(cached).then(m => m || net);
  e.respondWith(Promise.race([net.catch(cached), slow]));
});
