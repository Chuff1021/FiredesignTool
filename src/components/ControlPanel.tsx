"use client";

import {
  FIREPLACE_ELEVATION_RANGE,
  MANTEL_CLEARANCE_RANGE,
  WALL_HEIGHT_RANGE,
  WALL_WIDTH_RANGE,
} from "@/domain/configuration";
import { fireplaceProduct, mantelProduct, stoneProduct } from "@/domain/catalog";
import { useConfigurationStore } from "@/store/configurationStore";
import { RangeControl } from "@/components/RangeControl";
import { UiIcon } from "@/components/UiIcon";

type ControlPanelProps = {
  onEnterPresentation: () => void;
  onOpenDiagnostics: () => void;
  presentationReady: boolean;
};

export function ControlPanel({
  onEnterPresentation,
  onOpenDiagnostics,
  presentationReady,
}: ControlPanelProps) {
  const wallWidth = useConfigurationStore((state) => state.wallWidth);
  const wallHeight = useConfigurationStore((state) => state.wallHeight);
  const fireplaceElevation = useConfigurationStore((state) => state.fireplaceElevation);
  const mantelClearance = useConfigurationStore((state) => state.mantelClearance);
  const cameraMode = useConfigurationStore((state) => state.cameraMode);
  const showDimensions = useConfigurationStore((state) => state.showDimensions);
  const setWallWidth = useConfigurationStore((state) => state.setWallWidth);
  const setWallHeight = useConfigurationStore((state) => state.setWallHeight);
  const setFireplaceElevation = useConfigurationStore((state) => state.setFireplaceElevation);
  const setMantelClearance = useConfigurationStore((state) => state.setMantelClearance);
  const setCameraMode = useConfigurationStore((state) => state.setCameraMode);
  const setShowDimensions = useConfigurationStore((state) => state.setShowDimensions);
  const reset = useConfigurationStore((state) => state.reset);

  return (
    <aside className="control-panel">
      <header className="brand-header">
        <div className="brand-mark" aria-hidden="true">
          <span />
        </div>
        <div>
          <p className="eyebrow">Showroom edition</p>
          <h1>FireDesign</h1>
        </div>
      </header>

      <section className="product-summary">
        <div className="product-summary__visual">
          <div className="product-summary__glow" />
          <span>864</span>
        </div>
        <div className="product-summary__copy">
          <p className="eyebrow">{fireplaceProduct.manufacturer}</p>
          <h2>{fireplaceProduct.model}</h2>
          <p>SKU {fireplaceProduct.sku}</p>
        </div>
        <div className="verified-pill">
          <UiIcon name="check" size={14} />
          Official product
        </div>
      </section>

      <div className="control-panel__scroll">
        <section className="control-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Architecture</p>
              <h3>Feature wall</h3>
            </div>
            <button
              className="icon-button"
              onClick={() => setShowDimensions(!showDimensions)}
              title={showDimensions ? "Hide dimensions" : "Show dimensions"}
              type="button"
            >
              <UiIcon name="dimensions" />
              <span className="sr-only">
                {showDimensions ? "Hide dimensions" : "Show dimensions"}
              </span>
            </button>
          </div>

          <RangeControl
            description="Total design width"
            label="Wall width"
            max={WALL_WIDTH_RANGE.max}
            min={WALL_WIDTH_RANGE.min}
            onChange={setWallWidth}
            step={WALL_WIDTH_RANGE.step}
            value={wallWidth}
          />
          <RangeControl
            description="Floor to ceiling"
            label="Wall height"
            max={WALL_HEIGHT_RANGE.max}
            min={WALL_HEIGHT_RANGE.min}
            onChange={setWallHeight}
            step={WALL_HEIGHT_RANGE.step}
            value={wallHeight}
          />
          <RangeControl
            description="Fireplace base above floor"
            label="Fireplace elevation"
            max={FIREPLACE_ELEVATION_RANGE.max}
            min={FIREPLACE_ELEVATION_RANGE.min}
            onChange={setFireplaceElevation}
            step={FIREPLACE_ELEVATION_RANGE.step}
            value={fireplaceElevation}
          />
          <RangeControl
            description="Minimum 8″ above appliance face"
            label="Mantel clearance"
            max={MANTEL_CLEARANCE_RANGE.max}
            min={MANTEL_CLEARANCE_RANGE.min}
            onChange={setMantelClearance}
            step={MANTEL_CLEARANCE_RANGE.step}
            value={mantelClearance}
          />
        </section>

        <section className="control-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">View</p>
              <h3>Presentation angle</h3>
            </div>
          </div>
          <div className="segmented-control" role="group" aria-label="Presentation angle">
            <button
              aria-pressed={cameraMode === "front"}
              onClick={() => setCameraMode("front")}
              type="button"
            >
              <UiIcon name="front" />
              Front elevation
            </button>
            <button
              aria-pressed={cameraMode === "perspective"}
              onClick={() => setCameraMode("perspective")}
              type="button"
            >
              <UiIcon name="perspective" />
              Perspective
            </button>
          </div>
        </section>

        <section className="control-section material-section">
          <p className="eyebrow">Specified materials</p>
          <div className="material-row">
            <span
              className="material-swatch material-swatch--stone"
              role="img"
              aria-label="Kentucky Ledge stone swatch"
            />
            <div>
              <strong>{stoneProduct.name}</strong>
              <span>
                {stoneProduct.manufacturer} · {stoneProduct.patternCode}-
                {stoneProduct.colorCode}
              </span>
            </div>
          </div>
          <div className="material-row">
            <span
              className="material-swatch material-swatch--mantel"
              role="img"
              aria-label="Pearl mantel finish swatch"
            />
            <div>
              <strong>Pearl finish · 60″</strong>
              <span>
                {mantelProduct.manufacturer} · {mantelProduct.model}
              </span>
            </div>
          </div>
        </section>

        <div className="control-panel__utility">
          <button className="text-button" onClick={reset} type="button">
            <UiIcon name="reset" />
            Reset design
          </button>
          <button className="text-button" onClick={onOpenDiagnostics} type="button">
            <UiIcon name="diagnostics" />
            System diagnostics
          </button>
        </div>
      </div>

      <footer className="control-panel__footer">
        <button
          className="presentation-button"
          disabled={!presentationReady}
          onClick={onEnterPresentation}
          type="button"
        >
          <span>
            {presentationReady ? "Present design" : "Preparing display"}
            <small>
              {presentationReady ? "Clean fullscreen view" : "Uploading approved materials"}
            </small>
          </span>
          <UiIcon name="expand" />
        </button>
      </footer>
    </aside>
  );
}
