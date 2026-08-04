import { catalogRepository } from "@/domain/catalogRepository";
import { getMantelBottom, type FeatureWallConfiguration } from "@/domain/configuration";
import {
  builtInAvailableWidth,
  faceBoundsWithinOpening,
  imagePoint,
  type BuiltInSide,
  type NormalizedPoint,
  type RoomProject,
} from "@/domain/roomProject";
import { loadImage } from "@/lib/roomImage";

type Point = { x: number; y: number };
type Triangle = [Point, Point, Point];

const imageCache = new Map<string, Promise<HTMLImageElement>>();
const MIN_DESIGN_PIXELS_PER_INCH = 6;
const MAX_DESIGN_CANVAS_EDGE = 4096;
const MAX_DESIGN_CANVAS_PIXELS = 4096 * 2160;

function pointDistance(first: Point, second: Point): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
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

function drawTexturedRect(
  context: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number,
  scale = 1,
) {
  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  const tileWidth = Math.max(140, image.naturalWidth * scale);
  const tileHeight = Math.max(90, image.naturalHeight * scale);
  for (let top = y - tileHeight; top < y + height + tileHeight; top += tileHeight) {
    for (let left = x - tileWidth; left < x + width + tileWidth; left += tileWidth) {
      context.drawImage(image, left, top, tileWidth + 1, tileHeight + 1);
    }
  }
  context.restore();
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
  const stone = catalogRepository.getStone(configuration.stoneId);
  const mantel = catalogRepository.getMantelSize(
    configuration.mantelProductId,
    configuration.mantelWidth,
  );
  const mantelFinish = catalogRepository.getMantelFinish(
    configuration.mantelProductId,
    configuration.mantelFinishId,
  );
  const [stoneImage, fireplaceImage, mantelImage] = await Promise.all([
    cachedImage(stone.assets[0]!.localPath),
    cachedImage(face.asset.localPath),
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
    drawTexturedRect(
      context,
      mantelImage,
      mantelLeft,
      mantelTop,
      mantelWidth,
      mantelHeight,
      0.7,
    );
    const shade = context.createLinearGradient(0, mantelTop, 0, mantelTop + mantelHeight);
    shade.addColorStop(0, "rgba(255,255,255,.16)");
    shade.addColorStop(1, "rgba(0,0,0,.14)");
    context.fillStyle = shade;
    context.fillRect(mantelLeft, mantelTop, mantelWidth, mantelHeight);
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
  const image = await cachedImage(face.asset.localPath);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(face.visibleFace.width * pixelsPerInch);
  canvas.height = Math.round(face.visibleFace.height * pixelsPerInch);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The insert renderer could not start.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
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

function drawTriangle(
  context: CanvasRenderingContext2D,
  image: CanvasImageSource,
  source: Triangle,
  destination: Triangle,
) {
  const [s0, s1, s2] = source;
  const [d0, d1, d2] = destination;
  const determinant = s0.x * (s1.y - s2.y) + s1.x * (s2.y - s0.y) + s2.x * (s0.y - s1.y);
  if (Math.abs(determinant) < 0.0001) return;
  const a = (d0.x * (s1.y - s2.y) + d1.x * (s2.y - s0.y) + d2.x * (s0.y - s1.y)) / determinant;
  const b = (d0.y * (s1.y - s2.y) + d1.y * (s2.y - s0.y) + d2.y * (s0.y - s1.y)) / determinant;
  const c = (d0.x * (s2.x - s1.x) + d1.x * (s0.x - s2.x) + d2.x * (s1.x - s0.x)) / determinant;
  const d = (d0.y * (s2.x - s1.x) + d1.y * (s0.x - s2.x) + d2.y * (s1.x - s0.x)) / determinant;
  const e =
    (d0.x * (s1.x * s2.y - s2.x * s1.y) +
      d1.x * (s2.x * s0.y - s0.x * s2.y) +
      d2.x * (s0.x * s1.y - s1.x * s0.y)) /
    determinant;
  const f =
    (d0.y * (s1.x * s2.y - s2.x * s1.y) +
      d1.y * (s2.x * s0.y - s0.x * s2.y) +
      d2.y * (s0.x * s1.y - s1.x * s0.y)) /
    determinant;
  context.save();
  context.beginPath();
  context.moveTo(d0.x, d0.y);
  context.lineTo(d1.x, d1.y);
  context.lineTo(d2.x, d2.y);
  context.closePath();
  context.clip();
  context.transform(a, b, c, d, e, f);
  context.drawImage(image, 0, 0);
  context.restore();
}

function projectLayer(
  context: CanvasRenderingContext2D,
  layer: HTMLCanvasElement,
  quad: Point[],
) {
  const columns = 18;
  const rows = 12;
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const u0 = column / columns;
      const u1 = (column + 1) / columns;
      const v0 = row / rows;
      const v1 = (row + 1) / rows;
      const sourceTopLeft = { x: u0 * layer.width, y: v0 * layer.height };
      const sourceTopRight = { x: u1 * layer.width, y: v0 * layer.height };
      const sourceBottomRight = { x: u1 * layer.width, y: v1 * layer.height };
      const sourceBottomLeft = { x: u0 * layer.width, y: v1 * layer.height };
      const targetTopLeft = bilinear(quad, u0, v0);
      const targetTopRight = bilinear(quad, u1, v0);
      const targetBottomRight = bilinear(quad, u1, v1);
      const targetBottomLeft = bilinear(quad, u0, v1);
      drawTriangle(
        context,
        layer,
        [sourceTopLeft, sourceTopRight, sourceBottomRight],
        [targetTopLeft, targetTopRight, targetBottomRight],
      );
      drawTriangle(
        context,
        layer,
        [sourceTopLeft, sourceBottomRight, sourceBottomLeft],
        [targetTopLeft, targetBottomRight, targetBottomLeft],
      );
    }
  }
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

function textureCanvas(
  image: HTMLImageElement,
  width: number,
  height: number,
  pixelsPerInch: number,
  treatment: "top" | "riser",
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(2, Math.round(width * pixelsPerInch));
  canvas.height = Math.max(2, Math.round(height * pixelsPerInch));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The hearth renderer could not start.");
  drawTexturedRect(context, image, 0, 0, canvas.width, canvas.height, 0.48);
  const shade = context.createLinearGradient(0, 0, 0, canvas.height);
  if (treatment === "top") {
    shade.addColorStop(0, "rgba(255,255,255,.2)");
    shade.addColorStop(1, "rgba(0,0,0,.08)");
  } else {
    shade.addColorStop(0, "rgba(0,0,0,.08)");
    shade.addColorStop(1, "rgba(0,0,0,.27)");
  }
  context.fillStyle = shade;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = treatment === "top" ? "rgba(255,255,255,.22)" : "rgba(0,0,0,.2)";
  context.lineWidth = Math.max(1, pixelsPerInch * 0.12);
  const capWidth = 20 * pixelsPerInch;
  for (let x = capWidth; x < canvas.width; x += capWidth) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, canvas.height);
    context.stroke();
  }
  return canvas;
}

async function drawProjectedHearth(
  context: CanvasRenderingContext2D,
  quad: Point[],
  configuration: FeatureWallConfiguration,
) {
  if (!configuration.hearthEnabled || configuration.fireplaceElevation < 1.5) return;
  const stone = catalogRepository.getStone(configuration.stoneId);
  const hearthImage = await cachedImage(stone.hearthstone.assets[0]!.localPath);
  const bottomWidth = pointDistance(quad[3]!, quad[2]!);
  const destinationPixelsPerInch = bottomWidth / configuration.wallWidth;
  const direction = averageFloorDirection(quad);
  const depthInches = 20;
  const projectedDepth = Math.max(4, depthInches * destinationPixelsPerInch * 0.38);
  const offset = { x: direction.x * projectedDepth, y: direction.y * projectedDepth };
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
  const rearLeftBottom = wallPhysicalPoint(quad, configuration, -halfWidth, 0);
  const rearRightBottom = wallPhysicalPoint(quad, configuration, halfWidth, 0);
  const frontLeftTop = { x: rearLeftTop.x + offset.x, y: rearLeftTop.y + offset.y };
  const frontRightTop = { x: rearRightTop.x + offset.x, y: rearRightTop.y + offset.y };
  const frontLeftBottom = { x: rearLeftBottom.x + offset.x, y: rearLeftBottom.y + offset.y };
  const frontRightBottom = { x: rearRightBottom.x + offset.x, y: rearRightBottom.y + offset.y };
  const textureScale = Math.max(4, destinationPixelsPerInch);
  const riser = textureCanvas(
    hearthImage,
    configuration.stoneWidth,
    configuration.fireplaceElevation,
    textureScale,
    "riser",
  );
  const top = textureCanvas(
    hearthImage,
    configuration.stoneWidth,
    depthInches,
    textureScale,
    "top",
  );

  context.save();
  context.shadowColor = "rgba(0,0,0,.42)";
  context.shadowBlur = Math.max(4, projectedDepth * 0.3);
  context.shadowOffsetY = Math.max(2, projectedDepth * 0.14);
  projectLayer(context, riser, [
    frontLeftTop,
    frontRightTop,
    frontRightBottom,
    frontLeftBottom,
  ]);
  context.restore();
  projectLayer(context, top, [rearLeftTop, rearRightTop, frontRightTop, frontLeftTop]);
  context.save();
  context.strokeStyle = "rgba(245,235,220,.24)";
  context.lineWidth = Math.max(1, destinationPixelsPerInch * 0.3);
  context.beginPath();
  context.moveTo(frontLeftTop.x, frontLeftTop.y);
  context.lineTo(frontRightTop.x, frontRightTop.y);
  context.stroke();
  context.restore();
}

export async function renderRoomProject(
  canvas: HTMLCanvasElement,
  project: RoomProject,
  configuration: FeatureWallConfiguration,
  options: {
    comparison?: number;
    markers?: boolean;
    foregroundDraft?: NormalizedPoint[];
  } = {},
): Promise<void> {
  canvas.width = project.source.width;
  canvas.height = project.source.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The customer room canvas is unavailable.");
  const room = await cachedImage(project.source.dataUrl);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(room, 0, 0, canvas.width, canvas.height);
  const comparison = options.comparison ?? project.comparison;
  if (project.scenario === "full-remodel" && project.wallQuad.length === 4) {
    const wallQuad = project.wallQuad.map((point) =>
      imagePoint(point, project.source.width, project.source.height),
    );
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
    projectLayer(context, design, wallQuad);
    await drawProjectedHearth(context, wallQuad, configuration);
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
    projectLayer(context, face.canvas, target);
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
  if (options.markers) drawCalibrationMarkers(context, project);
  if (options.foregroundDraft) {
    drawForegroundMarkers(context, project, options.foregroundDraft);
  }
}

function drawForegroundMarkers(
  context: CanvasRenderingContext2D,
  project: RoomProject,
  draft: NormalizedPoint[],
) {
  const polygons = [...project.foregroundPolygons, draft].filter(
    (polygon) => polygon.length > 0,
  );
  polygons.forEach((polygon, polygonIndex) => {
    const pixels = polygon.map((point) =>
      imagePoint(point, project.source.width, project.source.height),
    );
    context.save();
    context.beginPath();
    context.strokeStyle = "rgba(240, 174, 105, .98)";
    context.fillStyle = "rgba(240, 174, 105, .14)";
    context.lineWidth = Math.max(2, project.source.width / 800);
    context.setLineDash([Math.max(7, project.source.width / 150), 5]);
    context.moveTo(pixels[0]!.x, pixels[0]!.y);
    pixels.slice(1).forEach((pixel) => context.lineTo(pixel.x, pixel.y));
    if (polygonIndex < project.foregroundPolygons.length) context.closePath();
    context.fill();
    context.stroke();
    context.restore();
    pixels.forEach((pixel, pointIndex) => {
      context.beginPath();
      context.fillStyle = "#f0ae69";
      context.strokeStyle = "rgba(15,13,11,.9)";
      context.lineWidth = Math.max(2, project.source.width / 900);
      context.arc(pixel.x, pixel.y, Math.max(6, project.source.width / 180), 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = "#17130f";
      context.font = `600 ${Math.max(10, project.source.width / 125)}px sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(`${pointIndex + 1}`, pixel.x, pixel.y);
    });
  });
}

function drawCalibrationMarkers(context: CanvasRenderingContext2D, project: RoomProject) {
  const drawOutline = (points: NormalizedPoint[], color: string) => {
    if (points.length < 2) return;
    const pixels = points.map((point) =>
      imagePoint(point, project.source.width, project.source.height),
    );
    context.save();
    context.beginPath();
    context.strokeStyle = color;
    context.lineWidth = Math.max(2, project.source.width / 900);
    context.setLineDash([Math.max(7, project.source.width / 140), 6]);
    context.moveTo(pixels[0]!.x, pixels[0]!.y);
    pixels.slice(1).forEach((pixel) => context.lineTo(pixel.x, pixel.y));
    if (pixels.length === 4) context.closePath();
    context.stroke();
    context.restore();
  };
  const drawPoints = (points: NormalizedPoint[], color: string, prefix = "") => {
    points.forEach((point, index) => {
      const pixel = imagePoint(point, project.source.width, project.source.height);
      context.beginPath();
      context.fillStyle = color;
      context.strokeStyle = "rgba(15,13,11,.9)";
      context.lineWidth = Math.max(2, project.source.width / 800);
      context.arc(pixel.x, pixel.y, Math.max(7, project.source.width / 160), 0, Math.PI * 2);
      context.fill();
      context.stroke();
      context.fillStyle = "#17130f";
      context.font = `600 ${Math.max(11, project.source.width / 110)}px sans-serif`;
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(`${prefix}${index + 1}`, pixel.x, pixel.y);
    });
  };
  drawOutline(project.wallQuad, "rgba(227,198,158,.9)");
  drawOutline(project.referenceSegment, "rgba(140,183,142,.9)");
  drawPoints(project.wallQuad, "#e3c69e");
  drawPoints(project.referenceSegment, "#8cb78e");
  if (project.scenario === "insert") {
    drawOutline(project.openingQuad, "rgba(121,182,201,.95)");
    drawPoints(project.openingQuad, "#79b6c9", "O");
  }
}
