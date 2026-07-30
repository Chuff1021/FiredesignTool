"use client";

import {
  fireplaceProducts,
  getFaceOption,
  getFireplaceProduct,
  getMantelFinish,
  getMantelSize,
  getStoneProduct,
  mantelFinishes,
  mantelSizes,
  stoneProducts,
  type FaceOptionId,
  type FireplaceId,
  type MantelFinishId,
  type StoneId,
} from "@/domain/catalog";
import {
  FIREPLACE_ELEVATION_RANGE,
  MANTEL_HEIGHT_RANGE,
  STONE_WIDTH_RANGE,
  WALL_HEIGHT_RANGE,
  WALL_WIDTH_RANGE,
  getMinimumMantelHeight,
  getMinimumStoneWidth,
  inchesLabel,
} from "@/domain/configuration";
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
  const stoneWidth = useConfigurationStore((state) => state.stoneWidth);
  const fireplaceElevation = useConfigurationStore((state) => state.fireplaceElevation);
  const mantelHeightAboveBase = useConfigurationStore((state) => state.mantelHeightAboveBase);
  const fireplaceId = useConfigurationStore((state) => state.fireplaceId);
  const faceOptionId = useConfigurationStore((state) => state.faceOptionId);
  const stoneId = useConfigurationStore((state) => state.stoneId);
  const mantelWidth = useConfigurationStore((state) => state.mantelWidth);
  const mantelFinishId = useConfigurationStore((state) => state.mantelFinishId);
  const cameraMode = useConfigurationStore((state) => state.cameraMode);
  const showDimensions = useConfigurationStore((state) => state.showDimensions);
  const setWallWidth = useConfigurationStore((state) => state.setWallWidth);
  const setWallHeight = useConfigurationStore((state) => state.setWallHeight);
  const setStoneWidth = useConfigurationStore((state) => state.setStoneWidth);
  const setFireplaceElevation = useConfigurationStore((state) => state.setFireplaceElevation);
  const setMantelHeightAboveBase = useConfigurationStore(
    (state) => state.setMantelHeightAboveBase,
  );
  const setFireplaceId = useConfigurationStore((state) => state.setFireplaceId);
  const setFaceOptionId = useConfigurationStore((state) => state.setFaceOptionId);
  const setStoneId = useConfigurationStore((state) => state.setStoneId);
  const setMantelWidth = useConfigurationStore((state) => state.setMantelWidth);
  const setMantelFinishId = useConfigurationStore((state) => state.setMantelFinishId);
  const setCameraMode = useConfigurationStore((state) => state.setCameraMode);
  const setShowDimensions = useConfigurationStore((state) => state.setShowDimensions);
  const reset = useConfigurationStore((state) => state.reset);

  const fireplace = getFireplaceProduct(fireplaceId);
  const face = getFaceOption(fireplaceId, faceOptionId);
  const stone = getStoneProduct(stoneId);
  const mantelSize = getMantelSize(mantelWidth);
  const mantelFinish = getMantelFinish(mantelFinishId);
  const minimumMantelHeight = getMinimumMantelHeight(fireplaceId, mantelSize.depth);
  const minimumStoneWidth = getMinimumStoneWidth(fireplaceId, faceOptionId, mantelWidth);

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
          <span>{fireplace.shortLabel.startsWith("4237") ? "4237" : "864"}</span>
        </div>
        <div className="product-summary__copy">
          <p className="eyebrow">{fireplace.manufacturer}</p>
          <h2>{fireplace.model}</h2>
          <p>SKU {fireplace.sku}</p>
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
              <p className="eyebrow">Fireplace</p>
              <h3>Model & face</h3>
            </div>
          </div>
          <label className="select-control">
            <span>Fireplace model</span>
            <select
              aria-label="Fireplace model"
              onChange={(event) => setFireplaceId(event.target.value as FireplaceId)}
              value={fireplaceId}
            >
              {fireplaceProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.shortLabel}
                </option>
              ))}
            </select>
          </label>
          <label className="select-control">
            <span>Face or trim</span>
            <select
              aria-label="Face or trim"
              disabled={fireplace.faceOptions.length === 1}
              onChange={(event) => setFaceOptionId(event.target.value as FaceOptionId)}
              value={faceOptionId}
            >
              {fireplace.faceOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <small>
              {fireplace.faceOptions.length === 1
                ? "This model uses its clean-face configuration."
                : `${face.shape === "arched" ? "Arched" : "Square"} profile · SKU ${face.sku}`}
            </small>
          </label>
        </section>

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
            description="Total finished wall width"
            label="Wall width"
            max={WALL_WIDTH_RANGE.max}
            min={WALL_WIDTH_RANGE.min}
            onChange={setWallWidth}
            step={WALL_WIDTH_RANGE.step}
            value={wallWidth}
          />
          <RangeControl
            description="Centered stone field; drywall remains visible outside it"
            label="Stone width"
            max={Math.min(STONE_WIDTH_RANGE.max, wallWidth)}
            min={minimumStoneWidth}
            onChange={setStoneWidth}
            step={STONE_WIDTH_RANGE.step}
            value={stoneWidth}
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
            description="Fireplace base above finished floor"
            label="Fireplace elevation"
            max={FIREPLACE_ELEVATION_RANGE.max}
            min={FIREPLACE_ELEVATION_RANGE.min}
            onChange={setFireplaceElevation}
            step={FIREPLACE_ELEVATION_RANGE.step}
            value={fireplaceElevation}
          />
          <RangeControl
            description={`From fireplace base · minimum ${inchesLabel(minimumMantelHeight)} · manual p.${fireplace.mantelRule.manualPage}`}
            label="Mantel height"
            max={MANTEL_HEIGHT_RANGE.max}
            min={minimumMantelHeight}
            onChange={setMantelHeightAboveBase}
            step={MANTEL_HEIGHT_RANGE.step}
            value={mantelHeightAboveBase}
          />
          <div className="rule-note">
            <UiIcon name="check" size={15} />
            <span>
              {fireplace.mantelRule.note}
              <small>
                Travis install manual · rev. {fireplace.mantelRule.manualRevision} · p.
                {fireplace.mantelRule.manualPage} · measured from fireplace base
              </small>
            </span>
          </div>
        </section>

        <section className="control-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Materials</p>
              <h3>Stone & mantel</h3>
            </div>
          </div>
          <label className="select-control">
            <span>Centurion stone</span>
            <select
              aria-label="Centurion stone"
              onChange={(event) => setStoneId(event.target.value as StoneId)}
              value={stoneId}
            >
              {stoneProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} · {product.productCode}
                </option>
              ))}
            </select>
          </label>

          <div className="field-label">Pearl Linear shelf length</div>
          <div
            className="segmented-control segmented-control--compact"
            role="group"
            aria-label="Mantel length"
          >
            {mantelSizes.map((size) => (
              <button
                aria-pressed={mantelWidth === size.width}
                key={size.width}
                onClick={() => setMantelWidth(size.width)}
                type="button"
              >
                {size.width}″
              </button>
            ))}
          </div>

          <label className="select-control">
            <span>Mantel finish</span>
            <select
              aria-label="Mantel finish"
              onChange={(event) => setMantelFinishId(event.target.value as MantelFinishId)}
              value={mantelFinishId}
            >
              {mantelFinishes.map((finish) => (
                <option key={finish.id} value={finish.id}>
                  {finish.name}
                </option>
              ))}
            </select>
          </label>

          <div className="material-selection-summary">
            <div>
              <span
                className="material-swatch"
                style={{
                  backgroundImage: `url(${stone.assets[0]!.localPath})`,
                }}
              />
              <p>
                <strong>{stone.name}</strong>
                <small>Centurion · {stone.productCode}</small>
              </p>
            </div>
            <div>
              <span
                className="material-swatch"
                style={{
                  backgroundColor: mantelFinish.colorHex,
                  backgroundImage: `url(${mantelFinish.assets[0]!.localPath})`,
                }}
              />
              <p>
                <strong>
                  {mantelFinish.name} · {mantelWidth}″
                </strong>
                <small>
                  Pearl · NCL-{mantelWidth}
                  {mantelFinish.name}
                </small>
              </p>
            </div>
          </div>
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
              {presentationReady ? "Clean fullscreen view" : "Loading approved materials"}
            </small>
          </span>
          <UiIcon name="expand" />
        </button>
      </footer>
    </aside>
  );
}
