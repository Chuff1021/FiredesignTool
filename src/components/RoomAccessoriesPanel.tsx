"use client";

import {
  builtInAvailableWidth,
  builtInFits,
  type BuiltInSide,
  type RoomAccessories,
} from "@/domain/roomProject";

type Props = {
  accessories: RoomAccessories;
  stoneWidth: number;
  wallWidth: number;
  onChange: (accessories: RoomAccessories) => void;
};

const finishLabels: Record<BuiltInSide["finish"], string> = {
  "warm-white": "Warm white",
  "white-oak": "White oak",
  walnut: "Walnut",
  charcoal: "Charcoal",
};

function NumberControl({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <div>
        <input
          aria-label={label}
          max={max}
          min={min}
          onChange={(event) => onChange(Number(event.target.value) || min)}
          step={step}
          type="number"
          value={value}
        />
        <small>in</small>
      </div>
    </label>
  );
}

function SideControls({
  label,
  side,
  availableWidth,
  fits,
  onChange,
}: {
  label: string;
  side: BuiltInSide;
  availableWidth: number;
  fits: boolean;
  onChange: (side: BuiltInSide) => void;
}) {
  const update = <Key extends keyof BuiltInSide>(key: Key, value: BuiltInSide[Key]) =>
    onChange({ ...side, [key]: value });
  return (
    <fieldset className="room-accessory-side" data-enabled={side.enabled}>
      <legend>
        <label>
          <input
            checked={side.enabled}
            onChange={(event) => update("enabled", event.target.checked)}
            type="checkbox"
          />
          {label} side
        </label>
        <small>{availableWidth.toFixed(0)} in available</small>
      </legend>
      <div className="room-accessory-fields">
        <label>
          <span>Layout</span>
          <select
            aria-label={`${label} accessory layout`}
            disabled={!side.enabled}
            onChange={(event) => update("style", event.target.value as BuiltInSide["style"])}
            value={side.style}
          >
            <option value="bookcase">Built-in bookcase</option>
            <option value="floating-shelves">Floating shelves</option>
          </select>
        </label>
        <label>
          <span>Finish</span>
          <select
            aria-label={`${label} accessory finish`}
            disabled={!side.enabled}
            onChange={(event) => update("finish", event.target.value as BuiltInSide["finish"])}
            value={side.finish}
          >
            {Object.entries(finishLabels).map(([value, finishLabel]) => (
              <option key={value} value={value}>
                {finishLabel}
              </option>
            ))}
          </select>
        </label>
        <NumberControl
          label={`${label} width`}
          max={Math.max(18, Math.min(72, Math.floor(availableWidth)))}
          min={18}
          onChange={(value) => update("width", value)}
          value={side.width}
        />
        <NumberControl
          label={`${label} height`}
          max={120}
          min={48}
          onChange={(value) => update("height", value)}
          value={side.height}
        />
        <NumberControl
          label={`${label} gap from stone`}
          max={36}
          min={0}
          onChange={(value) => update("gap", value)}
          value={side.gap}
        />
        <label>
          <span>Shelf count</span>
          <div>
            <input
              aria-label={`${label} shelf count`}
              disabled={!side.enabled}
              max="8"
              min="2"
              onChange={(event) => update("shelfCount", Number(event.target.value) || 2)}
              type="number"
              value={side.shelfCount}
            />
          </div>
        </label>
        <label className="room-accessory-toggle">
          <input
            checked={side.baseCabinet}
            disabled={!side.enabled || side.style !== "bookcase"}
            onChange={(event) => update("baseCabinet", event.target.checked)}
            type="checkbox"
          />
          Base cabinets
        </label>
      </div>
      {side.enabled && !fits ? (
        <p role="alert">
          This side needs {side.width + side.gap} in between the stone and wall edge. Reduce its
          width or gap, narrow the stone, or widen the wall.
        </p>
      ) : null}
    </fieldset>
  );
}

export function RoomAccessoriesPanel({ accessories, stoneWidth, wallWidth, onChange }: Props) {
  const leftAvailable = builtInAvailableWidth(wallWidth, stoneWidth, accessories.left);
  const rightAvailable = builtInAvailableWidth(wallWidth, stoneWidth, accessories.right);
  return (
    <details className="room-accessories">
      <summary>
        <span>Built-ins & shelves</span>
        <small>
          {accessories.left.enabled || accessories.right.enabled
            ? `${accessories.left.enabled ? "Left" : ""}${accessories.left.enabled && accessories.right.enabled ? " + " : ""}${accessories.right.enabled ? "Right" : ""}`
            : "Optional"}
        </small>
      </summary>
      <div className="room-accessories__body">
        <div className="room-accessories__intro">
          <strong>Architectural concept millwork</strong>
          <span>
            Add each side independently. Dimensions are scaled to the marked wall; finishes are
            representative and should be confirmed with the cabinet supplier.
          </span>
        </div>
        <div className="room-accessories__sides">
          <SideControls
            availableWidth={leftAvailable}
            fits={builtInFits(wallWidth, stoneWidth, accessories.left)}
            label="Left"
            onChange={(left) => onChange({ ...accessories, left })}
            side={accessories.left}
          />
          <SideControls
            availableWidth={rightAvailable}
            fits={builtInFits(wallWidth, stoneWidth, accessories.right)}
            label="Right"
            onChange={(right) => onChange({ ...accessories, right })}
            side={accessories.right}
          />
        </div>
        <button
          className="room-accessories__mirror"
          onClick={() => onChange({ left: accessories.left, right: { ...accessories.left } })}
          type="button"
        >
          Match right side to left
        </button>
      </div>
    </details>
  );
}
