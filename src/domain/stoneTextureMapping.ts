export type StoneTextureCoverage = {
  width: number;
  height: number;
};

export type StoneTextureTransform = {
  repeatX: number;
  repeatY: number;
  offsetX: number;
  offsetY: number;
};

/**
 * Maps a physically sized surface into a manufacturer-calibrated stone atlas.
 * The atlas is centered so the feature-wall and customer-room renderers begin
 * on the same courses, while values above one repeat its mirrored, seamless edges.
 */
export function centeredStoneTextureTransform(
  surfaceWidth: number,
  surfaceHeight: number,
  coverage: StoneTextureCoverage,
): StoneTextureTransform {
  const repeatX = surfaceWidth / coverage.width;
  const repeatY = surfaceHeight / coverage.height;
  return {
    repeatX,
    repeatY,
    offsetX: (1 - repeatX) / 2,
    offsetY: (1 - repeatY) / 2,
  };
}

export function centeredStoneTileOrigin(
  surfaceWidth: number,
  surfaceHeight: number,
  coverage: StoneTextureCoverage,
) {
  return {
    x: (surfaceWidth - coverage.width) / 2,
    y: (surfaceHeight - coverage.height) / 2,
  };
}
