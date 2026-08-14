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
 * Maps a physically sized surface into a manufacturer-calibrated installed-wall
 * atlas. Every approved atlas covers 192 x 144 inches, so normal showroom walls
 * sample one continuous field without mirrored seams or repeated symmetry.
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
