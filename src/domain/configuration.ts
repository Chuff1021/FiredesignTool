import { z } from "zod";
import {
  faceOptionIdSchema,
  fireplaceIdSchema,
  getFireplaceProduct,
  getMantelFinish,
  getMantelProduct,
  getMantelSize,
  mantelFinishIdSchema,
  mantelProductIdSchema,
  mantelWidthSchema,
  stoneIdSchema,
} from "@/domain/catalog";

export const WALL_WIDTH_RANGE = { min: 120, max: 240, step: 1 } as const;
export const WALL_HEIGHT_RANGE = { min: 96, max: 144, step: 1 } as const;
export const STONE_WIDTH_RANGE = { min: 50, max: 192, step: 1 } as const;
export const FIREPLACE_ELEVATION_RANGE = { min: 0, max: 24, step: 0.5 } as const;
export const MANTEL_HEIGHT_RANGE = { min: 0, max: 84, step: 0.25 } as const;

export const cameraModeSchema = z.enum(["front", "perspective"]);

export const featureWallConfigurationSchema = z.object({
  schemaVersion: z.literal(4),
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
  mantelProductId: mantelProductIdSchema,
  mantelWidth: mantelWidthSchema,
  mantelFinishId: mantelFinishIdSchema,
  hearthEnabled: z.boolean(),
  cameraMode: cameraModeSchema,
  showDimensions: z.boolean(),
});

export type FeatureWallConfiguration = z.infer<typeof featureWallConfigurationSchema>;
export type CameraMode = z.infer<typeof cameraModeSchema>;

export const DEFAULT_CONFIGURATION: FeatureWallConfiguration = Object.freeze({
  schemaVersion: 4,
  wallWidth: 144,
  wallHeight: 108,
  stoneWidth: 96,
  fireplaceElevation: 0,
  mantelHeightAboveBase: 45.75,
  fireplaceId: "864-trv-31k-clean-face",
  faceOptionId: "clean-face",
  stoneId: "kentucky-ledge",
  mantelProductId: "zachary-smooth",
  mantelWidth: 72,
  mantelFinishId: "graywash",
  hearthEnabled: false,
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

export function getMinimumStoneWidth(): number {
  return STONE_WIDTH_RANGE.min;
}

export function getHearthWidth(configuration: FeatureWallConfiguration): number {
  return configuration.stoneWidth;
}

export type HearthStoneSegment = {
  centerX: number;
  width: number;
};

export function getHearthStoneSegments(stoneWidth: number): HearthStoneSegment[] {
  const width = clampToRange(stoneWidth, STONE_WIDTH_RANGE);
  const moduleWidth = 18;
  const count = Math.max(1, Math.ceil(width / moduleWidth));
  const innerCount = Math.max(0, count - 2);
  const endWidth = count === 1 ? width : (width - innerCount * moduleWidth) / 2;
  const widths =
    count === 1
      ? [width]
      : [endWidth, ...Array.from({ length: innerCount }, () => moduleWidth), endWidth];
  let cursor = -width / 2;
  return widths.map((segmentWidth) => {
    const segment = {
      centerX: cursor + segmentWidth / 2,
      width: segmentWidth,
    };
    cursor += segmentWidth;
    return segment;
  });
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
  const mantelProductId = mantelProductIdSchema
    .catch(DEFAULT_CONFIGURATION.mantelProductId)
    .parse(candidate.mantelProductId);
  const mantelProduct = getMantelProduct(mantelProductId);
  const requestedMantelWidth = mantelWidthSchema
    .catch(mantelProduct.defaultWidth)
    .parse(candidate.mantelWidth);
  const mantelWidth = mantelProduct.sizes.some((size) => size.width === requestedMantelWidth)
    ? requestedMantelWidth
    : mantelProduct.defaultWidth;
  const requestedMantelFinishId = mantelFinishIdSchema
    .catch(mantelProduct.defaultFinishId)
    .parse(candidate.mantelFinishId);
  const mantelFinishId = mantelProduct.finishIds.includes(requestedMantelFinishId)
    ? requestedMantelFinishId
    : mantelProduct.defaultFinishId;
  const hearthEnabled = candidate.hearthEnabled ?? DEFAULT_CONFIGURATION.hearthEnabled;
  const wallWidth = clampToRange(
    candidate.wallWidth ?? DEFAULT_CONFIGURATION.wallWidth,
    WALL_WIDTH_RANGE,
  );
  const minimumStoneWidth = getMinimumStoneWidth();
  const stoneWidth = clampToRange(candidate.stoneWidth ?? DEFAULT_CONFIGURATION.stoneWidth, {
    min: minimumStoneWidth,
    max: Math.min(STONE_WIDTH_RANGE.max, wallWidth),
  });
  const fireplaceElevation = clampToRange(
    candidate.fireplaceElevation ?? DEFAULT_CONFIGURATION.fireplaceElevation,
    {
      min: hearthEnabled ? 1.5 : FIREPLACE_ELEVATION_RANGE.min,
      max: FIREPLACE_ELEVATION_RANGE.max,
    },
  );

  const normalized: FeatureWallConfiguration = {
    schemaVersion: 4,
    wallWidth,
    wallHeight: clampToRange(
      candidate.wallHeight ?? DEFAULT_CONFIGURATION.wallHeight,
      WALL_HEIGHT_RANGE,
    ),
    stoneWidth,
    fireplaceElevation,
    mantelHeightAboveBase: clampToRange(
      candidate.mantelHeightAboveBase ?? DEFAULT_CONFIGURATION.mantelHeightAboveBase,
      MANTEL_HEIGHT_RANGE,
    ),
    fireplaceId,
    faceOptionId,
    stoneId: stoneIdSchema.catch(DEFAULT_CONFIGURATION.stoneId).parse(candidate.stoneId),
    mantelProductId,
    mantelWidth,
    mantelFinishId,
    hearthEnabled,
    cameraMode: cameraModeSchema
      .catch(DEFAULT_CONFIGURATION.cameraMode)
      .parse(candidate.cameraMode),
    showDimensions: candidate.showDimensions ?? DEFAULT_CONFIGURATION.showDimensions,
  };

  getMantelFinish(normalized.mantelProductId, normalized.mantelFinishId);
  return featureWallConfigurationSchema.parse(normalized);
}

export function getMantelBottom(configuration: FeatureWallConfiguration): number {
  return configuration.fireplaceElevation + configuration.mantelHeightAboveBase;
}

export function getMantelCenter(configuration: FeatureWallConfiguration): number {
  return (
    getMantelBottom(configuration) +
    getMantelSize(configuration.mantelProductId, configuration.mantelWidth).height / 2
  );
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
