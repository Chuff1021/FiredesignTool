type CacheMessageType = "CACHE_PACK" | "CACHE_ALL";

export type OfflineCacheResult = {
  cached: boolean;
  count: number;
};

async function sendCacheMessage(
  type: CacheMessageType,
  paths: readonly string[] = [],
): Promise<OfflineCacheResult> {
  if (process.env.NODE_ENV !== "production") {
    return { cached: true, count: new Set(paths).size };
  }
  if (!("serviceWorker" in navigator)) {
    throw new Error("Offline installation is not supported by this browser.");
  }

  const registration = await navigator.serviceWorker.ready;
  const worker = navigator.serviceWorker.controller ?? registration.active;
  if (!worker) throw new Error("The offline worker is not ready.");

  return new Promise<OfflineCacheResult>((resolve, reject) => {
    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => {
      channel.port1.close();
      reject(new Error("Offline installation timed out."));
    }, 120_000);
    channel.port1.onmessage = (event: MessageEvent) => {
      window.clearTimeout(timeout);
      channel.port1.close();
      if (event.data?.type === "CACHE_READY") {
        resolve({ cached: true, count: Number(event.data.count) || 0 });
      } else {
        reject(new Error(event.data?.message ?? "Offline installation failed."));
      }
    };
    const runtimeUrls = performance
      .getEntriesByType("resource")
      .map((entry) => entry.name)
      .filter((url) => {
        const parsed = new URL(url, window.location.origin);
        return (
          parsed.origin === window.location.origin &&
          parsed.pathname.startsWith("/_next/static/")
        );
      });
    worker.postMessage(
      { type, paths: [...new Set(paths)], runtimeUrls: [...new Set(runtimeUrls)] },
      [channel.port2],
    );
  });
}

export const cacheAssetPack = (paths: readonly string[]) =>
  sendCacheMessage("CACHE_PACK", paths);

export const cacheCompleteCatalog = () => sendCacheMessage("CACHE_ALL");
