const CACHE_VERSION = "firedesign-2026.08.14-1-210f46f57479";
const SHELL = ["/", "/manifest.webmanifest", "/icon.svg", "/icon-192.png", "/icon-512.png"];

async function loadApprovedManifest(cache) {
  let manifestResponse;
  try {
    manifestResponse = await fetch("/assets/manifest.json", { cache: "no-store" });
  } catch {
    manifestResponse = await cache.match("/assets/manifest.json");
  }
  if (!manifestResponse) throw new Error("Approved asset manifest is unavailable.");
  if (!manifestResponse.ok) throw new Error("Approved asset manifest is unavailable.");
  const manifest = await manifestResponse.clone().json();
  const approvedPaths = Array.isArray(manifest.files)
    ? manifest.files
        .map((file) => file?.path)
        .filter(
          (assetPath) => typeof assetPath === "string" && assetPath.startsWith("/assets/"),
        )
    : [];
  await cache.put("/assets/manifest.json", manifestResponse);
  return new Set(approvedPaths);
}

async function cacheApprovedPaths(cache, requestedPaths) {
  const approvedPaths = await loadApprovedManifest(cache);
  const uniquePaths = [...new Set(requestedPaths)];
  const invalidPath = uniquePaths.find((path) => !approvedPaths.has(path));
  if (invalidPath) throw new Error(`Unapproved offline asset requested: ${invalidPath}`);
  for (let index = 0; index < uniquePaths.length; index += 8) {
    await cache.addAll(uniquePaths.slice(index, index + 8));
  }
  return uniquePaths.length;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then(async (cache) => {
        await cache.addAll(SHELL);
        await loadApprovedManifest(cache);
      })
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

  if (url.pathname === "/assets/manifest.json") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            void caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(
          async () =>
            (await caches.match(request)) ??
            new Response(null, { status: 503, statusText: "Manifest unavailable" }),
        ),
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
  const type = event.data?.type;
  if (type !== "CACHE_PACK" && type !== "CACHE_ALL") return;
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then(async (cache) => {
        const approvedPaths = await loadApprovedManifest(cache);
        const requestedPaths =
          type === "CACHE_ALL"
            ? [...approvedPaths]
            : Array.isArray(event.data.paths)
              ? event.data.paths.filter((path) => typeof path === "string")
              : [];
        const count = await cacheApprovedPaths(cache, requestedPaths);
        const runtimeUrls = Array.isArray(event.data.runtimeUrls)
          ? event.data.runtimeUrls.filter((value) => {
              if (typeof value !== "string") return false;
              const url = new URL(value, self.location.origin);
              return (
                url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")
              );
            })
          : [];
        await cache.addAll([...new Set(runtimeUrls)]);
        return count;
      })
      .then((count) => event.ports[0]?.postMessage({ type: "CACHE_READY", count }))
      .catch((error) =>
        event.ports[0]?.postMessage({
          type: "CACHE_ERROR",
          message: error instanceof Error ? error.message : "Offline installation failed.",
        }),
      ),
  );
});
