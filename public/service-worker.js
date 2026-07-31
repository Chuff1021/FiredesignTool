const CACHE_VERSION = "firedesign-2026.07.31-14";
const SHELL = ["/", "/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/icon-512.png"];

async function cacheApprovedRelease(cache) {
  const manifestResponse = await fetch("/assets/manifest.json", { cache: "no-store" });
  if (!manifestResponse.ok) throw new Error("Approved asset manifest is unavailable.");
  const manifest = await manifestResponse.clone().json();
  const assetPaths = Array.isArray(manifest.files)
    ? manifest.files
        .map((file) => file?.path)
        .filter(
          (assetPath) => typeof assetPath === "string" && assetPath.startsWith("/assets/"),
        )
    : [];
  await cache.put("/assets/manifest.json", manifestResponse);
  await cache.addAll([...SHELL, ...assetPaths]);
  return new Set([...SHELL, "/assets/manifest.json", ...assetPaths]);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cacheApprovedRelease(cache))
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

  const rangeHeader = request.headers.get("range");
  if (rangeHeader && url.pathname.endsWith(".mp4")) {
    event.respondWith(
      caches.match(new Request(request.url)).then(async (cached) => {
        const fullResponse = cached ?? (await fetch(new Request(request.url)));
        if (!fullResponse.ok) return fullResponse;
        const bytes = await fullResponse.arrayBuffer();
        const match = /^bytes=(\d+)-(\d*)$/.exec(rangeHeader);
        if (!match) return new Response(null, { status: 416 });
        const start = Number(match[1]);
        const requestedEnd = match[2] ? Number(match[2]) : bytes.byteLength - 1;
        const end = Math.min(requestedEnd, bytes.byteLength - 1);
        if (start > end || start >= bytes.byteLength) {
          return new Response(null, {
            status: 416,
            headers: { "Content-Range": `bytes */${bytes.byteLength}` },
          });
        }
        return new Response(bytes.slice(start, end + 1), {
          status: 206,
          headers: {
            "Accept-Ranges": "bytes",
            "Content-Length": String(end - start + 1),
            "Content-Range": `bytes ${start}-${end}/${bytes.byteLength}`,
            "Content-Type": fullResponse.headers.get("Content-Type") ?? "video/mp4",
          },
        });
      }),
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
        const approvedPaths = await cacheApprovedRelease(cache);
        const additional = [...new Set(urls)].filter(
          (url) => !approvedPaths.has(new URL(url, self.location.origin).pathname),
        );
        await Promise.allSettled(additional.map((url) => cache.add(url)));
      })
      .then(() => event.ports[0]?.postMessage({ type: "CACHE_READY" }))
      .catch(() => event.ports[0]?.postMessage({ type: "CACHE_ERROR" })),
  );
});
