"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ControlPanel } from "@/components/ControlPanel";
import { DiagnosticsPanel, type DiagnosticsData } from "@/components/DiagnosticsPanel";
import { SceneErrorBoundary } from "@/components/SceneErrorBoundary";
import { SceneViewport } from "@/components/SceneViewport";
import { StartupGate } from "@/components/StartupGate";
import {
  APPROVED_ASSET_PATHS,
  APPROVED_CORE_ASSET_PATHS,
  catalogRepository,
  getApprovedFireplaceAssetPaths,
  getApprovedStartupAssetPaths,
} from "@/domain/catalogRepository";
import {
  runReadinessChecks,
  verifyApprovedAssets,
  type GraphicsSupport,
  type ReadinessResult,
} from "@/lib/readiness";
import { useConfigurationStore } from "@/store/configurationStore";
import type { FireboxMediaStatus } from "@/components/FireboxMedia";
import { readStorageHealth, UNAVAILABLE_STORAGE_HEALTH } from "@/lib/storageHealth";
import { cacheAssetPack, cacheCompleteCatalog } from "@/lib/offlineCatalog";

const CustomerRoomViewport = dynamic(
  () =>
    import("@/components/CustomerRoomViewport").then((module) => module.CustomerRoomViewport),
  {
    ssr: false,
    loading: () => (
      <section className="room-workspace room-workspace--empty">
        <div className="room-empty">
          <span className="scene-loading__mark" />
          <h2>Preparing customer projects</h2>
        </div>
      </section>
    ),
  },
);

const UNKNOWN_GRAPHICS: GraphicsSupport = {
  supported: false,
  webgl2: false,
  renderer: "Checking",
  vendor: "Checking",
};

type AssetPackState = {
  complete: number;
  error: string | null;
  fireplaceId: string;
  status: "loading" | "ready" | "error";
  total: number;
};

function isStaleAssetCacheError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return (
    error.message.includes("unexpected size") ||
    error.message.includes("failed its integrity check")
  );
}

async function clearStaleReleaseCaches(): Promise<void> {
  if ("caches" in window) {
    const cacheNames = await window.caches.keys();
    await Promise.all(
      cacheNames
        .filter((cacheName) => cacheName.startsWith("firedesign-"))
        .map((cacheName) => window.caches.delete(cacheName)),
    );
  }
  if ("serviceWorker" in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    await registration?.update().catch(() => undefined);
  }
}

export function FireDesignApp() {
  const initialize = useConfigurationStore((state) => state.initialize);
  const fireplaceId = useConfigurationStore((state) => state.fireplaceId);
  const firebackOptionId = useConfigurationStore((state) => state.firebackOptionId);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [progress, setProgress] = useState({
    complete: 0,
    total: 0,
  });
  const [assetPack, setAssetPack] = useState<AssetPackState>({
    complete: 0,
    error: null,
    fireplaceId,
    status: "loading",
    total: 0,
  });
  const [assetPackRetry, setAssetPackRetry] = useState(0);
  const [completeCatalogStatus, setCompleteCatalogStatus] =
    useState<DiagnosticsData["completeCatalogStatus"]>("idle");
  const [completeCatalogProgress, setCompleteCatalogProgress] = useState("Not installed");
  const verifiedPacks = useRef(new Set<string>());
  const packRequest = useRef(0);
  const [isPresentation, setPresentation] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [cacheReady, setCacheReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [fps, setFps] = useState(0);
  const [mediaStatus, setMediaStatus] = useState<FireboxMediaStatus>("preparing");
  const [rendererStatus, setRendererStatus] =
    useState<DiagnosticsData["rendererStatus"]>("recovering");
  const [storageHealth, setStorageHealth] = useState(UNAVAILABLE_STORAGE_HEALTH);
  const [workspace, setWorkspace] = useState<"feature-wall" | "customer-room">("feature-wall");

  const checkReadiness = useCallback(async () => {
    setStartupError(null);
    setReadiness(null);
    try {
      initialize();
      const initialFireplaceId = useConfigurationStore.getState().fireplaceId;
      const requiredPaths = getApprovedStartupAssetPaths(initialFireplaceId);
      setProgress({ complete: 0, total: requiredPaths.length });
      setAssetPack({
        complete: 0,
        error: null,
        fireplaceId: initialFireplaceId,
        status: "loading",
        total: requiredPaths.length,
      });
      const reportProgress = (complete: number, total: number) =>
        setProgress({ complete, total });
      let result: ReadinessResult;
      try {
        result = await runReadinessChecks(requiredPaths, reportProgress);
      } catch (error) {
        if (!isStaleAssetCacheError(error)) throw error;
        console.warn("[FireDesign] Stale release cache detected; rebuilding approved cache.");
        await clearStaleReleaseCaches();
        setProgress({ complete: 0, total: requiredPaths.length });
        result = await runReadinessChecks(requiredPaths, reportProgress);
      }
      verifiedPacks.current.add(initialFireplaceId);
      setAssetPack({
        complete: requiredPaths.length,
        error: null,
        fireplaceId: initialFireplaceId,
        status: "ready",
        total: requiredPaths.length,
      });
      setReadiness(result);
      void cacheAssetPack(requiredPaths)
        .then(() => setCacheReady(true))
        .catch(() => setCacheReady(false));
      void readStorageHealth().then(setStorageHealth);
    } catch (error) {
      setStartupError(
        error instanceof Error
          ? error.message
          : "The approved showroom release could not be verified.",
      );
    }
  }, [initialize]);

  useEffect(() => {
    // Startup verification is an external synchronization boundary.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void checkReadiness();
  }, [checkReadiness]);

  useEffect(() => {
    queueMicrotask(() => setOnline(navigator.onLine));
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => registration.update().catch(() => undefined))
        .catch(() => setCacheReady(false));
    } else {
      queueMicrotask(() => setCacheReady(process.env.NODE_ENV !== "production"));
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!readiness) return;
    const requestId = ++packRequest.current;
    const requiredPaths = getApprovedStartupAssetPaths(fireplaceId);
    const modelPaths = getApprovedFireplaceAssetPaths(fireplaceId);
    // A model change is the asset-verification synchronization boundary. The
    // scene is already gated by the mismatched pack ID before these flags reset.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCacheReady(false);
    setRendererStatus("recovering");

    if (verifiedPacks.current.has(fireplaceId)) {
      setAssetPack({
        complete: requiredPaths.length,
        error: null,
        fireplaceId,
        status: "ready",
        total: requiredPaths.length,
      });
      void cacheAssetPack(requiredPaths)
        .then(() => {
          if (packRequest.current === requestId) setCacheReady(true);
        })
        .catch(() => {
          if (packRequest.current === requestId) setCacheReady(false);
        });
      return;
    }

    setAssetPack({
      complete: APPROVED_CORE_ASSET_PATHS.length,
      error: null,
      fireplaceId,
      status: "loading",
      total: requiredPaths.length,
    });
    void verifyApprovedAssets(readiness.manifest, modelPaths, (complete) => {
      if (packRequest.current !== requestId) return;
      setAssetPack((current) => ({
        ...current,
        complete: APPROVED_CORE_ASSET_PATHS.length + complete,
      }));
    })
      .then(() => {
        if (packRequest.current !== requestId) return;
        verifiedPacks.current.add(fireplaceId);
        setAssetPack({
          complete: requiredPaths.length,
          error: null,
          fireplaceId,
          status: "ready",
          total: requiredPaths.length,
        });
        void cacheAssetPack(requiredPaths)
          .then(() => {
            if (packRequest.current === requestId) setCacheReady(true);
          })
          .catch(() => {
            if (packRequest.current === requestId) setCacheReady(false);
          });
      })
      .catch((error) => {
        if (packRequest.current !== requestId) return;
        setAssetPack({
          complete: APPROVED_CORE_ASSET_PATHS.length,
          error:
            error instanceof Error
              ? error.message
              : "This fireplace asset pack could not be prepared.",
          fireplaceId,
          status: "error",
          total: requiredPaths.length,
        });
        setCacheReady(false);
      });
  }, [assetPackRetry, fireplaceId, readiness]);

  const installCompleteCatalog = async () => {
    if (!readiness || completeCatalogStatus === "installing") return;
    setCompleteCatalogStatus("installing");
    setCompleteCatalogProgress(`0 / ${APPROVED_ASSET_PATHS.length} verified`);
    try {
      await verifyApprovedAssets(readiness.manifest, APPROVED_ASSET_PATHS, (complete, total) =>
        setCompleteCatalogProgress(`${complete} / ${total} verified`),
      );
      setCompleteCatalogProgress("Caching complete catalog…");
      await cacheCompleteCatalog();
      setCompleteCatalogStatus("ready");
      setCompleteCatalogProgress(`${APPROVED_ASSET_PATHS.length} assets installed`);
      setCacheReady(true);
    } catch {
      setCompleteCatalogStatus("error");
      setCompleteCatalogProgress("Install failed");
    }
  };

  useEffect(() => {
    const onFullscreenChange = () => setPresentation(Boolean(document.fullscreenElement));
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.shiftKey && event.key.toLowerCase() === "d") {
        setDiagnosticsOpen(true);
      }
      if (event.key === "Escape" && !document.fullscreenElement) {
        setPresentation(false);
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  useEffect(() => {
    if (diagnosticsOpen) void readStorageHealth().then(setStorageHealth);
  }, [diagnosticsOpen]);

  const enterPresentation = async () => {
    if (rendererStatus !== "ready") return;
    setPresentation(true);
    await document.documentElement.requestFullscreen?.().catch(() => undefined);
  };

  const openDiagnostics = () => {
    setDiagnosticsOpen(true);
  };

  const exitPresentation = async () => {
    setPresentation(false);
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    }
  };

  if (!readiness) {
    return (
      <StartupGate
        error={startupError}
        onRetry={() => void checkReadiness()}
        progress={progress.complete}
        total={progress.total}
      />
    );
  }

  const diagnosticsFireplace = catalogRepository.getFireplace(fireplaceId);
  const diagnosticsFireback = catalogRepository.getFireback(fireplaceId, firebackOptionId);
  const diagnostics: DiagnosticsData = {
    cacheReady,
    completeCatalogProgress,
    completeCatalogStatus,
    fps,
    graphics: readiness.graphics ?? UNKNOWN_GRAPHICS,
    online,
    rendererStatus,
    mediaStatus,
    requiredAssets: assetPack.total,
    selectedModel: catalogRepository.getFireplace(fireplaceId).shortLabel,
    selectedFireback: `${diagnosticsFireback.name} · ${
      diagnosticsFireplace.burnMedia?.compatibleFirebackIds.includes(diagnosticsFireback.id)
        ? "live"
        : "static"
    }`,
    storage: storageHealth,
    verifiedAssets: assetPack.complete,
  };
  const activePackReady = assetPack.fireplaceId === fireplaceId && assetPack.status === "ready";
  const selectedFireplace = catalogRepository.getFireplace(fireplaceId);

  return (
    <main className="app-shell" data-presentation={isPresentation}>
      {!isPresentation ? (
        <ControlPanel
          onEnterPresentation={() => void enterPresentation()}
          onOpenDiagnostics={openDiagnostics}
          onWorkspaceChange={setWorkspace}
          presentationReady={
            workspace === "feature-wall" && activePackReady && rendererStatus === "ready"
          }
          workspace={workspace}
        />
      ) : null}
      {!activePackReady && workspace === "feature-wall" ? (
        <section aria-live="polite" className="scene-viewport asset-pack-gate">
          <div className="scene-loading">
            <span className="scene-loading__mark" />
            <strong>
              {assetPack.status === "error"
                ? `${selectedFireplace.shortLabel} is not ready`
                : `Preparing ${selectedFireplace.shortLabel}`}
            </strong>
            <span>
              {assetPack.status === "error"
                ? "The current design is protected. Retry this model or choose another fireplace."
                : `${Math.min(assetPack.complete, assetPack.total)} of ${assetPack.total} approved assets verified`}
            </span>
            {assetPack.status === "error" ? (
              <button
                className="primary-button"
                onClick={() => setAssetPackRetry((value) => value + 1)}
                type="button"
              >
                Retry fireplace pack
              </button>
            ) : null}
          </div>
        </section>
      ) : workspace === "customer-room" && !isPresentation ? (
        <CustomerRoomViewport />
      ) : (
        <SceneErrorBoundary onError={() => setRendererStatus("error")}>
          <SceneViewport
            isPresentation={isPresentation}
            onExitPresentation={() => void exitPresentation()}
            onFps={setFps}
            mediaStatus={mediaStatus}
            onMediaStatus={setMediaStatus}
            onRendererStatus={setRendererStatus}
          />
        </SceneErrorBoundary>
      )}
      {diagnosticsOpen ? (
        <DiagnosticsPanel
          data={diagnostics}
          onClose={() => setDiagnosticsOpen(false)}
          onInstallCompleteCatalog={() => void installCompleteCatalog()}
          onReload={() => window.location.reload()}
        />
      ) : null}
    </main>
  );
}
