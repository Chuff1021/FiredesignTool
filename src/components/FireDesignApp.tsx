"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { ControlPanel } from "@/components/ControlPanel";
import { DiagnosticsPanel, type DiagnosticsData } from "@/components/DiagnosticsPanel";
import { SceneErrorBoundary } from "@/components/SceneErrorBoundary";
import { SceneViewport } from "@/components/SceneViewport";
import { StartupGate } from "@/components/StartupGate";
import { APPROVED_ASSET_PATHS } from "@/domain/catalogRepository";
import {
  runReadinessChecks,
  type GraphicsSupport,
  type ReadinessResult,
} from "@/lib/readiness";
import { useConfigurationStore } from "@/store/configurationStore";
import type { FireboxMediaStatus } from "@/components/FireboxMedia";

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

export function FireDesignApp() {
  const initialize = useConfigurationStore((state) => state.initialize);
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [startupError, setStartupError] = useState<string | null>(null);
  const [progress, setProgress] = useState({
    complete: 0,
    total: APPROVED_ASSET_PATHS.length,
  });
  const [isPresentation, setPresentation] = useState(false);
  const [diagnosticsOpen, setDiagnosticsOpen] = useState(false);
  const [cacheReady, setCacheReady] = useState(false);
  const [online, setOnline] = useState(true);
  const [fps, setFps] = useState(0);
  const [mediaStatus, setMediaStatus] = useState<FireboxMediaStatus>("preparing");
  const [rendererStatus, setRendererStatus] =
    useState<DiagnosticsData["rendererStatus"]>("recovering");
  const [workspace, setWorkspace] = useState<"feature-wall" | "customer-room">("feature-wall");

  const checkReadiness = useCallback(async () => {
    setStartupError(null);
    setReadiness(null);
    setProgress({ complete: 0, total: APPROVED_ASSET_PATHS.length });
    try {
      const result = await runReadinessChecks((complete, total) =>
        setProgress({ complete, total }),
      );
      initialize();
      setReadiness(result);
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
        .then(async (registration) => {
          const readyRegistration = await navigator.serviceWorker.ready;
          await registration.update().catch(() => undefined);
          const worker =
            navigator.serviceWorker.controller ??
            readyRegistration.active ??
            registration.active;
          if (!worker) return;
          const resources = performance
            .getEntriesByType("resource")
            .map((entry) => entry.name)
            .filter((url) => url.startsWith(window.location.origin));
          const channel = new MessageChannel();
          channel.port1.onmessage = (event: MessageEvent) =>
            setCacheReady(event.data?.type === "CACHE_READY");
          worker.postMessage({ type: "CACHE_RELEASE", urls: resources }, [channel.port2]);
        })
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

  const enterPresentation = async () => {
    if (rendererStatus !== "ready") return;
    setPresentation(true);
    await document.documentElement.requestFullscreen?.().catch(() => undefined);
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

  const diagnostics: DiagnosticsData = {
    cacheReady,
    fps,
    graphics: readiness.graphics ?? UNKNOWN_GRAPHICS,
    online,
    rendererStatus,
    mediaStatus,
    verifiedAssets: readiness.verifiedAssets,
  };

  return (
    <main className="app-shell" data-presentation={isPresentation}>
      {!isPresentation ? (
        <ControlPanel
          onEnterPresentation={() => void enterPresentation()}
          onOpenDiagnostics={() => setDiagnosticsOpen(true)}
          onWorkspaceChange={setWorkspace}
          presentationReady={workspace === "feature-wall" && rendererStatus === "ready"}
          workspace={workspace}
        />
      ) : null}
      {workspace === "customer-room" && !isPresentation ? (
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
          onReload={() => window.location.reload()}
        />
      ) : null}
    </main>
  );
}
