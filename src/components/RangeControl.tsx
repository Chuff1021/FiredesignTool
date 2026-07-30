import type { CSSProperties } from "react";
import { inchesLabel } from "@/domain/configuration";

type RangeControlProps = {
  description: string;
  label: string;
  max: number;
  min: number;
  onChange: (value: number) => void;
  step: number;
  value: number;
};

export function RangeControl({
  description,
  label,
  max,
  min,
  onChange,
  step,
  value,
}: RangeControlProps) {
  const id = `control-${label.toLowerCase().replaceAll(" ", "-")}`;
  const progress = ((value - min) / (max - min)) * 100;

  return (
    <div className="range-control">
      <div className="range-control__header">
        <div>
          <label htmlFor={id}>{label}</label>
          <p>{description}</p>
        </div>
        <output htmlFor={id}>{inchesLabel(value)}</output>
      </div>
      <input
        aria-describedby={`${id}-description`}
        id={id}
        max={max}
        min={min}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        step={step}
        style={{ "--range-progress": `${progress}%` } as CSSProperties}
        type="range"
        value={value}
      />
      <span className="sr-only" id={`${id}-description`}>
        {description}
      </span>
      <div aria-hidden="true" className="range-control__bounds">
        <span>{inchesLabel(min)}</span>
        <span>{inchesLabel(max)}</span>
      </div>
    </div>
  );
}
