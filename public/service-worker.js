const CACHE_VERSION = "firedesign-2026.07.30-2";
const CORE = [
  "/",
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/assets/manifest.json",
  "/assets/fpx-864-trv-31k-clean-face.png",
  "/assets/centurion-kentucky-ledge.webp",
  "/assets/centurion-kentucky-ledge-bump.webp",
  "/assets/pearl-ncl-60-pearl.webp",
  "/assets/pearl-ncl-60-pearl-bump.webp",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(CORE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          void caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(async () => (await caches.match(request)) ?? (await caches.match("/"))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response.ok) return response;
        const clone = response.clone();
        void caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        return response;
      });
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "CACHE_RELEASE") return;
  const urls = Array.isArray(event.data.urls)
    ? event.data.urls.filter((url) => typeof url === "string")
    : [];
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then(async (cache) => {
        await cache.addAll(CORE);
        const additional = [...new Set(urls)].filter(
          (url) => !CORE.includes(new URL(url, self.location.origin).pathname),
        );
        await Promise.allSettled(additional.map((url) => cache.add(url)));
      })
      .then(() => event.ports[0]?.postMessage({ type: "CACHE_READY" }))
      .catch(() => event.ports[0]?.postMessage({ type: "CACHE_ERROR" })),
  );
});
