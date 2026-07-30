"use client";

import dynamic from "next/dynamic";
import { UiIcon } from "@/components/UiIcon";

const FeatureWallCanvas = dynamic(
  () => import("@/components/FeatureWallCanvas").then((module) => module.FeatureWallCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="scene-loading" aria-live="polite">
        <span className="scene-loading__mark" />
        <span>Preparing dimensional scene</span>
      </div>
    ),
  },
);

type SceneViewportProps = {
  isPresentation: boolean;
  onExitPresentation: () => void;
  onFps: (fps: number) => void;
  onRendererStatus: (status: "ready" | "recovering" | "error") => void;
};

export function SceneViewport({
  isPresentation,
  onExitPresentation,
  onFps,
  onRendererStatus,
}: SceneViewportProps) {
  return (
    <section
      aria-label="Fireplace design visualization"
      className="scene-viewport"
      data-presentation={isPresentation}
    >
      <FeatureWallCanvas onFps={onFps} onRendererStatus={onRendererStatus} />
      <div className="scene-topbar">
        <div className="scene-status">
          <span aria-hidden="true" />
          Dimensionally calibrated
        </div>
        <div className="scene-scale">1 unit = 1 inch</div>
      </div>
      <div className="scene-caption">
        <span>Current composition</span>
        <strong>864 TRV · Kentucky Ledge · Pearl Linear 60″</strong>
      </div>
      {isPresentation ? (
        <button className="exit-presentation" onClick={onExitPresentation} type="button">
          <UiIcon name="collapse" />
          Exit presentation
        </button>
      ) : null}
    </section>
  );
}
