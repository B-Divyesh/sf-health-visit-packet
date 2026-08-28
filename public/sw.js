const CACHE='health-visit-packet-v1'; const SHELL=['/','/index.html','/manifest.webmanifest','/icon.svg','/offline.html'];
self.addEventListener('install', event => { self.skipWaiting(); event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL))); });
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => { if (event.request.method !== 'GET') return; event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(res => { if (res.ok && new URL(event.request.url).origin === location.origin) caches.open(CACHE).then(c => c.put(event.request,res.clone())); return res; }).catch(() => event.request.mode === 'navigate' ? caches.match('/offline.html') : Response.error()))); });
