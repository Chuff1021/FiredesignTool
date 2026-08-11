"use client";

import {
  type FaceOptionId,
  type FirebackOptionId,
  type FireplaceId,
  type MantelFinishId,
  type MantelProductId,
  type MantelWidth,
  type StoneId,
} from "@/domain/catalog";
import { catalogRepository } from "@/domain/catalogRepository";
import {
  FIREPLACE_ELEVATION_RANGE,
  MANTEL_HEIGHT_RANGE,
  STONE_WIDTH_RANGE,
  WALL_HEIGHT_RANGE,
  WALL_WIDTH_RANGE,
  getHearthStoneSegments,
  getMinimumMantelHeight,
  getMinimumNonCombustibleMantelHeight,
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
  workspace: "feature-wall" | "customer-room";
  onWorkspaceChange: (workspace: "feature-wall" | "customer-room") => void;
};

export function ControlPanel({
  onEnterPresentation,
  onOpenDiagnostics,
  presentationReady,
  workspace,
  onWorkspaceChange,
}: ControlPanelProps) {
  const fireplaceProducts = catalogRepository.listFireplaces();
  const mantelProducts = catalogRepository.listMantels();
  const mantelFinishes = catalogRepository.listMantelFinishes();
  const stoneProducts = catalogRepository.listStones();
  const wallWidth = useConfigurationStore((state) => state.wallWidth);
  const wallHeight = useConfigurationStore((state) => state.wallHeight);
  const stoneWidth = useConfigurationStore((state) => state.stoneWidth);
  const fireplaceElevation = useConfigurationStore((state) => state.fireplaceElevation);
  const mantelHeightAboveBase = useConfigurationStore((state) => state.mantelHeightAboveBase);
  const fireplaceId = useConfigurationStore((state) => state.fireplaceId);
  const faceOptionId = useConfigurationStore((state) => state.faceOptionId);
  const firebackOptionId = useConfigurationStore((state) => state.firebackOptionId);
  const stoneId = useConfigurationStore((state) => state.stoneId);
  const mantelProductId = useConfigurationStore((state) => state.mantelProductId);
  const mantelWidth = useConfigurationStore((state) => state.mantelWidth);
  const mantelFinishId = useConfigurationStore((state) => state.mantelFinishId);
  const hearthEnabled = useConfigurationStore((state) => state.hearthEnabled);
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
  const setFirebackOptionId = useConfigurationStore((state) => state.setFirebackOptionId);
  const setStoneId = useConfigurationStore((state) => state.setStoneId);
  const setMantelProductId = useConfigurationStore((state) => state.setMantelProductId);
  const setMantelWidth = useConfigurationStore((state) => state.setMantelWidth);
  const setMantelFinishId = useConfigurationStore((state) => state.setMantelFinishId);
  const setHearthEnabled = useConfigurationStore((state) => state.setHearthEnabled);
  const setCameraMode = useConfigurationStore((state) => state.setCameraMode);
  const setShowDimensions = useConfigurationStore((state) => state.setShowDimensions);
  const reset = useConfigurationStore((state) => state.reset);

  const fireplace = catalogRepository.getFireplace(fireplaceId);
  const face = catalogRepository.getFace(fireplaceId, faceOptionId);
  const fireback = catalogRepository.getFireback(fireplaceId, firebackOptionId);
  const liveFireback =
    fireplace.burnMedia?.compatibleFirebackIds.includes(fireback.id) ?? false;
  const stone = catalogRepository.getStone(stoneId);
  const mantelProduct = catalogRepository.getMantel(mantelProductId);
  const mantelSize = catalogRepository.getMantelSize(mantelProductId, mantelWidth);
  const mantelFinish = catalogRepository.getMantelFinish(mantelProductId, mantelFinishId);
  const compatibleMantelFinishes = mantelFinishes.filter((finish) =>
    finish.compatibleProductIds.includes(mantelProductId),
  );
  const hearthstone = stone.hearthstone;
  const minimumMantelHeight = getMinimumMantelHeight(fireplaceId, mantelSize.depth);
  const minimumNonCombustibleMantelHeight = getMinimumNonCombustibleMantelHeight(fireplaceId);
  const minimumStoneWidth = getMinimumStoneWidth(fireplaceId);
  const hearthWidth = stoneWidth;
  const hearthSegments = getHearthStoneSegments(stoneWidth);

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

      <nav className="workspace-switcher" aria-label="Design workspace">
        <button
          aria-current={workspace === "feature-wall" ? "page" : undefined}
          onClick={() => onWorkspaceChange("feature-wall")}
          type="button"
        >
          <UiIcon name="front" />
          <span>
            Feature wall<small>Dimensional elevation</small>
          </span>
        </button>
        <button
          aria-current={workspace === "customer-room" ? "page" : undefined}
          onClick={() => onWorkspaceChange("customer-room")}
          type="button"
        >
          <UiIcon name="image" />
          <span>
            Customer room<small>Place in a photograph</small>
          </span>
        </button>
      </nav>

      <section className="product-summary">
        <div className="product-summary__visual">
          <div className="product-summary__glow" />
          <span>{fireplace.model.split(" ")[0]}</span>
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
                ? "This model has one approved face or trim configuration."
                : `${face.shape === "arched" ? "Arched" : "Square"} profile · SKU ${face.sku}`}
            </small>
          </label>
          <label className="select-control">
            <span>Fireback</span>
            <select
              aria-label="Fireback"
              disabled={fireplace.firebackOptions.length === 1}
              onChange={(event) => setFirebackOptionId(event.target.value as FirebackOptionId)}
              value={firebackOptionId}
            >
              {fireplace.firebackOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <small>
              {fireplace.firebackOptions.length === 1
                ? "No alternate firebacks are offered for this exact unit."
                : `${liveFireback ? "Official live burn footage" : "Official static configuration"} · SKU ${fireback.sku}`}
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
            max={fireplace.hearthRule?.maximumRaisedHeight ?? FIREPLACE_ELEVATION_RANGE.max}
            min={
              hearthEnabled && !fireplace.hearthRule?.required
                ? 1.5
                : FIREPLACE_ELEVATION_RANGE.min
            }
            onChange={setFireplaceElevation}
            step={FIREPLACE_ELEVATION_RANGE.step}
            value={fireplaceElevation}
          />
          <RangeControl
            description={
              minimumNonCombustibleMantelHeight > 0
                ? "From fireplace base · manufacturer minimum enforced"
                : "From fireplace base · free placement for non-combustible shelves"
            }
            label="Mantel height"
            max={MANTEL_HEIGHT_RANGE.max}
            min={Math.max(MANTEL_HEIGHT_RANGE.min, minimumNonCombustibleMantelHeight)}
            onChange={setMantelHeightAboveBase}
            step={MANTEL_HEIGHT_RANGE.step}
            value={mantelHeightAboveBase}
          />
          <div className="rule-note">
            <UiIcon name="warning" size={15} />
            <span>
              {minimumNonCombustibleMantelHeight > 0
                ? `Manual requirement: non-combustible mantel at ${inchesLabel(minimumNonCombustibleMantelHeight)} or higher from the fireplace base.`
                : "Showroom override: no minimum is enforced for this ASTM E136 non-combustible shelf."}
              <small>
                {minimumNonCombustibleMantelHeight > 0
                  ? `Maximum non-combustible depth ${inchesLabel(fireplace.mantelRule.maximumNonCombustibleDepth ?? mantelSize.depth)} · manual p.${fireplace.mantelRule.manualPage}`
                  : `Confirm local code and manufacturer instructions before installation · published combustible reference ${inchesLabel(minimumMantelHeight)} from fireplace base · manual p.${fireplace.mantelRule.manualPage}`}
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

          <label className="select-control">
            <span>Pearl mantel style</span>
            <select
              aria-label="Mantel style"
              onChange={(event) => setMantelProductId(event.target.value as MantelProductId)}
              value={mantelProductId}
            >
              {mantelProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.shortLabel}
                </option>
              ))}
            </select>
            <small>
              {mantelProduct.classification} · {inchesLabel(mantelSize.height)} high ×{" "}
              {inchesLabel(mantelSize.depth)} deep
            </small>
          </label>

          <div className="field-label">Mantel length</div>
          <div
            className="segmented-control segmented-control--compact"
            role="group"
            aria-label="Mantel length"
          >
            {mantelProduct.sizes.map((size) => (
              <button
                aria-pressed={mantelWidth === size.width}
                key={size.width}
                onClick={() => setMantelWidth(size.width as MantelWidth)}
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
              {compatibleMantelFinishes.map((finish) => (
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
                  Pearl · {mantelProduct.shortLabel} · {mantelSize.modelCode}
                </small>
              </p>
            </div>
          </div>
        </section>

        <section className="control-section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Raised installation</p>
              <h3>Hearth</h3>
            </div>
            <label className="toggle-control">
              <input
                aria-label="Add raised hearth"
                checked={hearthEnabled}
                disabled={fireplace.hearthRule?.required}
                onChange={(event) => setHearthEnabled(event.target.checked)}
                type="checkbox"
              />
              <span aria-hidden="true" />
            </label>
          </div>
          <p className="section-description">
            {fireplace.hearthRule
              ? `Required wood-fireplace hearth · minimum ${inchesLabel(fireplace.hearthRule.minimumWidth)} wide × ${inchesLabel(fireplace.hearthRule.floorExtension)} forward · R-${fireplace.hearthRule.minimumRValue} minimum. Current Centurion layout is locked on.`
              : hearthEnabled
                ? `Centurion #860 hearthstones match the ${inchesLabel(stoneWidth)} stone field and align to the ${inchesLabel(fireplaceElevation)} fireplace base.`
                : "Add a stone riser and matching Centurion hearthstones for a raised fireplace."}
          </p>
          {hearthEnabled ? (
            <div className="hearth-spec">
              <span
                className="material-swatch"
                style={{
                  backgroundImage: `url(${hearthstone.assets[0]!.localPath})`,
                }}
              />
              <p>
                <strong>
                  {hearthstone.colorName} Hearthstone · {inchesLabel(hearthWidth)}
                </strong>
                <small>
                  {hearthSegments.length} pieces · centered end cuts as needed ·{" "}
                  {inchesLabel(
                    fireplace.hearthRule?.floorExtension ?? hearthstone.dimensions.depth,
                  )}{" "}
                  deep × {inchesLabel(hearthstone.dimensions.thickness)} thick
                </small>
              </p>
            </div>
          ) : null}
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
        {workspace === "customer-room" ? (
          <div className="room-mode-note">
            <UiIcon name="check" />
            <span>
              Room design active
              <small>Calibrate and present from the photo workspace</small>
            </span>
          </div>
        ) : (
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
        )}
      </footer>
    </aside>
  );
}
