import { catalogRepository } from "@/domain/catalogRepository";
import {
  getHearthStoneSegments,
  getMantelBottom,
  type FeatureWallConfiguration,
} from "@/domain/configuration";
import {
  builtInAvailableWidth,
  faceBoundsWithinOpening,
  imagePoint,
  type BuiltInSide,
  type RoomProject,
} from "@/domain/roomProject";
import { loadImage } from "@/lib/roomImage";
import { projectCanvasLayer } from "@/lib/roomPerspective";

type Point = { x: number; y: number };

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const texturePaletteCache = new WeakMap<
  HTMLImageElement,
  { red: number; green: number; blue: number; variation: number }
>();
const MIN_DESIGN_PIXELS_PER_INCH = 6;
const MAX_DESIGN_CANVAS_EDGE = 4096;
const MAX_DESIGN_CANVAS_PIXELS = 4096 * 2160;

function pointDistance(first: Point, second: Point): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

function midpoint(first: Point, second: Point): Point {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

function interpolatePoint(first: Point, second: Point, progress: number): Point {
  return {
    x: first.x + (second.x - first.x) * progress,
    y: first.y + (second.y - first.y) * progress,
  };
}

export function projectedPixelsPerInch(
  quad: Point[],
  widthInches: number,
  heightInches: number,
): number {
  const [topLeft, topRight, bottomRight, bottomLeft] = quad;
  if (!topLeft || !topRight || !bottomRight || !bottomLeft) {
    return MIN_DESIGN_PIXELS_PER_INCH;
  }
  const projectedWidth = Math.max(
    pointDistance(topLeft, topRight),
    pointDistance(bottomLeft, bottomRight),
  );
  const projectedHeight = Math.max(
    pointDistance(topLeft, bottomLeft),
    pointDistance(topRight, bottomRight),
  );
  const desired = Math.max(projectedWidth / widthInches, projectedHeight / heightInches);
  const edgeLimit = Math.min(
    MAX_DESIGN_CANVAS_EDGE / widthInches,
    MAX_DESIGN_CANVAS_EDGE / heightInches,
  );
  const pixelLimit = Math.sqrt(MAX_DESIGN_CANVAS_PIXELS / (widthInches * heightInches));
  return Math.max(MIN_DESIGN_PIXELS_PER_INCH, Math.min(desired, edgeLimit, pixelLimit));
}

function cachedImage(source: string): Promise<HTMLImageElement> {
  const existing = imageCache.get(source);
  if (existing) return existing;
  const loading = loadImage(source);
  imageCache.set(source, loading);
  return loading;
}

const builtInFinishes: Record<
  BuiltInSide["finish"],
  { face: string; recess: string; edge: string }
> = {
  "warm-white": { face: "#e8e2d7", recess: "#cfc8bd", edge: "#f5f1e9" },
  "white-oak": { face: "#b89a70", recess: "#846b4d", edge: "#d2b78f" },
  walnut: { face: "#6d4934", recess: "#3f2c22", edge: "#8b6549" },
  charcoal: { face: "#4a4a46", recess: "#292a28", edge: "#666660" },
};

function addWoodGrain(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  pixelsPerInch: number,
) {
  context.save();
  context.globalAlpha = 0.09;
  context.strokeStyle = "#2a1d14";
  context.lineWidth = Math.max(1, pixelsPerInch * 0.08);
  for (let line = x + pixelsPerInch * 1.5; line < x + width; line += pixelsPerInch * 2.8) {
    context.beginPath();
    context.moveTo(line, y);
    context.bezierCurveTo(
      line + pixelsPerInch * 0.7,
      y + height * 0.3,
      line - pixelsPerInch * 0.6,
      y + height * 0.7,
      line + pixelsPerInch * 0.25,
      y + height,
    );
    context.stroke();
  }
  context.restore();
}

function drawBuiltIn(
  context: CanvasRenderingContext2D,
  side: BuiltInSide,
  x: number,
  floorY: number,
  width: number,
  pixelsPerInch: number,
) {
  if (!side.enabled || width < 18) return;
  const finish = builtInFinishes[side.finish];
  const height = side.height * pixelsPerInch;
  const top = floorY - height;
  const frame = Math.max(2.25 * pixelsPerInch, width * 0.045);
  const shelfThickness = Math.max(1.25 * pixelsPerInch, 4);
  const baseHeight = side.baseCabinet && side.style === "bookcase" ? 30 * pixelsPerInch : 0;

  context.save();
  context.shadowColor = "rgba(0,0,0,.32)";
  context.shadowBlur = 2.4 * pixelsPerInch;
  context.shadowOffsetY = 0.8 * pixelsPerInch;

  if (side.style === "floating-shelves") {
    const shelfWidth = width * 0.9;
    const shelfLeft = x + width * 0.05;
    for (let index = 0; index < side.shelfCount; index += 1) {
      const shelfY = floorY - ((index + 1) / (side.shelfCount + 1)) * height;
      context.fillStyle = finish.face;
      context.fillRect(shelfLeft, shelfY, shelfWidth, shelfThickness);
      context.fillStyle = "rgba(0,0,0,.22)";
      context.fillRect(
        shelfLeft,
        shelfY + shelfThickness * 0.72,
        shelfWidth,
        shelfThickness * 0.28,
      );
      if (side.finish === "white-oak" || side.finish === "walnut") {
        addWoodGrain(context, shelfLeft, shelfY, shelfWidth, shelfThickness, pixelsPerInch);
      }
    }
    context.restore();
    return;
  }

  context.fillStyle = finish.face;
  context.fillRect(x, top, width, height);
  const openingTop = top + frame;
  const openingBottom = floorY - baseHeight - frame;
  context.fillStyle = finish.recess;
  context.fillRect(x + frame, openingTop, width - frame * 2, openingBottom - openingTop);
  const recessShade = context.createLinearGradient(x + frame, 0, x + width - frame, 0);
  recessShade.addColorStop(0, "rgba(0,0,0,.2)");
  recessShade.addColorStop(0.18, "rgba(255,255,255,.04)");
  recessShade.addColorStop(1, "rgba(0,0,0,.08)");
  context.fillStyle = recessShade;
  context.fillRect(x + frame, openingTop, width - frame * 2, openingBottom - openingTop);

  const shelfArea = openingBottom - openingTop;
  for (let index = 1; index <= side.shelfCount; index += 1) {
    const shelfY = openingTop + (index / (side.shelfCount + 1)) * shelfArea;
    context.fillStyle = finish.edge;
    context.fillRect(x + frame * 0.72, shelfY, width - frame * 1.44, shelfThickness);
    context.fillStyle = "rgba(0,0,0,.2)";
    context.fillRect(
      x + frame * 0.72,
      shelfY + shelfThickness * 0.72,
      width - frame * 1.44,
      shelfThickness * 0.28,
    );
  }

  if (baseHeight > 0) {
    const cabinetTop = floorY - baseHeight;
    context.fillStyle = finish.face;
    context.fillRect(x, cabinetTop, width, baseHeight);
    const doorGap = Math.max(1, pixelsPerInch * 0.18);
    const doorWidth = (width - frame * 1.5 - doorGap) / 2;
    for (let index = 0; index < 2; index += 1) {
      const doorX = x + frame * 0.75 + index * (doorWidth + doorGap);
      context.strokeStyle = "rgba(30,25,20,.28)";
      context.lineWidth = Math.max(1, pixelsPerInch * 0.12);
      context.strokeRect(doorX, cabinetTop + frame * 0.65, doorWidth, baseHeight - frame * 1.3);
    }
  }
  if (side.finish === "white-oak" || side.finish === "walnut") {
    addWoodGrain(context, x, top, width, height, pixelsPerInch);
  }
  context.fillStyle = "rgba(255,255,255,.16)";
  context.fillRect(x, top, Math.max(1, pixelsPerInch * 0.22), height);
  context.restore();
}

function drawStoneField(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  width: number,
  height: number,
  pixelsPerInch: number,
) {
  context.save();
  context.beginPath();
  context.rect(x, 0, width, height);
  context.clip();
  const tileWidth = Math.max(36 * pixelsPerInch, Math.min(66 * pixelsPerInch, width));
  const tileHeight = tileWidth * (image.naturalHeight / image.naturalWidth);
  let row = 0;
  for (let top = -tileHeight; top < height + tileHeight; top += tileHeight) {
    const offset = row % 2 === 0 ? 0 : -tileWidth * 0.47;
    let column = 0;
    for (let left = x + offset - tileWidth; left < x + width + tileWidth; left += tileWidth) {
      context.save();
      context.globalAlpha = 0.97 + ((row + column) % 3) * 0.01;
      if ((row + column) % 2 === 0) {
        context.translate(left + tileWidth, top);
        context.scale(-1, 1);
        context.drawImage(image, 0, 0, tileWidth + 1, tileHeight + 1);
      } else {
        context.drawImage(image, left, top, tileWidth + 1, tileHeight + 1);
      }
      context.restore();
      column += 1;
    }
    row += 1;
  }
  const depth = context.createLinearGradient(x, 0, x + width, 0);
  depth.addColorStop(0, "rgba(0,0,0,.1)");
  depth.addColorStop(0.08, "rgba(255,255,255,.025)");
  depth.addColorStop(0.92, "rgba(255,255,255,.02)");
  depth.addColorStop(1, "rgba(0,0,0,.11)");
  context.fillStyle = depth;
  context.fillRect(x, 0, width, height);
  context.restore();
}

function drawImageCover(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
) {
  const sourceAspect = image.naturalWidth / image.naturalHeight;
  const targetAspect = width / height;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = image.naturalWidth;
  let sourceHeight = image.naturalHeight;
  if (sourceAspect > targetAspect) {
    sourceWidth = image.naturalHeight * targetAspect;
    sourceX = (image.naturalWidth - sourceWidth) / 2;
  } else if (sourceAspect < targetAspect) {
    sourceHeight = image.naturalWidth / targetAspect;
    sourceY = (image.naturalHeight - sourceHeight) / 2;
  }
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height);
}

function createMaskedOpening(
  image: HTMLImageElement,
  mask: HTMLImageElement,
  width: number,
  height: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The firebox mask could not be prepared.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  drawImageCover(context, image, width, height);
  context.globalCompositeOperation = "destination-in";
  context.drawImage(mask, 0, 0, width, height);
  context.globalCompositeOperation = "source-over";
  return canvas;
}

async function createDesignLayer(
  configuration: FeatureWallConfiguration,
  scenario: RoomProject["scenario"],
  accessories: RoomProject["accessories"],
  pixelsPerInch: number,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(configuration.wallWidth * pixelsPerInch);
  canvas.height = Math.round(configuration.wallHeight * pixelsPerInch);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The room renderer could not start.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const fireplace = catalogRepository.getFireplace(configuration.fireplaceId);
  const face = catalogRepository.getFace(configuration.fireplaceId, configuration.faceOptionId);
  const fireback = catalogRepository.getFireback(
    configuration.fireplaceId,
    configuration.firebackOptionId,
  );
  const stone = catalogRepository.getStone(configuration.stoneId);
  const mantel = catalogRepository.getMantelSize(
    configuration.mantelProductId,
    configuration.mantelWidth,
  );
  const mantelFinish = catalogRepository.getMantelFinish(
    configuration.mantelProductId,
    configuration.mantelFinishId,
  );
  const [
    stoneImage,
    fireplaceImage,
    firebackImage,
    faceMaskImage,
    faceOverlayImage,
    mantelImage,
  ] = await Promise.all([
    cachedImage(stone.assets[0]!.localPath),
    cachedImage(face.asset.localPath),
    fireback.renderMode === "base-layer" ? cachedImage(fireback.asset.localPath) : null,
    fireback.renderMode === "base-layer" ? cachedImage(face.maskAsset.localPath) : null,
    face.overlayMode === "always" ? cachedImage(face.overlayAsset.localPath) : null,
    cachedImage(mantelFinish.assets[0]!.localPath),
  ]);
  const toX = (inches: number) => (configuration.wallWidth / 2 + inches) * pixelsPerInch;
  const toY = (inches: number) => canvas.height - inches * pixelsPerInch;

  const stoneLeft = toX(-configuration.stoneWidth / 2);
  const stoneWidth = configuration.stoneWidth * pixelsPerInch;
  if (scenario === "full-remodel") {
    const leftAvailable = builtInAvailableWidth(
      configuration.wallWidth,
      configuration.stoneWidth,
      accessories.left,
    );
    const rightAvailable = builtInAvailableWidth(
      configuration.wallWidth,
      configuration.stoneWidth,
      accessories.right,
    );
    const leftWidth = Math.min(accessories.left.width, leftAvailable) * pixelsPerInch;
    const rightWidth = Math.min(accessories.right.width, rightAvailable) * pixelsPerInch;
    drawBuiltIn(
      context,
      accessories.left,
      stoneLeft - accessories.left.gap * pixelsPerInch - leftWidth,
      canvas.height,
      leftWidth,
      pixelsPerInch,
    );
    drawBuiltIn(
      context,
      accessories.right,
      stoneLeft + stoneWidth + accessories.right.gap * pixelsPerInch,
      canvas.height,
      rightWidth,
      pixelsPerInch,
    );
    drawStoneField(context, stoneImage, stoneLeft, stoneWidth, canvas.height, pixelsPerInch);
  }

  const faceWidth = face.visibleFace.width * pixelsPerInch;
  const faceHeight = face.visibleFace.height * pixelsPerInch;
  const faceLeft = toX(-face.visibleFace.width / 2);
  const faceTop = toY(configuration.fireplaceElevation + face.visibleFace.height);
  context.save();
  context.shadowColor = "rgba(0,0,0,.42)";
  context.shadowBlur = 5 * pixelsPerInch;
  context.shadowOffsetY = 1.2 * pixelsPerInch;
  context.drawImage(fireplaceImage, faceLeft, faceTop, faceWidth, faceHeight);
  if (firebackImage && faceMaskImage) {
    const firebackWidth = face.mediaWindow.width * pixelsPerInch;
    const firebackHeight = face.mediaWindow.height * pixelsPerInch;
    const firebackLeft = toX(face.mediaWindow.offsetX - face.mediaWindow.width / 2);
    const firebackTop = toY(
      configuration.fireplaceElevation +
        face.visibleFace.height / 2 +
        face.mediaWindow.offsetY +
        face.mediaWindow.height / 2,
    );
    const opening = createMaskedOpening(
      firebackImage,
      faceMaskImage,
      Math.max(1, Math.round(firebackWidth)),
      Math.max(1, Math.round(firebackHeight)),
    );
    context.drawImage(opening, firebackLeft, firebackTop, firebackWidth, firebackHeight);
  }
  if (faceOverlayImage) {
    context.drawImage(faceOverlayImage, faceLeft, faceTop, faceWidth, faceHeight);
  }
  context.restore();

  if (scenario === "full-remodel") {
    const mantelLeft = toX(-mantel.width / 2);
    const mantelTop = toY(getMantelBottom(configuration) + mantel.height);
    const mantelWidth = mantel.width * pixelsPerInch;
    const mantelHeight = mantel.height * pixelsPerInch;
    context.save();
    context.shadowColor = "rgba(0,0,0,.36)";
    context.shadowBlur = 2.2 * pixelsPerInch;
    context.shadowOffsetY = 1.1 * pixelsPerInch;
    context.fillStyle = mantelFinish.colorHex;
    context.fillRect(mantelLeft, mantelTop, mantelWidth, mantelHeight);
    // Pearl's packaged front reference is already a straight-on product
    // elevation. Mapping that single approved image across the complete shelf
    // keeps the grain continuous and avoids the repeated streaks caused by
    // tiling a narrow crop.
    context.globalAlpha = 0.82;
    context.drawImage(mantelImage, mantelLeft, mantelTop, mantelWidth, mantelHeight);
    context.globalAlpha = 1;
    const shade = context.createLinearGradient(0, mantelTop, 0, mantelTop + mantelHeight);
    shade.addColorStop(0, "rgba(255,255,255,.2)");
    shade.addColorStop(0.22, "rgba(255,255,255,.045)");
    shade.addColorStop(0.82, "rgba(0,0,0,.04)");
    shade.addColorStop(1, "rgba(0,0,0,.18)");
    context.fillStyle = shade;
    context.fillRect(mantelLeft, mantelTop, mantelWidth, mantelHeight);
    context.strokeStyle = "rgba(255,255,255,.18)";
    context.lineWidth = Math.max(1, pixelsPerInch * 0.08);
    context.beginPath();
    context.moveTo(mantelLeft, mantelTop);
    context.lineTo(mantelLeft + mantelWidth, mantelTop);
    context.stroke();
    context.restore();
  }

  // Keeps the media choice attached to the exact catalog entry used for the projection.
  canvas.dataset.fireplaceId = fireplace.id;
  return canvas;
}

async function createInsertFaceLayer(
  configuration: FeatureWallConfiguration,
  pixelsPerInch: number,
): Promise<{ canvas: HTMLCanvasElement; widthInches: number; heightInches: number }> {
  const face = catalogRepository.getFace(configuration.fireplaceId, configuration.faceOptionId);
  const fireback = catalogRepository.getFireback(
    configuration.fireplaceId,
    configuration.firebackOptionId,
  );
  const [image, firebackImage, mask, overlay] = await Promise.all([
    cachedImage(face.asset.localPath),
    fireback.renderMode === "base-layer" ? cachedImage(fireback.asset.localPath) : null,
    fireback.renderMode === "base-layer" ? cachedImage(face.maskAsset.localPath) : null,
    face.overlayMode === "always" ? cachedImage(face.overlayAsset.localPath) : null,
  ]);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(face.visibleFace.width * pixelsPerInch);
  canvas.height = Math.round(face.visibleFace.height * pixelsPerInch);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The insert renderer could not start.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  if (firebackImage && mask) {
    const width = face.mediaWindow.width * pixelsPerInch;
    const height = face.mediaWindow.height * pixelsPerInch;
    const left = canvas.width / 2 + face.mediaWindow.offsetX * pixelsPerInch - width / 2;
    const top = canvas.height / 2 - face.mediaWindow.offsetY * pixelsPerInch - height / 2;
    const opening = createMaskedOpening(
      firebackImage,
      mask,
      Math.max(1, Math.round(width)),
      Math.max(1, Math.round(height)),
    );
    context.drawImage(opening, left, top, width, height);
  }
  if (overlay) context.drawImage(overlay, 0, 0, canvas.width, canvas.height);
  return {
    canvas,
    widthInches: face.visibleFace.width,
    heightInches: face.visibleFace.height,
  };
}

function bilinear(quad: Point[], u: number, v: number): Point {
  const [topLeft, topRight, bottomRight, bottomLeft] = quad;
  if (!topLeft || !topRight || !bottomRight || !bottomLeft) return { x: 0, y: 0 };
  return {
    x:
      topLeft.x * (1 - u) * (1 - v) +
      topRight.x * u * (1 - v) +
      bottomRight.x * u * v +
      bottomLeft.x * (1 - u) * v,
    y:
      topLeft.y * (1 - u) * (1 - v) +
      topRight.y * u * (1 - v) +
      bottomRight.y * u * v +
      bottomLeft.y * (1 - u) * v,
  };
}

function averageFloorDirection(quad: Point[]): Point {
  const [topLeft, topRight, bottomRight, bottomLeft] = quad;
  if (!topLeft || !topRight || !bottomRight || !bottomLeft) return { x: 0, y: 1 };
  const left = { x: bottomLeft.x - topLeft.x, y: bottomLeft.y - topLeft.y };
  const right = { x: bottomRight.x - topRight.x, y: bottomRight.y - topRight.y };
  const x = left.x + right.x;
  const y = left.y + right.y;
  const length = Math.hypot(x, y) || 1;
  return { x: x / length, y: y / length };
}

function wallPhysicalPoint(
  quad: Point[],
  configuration: FeatureWallConfiguration,
  xFromCenter: number,
  yFromFloor: number,
): Point {
  return bilinear(
    quad,
    (configuration.wallWidth / 2 + xFromCenter) / configuration.wallWidth,
    1 - yFromFloor / configuration.wallHeight,
  );
}

function drawHearthSurface(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  width: number,
  height: number,
  pixelsPerInch: number,
) {
  let palette = texturePaletteCache.get(image);
  if (!palette) {
    const sample = document.createElement("canvas");
    sample.width = 40;
    sample.height = 40;
    const sampleContext = sample.getContext("2d", { willReadFrequently: true });
    if (!sampleContext) throw new Error("The hearth material could not be sampled.");
    sampleContext.drawImage(image, 0, 0, sample.width, sample.height);
    const pixels = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
    let red = 0;
    let green = 0;
    let blue = 0;
    let luminance = 0;
    let luminanceSquared = 0;
    const count = pixels.length / 4;
    for (let offset = 0; offset < pixels.length; offset += 4) {
      red += pixels[offset]!;
      green += pixels[offset + 1]!;
      blue += pixels[offset + 2]!;
      const value =
        pixels[offset]! * 0.2126 + pixels[offset + 1]! * 0.7152 + pixels[offset + 2]! * 0.0722;
      luminance += value;
      luminanceSquared += value * value;
    }
    const averageLuminance = luminance / count;
    palette = {
      red: red / count,
      green: green / count,
      blue: blue / count,
      variation: Math.max(
        7,
        Math.min(16, Math.sqrt(luminanceSquared / count - averageLuminance ** 2) * 0.52),
      ),
    };
    texturePaletteCache.set(image, palette);
  }

  const surface = context.createImageData(width, height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const grain = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) * 43758.5453;
      const normalizedGrain = (grain - Math.floor(grain) - 0.5) * 2;
      const slate =
        Math.sin(x * 0.034 + y * 0.011) * 0.32 +
        Math.sin(x * 0.009 - y * 0.027) * 0.2 +
        normalizedGrain * 0.48;
      const variation = slate * palette.variation;
      surface.data[index] = Math.max(0, Math.min(255, palette.red + variation));
      surface.data[index + 1] = Math.max(0, Math.min(255, palette.green + variation * 0.94));
      surface.data[index + 2] = Math.max(0, Math.min(255, palette.blue + variation * 0.9));
      surface.data[index + 3] = 255;
    }
  }
  context.putImageData(surface, 0, 0);

  // Retain a restrained amount of the official swatch's real surface
  // character without exposing its low-resolution crop or obvious repeats.
  const sourceAspect = image.naturalWidth / image.naturalHeight;
  const tileWidth = Math.max(8, 28 * pixelsPerInch);
  const tileHeight = tileWidth / sourceAspect;
  context.save();
  context.globalAlpha = 0.1;
  context.filter = `blur(${Math.max(2, pixelsPerInch * 0.42)}px)`;
  let row = 0;
  for (let top = -tileHeight * 0.18; top < height; top += tileHeight - 1) {
    const rowOffset = row % 2 === 0 ? -tileWidth * 0.12 : -tileWidth * 0.58;
    let column = 0;
    for (let left = rowOffset; left < width; left += tileWidth - 1) {
      context.save();
      context.beginPath();
      context.rect(Math.max(0, left), Math.max(0, top), tileWidth + 1, tileHeight + 1);
      context.clip();
      if ((row + column) % 2 === 1) {
        context.translate(left + tileWidth, top);
        context.scale(-1, 1);
        context.drawImage(image, 0, 0, tileWidth + 1, tileHeight + 1);
      } else {
        context.drawImage(image, left, top, tileWidth + 1, tileHeight + 1);
      }
      context.restore();
      column += 1;
    }
    row += 1;
  }
  context.restore();
}

function hearthSurfaceCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
  pixelsPerInch: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(width * pixelsPerInch));
  canvas.height = Math.max(2, Math.round(height * pixelsPerInch));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The hearth renderer could not start.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  drawHearthSurface(context, image, canvas.width, canvas.height, pixelsPerInch);
  const shade = context.createLinearGradient(0, 0, 0, canvas.height);
  shade.addColorStop(0, "rgba(255,255,255,.14)");
  shade.addColorStop(0.55, "rgba(255,255,255,.015)");
  shade.addColorStop(1, "rgba(0,0,0,.12)");
  context.fillStyle = shade;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

function stoneRiserCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
  pixelsPerInch: number,
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(width * pixelsPerInch));
  canvas.height = Math.max(2, Math.round(height * pixelsPerInch));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The hearth renderer could not start.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  drawStoneField(context, image, 0, canvas.width, canvas.height, pixelsPerInch);
  const shade = context.createLinearGradient(0, 0, 0, canvas.height);
  shade.addColorStop(0, "rgba(0,0,0,.08)");
  shade.addColorStop(1, "rgba(0,0,0,.2)");
  context.fillStyle = shade;
  context.fillRect(0, 0, canvas.width, canvas.height);
  return canvas;
}

export function projectedHearthGeometry(
  quad: Point[],
  project: RoomProject,
  configuration: FeatureWallConfiguration,
) {
  const stone = catalogRepository.getStone(configuration.stoneId);
  const depthInches = stone.hearthstone.dimensions.depth;
  const thicknessInches = stone.hearthstone.dimensions.thickness;
  const halfWidth = configuration.stoneWidth / 2;
  const rearLeftTop = wallPhysicalPoint(
    quad,
    configuration,
    -halfWidth,
    configuration.fireplaceElevation,
  );
  const rearRightTop = wallPhysicalPoint(
    quad,
    configuration,
    halfWidth,
    configuration.fireplaceElevation,
  );
  const rearLeftFloor = wallPhysicalPoint(quad, configuration, -halfWidth, 0);
  const rearRightFloor = wallPhysicalPoint(quad, configuration, halfWidth, 0);
  const rearCenter = midpoint(rearLeftTop, rearRightTop);
  const rearFloorCenter = midpoint(rearLeftFloor, rearRightFloor);
  const destinationPixelsPerInch = pointDistance(quad[3]!, quad[2]!) / configuration.wallWidth;
  const wallDirection = averageFloorDirection(quad);
  const defaultDepth = Math.max(8, depthInches * destinationPixelsPerInch * 0.72);
  const requestedFrontCenter = project.hearthFrontCenter
    ? imagePoint(project.hearthFrontCenter, project.source.width, project.source.height)
    : {
        x: rearCenter.x + wallDirection.x * defaultDepth,
        y: rearCenter.y + wallDirection.y * defaultDepth,
      };
  const requestedOffset = {
    x: requestedFrontCenter.x - rearCenter.x,
    y: requestedFrontCenter.y - rearCenter.y,
  };
  const requestedLength = Math.hypot(requestedOffset.x, requestedOffset.y) || defaultDepth;
  const minimumDepth = depthInches * destinationPixelsPerInch * 0.22;
  const maximumDepth = depthInches * destinationPixelsPerInch * 1.08;
  const resolvedDepth = Math.max(minimumDepth, Math.min(maximumDepth, requestedLength));
  const requestedDirection = {
    x: requestedOffset.x / requestedLength,
    y: requestedOffset.y / requestedLength,
  };
  const directionAlignment =
    requestedDirection.x * wallDirection.x + requestedDirection.y * wallDirection.y;
  const blendedDirection =
    directionAlignment < 0.25
      ? wallDirection
      : {
          x: requestedDirection.x * 0.82 + wallDirection.x * 0.18,
          y: requestedDirection.y * 0.82 + wallDirection.y * 0.18,
        };
  const blendedLength = Math.hypot(blendedDirection.x, blendedDirection.y) || 1;
  const direction = {
    x: blendedDirection.x / blendedLength,
    y: blendedDirection.y / blendedLength,
  };
  const depthOffset = {
    x: direction.x * resolvedDepth,
    y: direction.y * resolvedDepth,
  };
  const frontCenter = {
    x: rearCenter.x + depthOffset.x,
    y: rearCenter.y + depthOffset.y,
  };
  const frontFloorCenter = {
    x: rearFloorCenter.x + depthOffset.x,
    y: rearFloorCenter.y + depthOffset.y,
  };
  const rearWidth = pointDistance(rearLeftTop, rearRightTop);
  const rearDirection = {
    x: (rearRightTop.x - rearLeftTop.x) / Math.max(1, rearWidth),
    y: (rearRightTop.y - rearLeftTop.y) / Math.max(1, rearWidth),
  };
  const wallHeightPixels =
    (pointDistance(quad[0]!, quad[3]!) + pointDistance(quad[1]!, quad[2]!)) / 2;
  const perspectiveScale = Math.max(
    1,
    Math.min(1.06, 1 + (resolvedDepth / Math.max(1, wallHeightPixels)) * 0.24),
  );
  const frontHalfWidth = (rearWidth * perspectiveScale) / 2;
  const frontLeftTop = {
    x: frontCenter.x - rearDirection.x * frontHalfWidth,
    y: frontCenter.y - rearDirection.y * frontHalfWidth,
  };
  const frontRightTop = {
    x: frontCenter.x + rearDirection.x * frontHalfWidth,
    y: frontCenter.y + rearDirection.y * frontHalfWidth,
  };
  const frontLeftFloor = {
    x: frontFloorCenter.x - rearDirection.x * frontHalfWidth,
    y: frontFloorCenter.y - rearDirection.y * frontHalfWidth,
  };
  const frontRightFloor = {
    x: frontFloorCenter.x + rearDirection.x * frontHalfWidth,
    y: frontFloorCenter.y + rearDirection.y * frontHalfWidth,
  };
  const capDrop = {
    x: wallDirection.x * thicknessInches * destinationPixelsPerInch,
    y: wallDirection.y * thicknessInches * destinationPixelsPerInch,
  };
  return {
    capDrop,
    depthInches,
    destinationPixelsPerInch,
    frontLeftFloor,
    frontLeftTop,
    frontRightFloor,
    frontRightTop,
    rearLeftTop,
    rearRightTop,
    riserHeight: Math.max(0, configuration.fireplaceElevation - thicknessInches),
  };
}

async function drawProjectedHearth(
  context: CanvasRenderingContext2D,
  quad: Point[],
  project: RoomProject,
  configuration: FeatureWallConfiguration,
) {
  if (!configuration.hearthEnabled || configuration.fireplaceElevation < 1.5) return;
  const stone = catalogRepository.getStone(configuration.stoneId);
  const [hearthImage, wallStoneImage] = await Promise.all([
    cachedImage(stone.hearthstone.assets[0]!.localPath),
    cachedImage(stone.assets[0]!.localPath),
  ]);
  const geometry = projectedHearthGeometry(quad, project, configuration);
  const {
    capDrop,
    depthInches,
    destinationPixelsPerInch,
    frontLeftFloor,
    frontLeftTop,
    frontRightFloor,
    frontRightTop,
    rearLeftTop,
    rearRightTop,
    riserHeight,
  } = geometry;
  const frontLeftCapBottom = {
    x: frontLeftTop.x + capDrop.x,
    y: frontLeftTop.y + capDrop.y,
  };
  const frontRightCapBottom = {
    x: frontRightTop.x + capDrop.x,
    y: frontRightTop.y + capDrop.y,
  };
  const rearLeftCapBottom = {
    x: rearLeftTop.x + capDrop.x,
    y: rearLeftTop.y + capDrop.y,
  };
  const rearRightCapBottom = {
    x: rearRightTop.x + capDrop.x,
    y: rearRightTop.y + capDrop.y,
  };
  const textureScale = Math.max(6, destinationPixelsPerInch);

  context.save();
  context.fillStyle = "rgba(0,0,0,.22)";
  context.filter = `blur(${Math.max(3, destinationPixelsPerInch * 0.9)}px)`;
  context.beginPath();
  context.moveTo(frontLeftFloor.x, frontLeftFloor.y);
  context.lineTo(frontRightFloor.x, frontRightFloor.y);
  context.lineTo(frontRightFloor.x + capDrop.x * 2.2, frontRightFloor.y + capDrop.y * 2.2);
  context.lineTo(frontLeftFloor.x + capDrop.x * 2.2, frontLeftFloor.y + capDrop.y * 2.2);
  context.closePath();
  context.fill();
  context.restore();

  if (riserHeight > 0.05) {
    const riser = stoneRiserCanvas(
      wallStoneImage,
      configuration.stoneWidth,
      riserHeight,
      textureScale,
    );
    context.save();
    context.shadowColor = "rgba(0,0,0,.38)";
    context.shadowBlur = Math.max(3, destinationPixelsPerInch * 1.1);
    context.shadowOffsetY = Math.max(1, destinationPixelsPerInch * 0.35);
    projectCanvasLayer(context, riser, [
      frontLeftCapBottom,
      frontRightCapBottom,
      frontRightFloor,
      frontLeftFloor,
    ]);
    context.restore();
  }

  const cap = hearthSurfaceCanvas(
    hearthImage,
    configuration.stoneWidth,
    depthInches,
    textureScale,
  );
  context.save();
  context.shadowColor = "rgba(0, 0, 0, .24)";
  context.shadowBlur = Math.max(2, destinationPixelsPerInch * 0.55);
  context.shadowOffsetY = Math.max(1, destinationPixelsPerInch * 0.16);
  projectCanvasLayer(context, cap, [rearLeftTop, rearRightTop, frontRightTop, frontLeftTop]);
  context.restore();

  const nose = hearthSurfaceCanvas(
    hearthImage,
    configuration.stoneWidth,
    stone.hearthstone.dimensions.thickness,
    textureScale,
  );
  projectCanvasLayer(context, nose, [
    frontLeftTop,
    frontRightTop,
    frontRightCapBottom,
    frontLeftCapBottom,
  ]);

  const segments = getHearthStoneSegments(configuration.stoneWidth);

  context.save();
  context.fillStyle = "rgba(42, 39, 35, .58)";
  context.beginPath();
  context.moveTo(rearLeftTop.x, rearLeftTop.y);
  context.lineTo(frontLeftTop.x, frontLeftTop.y);
  context.lineTo(frontLeftCapBottom.x, frontLeftCapBottom.y);
  context.lineTo(rearLeftCapBottom.x, rearLeftCapBottom.y);
  context.closePath();
  context.fill();
  context.fillStyle = "rgba(28, 26, 24, .68)";
  context.beginPath();
  context.moveTo(rearRightTop.x, rearRightTop.y);
  context.lineTo(frontRightTop.x, frontRightTop.y);
  context.lineTo(frontRightCapBottom.x, frontRightCapBottom.y);
  context.lineTo(rearRightCapBottom.x, rearRightCapBottom.y);
  context.closePath();
  context.fill();
  context.restore();

  context.save();
  context.lineWidth = Math.max(0.75, destinationPixelsPerInch * 0.055);
  context.strokeStyle = "rgba(35, 31, 28, .28)";
  segments.slice(0, -1).forEach((segment) => {
    const progress =
      (segment.centerX + segment.width / 2 + configuration.stoneWidth / 2) /
      configuration.stoneWidth;
    const rear = interpolatePoint(rearLeftTop, rearRightTop, progress);
    const front = interpolatePoint(frontLeftTop, frontRightTop, progress);
    const bottom = interpolatePoint(frontLeftCapBottom, frontRightCapBottom, progress);
    context.beginPath();
    context.moveTo(rear.x, rear.y);
    context.lineTo(front.x, front.y);
    context.stroke();
    context.beginPath();
    context.moveTo(front.x, front.y);
    context.lineTo(bottom.x, bottom.y);
    context.stroke();
  });
  context.restore();

  context.save();
  context.strokeStyle = "rgba(15, 13, 11, .34)";
  context.lineWidth = Math.max(1, destinationPixelsPerInch * 0.16);
  context.filter = `blur(${Math.max(1, destinationPixelsPerInch * 0.22)}px)`;
  context.beginPath();
  context.moveTo(rearLeftCapBottom.x, rearLeftCapBottom.y);
  context.lineTo(rearRightCapBottom.x, rearRightCapBottom.y);
  context.stroke();
  context.restore();

  context.save();
  context.strokeStyle = "rgba(250,243,232,.33)";
  context.lineWidth = Math.max(1, destinationPixelsPerInch * 0.18);
  context.beginPath();
  context.moveTo(frontLeftTop.x, frontLeftTop.y);
  context.lineTo(frontRightTop.x, frontRightTop.y);
  context.stroke();
  context.restore();
}

type Rgb = { red: number; green: number; blue: number };

function sampleRoomColor(context: CanvasRenderingContext2D, point: Point): Rgb {
  const radius = Math.max(2, Math.round(context.canvas.width / 600));
  const left = Math.max(0, Math.min(context.canvas.width - 1, Math.round(point.x) - radius));
  const top = Math.max(0, Math.min(context.canvas.height - 1, Math.round(point.y) - radius));
  const width = Math.max(1, Math.min(radius * 2 + 1, context.canvas.width - left));
  const height = Math.max(1, Math.min(radius * 2 + 1, context.canvas.height - top));
  const pixels = context.getImageData(left, top, width, height).data;
  let red = 0;
  let green = 0;
  let blue = 0;
  let samples = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    red += pixels[index]!;
    green += pixels[index + 1]!;
    blue += pixels[index + 2]!;
    samples += 1;
  }
  return { red: red / samples, green: green / samples, blue: blue / samples };
}

function blendChannel(
  topLeft: number,
  topRight: number,
  bottomRight: number,
  bottomLeft: number,
  u: number,
  v: number,
) {
  return (
    topLeft * (1 - u) * (1 - v) +
    topRight * u * (1 - v) +
    bottomRight * u * v +
    bottomLeft * (1 - u) * v
  );
}

function drawWallCleanup(
  context: CanvasRenderingContext2D,
  project: RoomProject,
  wallQuad: Point[],
  room: HTMLImageElement,
) {
  if (project.removalPolygons.length === 0 || wallQuad.length !== 4) return;
  project.removalPolygons.forEach((polygon) => {
    const pixels = polygon.map((point) =>
      imagePoint(point, project.source.width, project.source.height),
    );
    const xs = pixels.map((point) => point.x);
    const ys = pixels.map((point) => point.y);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    const padding = Math.max(
      project.cleanupFeather * 2,
      12,
      Math.min(right - left, bottom - top) * 0.12,
    );
    const colors = [
      { x: left - padding, y: top - padding },
      { x: right + padding, y: top - padding },
      { x: right + padding, y: bottom + padding },
      { x: left - padding, y: bottom + padding },
    ].map((point) => sampleRoomColor(context, point));

    const coarse = document.createElement("canvas");
    coarse.width = 64;
    coarse.height = 64;
    const coarseContext = coarse.getContext("2d");
    if (!coarseContext) return;
    const image = coarseContext.createImageData(coarse.width, coarse.height);
    for (let y = 0; y < coarse.height; y += 1) {
      for (let x = 0; x < coarse.width; x += 1) {
        const u = x / Math.max(1, coarse.width - 1);
        const v = y / Math.max(1, coarse.height - 1);
        const noise = Math.sin((x + 1) * 12.9898 + (y + 1) * 78.233) * 0.7;
        const offset = (y * coarse.width + x) * 4;
        image.data[offset] = Math.max(
          0,
          Math.min(
            255,
            blendChannel(colors[0]!.red, colors[1]!.red, colors[2]!.red, colors[3]!.red, u, v) +
              noise,
          ),
        );
        image.data[offset + 1] = Math.max(
          0,
          Math.min(
            255,
            blendChannel(
              colors[0]!.green,
              colors[1]!.green,
              colors[2]!.green,
              colors[3]!.green,
              u,
              v,
            ) + noise,
          ),
        );
        image.data[offset + 2] = Math.max(
          0,
          Math.min(
            255,
            blendChannel(
              colors[0]!.blue,
              colors[1]!.blue,
              colors[2]!.blue,
              colors[3]!.blue,
              u,
              v,
            ) + noise,
          ),
        );
        image.data[offset + 3] = 255;
      }
    }
    coarseContext.putImageData(image, 0, 0);

    const reconstruction = document.createElement("canvas");
    reconstruction.width = context.canvas.width;
    reconstruction.height = context.canvas.height;
    const reconstructionContext = reconstruction.getContext("2d");
    if (!reconstructionContext) return;
    reconstructionContext.imageSmoothingEnabled = true;
    reconstructionContext.imageSmoothingQuality = "high";
    if (project.cleanupSamplePoint) {
      const sample = imagePoint(
        project.cleanupSamplePoint,
        project.source.width,
        project.source.height,
      );
      const center = { x: (left + right) / 2, y: (top + bottom) / 2 };
      reconstructionContext.drawImage(
        room,
        center.x - sample.x,
        center.y - sample.y,
        context.canvas.width,
        context.canvas.height,
      );
    } else {
      reconstructionContext.drawImage(
        coarse,
        left - padding,
        top - padding,
        right - left + padding * 2,
        bottom - top + padding * 2,
      );
    }

    const hardMask = document.createElement("canvas");
    hardMask.width = context.canvas.width;
    hardMask.height = context.canvas.height;
    const hardMaskContext = hardMask.getContext("2d");
    if (!hardMaskContext) return;
    hardMaskContext.save();
    hardMaskContext.beginPath();
    hardMaskContext.moveTo(wallQuad[0]!.x, wallQuad[0]!.y);
    wallQuad.slice(1).forEach((point) => hardMaskContext.lineTo(point.x, point.y));
    hardMaskContext.closePath();
    hardMaskContext.clip();
    hardMaskContext.fillStyle = "white";
    hardMaskContext.beginPath();
    hardMaskContext.moveTo(pixels[0]!.x, pixels[0]!.y);
    pixels.slice(1).forEach((pixel) => hardMaskContext.lineTo(pixel.x, pixel.y));
    hardMaskContext.closePath();
    hardMaskContext.fill();
    hardMaskContext.restore();

    const mask = document.createElement("canvas");
    mask.width = context.canvas.width;
    mask.height = context.canvas.height;
    const maskContext = mask.getContext("2d");
    if (!maskContext) return;
    maskContext.filter = `blur(${project.cleanupFeather}px)`;
    maskContext.drawImage(hardMask, 0, 0);
    reconstructionContext.globalCompositeOperation = "destination-in";
    reconstructionContext.drawImage(mask, 0, 0);
    reconstructionContext.globalCompositeOperation = "source-over";
    context.drawImage(reconstruction, 0, 0);
  });
}

export async function renderRoomProject(
  canvas: HTMLCanvasElement,
  project: RoomProject,
  configuration: FeatureWallConfiguration,
  options: {
    comparison?: number;
  } = {},
): Promise<void> {
  canvas.width = project.source.width;
  canvas.height = project.source.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The customer room canvas is unavailable.");
  const room = await cachedImage(project.source.dataUrl);
  const cleanedRoom = project.cleanedSource
    ? await cachedImage(project.cleanedSource.dataUrl)
    : null;
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(room, 0, 0, canvas.width, canvas.height);
  const comparison = options.comparison ?? project.comparison;
  const wallQuad = project.wallQuad.map((point) =>
    imagePoint(point, project.source.width, project.source.height),
  );
  if (comparison > 0 && (cleanedRoom || project.removalPolygons.length > 0)) {
    context.save();
    context.beginPath();
    context.rect(0, 0, canvas.width * comparison, canvas.height);
    context.clip();
    if (cleanedRoom) context.drawImage(cleanedRoom, 0, 0, canvas.width, canvas.height);
    else drawWallCleanup(context, project, wallQuad, room);
    context.restore();
  }
  if (project.scenario === "full-remodel" && project.wallQuad.length === 4) {
    const design = await createDesignLayer(
      configuration,
      "full-remodel",
      project.accessories,
      projectedPixelsPerInch(wallQuad, configuration.wallWidth, configuration.wallHeight),
    );
    context.save();
    context.beginPath();
    context.rect(0, 0, canvas.width * comparison, canvas.height);
    context.clip();
    projectCanvasLayer(context, design, wallQuad);
    await drawProjectedHearth(context, wallQuad, project, configuration);
    context.restore();
  }
  if (project.scenario === "insert" && project.openingQuad.length === 4) {
    const selectedFace = catalogRepository.getFace(
      configuration.fireplaceId,
      configuration.faceOptionId,
    );
    const opening = project.openingQuad.map((point) =>
      imagePoint(point, project.source.width, project.source.height),
    );
    const bounds = faceBoundsWithinOpening(
      project,
      selectedFace.visibleFace.width,
      selectedFace.visibleFace.height,
    );
    const target = [
      bilinear(opening, bounds.left, bounds.top),
      bilinear(opening, bounds.right, bounds.top),
      bilinear(opening, bounds.right, bounds.bottom),
      bilinear(opening, bounds.left, bounds.bottom),
    ];
    const face = await createInsertFaceLayer(
      configuration,
      projectedPixelsPerInch(
        target,
        selectedFace.visibleFace.width,
        selectedFace.visibleFace.height,
      ),
    );
    context.save();
    context.beginPath();
    context.rect(0, 0, canvas.width * comparison, canvas.height);
    context.clip();
    projectCanvasLayer(context, face.canvas, target);
    context.restore();
  }
  if (comparison > 0 && project.foregroundPolygons.length > 0) {
    project.foregroundPolygons.forEach((polygon) => {
      const pixels = polygon.map((point) =>
        imagePoint(point, project.source.width, project.source.height),
      );
      context.save();
      context.beginPath();
      context.rect(0, 0, canvas.width * comparison, canvas.height);
      context.clip();
      context.beginPath();
      context.moveTo(pixels[0]!.x, pixels[0]!.y);
      pixels.slice(1).forEach((pixel) => context.lineTo(pixel.x, pixel.y));
      context.closePath();
      context.clip();
      context.drawImage(room, 0, 0, canvas.width, canvas.height);
      context.restore();
    });
  }
  if (comparison > 0 && comparison < 1) {
    context.strokeStyle = "rgba(255,255,255,.95)";
    context.lineWidth = Math.max(2, canvas.width / 700);
    context.beginPath();
    context.moveTo(canvas.width * comparison, 0);
    context.lineTo(canvas.width * comparison, canvas.height);
    context.stroke();
  }
}
