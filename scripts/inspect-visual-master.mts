import { access } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const argumentsList = process.argv.slice(2);
const sourceArgument = argumentsList[0]?.startsWith("--") ? undefined : argumentsList[0];

function optionValue(name: string): string | undefined {
  const index = argumentsList.indexOf(name);
  return index >= 0 ? argumentsList[index + 1] : undefined;
}

function positiveInteger(name: string, fallback: number): number {
  const raw = optionValue(name);
  if (!raw) return fallback;
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return parsed;
}

function openingBounds(raw: string | undefined) {
  if (!raw) return undefined;
  const values = raw.split(",").map(Number);
  if (values.length !== 4 || values.some((value) => !Number.isInteger(value) || value < 0)) {
    throw new Error("--opening must be left,top,width,height in source pixels");
  }
  const [left, top, width, height] = values as [number, number, number, number];
  if (width <= 0 || height <= 0) throw new Error("Opening width and height must be positive");
  return { left, top, width, height };
}

function transparentRatio(bytes: Buffer, channels: number): number {
  let transparent = 0;
  const pixels = bytes.length / channels;
  for (let offset = channels - 1; offset < bytes.length; offset += channels) {
    if (bytes[offset]! <= 12) transparent += 1;
  }
  return transparent / pixels;
}

if (!sourceArgument || argumentsList.includes("--help")) {
  console.log(`Usage: npm run assets:inspect-master -- <image> [options]

Options:
  --min-width <pixels>       Minimum width after isolation (default 2400)
  --min-height <pixels>      Minimum height after isolation (default 1800)
  --opening <l,t,w,h>        Physical glass opening in source pixels
  --allow-opaque             Do not require an alpha channel
  --allow-non-srgb           Do not require sRGB pixel data
  --require-icc              Require an embedded ICC profile`);
  process.exit(sourceArgument ? 0 : 1);
}

const sourcePath = path.resolve(sourceArgument);
await access(sourcePath);
const minimumWidth = positiveInteger("--min-width", 2400);
const minimumHeight = positiveInteger("--min-height", 1800);
const opening = openingBounds(optionValue("--opening"));
const image = sharp(sourcePath, { failOn: "error" });
const metadata = await image.metadata();
if (!metadata.width || !metadata.height || !metadata.format) {
  throw new Error("Image metadata is incomplete");
}

const errors: string[] = [];
if (!new Set(["png", "tiff"]).has(metadata.format)) {
  errors.push(`Production raster must be lossless PNG or TIFF, received ${metadata.format}`);
}
if (metadata.width < minimumWidth) {
  errors.push(`Width ${metadata.width}px is below ${minimumWidth}px`);
}
if (metadata.height < minimumHeight) {
  errors.push(`Height ${metadata.height}px is below ${minimumHeight}px`);
}
if (!argumentsList.includes("--allow-opaque") && !metadata.hasAlpha) {
  errors.push("An alpha channel is required for product isolation");
}
if (!argumentsList.includes("--allow-non-srgb") && metadata.space !== "srgb") {
  errors.push(`Pixel data must be sRGB, received ${metadata.space ?? "unknown"}`);
}
if (argumentsList.includes("--require-icc") && !metadata.icc) {
  errors.push("An embedded ICC profile is required");
}

const raw = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const overallTransparentRatio = transparentRatio(raw.data, raw.info.channels);
let openingTransparentRatio: number | undefined;
if (opening) {
  if (
    opening.left + opening.width > metadata.width ||
    opening.top + opening.height > metadata.height
  ) {
    errors.push("The declared firebox opening extends outside the image");
  } else {
    const openingPixels = await sharp(sourcePath)
      .extract(opening)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    openingTransparentRatio = transparentRatio(openingPixels.data, openingPixels.info.channels);
    if (openingTransparentRatio < 0.95) {
      errors.push(
        `Only ${(openingTransparentRatio * 100).toFixed(2)}% of the declared firebox opening is transparent`,
      );
    }
  }
}

const report = {
  sourcePath,
  format: metadata.format,
  width: metadata.width,
  height: metadata.height,
  colorSpace: metadata.space,
  hasAlpha: Boolean(metadata.hasAlpha),
  hasEmbeddedIcc: Boolean(metadata.icc),
  overallTransparentPercent: Number((overallTransparentRatio * 100).toFixed(3)),
  openingTransparentPercent:
    openingTransparentRatio === undefined
      ? undefined
      : Number((openingTransparentRatio * 100).toFixed(3)),
  requirement: {
    minimumWidth,
    minimumHeight,
    opening,
    requiresAlpha: !argumentsList.includes("--allow-opaque"),
    requiresSrgb: !argumentsList.includes("--allow-non-srgb"),
    requiresEmbeddedIcc: argumentsList.includes("--require-icc"),
  },
  accepted: errors.length === 0,
  errors,
};

console.log(JSON.stringify(report, null, 2));
if (errors.length > 0) process.exitCode = 1;
