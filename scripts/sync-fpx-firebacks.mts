import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { FPX_OFFICIAL_FIREBACK_SETS } from "../src/catalog/fpxFirebacks";

const outputDirectory = path.resolve("public/assets/firebacks");
const imageRoot = "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900";

const insertFaceSkus: Readonly<Record<string, string>> = {
  "32-dvs-deluxe-ember-glo": "95300199",
  "430-deluxe-ember-glo": "96800705",
  "430-mod-fyre": "96800705",
  "34-dvl-deluxe-ember-glo": "95300596",
  "616-deluxe-ember-glo": "96900759",
  "616-mod-fyre": "96900759",
};

async function fetchOfficialPng(sourceUrl: string): Promise<Buffer> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(sourceUrl);
      if (!response.ok) throw new Error(`${response.status} from ${sourceUrl}`);
      const contentType = response.headers.get("content-type");
      if (!contentType?.startsWith("image/png")) {
        throw new Error(
          `Expected PNG but received ${contentType ?? "unknown"} from ${sourceUrl}`,
        );
      }
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    }
  }
  throw new Error(`Could not retrieve ${sourceUrl} after four attempts`, { cause: lastError });
}

async function writeTrimmedOfficialLayer(sourceName: string, outputName: string) {
  const sourceUrl = `${imageRoot}/${sourceName}.png`;
  const source = await fetchOfficialPng(sourceUrl);
  await sharp(source)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(outputDirectory, outputName));
}

type SourceLayer = {
  buffer: Buffer;
  outputName: string;
  sourceName: string;
  bounds: { left: number; top: number; width: number; height: number; area: number };
  canvas: { width: number; height: number };
};

async function loadSourceLayer(sourceName: string, outputName: string): Promise<SourceLayer> {
  const sourceUrl = `${imageRoot}/${sourceName}.png`;
  const buffer = await fetchOfficialPng(sourceUrl);
  const metadata = await sharp(buffer).metadata();
  if (!metadata.width || !metadata.height)
    throw new Error(`Missing dimensions for ${sourceUrl}`);
  const corner = await sharp(buffer)
    .ensureAlpha()
    .extract({ left: 0, top: 0, width: 1, height: 1 })
    .raw()
    .toBuffer();
  const trimmed = await sharp(buffer)
    .trim({
      background: {
        r: corner[0] ?? 0,
        g: corner[1] ?? 0,
        b: corner[2] ?? 0,
        alpha: corner[3] ?? 0,
      },
      threshold: 24,
    })
    .png()
    .toBuffer({ resolveWithObject: true });
  const left = -(trimmed.info.trimOffsetLeft ?? 0);
  const top = -(trimmed.info.trimOffsetTop ?? 0);
  return {
    buffer,
    outputName,
    sourceName,
    bounds: {
      left,
      top,
      width: trimmed.info.width,
      height: trimmed.info.height,
      area: trimmed.info.width * trimmed.info.height,
    },
    canvas: { width: metadata.width, height: metadata.height },
  };
}

function registeredFrame(
  productId: string,
  layers: SourceLayer[],
  targetAspect: number,
): { left: number; top: number; width: number; height: number } {
  const first = layers[0];
  if (!first) throw new Error(`No FireBuilder layers were found for ${productId}`);
  for (const layer of layers) {
    if (
      layer.canvas.width !== first.canvas.width ||
      layer.canvas.height !== first.canvas.height
    ) {
      throw new Error(`FireBuilder changed canvas dimensions inside ${productId}`);
    }
  }

  // This legacy 864 endpoint ships a gray, nearly opaque canvas instead of a
  // transparent one. Its manufacturer-composited appliance is registered at
  // the same 596 px horizontal frame in every option; crop that audited frame
  // before the shared glass-opening projection is applied.
  if (productId === "864-trv-31k-clean-face") {
    return { left: 155, top: 267, width: 596, height: 387 };
  }

  // A small number of FireBuilder PNGs contain an almost-opaque black canvas,
  // which makes an alpha trim report the entire 900 px source. Use the shared
  // model geometry from the non-outlier layers instead of allowing one file to
  // destroy registration for every option.
  const minimumArea = Math.min(...layers.map((layer) => layer.bounds.area));
  const registered = layers.filter((layer) => layer.bounds.area <= minimumArea * 2.25);
  if (registered.length === 0) throw new Error(`No stable FireBuilder bounds for ${productId}`);

  const left = Math.min(...registered.map((layer) => layer.bounds.left));
  const top = Math.min(...registered.map((layer) => layer.bounds.top));
  const right = Math.max(...registered.map((layer) => layer.bounds.left + layer.bounds.width));
  const bottom = Math.max(...registered.map((layer) => layer.bounds.top + layer.bounds.height));
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  let width = right - left;
  let height = bottom - top;
  if (width / height < targetAspect) width = Math.max(width, Math.round(height * targetAspect));
  else height = Math.max(height, Math.round(width / targetAspect));
  width = Math.min(first.canvas.width, Math.ceil(width));
  height = Math.min(first.canvas.height, Math.ceil(height));
  const frameLeft = Math.max(
    0,
    Math.min(first.canvas.width - width, Math.round(centerX - width / 2)),
  );
  const frameTop = Math.max(
    0,
    Math.min(first.canvas.height - height, Math.round(centerY - height / 2)),
  );
  return { left: frameLeft, top: frameTop, width, height };
}

await mkdir(outputDirectory, { recursive: true });

for (const [productId, firebackSet] of Object.entries(FPX_OFFICIAL_FIREBACK_SETS)) {
  const layers = await Promise.all(
    firebackSet.options.map((fireback) => {
      const sourceName = [
        firebackSet.modelSku,
        fireback.fireBuilderSku,
        ...firebackSet.defaultMediaSkus,
      ].join("_");
      return loadSourceLayer(sourceName, `${productId}-${fireback.id}.png`);
    }),
  );
  const frame = registeredFrame(
    productId,
    layers,
    firebackSet.viewingArea.width / firebackSet.viewingArea.height,
  );
  for (const layer of layers) {
    await sharp(layer.buffer)
      .extract(frame)
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(path.join(outputDirectory, layer.outputName));
  }
}

for (const [productId, faceSku] of Object.entries(insertFaceSkus)) {
  await writeTrimmedOfficialLayer(faceSku, `${productId}-face-metropolitan.png`);
}

console.log(
  `Prepared ${Object.values(FPX_OFFICIAL_FIREBACK_SETS).reduce(
    (total, set) => total + set.options.length,
    0,
  )} exact FireBuilder configurations and ${Object.keys(insertFaceSkus).length} insert face layers.`,
);
