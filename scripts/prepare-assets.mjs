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

for (const [sku, filename] of standardFaces) {
  const face = await sharp(path.join(source, `fpx-face-${sku}-900.png`))
    .extract({ left: 120, top: 155, width: 660, height: 570 })
    .png()
    .toBuffer();
  await sharp(standardBase)
    .composite([{ input: face }])
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(path.join(output, filename));
}

await sharp(path.join(source, "fpx-4237-clean-birch-900.png"))
  .extract({ left: 155, top: 205, width: 600, height: 518 })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(path.join(output, "fpx-4237-clean-face.png"));

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
    .resize(1800, 2000, { fit: "fill", kernel: sharp.kernel.lanczos3 })
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

await sharp(path.join(root, "public", "icon.svg"))
  .resize(192, 192)
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, "public", "icon-192.png"));

await sharp(path.join(root, "public", "icon.svg"))
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, "public", "icon-512.png"));

console.log("Prepared deterministic manufacturer assets.");
