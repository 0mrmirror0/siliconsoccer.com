// Silicon Soccer — service worker: gioco offline (cache-first)
const CACHE = 'silicon-soccer-v62-20260730';
const CACHE_PREFIX = 'silicon-soccer-';
const ASSETS = ['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./og.png','./privacy.html'];
const ASSET_URLS = new Set(ASSETS.map(path => new URL(path, self.location.href).href));

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE).map(k => caches.delete(k)))
  ).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;
  url.hash = '';

  const cacheableAsset = ASSET_URLS.has(url.href);
  if (!cacheableAsset && e.request.mode !== 'navigate') return;

  e.respondWith((async () => {
    const cache = await caches.open(CACHE);

    if (e.request.mode === 'navigate') {
      try {
        const fresh = await fetch(e.request);
        if (fresh.ok && fresh.type === 'basic') cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (_) {
        return await cache.match('./index.html') || Response.error();
      }
    }

    const hit = await cache.match(e.request);
    if (hit) return hit;

    const res = await fetch(e.request);
    if (res.ok && res.type === 'basic') cache.put(e.request, res.clone());
    return res;
  })());
});
