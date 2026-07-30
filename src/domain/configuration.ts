import { z } from "zod";
import { fireplaceProduct, mantelProduct } from "@/domain/catalog";

export const WALL_WIDTH_RANGE = { min: 120, max: 192, step: 1 } as const;
export const WALL_HEIGHT_RANGE = { min: 96, max: 132, step: 1 } as const;
export const FIREPLACE_ELEVATION_RANGE = { min: 0, max: 24, step: 0.5 } as const;
export const MANTEL_CLEARANCE_RANGE = {
  min: mantelProduct.minimumClearance,
  max: 24,
  step: 0.5,
} as const;

export const cameraModeSchema = z.enum(["front", "perspective"]);

export const featureWallConfigurationSchema = z.object({
  schemaVersion: z.literal(1),
  wallWidth: z.number().min(WALL_WIDTH_RANGE.min).max(WALL_WIDTH_RANGE.max).finite(),
  wallHeight: z.number().min(WALL_HEIGHT_RANGE.min).max(WALL_HEIGHT_RANGE.max).finite(),
  fireplaceElevation: z
    .number()
    .min(FIREPLACE_ELEVATION_RANGE.min)
    .max(FIREPLACE_ELEVATION_RANGE.max)
    .finite(),
  mantelClearance: z
    .number()
    .min(MANTEL_CLEARANCE_RANGE.min)
    .max(MANTEL_CLEARANCE_RANGE.max)
    .finite(),
  cameraMode: cameraModeSchema,
  showDimensions: z.boolean(),
});

export type FeatureWallConfiguration = z.infer<typeof featureWallConfigurationSchema>;
export type CameraMode = z.infer<typeof cameraModeSchema>;

export const DEFAULT_CONFIGURATION: FeatureWallConfiguration = Object.freeze({
  schemaVersion: 1,
  wallWidth: 144,
  wallHeight: 108,
  fireplaceElevation: 0,
  mantelClearance: 8,
  cameraMode: "front",
  showDimensions: true,
});

export function clampToRange(value: number, range: { min: number; max: number }): number {
  if (!Number.isFinite(value)) return range.min;
  return Math.min(range.max, Math.max(range.min, value));
}

export function normalizeConfiguration(
  candidate: Partial<FeatureWallConfiguration>,
): FeatureWallConfiguration {
  const normalized: FeatureWallConfiguration = {
    schemaVersion: 1,
    wallWidth: clampToRange(
      candidate.wallWidth ?? DEFAULT_CONFIGURATION.wallWidth,
      WALL_WIDTH_RANGE,
    ),
    wallHeight: clampToRange(
      candidate.wallHeight ?? DEFAULT_CONFIGURATION.wallHeight,
      WALL_HEIGHT_RANGE,
    ),
    fireplaceElevation: clampToRange(
      candidate.fireplaceElevation ?? DEFAULT_CONFIGURATION.fireplaceElevation,
      FIREPLACE_ELEVATION_RANGE,
    ),
    mantelClearance: clampToRange(
      candidate.mantelClearance ?? DEFAULT_CONFIGURATION.mantelClearance,
      MANTEL_CLEARANCE_RANGE,
    ),
    cameraMode: cameraModeSchema
      .catch(DEFAULT_CONFIGURATION.cameraMode)
      .parse(candidate.cameraMode),
    showDimensions: candidate.showDimensions ?? DEFAULT_CONFIGURATION.showDimensions,
  };

  return featureWallConfigurationSchema.parse(normalized);
}

export function getMantelBottom(configuration: FeatureWallConfiguration): number {
  return (
    configuration.fireplaceElevation +
    fireplaceProduct.applianceHeight +
    Math.max(configuration.mantelClearance, mantelProduct.minimumClearance)
  );
}

export function getMantelCenter(configuration: FeatureWallConfiguration): number {
  return getMantelBottom(configuration) + mantelProduct.dimensions.height / 2;
}

export function inchesLabel(value: number): string {
  const whole = Math.floor(value);
  const fraction = value - whole;
  if (Math.abs(fraction) < 0.001) return `${whole}″`;
  if (Math.abs(fraction - 0.5) < 0.001) return `${whole}½″`;
  return `${value.toFixed(1)}″`;
}

export function calculateOrthographicZoom(
  viewportWidth: number,
  viewportHeight: number,
  wallWidth: number,
  wallHeight: number,
  padding = 22,
): number {
  if (
    ![viewportWidth, viewportHeight, wallWidth, wallHeight].every(
      (value) => Number.isFinite(value) && value > 0,
    )
  ) {
    return 1;
  }
  return Math.min(
    viewportWidth / (wallWidth + padding),
    viewportHeight / (wallHeight + padding),
  );
}
