const CACHE = "health-visit-packet-v1";
const SHELL = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icon.svg",
  "/offline.html",
];
async function precacheAppShell() {
  const cache = await caches.open(CACHE);
  const index = await fetch("/");
  const html = await index.text();
  const assets = [...html.matchAll(/(?:src|href)="([^\"]+)"/g)]
    .map((match) => match[1])
    .filter((url) => url.startsWith("/assets/"));
  await cache.addAll([...SHELL, ...assets]);
}
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(precacheAppShell());
});
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("message", (event) => {
  if (event.data?.type !== "cache-urls") return;
  const urls = (event.data.urls || []).filter((url) => {
    try {
      return new URL(url, self.location.origin).origin === self.location.origin;
    } catch {
      return false;
    }
  });
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(urls)));
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && new URL(event.request.url).origin === location.origin)
          caches.open(CACHE).then((c) => c.put(event.request, res.clone()));
        return res;
      })
      .catch(() =>
        event.request.mode === "navigate"
          ? caches.match("/offline.html")
          : caches.match(event.request).then((hit) => hit || Response.error()),
      ),
  );
});
