import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "assets-source");
const output = path.join(root, "public", "assets");

await mkdir(output, { recursive: true });

await sharp(path.join(source, "fpx-864-clean-oak-900.png"))
  // FireBuilder includes a faint document border, so use the calibrated
  // product bounds instead of alpha-trim.
  .extract({ left: 142, top: 233, width: 624, height: 468 })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(path.join(output, "fpx-864-trv-31k-clean-face.png"));

const standardBase = await sharp(path.join(source, "fpx-864-standard-oak-900.png"))
  .extract({ left: 120, top: 155, width: 660, height: 570 })
  .png()
  .toBuffer();

const standardFaces = [
  ["99300497", "fpx-864-classic-arch.png"],
  ["95800616", "fpx-864-arched-french-country.png"],
  ["95800623", "fpx-864-metropolitan.png"],
  ["95800743", "fpx-864-rectangle-double-door.png"],
];

async function makeExactDesignerFace(sku, filename) {
  const face = await sharp(path.join(source, `fpx-face-${sku}-900.png`))
    .extract({ left: 120, top: 155, width: 660, height: 570 })
    .ensureAlpha()
    .png()
    .toBuffer();

  await sharp(face)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(output, filename.replace(".png", "-overlay.png")));

  const { data, info } = await sharp(face)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixelCount = info.width * info.height;
  const visited = new Uint8Array(pixelCount);
  const openingPixels = [];
  const components = [];

  for (let start = 0; start < pixelCount; start += 1) {
    if (visited[start] || data[start * 4 + 3] > 16) continue;
    const stack = [start];
    const pixels = [];
    visited[start] = 1;
    let touchesBorder = false;
    let minX = info.width;
    let minY = info.height;
    let maxX = 0;
    let maxY = 0;

    while (stack.length > 0) {
      const pixel = stack.pop();
      if (pixel === undefined) continue;
      const x = pixel % info.width;
      const y = Math.floor(pixel / info.width);
      pixels.push(pixel);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1) {
        touchesBorder = true;
      }

      for (const neighbor of [pixel - 1, pixel + 1, pixel - info.width, pixel + info.width]) {
        if (neighbor < 0 || neighbor >= pixelCount || visited[neighbor]) continue;
        const neighborX = neighbor % info.width;
        if (Math.abs(neighborX - x) > 1 || data[neighbor * 4 + 3] > 16) continue;
        visited[neighbor] = 1;
        stack.push(neighbor);
      }
    }

    if (!touchesBorder && pixels.length > 10_000) {
      components.push({ pixels, minX, minY, maxX, maxY });
    }
  }

  if (components.length === 0) throw new Error(`No enclosed glass opening found for ${sku}.`);
  const bounds = components.reduce(
    (result, component) => ({
      minX: Math.min(result.minX, component.minX),
      minY: Math.min(result.minY, component.minY),
      maxX: Math.max(result.maxX, component.maxX),
      maxY: Math.max(result.maxY, component.maxY),
    }),
    { minX: info.width, minY: info.height, maxX: 0, maxY: 0 },
  );
  for (const component of components) {
    for (const pixel of component.pixels) openingPixels.push(pixel);
  }
  const mask = Buffer.alloc(pixelCount);
  for (const pixel of openingPixels) mask[pixel] = 255;
  const maskWidth = bounds.maxX - bounds.minX + 1;
  const maskHeight = bounds.maxY - bounds.minY + 1;
  await sharp(mask, { raw: { width: info.width, height: info.height, channels: 1 } })
    .extract({ left: bounds.minX, top: bounds.minY, width: maskWidth, height: maskHeight })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(output, filename.replace(".png", "-media-mask.png")));
}

for (const [sku, filename] of standardFaces) {
  const face = await sharp(path.join(source, `fpx-face-${sku}-900.png`))
    .extract({ left: 120, top: 155, width: 660, height: 570 })
    .png()
    .toBuffer();
  await sharp(standardBase)
    .composite([{ input: face }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(output, filename));
  await makeExactDesignerFace(sku, filename);
}

async function alphaBounds(input) {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let minY = info.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[(y * info.width + x) * 4 + 3] <= 16) continue;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  if (maxX < minX || maxY < minY) throw new Error("Transparent asset has no visible pixels.");
  return { left: minX, top: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
}

async function prepareStaticWoodFireplace({ face, door, outputName }) {
  const facePath = path.join(source, face);
  const composite = door
    ? await sharp(facePath)
        .ensureAlpha()
        .composite([{ input: path.join(source, door) }])
        .png()
        .toBuffer()
    : await sharp(facePath).ensureAlpha().png().toBuffer();
  const bounds = await alphaBounds(composite);

  await sharp(composite)
    .extract(bounds)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(output, outputName));
}

for (const fireplace of [
  {
    face: "fpx-42-apex-face-95500451.png",
    outputName: "fpx-42-apex-timberline.png",
  },
  {
    face: "fpx-42-apex-face-95500452.png",
    outputName: "fpx-42-apex-metropolitan.png",
  },
  {
    face: "fpx-42-apex-face-95500453.png",
    outputName: "fpx-42-apex-universal.png",
  },
  {
    face: "fpx-36-elite-face-98500556.png",
    door: "fpx-36-elite-door-98500458.png",
    outputName: "fpx-36-elite-classic-single-door.png",
  },
  {
    face: "fpx-36-elite-face-98500556.png",
    door: "fpx-36-elite-door-98500456.png",
    outputName: "fpx-36-elite-classic-double-door.png",
  },
  {
    face: "fpx-36-elite-face-98500559.png",
    door: "fpx-36-elite-door-98500459.png",
    outputName: "fpx-36-elite-artisan-single-door.png",
  },
  {
    face: "fpx-44-elite-face-98500575.png",
    door: "fpx-44-elite-door-98500471.png",
    outputName: "fpx-44-elite-classic-double-door.png",
  },
  {
    face: "fpx-44-elite-face-98500590.png",
    door: "fpx-44-elite-door-98500472.png",
    outputName: "fpx-44-elite-artisan-double-door.png",
  },
]) {
  await prepareStaticWoodFireplace(fireplace);
}

async function enclosedOpeningMask(face, filename) {
  const { data, info } = await sharp(face)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixelCount = info.width * info.height;
  const visited = new Uint8Array(pixelCount);
  const components = [];

  for (let start = 0; start < pixelCount; start += 1) {
    if (visited[start] || data[start * 4 + 3] > 16) continue;
    const stack = [start];
    const pixels = [];
    visited[start] = 1;
    let touchesBorder = false;
    let minX = info.width;
    let minY = info.height;
    let maxX = 0;
    let maxY = 0;

    while (stack.length > 0) {
      const pixel = stack.pop();
      if (pixel === undefined) continue;
      const x = pixel % info.width;
      const y = Math.floor(pixel / info.width);
      pixels.push(pixel);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      if (x === 0 || y === 0 || x === info.width - 1 || y === info.height - 1) {
        touchesBorder = true;
      }
      for (const neighbor of [pixel - 1, pixel + 1, pixel - info.width, pixel + info.width]) {
        if (neighbor < 0 || neighbor >= pixelCount || visited[neighbor]) continue;
        const neighborX = neighbor % info.width;
        if (Math.abs(neighborX - x) > 1 || data[neighbor * 4 + 3] > 16) continue;
        visited[neighbor] = 1;
        stack.push(neighbor);
      }
    }

    if (!touchesBorder && pixels.length > 30_000) {
      components.push({ pixels, minX, minY, maxX, maxY });
    }
  }

  if (components.length === 0)
    throw new Error(`No enclosed glass opening found for ${filename}.`);
  const bounds = components.reduce(
    (result, component) => ({
      minX: Math.min(result.minX, component.minX),
      minY: Math.min(result.minY, component.minY),
      maxX: Math.max(result.maxX, component.maxX),
      maxY: Math.max(result.maxY, component.maxY),
    }),
    { minX: info.width, minY: info.height, maxX: 0, maxY: 0 },
  );
  const mask = Buffer.alloc(pixelCount);
  for (const component of components) {
    for (const pixel of component.pixels) mask[pixel] = 255;
  }
  await sharp(mask, { raw: { width: info.width, height: info.height, channels: 1 } })
    .extract({
      left: bounds.minX,
      top: bounds.minY,
      width: bounds.maxX - bounds.minX + 1,
      height: bounds.maxY - bounds.minY + 1,
    })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(output, filename));
}

const face564Sources = [
  { id: "classic-arch", source: "fpx-564-face-95400402-1800.png" },
  { id: "french-country", source: "fpx-564-face-95400408-1800.png" },
  { id: "metropolitan", source: "fpx-564-face-95400411-1800.png" },
  { id: "rectangle-double-door", source: "fpx-564-face-95400467-1800.png" },
  { id: "clean-face", source: "fpx-564-trim-95900370-1800.png" },
];

for (const faceDefinition of face564Sources) {
  const rawFace = path.join(source, faceDefinition.source);
  const bounds = await alphaBounds(rawFace);
  const face = await sharp(rawFace).extract(bounds).ensureAlpha().png().toBuffer();
  await sharp(face)
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(output, `fpx-564-${faceDefinition.id}-overlay.png`));
  await enclosedOpeningMask(face, `fpx-564-${faceDefinition.id}-media-mask.png`);

  for (const model of [
    { id: "trv-25k", source: "fpx-564-25k-oak-1800.png" },
    { id: "tv-35k", source: "fpx-564-35k-oak-1800.png" },
  ]) {
    const base = await sharp(path.join(source, model.source)).extract(bounds).png().toBuffer();
    await sharp(base)
      .composite([{ input: face }])
      .png({ compressionLevel: 9, adaptiveFiltering: true })
      .toFile(path.join(output, `fpx-564-${model.id}-${faceDefinition.id}.png`));
  }
}

await sharp(path.join(source, "fpx-564-25k-poster-master.webp"))
  .webp({ quality: 94, smartSubsample: true, effort: 6 })
  .toFile(path.join(output, "fpx-564-25k-burn-poster.webp"));
await sharp(path.join(source, "fpx-564-35k-poster-master.webp"))
  .webp({ quality: 94, smartSubsample: true, effort: 6 })
  .toFile(path.join(output, "fpx-564-35k-burn-poster.webp"));

await sharp(path.join(source, "fpx-4237-clean-birch-900.png"))
  .extract({ left: 155, top: 205, width: 600, height: 518 })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(path.join(output, "fpx-4237-clean-face.png"));

async function makeFireplaceOverlay({ filename, width, height, openingPath }) {
  const mask = Buffer.from(
    `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <mask id="opening"><rect width="100%" height="100%" fill="white"/><path d="${openingPath}" fill="black"/></mask>
      <rect width="100%" height="100%" fill="white" mask="url(#opening)"/>
    </svg>`,
  );
  await sharp(path.join(output, filename))
    .ensureAlpha()
    .composite([{ input: mask, blend: "dest-in" }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(output, filename.replace(".png", "-overlay.png")));
}

await makeFireplaceOverlay({
  filename: "fpx-864-trv-31k-clean-face.png",
  width: 624,
  height: 468,
  openingPath: "M51 64 H573 V404 H51 Z",
});
await makeFireplaceOverlay({
  filename: "fpx-4237-clean-face.png",
  width: 600,
  height: 518,
  openingPath: "M26 27 H574 V491 H26 Z",
});

await sharp({
  create: { width: 16, height: 16, channels: 3, background: "#ffffff" },
})
  .png({ compressionLevel: 9 })
  .toFile(path.join(output, "firebox-media-mask-rect.png"));

const stoneAtlasWidth = 4096;
const stoneAtlasHeight = 3072;
const stoneTileWidth = stoneAtlasWidth / 4;
const stoneTileHeight = stoneAtlasHeight / 4;

function featherMask(width, height, axis) {
  const gradient =
    axis === "x"
      ? `<linearGradient id="fade"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset=".5" stop-color="white" stop-opacity=".96"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>`
      : `<linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="white" stop-opacity="0"/><stop offset=".5" stop-color="white" stop-opacity=".96"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient>`;
  return Buffer.from(
    `<svg width="${width}" height="${height}">${gradient}<rect width="100%" height="100%" fill="url(#fade)"/></svg>`,
  );
}

async function stoneVariant(sourceBuffer, width, height, index) {
  const overscanX = 128;
  const overscanY = 96;
  const x = (index * 47) % (overscanX + 1);
  const y = (index * 29) % (overscanY + 1);
  let pipeline = sharp(sourceBuffer).resize(width + overscanX, height + overscanY, {
    fit: "cover",
    position: "centre",
    kernel: sharp.kernel.lanczos3,
  });
  if (index % 2 === 1) pipeline = pipeline.flop();
  return pipeline.extract({ left: x, top: y, width, height }).png().toBuffer();
}

async function makeStoneAtlas(sourceName) {
  const sourcePath = path.join(source, sourceName);
  const metadata = await sharp(sourcePath).rotate().metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not inspect stone swatch: ${sourceName}`);
  }
  const insetX = Math.max(2, Math.round(metadata.width * 0.03));
  const insetY = Math.max(2, Math.round(metadata.height * 0.03));
  const sourceBuffer = await sharp(sourcePath)
    .rotate()
    .extract({
      left: insetX,
      top: insetY,
      width: metadata.width - insetX * 2,
      height: metadata.height - insetY * 2,
    })
    .png()
    .toBuffer();

  const baseTiles = [];
  for (let row = 0; row < 4; row += 1) {
    for (let column = 0; column < 4; column += 1) {
      const index = row * 4 + column;
      baseTiles.push({
        input: await stoneVariant(sourceBuffer, stoneTileWidth, stoneTileHeight, index),
        left: column * stoneTileWidth,
        top: row * stoneTileHeight,
      });
    }
  }

  let atlas = await sharp({
    create: {
      width: stoneAtlasWidth,
      height: stoneAtlasHeight,
      channels: 3,
      background: "#6f6558",
    },
  })
    .composite(baseTiles)
    .png()
    .toBuffer();

  const verticalPatchWidth = 384;
  const verticalPatches = [];
  for (let seam = 1; seam < 4; seam += 1) {
    for (let row = 0; row < 4; row += 1) {
      const patch = await stoneVariant(
        sourceBuffer,
        verticalPatchWidth,
        stoneTileHeight,
        20 + seam * 5 + row,
      );
      const feathered = await sharp(patch)
        .ensureAlpha()
        .composite([
          {
            input: featherMask(verticalPatchWidth, stoneTileHeight, "x"),
            blend: "dest-in",
          },
        ])
        .png()
        .toBuffer();
      verticalPatches.push({
        input: feathered,
        left: seam * stoneTileWidth - verticalPatchWidth / 2,
        top: row * stoneTileHeight,
      });
    }
  }
  atlas = await sharp(atlas).composite(verticalPatches).png().toBuffer();

  const horizontalPatchHeight = 288;
  const horizontalPatches = [];
  for (let seam = 1; seam < 4; seam += 1) {
    for (let column = 0; column < 4; column += 1) {
      const patch = await stoneVariant(
        sourceBuffer,
        stoneTileWidth,
        horizontalPatchHeight,
        40 + seam * 7 + column,
      );
      const feathered = await sharp(patch)
        .ensureAlpha()
        .composite([
          {
            input: featherMask(stoneTileWidth, horizontalPatchHeight, "y"),
            blend: "dest-in",
          },
        ])
        .png()
        .toBuffer();
      horizontalPatches.push({
        input: feathered,
        left: column * stoneTileWidth,
        top: seam * stoneTileHeight - horizontalPatchHeight / 2,
      });
    }
  }

  return sharp(atlas).composite(horizontalPatches).png().toBuffer();
}

for (const stone of [
  {
    sourceName: "centurion-kentucky-ledge.jpg",
    outputName: "centurion-kentucky-ledge",
  },
  {
    sourceName: "centurion-brown-ledge.webp",
    outputName: "centurion-brown-ledge",
  },
]) {
  const atlas = await makeStoneAtlas(stone.sourceName);
  await sharp(atlas)
    .webp({ quality: 94, smartSubsample: true, effort: 6 })
    .toFile(path.join(output, `${stone.outputName}.webp`));

  await sharp(atlas)
    .greyscale()
    .normalise()
    .blur(0.7)
    .webp({ quality: 90, effort: 6 })
    .toFile(path.join(output, `${stone.outputName}-bump.webp`));
}

const mantelSources = [
  {
    id: "whitewash",
    front: "pearl-zachary-whitewash-front.jpg",
    top: "pearl-zachary-whitewash-top.jpg",
  },
  {
    id: "graywash",
    front: "pearl-zachary-graywash-front.jpg",
    top: "pearl-zachary-graywash-top.jpg",
  },
  {
    id: "little-river",
    front: "pearl-zachary-little-river-front.jpg",
    top: "pearl-zachary-little-river-top.jpg",
  },
  {
    id: "pearl",
    front: "pearl-ncl-60-pearl.jpg",
    top: "pearl-ncl-60-pearl.jpg",
  },
  {
    id: "graphite",
    front: "pearl-linear-graphite.jpg",
    top: "pearl-linear-graphite.jpg",
  },
  {
    id: "mocha",
    front: "pearl-linear-mocha.jpg",
    top: "pearl-linear-mocha.jpg",
  },
  {
    id: "onyx",
    front: "pearl-linear-onyx.jpg",
    top: "pearl-linear-onyx.jpg",
  },
  {
    id: "saddle",
    front: "pearl-linear-saddle.jpg",
    top: "pearl-linear-saddle.jpg",
  },
  {
    id: "tavern-fieldstone",
    front: "pearl-tavern-fieldstone-front.jpg",
    top: "pearl-tavern-fieldstone-top.jpg",
    frontHeight: 267,
    frontBottomInset: 0.12,
  },
  {
    id: "tavern-river-rock",
    front: "pearl-tavern-river-rock-front.jpg",
    top: "pearl-tavern-river-rock-top.jpg",
    frontHeight: 267,
    frontBottomInset: 0.12,
  },
  {
    id: "tavern-toasted-rye",
    front: "pearl-tavern-toasted-rye-front.jpg",
    top: "pearl-tavern-toasted-rye-top.jpg",
    frontHeight: 267,
    frontBottomInset: 0.12,
  },
  {
    id: "tavern-wheat",
    front: "pearl-tavern-wheat-front.jpg",
    top: "pearl-tavern-wheat-top.jpg",
    frontHeight: 267,
    frontBottomInset: 0.12,
  },
  {
    id: "cut-stone-mist",
    front: "pearl-cut-stone-mist-front.jpg",
    top: "pearl-cut-stone-mist-top.jpg",
    frontHeight: 167,
    frontBottomInset: 0.1,
  },
  {
    id: "cut-stone-dusk",
    front: "pearl-cut-stone-dusk-front.jpg",
    top: "pearl-cut-stone-dusk-top.jpg",
    frontHeight: 167,
    frontBottomInset: 0.1,
  },
  {
    id: "cut-stone-arctic-blast",
    front: "pearl-cut-stone-arctic-front.jpg",
    top: "pearl-cut-stone-arctic-top.jpg",
    frontHeight: 167,
    frontBottomInset: 0.1,
  },
  {
    id: "cut-stone-greystone",
    front: "pearl-cut-stone-greystone-front.jpg",
    top: "pearl-cut-stone-greystone-top.jpg",
    frontHeight: 167,
    frontBottomInset: 0.1,
  },
];

async function trimProductPhoto(sourceName) {
  return sharp(path.join(source, sourceName))
    .rotate()
    .trim({ background: "#ffffff", threshold: 18 })
    .png()
    .toBuffer();
}

async function mantelFaceMap(sourceName, face, frontHeight = 160, frontBottomInset = 0) {
  const product = await trimProductPhoto(sourceName);
  const metadata = await sharp(product).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not inspect mantel reference: ${sourceName}`);
  }
  const insetX = Math.round(metadata.width * 0.035);
  const top = face === "top" ? 0 : Math.round(metadata.height * 0.4);
  const bottomInset = face === "top" ? 0 : Math.round(metadata.height * frontBottomInset);
  const height =
    face === "top"
      ? Math.max(1, Math.round(metadata.height * 0.36))
      : metadata.height - top - bottomInset;
  return sharp(product)
    .extract({
      left: insetX,
      top,
      width: metadata.width - insetX * 2,
      height,
    })
    .resize(2400, face === "top" ? 300 : frontHeight, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();
}

for (const mantel of mantelSources) {
  const front = await mantelFaceMap(
    mantel.front,
    "front",
    mantel.frontHeight,
    mantel.frontBottomInset,
  );
  const top = await mantelFaceMap(mantel.top, "top", mantel.frontHeight);

  await sharp(front)
    .webp({ quality: 94, smartSubsample: true, effort: 6 })
    .toFile(path.join(output, `pearl-${mantel.id}-front.webp`));

  await sharp(top)
    .webp({ quality: 94, smartSubsample: true, effort: 6 })
    .toFile(path.join(output, `pearl-${mantel.id}-top.webp`));

  await sharp(front)
    .greyscale()
    .normalise()
    .blur(0.45)
    .webp({ quality: 90, effort: 6 })
    .toFile(path.join(output, `pearl-${mantel.id}-bump.webp`));
}

for (const hearthstone of [
  { id: "kentucky", sourceName: "centurion-hearthstone-kentucky.webp" },
  { id: "brown", sourceName: "centurion-hearthstone-brown.webp" },
]) {
  const color = await sharp(path.join(source, hearthstone.sourceName))
    .rotate()
    // These manufacturer files are color/texture swatches, not photographs
    // of an entire 18 × 20 hearthstone. Preserve the approved source aspect;
    // stretching the swatch to the physical piece ratio creates long, blurry
    // streaks once the hearth is projected into a customer photograph.
    .resize({ width: 2048, kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  await sharp(color)
    .webp({ quality: 94, smartSubsample: true, effort: 6 })
    .toFile(path.join(output, `centurion-hearthstone-${hearthstone.id}.webp`));
  await sharp(color)
    .greyscale()
    .normalise()
    .blur(0.55)
    .webp({ quality: 90, effort: 6 })
    .toFile(path.join(output, `centurion-hearthstone-${hearthstone.id}-bump.webp`));
}

// Current FPX lineup masters are exact FireBuilder composites. Trim only the
// transparent configurator canvas; do not invent pixels or reshape the product.
// Their remaining native pixel density exceeds the appliance footprint at the
// supported 4K wall framing sizes.
const staticProductAssets = [
  ["fpx-864-tv40-clean-oak-960.png", "fpx-864-tv40-clean.png"],
  ["fpx-864-tv40-classic-arch-960.png", "fpx-864-tv40-classic-arch.png"],
  ["fpx-864-tv40-french-country-960.png", "fpx-864-tv40-french-country.png"],
  ["fpx-864-tv40-metropolitan-960.png", "fpx-864-tv40-metropolitan.png"],
  ["fpx-864-tv40-double-door-960.png", "fpx-864-tv40-double-door.png"],
  ["fpx-4237-ironworks-birch-960.png", "fpx-4237-ironworks.png"],
  ["fpx-4415-black-glass-platinum-1410.png", "fpx-4415-high-output.png"],
  ["fpx-6015-black-glass-platinum-1410.png", "fpx-6015-high-output.png"],
  ["fpx-pb36-basic-1410.png", "fpx-pb36-basic.png"],
  ["fpx-pb36-deluxe-oak-1410.png", "fpx-pb36-deluxe.png"],
  ["fpx-pb36-see-through-oak-1410.png", "fpx-pb36-see-through.png"],
  ["fpx-pb42-deluxe-oak-1410.png", "fpx-pb42-deluxe.png"],
  ["fpx-pb42-linear-platinum-1410.png", "fpx-pb42-linear.png"],
  ["fpx-pb54-linear-platinum-1410.png", "fpx-pb54-linear.png"],
  ["fpx-pb72-linear-gsb-platinum-1410.png", "fpx-pb72-linear-gsb.png"],
  ["fpx-pb72-linear-deluxe-platinum-1410.png", "fpx-pb72-linear-deluxe.png"],
  ["fpx-32-dvs-metropolitan-oak-960.png", "fpx-32-dvs-insert.png"],
  ["fpx-430-metropolitan-oak-960.png", "fpx-430-insert.png"],
  ["fpx-430-mod-metropolitan-platinum-960.png", "fpx-430-mod-insert.png"],
  ["fpx-34-dvl-metropolitan-oak-960.png", "fpx-34-dvl-insert.png"],
  ["fpx-616-metropolitan-oak-960.png", "fpx-616-insert.png"],
  ["fpx-616-mod-metropolitan-platinum-960.png", "fpx-616-mod-insert.png"],
];

for (const [sourceName, outputName] of staticProductAssets) {
  await sharp(path.join(source, sourceName))
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 12 })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(output, outputName));
}

await sharp(path.join(root, "public", "icon.svg"))
  .resize(192, 192)
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, "public", "icon-192.png"));

await sharp(path.join(root, "public", "icon.svg"))
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, "public", "icon-512.png"));

console.log("Prepared deterministic manufacturer assets.");
