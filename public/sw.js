const VERSION = "v2";
const SHELL_CACHE = `health-visit-packet-shell-${VERSION}`;
const ASSET_CACHE = `health-visit-packet-assets-${VERSION}`;
const CACHE_PREFIX = "health-visit-packet-";
const SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/offline.html",
];
async function precacheAppShell() {
  const shellCache = await caches.open(SHELL_CACHE);
  const assetCache = await caches.open(ASSET_CACHE);
  const index = await fetch("/");
  const html = await index.text();
  const assets = [...html.matchAll(/(?:src|href)="([^\"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url.startsWith("/assets/"));
  await Promise.all([shellCache.addAll(SHELL), assetCache.addAll(assets)]);
}
self.addEventListener("install", (event) => {
  event.waitUntil(precacheAppShell().then(() => {
    if (!self.registration.active) return self.skipWaiting();
    return undefined;
  }));
});
self.addEventListener("activate", (event) => event.waitUntil(
  caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== SHELL_CACHE && key !== ASSET_CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim()),
));
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") { self.skipWaiting(); return; }
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.startsWith("/assets/") || /\.(?:png|webp|svg)$/.test(url.pathname)) {
    event.respondWith(caches.open(ASSET_CACHE).then((cache) => cache.match(event.request).then((hit) => hit || fetch(event.request).then((response) => { if (response.ok) cache.put(event.request, response.clone()); return response; }))));
    return;
  }
  event.respondWith(fetch(event.request).then((response) => { if (response.ok) caches.open(SHELL_CACHE).then((cache) => cache.put(event.request, response.clone())); return response; }).catch(() => caches.match(event.request, { ignoreVary: true }).then((hit) => hit || (event.request.mode === "navigate" ? caches.match("/offline.html") : Response.error()))));
});
