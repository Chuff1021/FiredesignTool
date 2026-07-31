import {
  getFaceOption,
  getFireplaceProduct,
  getHearthstone,
  getMantelFinish,
  getMantelSize,
  getStoneProduct,
} from "@/domain/catalog";
import { getMantelBottom, type FeatureWallConfiguration } from "@/domain/configuration";
import { imagePoint, type NormalizedPoint, type RoomProject } from "@/domain/roomProject";
import { loadImage } from "@/lib/roomImage";

type Point = { x: number; y: number };
type Triangle = [Point, Point, Point];

const imageCache = new Map<string, Promise<HTMLImageElement>>();

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

async function createDesignLayer(
  configuration: FeatureWallConfiguration,
  scenario: RoomProject["scenario"],
): Promise<HTMLCanvasElement> {
  const pixelsPerInch = 6;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(configuration.wallWidth * pixelsPerInch);
  canvas.height = Math.round(configuration.wallHeight * pixelsPerInch);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The room renderer could not start.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";

  const fireplace = getFireplaceProduct(configuration.fireplaceId);
  const face = getFaceOption(configuration.fireplaceId, configuration.faceOptionId);
  const stone = getStoneProduct(configuration.stoneId);
  const mantel = getMantelSize(configuration.mantelProductId, configuration.mantelWidth);
  const mantelFinish = getMantelFinish(
    configuration.mantelProductId,
    configuration.mantelFinishId,
  );
  const hearthstone = getHearthstone(configuration.stoneId);
  const [stoneImage, fireplaceImage, mantelImage, hearthImage] = await Promise.all([
    cachedImage(stone.assets[0]!.localPath),
    cachedImage(face.asset.localPath),
    cachedImage(mantelFinish.assets[0]!.localPath),
    cachedImage(hearthstone.assets[0]!.localPath),
  ]);
  const toX = (inches: number) => (configuration.wallWidth / 2 + inches) * pixelsPerInch;
  const toY = (inches: number) => canvas.height - inches * pixelsPerInch;

  const stoneLeft = toX(-configuration.stoneWidth / 2);
  const stoneWidth = configuration.stoneWidth * pixelsPerInch;
  if (scenario === "full-remodel") {
    drawTexturedRect(context, stoneImage, stoneLeft, 0, stoneWidth, canvas.height, 0.52);
    context.fillStyle = "rgba(20, 16, 12, .07)";
    context.fillRect(stoneLeft, 0, stoneWidth, canvas.height);
  }

  if (
    scenario === "full-remodel" &&
    configuration.hearthEnabled &&
    configuration.fireplaceElevation >= 1.5
  ) {
    const hearthHeight = configuration.fireplaceElevation * pixelsPerInch;
    const hearthLeft = toX(-configuration.stoneWidth / 2);
    const hearthTop = toY(configuration.fireplaceElevation);
    context.fillStyle = "#514941";
    context.fillRect(hearthLeft, hearthTop, stoneWidth, hearthHeight);
    drawTexturedRect(
      context,
      hearthImage,
      hearthLeft,
      hearthTop,
      stoneWidth,
      hearthHeight,
      0.42,
    );
    context.fillStyle = "rgba(255,255,255,.16)";
    context.fillRect(hearthLeft, hearthTop, stoneWidth, Math.max(3, 1.5 * pixelsPerInch));
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

export async function renderRoomProject(
  canvas: HTMLCanvasElement,
  project: RoomProject,
  configuration: FeatureWallConfiguration,
  options: { comparison?: number; markers?: boolean } = {},
): Promise<void> {
  canvas.width = project.source.width;
  canvas.height = project.source.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The customer room canvas is unavailable.");
  const room = await cachedImage(project.source.dataUrl);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(room, 0, 0, canvas.width, canvas.height);
  if (project.wallQuad.length === 4) {
    const design = await createDesignLayer(configuration, project.scenario);
    const quad = project.wallQuad.map((point) =>
      imagePoint(point, project.source.width, project.source.height),
    );
    context.save();
    const comparison = options.comparison ?? project.comparison;
    context.beginPath();
    context.rect(0, 0, canvas.width * comparison, canvas.height);
    context.clip();
    projectLayer(context, design, quad);
    context.restore();
    if (comparison > 0 && comparison < 1) {
      context.strokeStyle = "rgba(255,255,255,.95)";
      context.lineWidth = Math.max(2, canvas.width / 700);
      context.beginPath();
      context.moveTo(canvas.width * comparison, 0);
      context.lineTo(canvas.width * comparison, canvas.height);
      context.stroke();
    }
  }
  if (options.markers) drawCalibrationMarkers(context, project);
}

function drawCalibrationMarkers(context: CanvasRenderingContext2D, project: RoomProject) {
  const drawPoints = (points: NormalizedPoint[], color: string) => {
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
      context.fillText(String(index + 1), pixel.x, pixel.y);
    });
  };
  drawPoints(project.wallQuad, "#e3c69e");
  drawPoints(project.referenceSegment, "#8cb78e");
}
