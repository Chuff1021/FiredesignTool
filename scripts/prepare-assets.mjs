import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const source = path.join(root, "assets-source");
const output = path.join(root, "public", "assets");

await mkdir(output, { recursive: true });

await sharp(path.join(source, "fpx-98500187.png"))
  // FireBuilder includes a faint one-pixel document border, so use the
  // verified product bounds rather than alpha-trim (which would retain it).
  .extract({ left: 118, top: 194, width: 520, height: 390 })
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(path.join(output, "fpx-864-trv-31k-clean-face.png"));

async function makeStonePanel({ relief = false } = {}) {
  const cropTops = [24, 330, 645, 180];
  const panels = await Promise.all(
    cropTops.map(async (top, index) => {
      let pipeline = sharp(path.join(source, "centurion-kentucky-ledge.jpg"))
        .rotate()
        .extract({ left: 24, top, width: 2512, height: 1884 })
        .resize(2112, 1600, {
          fit: "fill",
          kernel: sharp.kernel.lanczos3,
        });
      if (index % 2 === 1) pipeline = pipeline.flop();
      if (relief) pipeline = pipeline.greyscale().normalise().blur(0.7);
      return pipeline.toBuffer();
    }),
  );
  const horizontalMask = Buffer.from(
    `<svg width="2112" height="1600" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="fade" x1="0" x2="1">
        <stop offset="0" stop-color="white" stop-opacity="0"/>
        <stop offset="0.061" stop-color="white" stop-opacity="1"/>
      </linearGradient></defs>
      <rect width="2112" height="1600" fill="url(#fade)"/>
    </svg>`,
  );
  const verticalMask = Buffer.from(
    `<svg width="2112" height="1600" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="fade" y1="0" y2="1">
        <stop offset="0" stop-color="white" stop-opacity="0"/>
        <stop offset="0.081" stop-color="white" stop-opacity="1"/>
      </linearGradient></defs>
      <rect width="2112" height="1600" fill="url(#fade)"/>
    </svg>`,
  );
  const rightPanel = await sharp(panels[1])
    .ensureAlpha()
    .composite([{ input: horizontalMask, blend: "dest-in" }])
    .png()
    .toBuffer();
  const lowerLeftPanel = await sharp(panels[2])
    .ensureAlpha()
    .composite([{ input: verticalMask, blend: "dest-in" }])
    .png()
    .toBuffer();
  const lowerRightPanel = await sharp(panels[3])
    .ensureAlpha()
    .composite([
      { input: horizontalMask, blend: "dest-in" },
      { input: verticalMask, blend: "dest-in" },
    ])
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: 4096,
      height: 3072,
      channels: 3,
      background: "#29231f",
    },
  }).composite([
    { input: panels[0], left: 0, top: 0 },
    { input: rightPanel, left: 1984, top: 0 },
    { input: lowerLeftPanel, left: 0, top: 1472 },
    { input: lowerRightPanel, left: 1984, top: 1472 },
  ]);
}

await (await makeStonePanel())
  .webp({ quality: 94, smartSubsample: true, effort: 6 })
  .toFile(path.join(output, "centurion-kentucky-ledge.webp"));

await (await makeStonePanel({ relief: true }))
  .webp({ quality: 90, effort: 6 })
  .toFile(path.join(output, "centurion-kentucky-ledge-bump.webp"));

await sharp(path.join(source, "pearl-ncl-60-pearl.jpg"))
  .rotate()
  .resize({ width: 2000, withoutEnlargement: true })
  .webp({ quality: 94, smartSubsample: true, effort: 6 })
  .toFile(path.join(output, "pearl-ncl-60-pearl.webp"));

await sharp(path.join(source, "pearl-ncl-60-pearl-detail.jpg"))
  .rotate()
  .resize({ width: 1600, withoutEnlargement: true })
  .greyscale()
  .normalise()
  .blur(0.45)
  .webp({ quality: 90, effort: 6 })
  .toFile(path.join(output, "pearl-ncl-60-pearl-bump.webp"));

await sharp(path.join(root, "public", "icon.svg"))
  .resize(192, 192)
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, "public", "icon-192.png"));

await sharp(path.join(root, "public", "icon.svg"))
  .resize(512, 512)
  .png({ compressionLevel: 9 })
  .toFile(path.join(root, "public", "icon-512.png"));

console.log("Prepared deterministic manufacturer assets.");
