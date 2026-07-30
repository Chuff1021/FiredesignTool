import { z } from "zod";
import {
  faceOptionIdSchema,
  fireplaceIdSchema,
  getFaceOption,
  getFireplaceProduct,
  getMantelFinish,
  getMantelSize,
  mantelFinishIdSchema,
  stoneIdSchema,
} from "@/domain/catalog";

export const WALL_WIDTH_RANGE = { min: 120, max: 240, step: 1 } as const;
export const WALL_HEIGHT_RANGE = { min: 96, max: 144, step: 1 } as const;
export const STONE_WIDTH_RANGE = { min: 72, max: 192, step: 1 } as const;
export const FIREPLACE_ELEVATION_RANGE = { min: 0, max: 24, step: 0.5 } as const;
export const MANTEL_HEIGHT_RANGE = { min: 40, max: 84, step: 0.25 } as const;

export const cameraModeSchema = z.enum(["front", "perspective"]);
export const mantelWidthSchema = z.union([z.literal(60), z.literal(84)]);

export const featureWallConfigurationSchema = z.object({
  schemaVersion: z.literal(2),
  wallWidth: z.number().min(WALL_WIDTH_RANGE.min).max(WALL_WIDTH_RANGE.max).finite(),
  wallHeight: z.number().min(WALL_HEIGHT_RANGE.min).max(WALL_HEIGHT_RANGE.max).finite(),
  stoneWidth: z.number().min(STONE_WIDTH_RANGE.min).max(WALL_WIDTH_RANGE.max).finite(),
  fireplaceElevation: z
    .number()
    .min(FIREPLACE_ELEVATION_RANGE.min)
    .max(FIREPLACE_ELEVATION_RANGE.max)
    .finite(),
  mantelHeightAboveBase: z
    .number()
    .min(MANTEL_HEIGHT_RANGE.min)
    .max(MANTEL_HEIGHT_RANGE.max)
    .finite(),
  fireplaceId: fireplaceIdSchema,
  faceOptionId: faceOptionIdSchema,
  stoneId: stoneIdSchema,
  mantelWidth: mantelWidthSchema,
  mantelFinishId: mantelFinishIdSchema,
  cameraMode: cameraModeSchema,
  showDimensions: z.boolean(),
});

export type FeatureWallConfiguration = z.infer<typeof featureWallConfigurationSchema>;
export type CameraMode = z.infer<typeof cameraModeSchema>;

export const DEFAULT_CONFIGURATION: FeatureWallConfiguration = Object.freeze({
  schemaVersion: 2,
  wallWidth: 144,
  wallHeight: 108,
  stoneWidth: 96,
  fireplaceElevation: 0,
  mantelHeightAboveBase: 44.75,
  fireplaceId: "864-trv-31k-clean-face",
  faceOptionId: "clean-face",
  stoneId: "kentucky-ledge",
  mantelWidth: 60,
  mantelFinishId: "pearl",
  cameraMode: "front",
  showDimensions: true,
});

export function clampToRange(value: number, range: { min: number; max: number }): number {
  if (!Number.isFinite(value)) return range.min;
  return Math.min(range.max, Math.max(range.min, value));
}

export function getMinimumMantelHeight(
  fireplaceId: FeatureWallConfiguration["fireplaceId"],
  mantelDepth: number,
): number {
  const points = getFireplaceProduct(fireplaceId).mantelRule.depthToMinimumHeight;
  const sorted = [...points].sort((a, b) => a.depth - b.depth);
  const first = sorted[0];
  const last = sorted.at(-1);
  if (!first || !last) throw new Error(`Mantel rule is incomplete for ${fireplaceId}.`);
  if (mantelDepth <= first.depth) return first.minimumHeight;
  if (mantelDepth >= last.depth) return last.minimumHeight;

  for (let index = 1; index < sorted.length; index += 1) {
    const upper = sorted[index];
    const lower = sorted[index - 1];
    if (!upper || !lower) continue;
    if (mantelDepth <= upper.depth) {
      const progress = (mantelDepth - lower.depth) / (upper.depth - lower.depth);
      return lower.minimumHeight + progress * (upper.minimumHeight - lower.minimumHeight);
    }
  }

  return last.minimumHeight;
}

export function getMinimumStoneWidth(
  fireplaceId: FeatureWallConfiguration["fireplaceId"],
  faceOptionId: FeatureWallConfiguration["faceOptionId"],
  mantelWidth: FeatureWallConfiguration["mantelWidth"],
): number {
  const face = getFaceOption(fireplaceId, faceOptionId);
  return Math.max(STONE_WIDTH_RANGE.min, mantelWidth + 12, face.visibleFace.width + 12);
}

export function normalizeConfiguration(
  candidate: Partial<FeatureWallConfiguration>,
): FeatureWallConfiguration {
  const fireplaceId = fireplaceIdSchema
    .catch(DEFAULT_CONFIGURATION.fireplaceId)
    .parse(candidate.fireplaceId);
  const fireplace = getFireplaceProduct(fireplaceId);
  const requestedFaceId = faceOptionIdSchema
    .catch(fireplace.defaultFaceOptionId)
    .parse(candidate.faceOptionId);
  const faceOptionId = fireplace.faceOptions.some((face) => face.id === requestedFaceId)
    ? requestedFaceId
    : fireplace.defaultFaceOptionId;
  const mantelWidth = mantelWidthSchema
    .catch(DEFAULT_CONFIGURATION.mantelWidth)
    .parse(candidate.mantelWidth);
  const mantelSize = getMantelSize(mantelWidth);
  const wallWidth = clampToRange(
    candidate.wallWidth ?? DEFAULT_CONFIGURATION.wallWidth,
    WALL_WIDTH_RANGE,
  );
  const minimumStoneWidth = getMinimumStoneWidth(fireplaceId, faceOptionId, mantelWidth);
  const stoneWidth = clampToRange(candidate.stoneWidth ?? DEFAULT_CONFIGURATION.stoneWidth, {
    min: minimumStoneWidth,
    max: Math.min(STONE_WIDTH_RANGE.max, wallWidth),
  });
  const minimumMantelHeight = getMinimumMantelHeight(fireplaceId, mantelSize.depth);

  const normalized: FeatureWallConfiguration = {
    schemaVersion: 2,
    wallWidth,
    wallHeight: clampToRange(
      candidate.wallHeight ?? DEFAULT_CONFIGURATION.wallHeight,
      WALL_HEIGHT_RANGE,
    ),
    stoneWidth,
    fireplaceElevation: clampToRange(
      candidate.fireplaceElevation ?? DEFAULT_CONFIGURATION.fireplaceElevation,
      FIREPLACE_ELEVATION_RANGE,
    ),
    mantelHeightAboveBase: clampToRange(
      candidate.mantelHeightAboveBase ?? minimumMantelHeight,
      {
        min: minimumMantelHeight,
        max: MANTEL_HEIGHT_RANGE.max,
      },
    ),
    fireplaceId,
    faceOptionId,
    stoneId: stoneIdSchema.catch(DEFAULT_CONFIGURATION.stoneId).parse(candidate.stoneId),
    mantelWidth,
    mantelFinishId: mantelFinishIdSchema
      .catch(DEFAULT_CONFIGURATION.mantelFinishId)
      .parse(candidate.mantelFinishId),
    cameraMode: cameraModeSchema
      .catch(DEFAULT_CONFIGURATION.cameraMode)
      .parse(candidate.cameraMode),
    showDimensions: candidate.showDimensions ?? DEFAULT_CONFIGURATION.showDimensions,
  };

  getMantelFinish(normalized.mantelFinishId);
  return featureWallConfigurationSchema.parse(normalized);
}

export function getMantelBottom(configuration: FeatureWallConfiguration): number {
  const size = getMantelSize(configuration.mantelWidth);
  const minimum = getMinimumMantelHeight(configuration.fireplaceId, size.depth);
  return (
    configuration.fireplaceElevation + Math.max(configuration.mantelHeightAboveBase, minimum)
  );
}

export function getMantelCenter(configuration: FeatureWallConfiguration): number {
  return getMantelBottom(configuration) + getMantelSize(configuration.mantelWidth).height / 2;
}

export function inchesLabel(value: number): string {
  const whole = Math.floor(value);
  const fraction = value - whole;
  if (Math.abs(fraction) < 0.001) return `${whole}″`;
  if (Math.abs(fraction - 0.25) < 0.001) return `${whole}¼″`;
  if (Math.abs(fraction - 0.5) < 0.001) return `${whole}½″`;
  if (Math.abs(fraction - 0.75) < 0.001) return `${whole}¾″`;
  if (Math.abs(fraction - 0.875) < 0.001) return `${whole}⅞″`;
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
