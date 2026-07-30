"use client";

import dynamic from "next/dynamic";
import { UiIcon } from "@/components/UiIcon";
import {
  getFaceOption,
  getFireplaceProduct,
  getMantelFinish,
  getStoneProduct,
} from "@/domain/catalog";
import { useConfigurationStore } from "@/store/configurationStore";

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
  const fireplaceId = useConfigurationStore((state) => state.fireplaceId);
  const faceOptionId = useConfigurationStore((state) => state.faceOptionId);
  const stoneId = useConfigurationStore((state) => state.stoneId);
  const mantelWidth = useConfigurationStore((state) => state.mantelWidth);
  const mantelFinishId = useConfigurationStore((state) => state.mantelFinishId);
  const fireplace = getFireplaceProduct(fireplaceId);
  const face = getFaceOption(fireplaceId, faceOptionId);
  const stone = getStoneProduct(stoneId);
  const mantelFinish = getMantelFinish(mantelFinishId);

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
        <strong>
          {fireplace.shortLabel} · {face.name} · {stone.name} · {mantelFinish.name} Linear{" "}
          {mantelWidth}″
        </strong>
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
