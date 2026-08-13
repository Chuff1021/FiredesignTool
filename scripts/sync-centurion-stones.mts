import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

sharp.cache(false);

type PieceRange = { widthMin: number; widthMax: number; heightMin: number; heightMax: number };
type PatternDefinition = {
  slug: string;
  name: string;
  patternCode: string;
  pieceRange: PieceRange;
  joint: "dry-stack" | "mortar";
  /** Installed width represented by one official swatch crop. */
  sourceFieldWidth: number;
};

const patterns: PatternDefinition[] = [
  {
    slug: "ashlar",
    name: "Ashlar",
    patternCode: "230",
    pieceRange: { widthMin: 5.75, widthMax: 20.75, heightMin: 2.25, heightMax: 11 },
    joint: "mortar",
    sourceFieldWidth: 48,
  },
  {
    slug: "biltmore",
    name: "Biltmore",
    patternCode: "400",
    pieceRange: { widthMin: 11.75, widthMax: 23.5, heightMin: 6, heightMax: 11.75 },
    joint: "dry-stack",
    sourceFieldWidth: 48,
  },
  {
    slug: "brick-stone",
    name: "Brick Stone",
    patternCode: "110",
    pieceRange: { widthMin: 7.5, widthMax: 7.5, heightMin: 2.25, heightMax: 2.25 },
    joint: "mortar",
    sourceFieldWidth: 48,
  },
  {
    slug: "brookstone",
    name: 'Brookstone 2"',
    patternCode: "186",
    pieceRange: { widthMin: 6, widthMax: 16, heightMin: 2, heightMax: 2 },
    joint: "dry-stack",
    sourceFieldWidth: 48,
  },
  {
    slug: "brookstone-4",
    name: 'Brookstone 4"',
    patternCode: "187",
    pieceRange: { widthMin: 6, widthMax: 16, heightMin: 4, heightMax: 4 },
    joint: "dry-stack",
    sourceFieldWidth: 48,
  },
  {
    slug: "brookstone-6",
    name: 'Brookstone 6"',
    patternCode: "188",
    pieceRange: { widthMin: 6, widthMax: 16, heightMin: 6, heightMax: 6 },
    joint: "dry-stack",
    sourceFieldWidth: 48,
  },
  {
    slug: "brookstone-blend",
    name: "Brookstone Blend",
    patternCode: "189",
    pieceRange: { widthMin: 6, widthMax: 16, heightMin: 2, heightMax: 6 },
    joint: "dry-stack",
    sourceFieldWidth: 72,
  },
  {
    slug: "canyon-ledge",
    name: "Canyon Ledge",
    patternCode: "280",
    pieceRange: { widthMin: 5.5, widthMax: 19, heightMin: 1.5, heightMax: 4 },
    joint: "mortar",
    sourceFieldWidth: 60,
  },
  {
    slug: "cathedral-stone",
    name: "Cathedral Stone",
    patternCode: "140",
    pieceRange: { widthMin: 11, widthMax: 22.5, heightMin: 3.25, heightMax: 11 },
    joint: "mortar",
    sourceFieldWidth: 48,
  },
  {
    slug: "centurion-castle",
    name: "Centurion Castle",
    patternCode: "070",
    pieceRange: { widthMin: 5.5, widthMax: 11.5, heightMin: 5.5, heightMax: 11.5 },
    joint: "mortar",
    sourceFieldWidth: 36,
  },
  {
    slug: "cherokee-blend",
    name: "Cherokee Blend",
    patternCode: "450",
    pieceRange: { widthMin: 4, widthMax: 20.75, heightMin: 1, heightMax: 10.5 },
    joint: "dry-stack",
    sourceFieldWidth: 72,
  },
  {
    slug: "cheyenne",
    name: "Cheyenne",
    patternCode: "480",
    pieceRange: { widthMin: 5, widthMax: 23, heightMin: 1.25, heightMax: 15.5 },
    joint: "dry-stack",
    sourceFieldWidth: 60,
  },
  {
    slug: "creekstone",
    name: "Creekstone",
    patternCode: "425",
    pieceRange: { widthMin: 6, widthMax: 16, heightMin: 1.5, heightMax: 6 },
    joint: "mortar",
    sourceFieldWidth: 60,
  },
  {
    slug: "cutface",
    name: "Cutface",
    patternCode: "270",
    pieceRange: { widthMin: 4, widthMax: 19, heightMin: 1, heightMax: 5.5 },
    joint: "dry-stack",
    sourceFieldWidth: 60,
  },
  {
    slug: "design-series",
    name: "Design Series",
    patternCode: "290",
    pieceRange: { widthMin: 4, widthMax: 16, heightMin: 1.75, heightMax: 1.75 },
    joint: "dry-stack",
    sourceFieldWidth: 72,
  },
  {
    slug: "elkmont",
    name: "Elkmont",
    patternCode: "460",
    pieceRange: { widthMin: 5, widthMax: 21.75, heightMin: 1, heightMax: 20 },
    joint: "dry-stack",
    sourceFieldWidth: 72,
  },
  {
    slug: "fieldstone",
    name: "Fieldstone",
    patternCode: "020",
    pieceRange: { widthMin: 2, widthMax: 13.75, heightMin: 4.75, heightMax: 18.75 },
    joint: "mortar",
    sourceFieldWidth: 60,
  },
  {
    slug: "flint-ridge",
    name: "Flint Ridge",
    patternCode: "430",
    pieceRange: { widthMin: 2, widthMax: 21.75, heightMin: 1.25, heightMax: 18.75 },
    joint: "dry-stack",
    sourceFieldWidth: 48,
  },
  {
    slug: "foundation",
    name: "Foundation Stone",
    patternCode: "530",
    pieceRange: { widthMin: 22.75, widthMax: 22.75, heightMin: 6.75, heightMax: 6.75 },
    joint: "mortar",
    sourceFieldWidth: 48,
  },
  {
    slug: "georgetown",
    name: "Georgetown",
    patternCode: "440",
    pieceRange: { widthMin: 4, widthMax: 20, heightMin: 1, heightMax: 6 },
    joint: "dry-stack",
    sourceFieldWidth: 84,
  },
  {
    slug: "hackett",
    name: "Hackett",
    patternCode: "050",
    pieceRange: { widthMin: 4, widthMax: 14, heightMin: 2, heightMax: 4 },
    joint: "dry-stack",
    sourceFieldWidth: 72,
  },
  {
    slug: "ledge",
    name: "Ledge",
    patternCode: "150",
    pieceRange: { widthMin: 6.75, widthMax: 16.75, heightMin: 1, heightMax: 3 },
    joint: "dry-stack",
    sourceFieldWidth: 96,
  },
  {
    slug: "mesa",
    name: "Mesa",
    patternCode: "420",
    pieceRange: { widthMin: 4, widthMax: 18, heightMin: 2, heightMax: 12 },
    joint: "dry-stack",
    sourceFieldWidth: 60,
  },
  {
    slug: "milano",
    name: "Milano",
    patternCode: "485",
    pieceRange: { widthMin: 4, widthMax: 18, heightMin: 2, heightMax: 6 },
    joint: "dry-stack",
    sourceFieldWidth: 60,
  },
  {
    slug: "mt-ledge",
    name: "Mountain Ledge",
    patternCode: "210",
    pieceRange: { widthMin: 8, widthMax: 12, heightMin: 4, heightMax: 4 },
    joint: "dry-stack",
    sourceFieldWidth: 72,
  },
  {
    slug: "ohio-limestone",
    name: "Ohio Limestone",
    patternCode: "190",
    pieceRange: { widthMin: 5, widthMax: 17.5, heightMin: 1.75, heightMax: 8.5 },
    joint: "mortar",
    sourceFieldWidth: 48,
  },
  {
    slug: "omaha",
    name: "Omaha",
    patternCode: "475",
    pieceRange: { widthMin: 4, widthMax: 18, heightMin: 2, heightMax: 6 },
    joint: "dry-stack",
    sourceFieldWidth: 72,
  },
  {
    slug: "palos-verdes",
    name: "Palos Verdes",
    patternCode: "040",
    pieceRange: { widthMin: 5, widthMax: 20.5, heightMin: 1.75, heightMax: 13.5 },
    joint: "mortar",
    sourceFieldWidth: 48,
  },
  {
    slug: "plantation",
    name: "Plantation",
    patternCode: "295",
    pieceRange: { widthMin: 4, widthMax: 21, heightMin: 1.75, heightMax: 13 },
    joint: "mortar",
    sourceFieldWidth: 72,
  },
  {
    slug: "quarry-stone",
    name: "Quarry Stone",
    patternCode: "255",
    pieceRange: { widthMin: 6, widthMax: 20, heightMin: 1.75, heightMax: 11 },
    joint: "mortar",
    sourceFieldWidth: 72,
  },
  {
    slug: "river-rock",
    name: "River Rock",
    patternCode: "080",
    pieceRange: { widthMin: 4, widthMax: 15, heightMin: 4, heightMax: 15 },
    joint: "mortar",
    sourceFieldWidth: 48,
  },
  {
    slug: "rubble",
    name: "Rubble",
    patternCode: "250",
    pieceRange: { widthMin: 4.75, widthMax: 20, heightMin: 2.5, heightMax: 8.75 },
    joint: "mortar",
    sourceFieldWidth: 48,
  },
  {
    slug: "rustic",
    name: "Rustic",
    patternCode: "900",
    pieceRange: { widthMin: 4, widthMax: 20, heightMin: 2, heightMax: 6 },
    joint: "dry-stack",
    sourceFieldWidth: 60,
  },
  {
    slug: "silhoutte-ledge",
    name: "Silhouette Ledge",
    patternCode: "160",
    pieceRange: { widthMin: 4.5, widthMax: 19, heightMin: 1.25, heightMax: 5.5 },
    joint: "mortar",
    sourceFieldWidth: 60,
  },
  {
    slug: "splitface",
    name: "Splitface",
    patternCode: "200",
    pieceRange: { widthMin: 4, widthMax: 16.75, heightMin: 2.75, heightMax: 13 },
    joint: "mortar",
    sourceFieldWidth: 48,
  },
  {
    slug: "stack",
    name: "Stack",
    patternCode: "100",
    pieceRange: { widthMin: 3.5, widthMax: 18, heightMin: 1, heightMax: 4 },
    joint: "dry-stack",
    sourceFieldWidth: 60,
  },
  {
    slug: "topeka",
    name: "Topeka",
    patternCode: "175",
    pieceRange: { widthMin: 2, widthMax: 12, heightMin: 3.75, heightMax: 22 },
    joint: "mortar",
    sourceFieldWidth: 36,
  },
  {
    slug: "vine-hill",
    name: "Vine Hill",
    patternCode: "410",
    pieceRange: { widthMin: 4, widthMax: 23, heightMin: 2.25, heightMax: 12 },
    joint: "dry-stack",
    sourceFieldWidth: 72,
  },
  {
    slug: "weather-edge",
    name: "Weatheredge",
    patternCode: "260",
    pieceRange: { widthMin: 6.5, widthMax: 23, heightMin: 1, heightMax: 7 },
    joint: "dry-stack",
    sourceFieldWidth: 72,
  },
];

const colorCodes: Record<string, string> = {
  alpine: "466-04",
  appalachian: "250-15",
  arizona: "724-25",
  austin: "647-10",
  beige: "56255",
  "bell-harbour": "634-18",
  brown: "200-25",
  "browns-valley": "145-65",
  "bucks-county": "701-25",
  california: "223-25",
  catalina: "690-25",
  chardonnay: "180-65",
  chicago: "63925",
  coastal: "584-15",
  cream: "604-10",
  crimson: "578-25",
  "desert-rust": "360-25",
  english: "270-15",
  gray: "030-45",
  kentucky: "260-15",
  lexington: "66925",
  lonestar: "623-25",
  louisville: "262-15",
  "mesa-valley": "930-65",
  midnight: "50847",
  millwood: "333-20",
  mist: "74315",
  "mtn-rundle-no-accent": "492-70",
  "new-england": "290-15",
  "norris-grey": "817-15",
  "odessa-falls": "365-25",
  oxford: "469-20",
  pennsylvania: "800-25",
  plain: "330-20",
  rocky: "591-04",
  santos: "673-18",
  "sage-valley": "710-25",
  shoreline: "408-15",
  smoke: "457-15",
  "southern-wheat": "801-25",
  suede: "185-65",
  texas: "310-10",
  tulsa: "791-15",
  "valley-brook": "719-25",
  "white-wash": "77315",
};

const accessoryByColor: Record<string, string> = {
  alpine: "Alpine",
  appalachian: "Appalachian",
  arizona: "Brown",
  austin: "Texas",
  "bell-harbour": "Bell Harbour",
  brown: "Brown",
  "browns-valley": "Chardonnay",
  "bucks-county": "Pennsylvania",
  california: "California",
  catalina: "Pennsylvania",
  chardonnay: "Chardonnay",
  coastal: "Coastal",
  cream: "Texas",
  crimson: "Crimson",
  "desert-rust": "California",
  english: "Appalachian",
  gray: "Gray",
  heather: "Brown",
  kentucky: "Kentucky",
  lonestar: "Ivory Buff",
  louisville: "Kentucky",
  "mesa-valley": "Mesa Valley",
  millwood: "Millwood",
  mist: "Plain",
  "mtn-rundle-no-accent": "Mt. Rundle",
  "new-england": "Appalachian",
  "norris-grey": "Norris Gray",
  "odessa-falls": "California",
  oxford: "Oxford",
  pennsylvania: "Pennsylvania",
  plain: "Plain",
  rocky: "Alpine",
  santos: "Santos",
  "sage-valley": "Pennsylvania",
  shoreline: "Coastal",
  smoke: "Smoke",
  "southern-wheat": "Brown",
  suede: "Suede",
  summit: "Pennsylvania",
  texas: "Texas",
  tulsa: "Tulsa",
  "valley-brook": "California",
  "white-wash": "Plain",
};

const officialAccessoryUrls: Record<string, string> = {
  appalachian: "https://www.centurionstone.com/wp-content/uploads/2024/08/Appalachian.webp",
  brown: "https://www.centurionstone.com/wp-content/uploads/2024/08/Brown.webp",
  chardonnay: "https://www.centurionstone.com/wp-content/uploads/2024/08/Chardonay.webp",
  coastal: "https://www.centurionstone.com/wp-content/uploads/2024/08/Coastal.webp",
  kentucky: "https://www.centurionstone.com/wp-content/uploads/2024/08/Kentucky.webp",
  "mesa-valley": "https://www.centurionstone.com/wp-content/uploads/2024/08/MesaValley.webp",
  missouri: "https://www.centurionstone.com/wp-content/uploads/2024/08/Missouri.webp",
  "mt-rundle": "https://www.centurionstone.com/wp-content/uploads/2024/08/Mt.Rundle.webp",
  pennsylvania: "https://www.centurionstone.com/wp-content/uploads/2024/08/Pennsylvania.webp",
  plain: "https://www.centurionstone.com/wp-content/uploads/2024/08/Plain.webp",
  suede: "https://www.centurionstone.com/wp-content/uploads/2024/08/Suede.webp",
  tennessee: "https://www.centurionstone.com/wp-content/uploads/2024/08/Tennesee.webp",
  texas: "https://www.centurionstone.com/wp-content/uploads/2024/08/Texas.webp",
  tulsa: "https://www.centurionstone.com/wp-content/uploads/2024/08/Tulsa.webp",
};

const root = process.cwd();
const sourceDirectory = path.join(root, "assets-source", "centurion");
const outputDirectory = path.join(root, "public", "assets", "centurion");
const thumbDirectory = path.join(outputDirectory, "thumbs");
const hearthDirectory = path.join(outputDirectory, "hearth");
const generatedPath = path.join(
  root,
  "src",
  "catalog",
  "generated",
  "centurionStoneProducts.ts",
);

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/&(?:#\d+|[a-z]+);/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const decodeName = (value: string) => value.replace(/&#8243;/g, '"').replace(/&amp;/g, "&");

async function fetchBuffer(url: string) {
  const response = await fetch(url, {
    headers: { "User-Agent": "FireDesignTool catalog sync" },
  });
  if (!response.ok) throw new Error(`Could not download ${url}: ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

const ATLAS_WIDTH = 2048;
const ATLAS_HEIGHT = 1536;
const ATLAS_PHYSICAL_WIDTH = 192;
const ATLAS_PHYSICAL_HEIGHT = 144;

function deterministicRandom(seed: string) {
  let state = 2166136261;
  for (const character of seed) {
    state ^= character.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function patchPositions(total: number, patch: number, overlap: number) {
  const positions: number[] = [];
  const last = total - patch;
  for (let position = 0; position < last; position += patch - overlap) positions.push(position);
  if (positions.at(-1) !== last) positions.push(last);
  return positions;
}

async function makeFoundationAtlas(
  sourceBuffer: Buffer,
  sourceFieldWidth: number,
  seed: string,
) {
  void seed;
  const tileWidth = Math.round((sourceFieldWidth / ATLAS_PHYSICAL_WIDTH) * ATLAS_WIDTH);
  // Six published 6.75-inch courses plus the photographed mortar joints occupy
  // approximately 43.5 installed inches in the square manufacturer swatch.
  const tileHeight = Math.round((43.5 / ATLAS_PHYSICAL_HEIGHT) * ATLAS_HEIGHT);
  const tile = await sharp(sourceBuffer)
    .rotate()
    .resize(tileWidth, tileHeight, { fit: "fill", kernel: sharp.kernel.lanczos3 })
    .removeAlpha()
    .png()
    .toBuffer();
  const columns = Math.ceil(ATLAS_WIDTH / tileWidth);
  const rows = Math.ceil(ATLAS_HEIGHT / tileHeight);
  const tiled = await sharp({
    create: {
      width: columns * tileWidth + 1,
      height: rows * tileHeight + 1,
      channels: 3,
      background: "#8c8274",
    },
  })
    .composite(
      Array.from({ length: rows }, (_, row) =>
        Array.from({ length: columns }, (_, column) => ({
          input: tile,
          left: column * tileWidth,
          top: row * tileHeight,
        })),
      ).flat(),
    )
    .png()
    .toBuffer();
  return sharp(tiled)
    .extract({ left: 0, top: 0, width: ATLAS_WIDTH, height: ATLAS_HEIGHT })
    .png()
    .toBuffer();
}

/**
 * Builds one physically calibrated 192 x 144 inch field from the official swatch.
 * Overlapping source patches are selected by edge similarity, preserving the real
 * stone scale without the kaleidoscope seams produced by full-image mirroring.
 */
async function makeAtlas(sourceBuffer: Buffer, sourceFieldWidth: number, seed: string) {
  const rotated = await sharp(sourceBuffer).rotate().toBuffer();
  const metadata = await sharp(rotated).metadata();
  if (!metadata.width || !metadata.height) throw new Error("Invalid Centurion swatch image");
  const insetX = Math.max(2, Math.round(metadata.width * 0.025));
  const insetY = Math.max(2, Math.round(metadata.height * 0.025));
  const cropped = sharp(rotated)
    .extract({
      left: insetX,
      top: insetY,
      width: metadata.width - insetX * 2,
      height: metadata.height - insetY * 2,
    })
    .resize({
      width: Math.round((sourceFieldWidth / ATLAS_PHYSICAL_WIDTH) * ATLAS_WIDTH),
      kernel: sharp.kernel.lanczos3,
    })
    .removeAlpha();
  const { data: source, info } = await cropped.raw().toBuffer({ resolveWithObject: true });
  const sourceWidth = info.width;
  const sourceHeight = info.height;
  const channels = info.channels;
  const patchWidth = Math.min(512, Math.max(240, Math.floor(sourceWidth * 0.72)));
  const patchHeight = Math.min(
    384,
    Math.max(192, Math.min(Math.floor(sourceHeight * 0.62), Math.floor(patchWidth * 0.8))),
  );
  const overlap = Math.max(48, Math.round(Math.min(patchWidth, patchHeight) * 0.2));
  const xPositions = patchPositions(ATLAS_WIDTH, patchWidth, overlap);
  const yPositions = patchPositions(ATLAS_HEIGHT, patchHeight, overlap);
  const target = Buffer.alloc(ATLAS_WIDTH * ATLAS_HEIGHT * channels);
  const filled = new Uint8Array(ATLAS_WIDTH * ATLAS_HEIGHT);
  const random = deterministicRandom(seed);
  const maxSourceX = Math.max(0, sourceWidth - patchWidth);
  const maxSourceY = Math.max(0, sourceHeight - patchHeight);

  const scoreCandidate = (
    targetX: number,
    targetY: number,
    sourceX: number,
    sourceY: number,
  ) => {
    let score = 0;
    let samples = 0;
    for (let patchY = 0; patchY < patchHeight; patchY += 4) {
      const outputY = targetY + patchY;
      for (let patchX = 0; patchX < patchWidth; patchX += 4) {
        const outputX = targetX + patchX;
        const outputPixel = outputY * ATLAS_WIDTH + outputX;
        if (filled[outputPixel] !== 1) continue;
        const sourcePixel = (sourceY + patchY) * sourceWidth + sourceX + patchX;
        const outputOffset = outputPixel * channels;
        const sourceOffset = sourcePixel * channels;
        for (let channel = 0; channel < 3; channel += 1) {
          const difference = target[outputOffset + channel]! - source[sourceOffset + channel]!;
          score += difference * difference;
        }
        samples += 1;
      }
    }
    return samples === 0 ? 0 : score / samples;
  };

  const pixelDifference = (outputPixel: number, sourcePixel: number) => {
    const outputOffset = outputPixel * channels;
    const sourceOffset = sourcePixel * channels;
    let difference = 0;
    for (let channel = 0; channel < 3; channel += 1) {
      const delta = target[outputOffset + channel]! - source[sourceOffset + channel]!;
      difference += delta * delta;
    }
    return difference;
  };

  const verticalSeam = (
    targetX: number,
    targetY: number,
    sourceX: number,
    sourceY: number,
    overlapWidth: number,
  ) => {
    const backtrack = new Int16Array(overlapWidth * patchHeight);
    let previous = new Float64Array(overlapWidth);
    let current = new Float64Array(overlapWidth);
    for (let y = 0; y < patchHeight; y += 1) {
      for (let x = 0; x < overlapWidth; x += 1) {
        const outputPixel = (targetY + y) * ATLAS_WIDTH + targetX + x;
        const sourcePixel = (sourceY + y) * sourceWidth + sourceX + x;
        let predecessor = x;
        if (y > 0) {
          if (x > 0 && previous[x - 1]! < previous[predecessor]!) predecessor = x - 1;
          if (x + 1 < overlapWidth && previous[x + 1]! < previous[predecessor]!)
            predecessor = x + 1;
        }
        backtrack[y * overlapWidth + x] = predecessor;
        current[x] =
          pixelDifference(outputPixel, sourcePixel) + (y === 0 ? 0 : previous[predecessor]!);
      }
      [previous, current] = [current, previous];
    }
    let cursor = 0;
    for (let x = 1; x < overlapWidth; x += 1) if (previous[x]! < previous[cursor]!) cursor = x;
    const seam = new Int16Array(patchHeight);
    for (let y = patchHeight - 1; y >= 0; y -= 1) {
      seam[y] = cursor;
      cursor = backtrack[y * overlapWidth + cursor]!;
    }
    return seam;
  };

  const horizontalSeam = (
    targetX: number,
    targetY: number,
    sourceX: number,
    sourceY: number,
    overlapHeight: number,
  ) => {
    const backtrack = new Int16Array(overlapHeight * patchWidth);
    let previous = new Float64Array(overlapHeight);
    let current = new Float64Array(overlapHeight);
    for (let x = 0; x < patchWidth; x += 1) {
      for (let y = 0; y < overlapHeight; y += 1) {
        const outputPixel = (targetY + y) * ATLAS_WIDTH + targetX + x;
        const sourcePixel = (sourceY + y) * sourceWidth + sourceX + x;
        let predecessor = y;
        if (x > 0) {
          if (y > 0 && previous[y - 1]! < previous[predecessor]!) predecessor = y - 1;
          if (y + 1 < overlapHeight && previous[y + 1]! < previous[predecessor]!)
            predecessor = y + 1;
        }
        backtrack[x * overlapHeight + y] = predecessor;
        current[y] =
          pixelDifference(outputPixel, sourcePixel) + (x === 0 ? 0 : previous[predecessor]!);
      }
      [previous, current] = [current, previous];
    }
    let cursor = 0;
    for (let y = 1; y < overlapHeight; y += 1) if (previous[y]! < previous[cursor]!) cursor = y;
    const seam = new Int16Array(patchWidth);
    for (let x = patchWidth - 1; x >= 0; x -= 1) {
      seam[x] = cursor;
      cursor = backtrack[x * overlapHeight + cursor]!;
    }
    return seam;
  };

  for (let yIndex = 0; yIndex < yPositions.length; yIndex += 1) {
    const targetY = yPositions[yIndex]!;
    const topOverlap = yIndex === 0 ? 0 : yPositions[yIndex - 1]! + patchHeight - targetY;
    for (let xIndex = 0; xIndex < xPositions.length; xIndex += 1) {
      const targetX = xPositions[xIndex]!;
      const leftOverlap = xIndex === 0 ? 0 : xPositions[xIndex - 1]! + patchWidth - targetX;
      let bestSourceX = 0;
      let bestSourceY = 0;
      let bestScore = Number.POSITIVE_INFINITY;
      const candidateCount = targetX === 0 && targetY === 0 ? 1 : 18;
      for (let candidate = 0; candidate < candidateCount; candidate += 1) {
        const sourceX = Math.round(random() * maxSourceX);
        const sourceY = Math.round(random() * maxSourceY);
        const score = scoreCandidate(targetX, targetY, sourceX, sourceY);
        if (score < bestScore) {
          bestScore = score;
          bestSourceX = sourceX;
          bestSourceY = sourceY;
        }
      }

      const leftSeam =
        leftOverlap > 0
          ? verticalSeam(targetX, targetY, bestSourceX, bestSourceY, leftOverlap)
          : undefined;
      const topSeam =
        topOverlap > 0
          ? horizontalSeam(targetX, targetY, bestSourceX, bestSourceY, topOverlap)
          : undefined;

      for (let patchY = 0; patchY < patchHeight; patchY += 1) {
        const outputY = targetY + patchY;
        for (let patchX = 0; patchX < patchWidth; patchX += 1) {
          const outputX = targetX + patchX;
          const outputPixel = outputY * ATLAS_WIDTH + outputX;
          const sourcePixel = (bestSourceY + patchY) * sourceWidth + bestSourceX + patchX;
          const outputOffset = outputPixel * channels;
          const sourceOffset = sourcePixel * channels;
          const crossesLeftSeam = leftSeam === undefined || patchX >= leftSeam[patchY]!;
          const crossesTopSeam = topSeam === undefined || patchY >= topSeam[patchX]!;
          if (filled[outputPixel] === 0 || (crossesLeftSeam && crossesTopSeam)) {
            for (let channel = 0; channel < channels; channel += 1)
              target[outputOffset + channel] = source[sourceOffset + channel]!;
          }
          filled[outputPixel] = 1;
        }
      }
    }
  }

  return sharp(target, { raw: { width: ATLAS_WIDTH, height: ATLAS_HEIGHT, channels } })
    .png()
    .toBuffer();
}

async function writeWallAssets(id: string, sourceUrl: string, sourceFieldWidth: number) {
  const sourceBuffer = await fetchBuffer(sourceUrl);
  await writeFile(path.join(sourceDirectory, `${id}.source`), sourceBuffer);
  const atlas = id.endsWith("-foundation")
    ? await makeFoundationAtlas(sourceBuffer, sourceFieldWidth, id)
    : await makeAtlas(sourceBuffer, sourceFieldWidth, id);
  await Promise.all([
    sharp(atlas)
      .webp({ quality: 82, smartSubsample: true, effort: 5 })
      .toFile(path.join(outputDirectory, `${id}.webp`)),
    sharp(atlas)
      .resize(1024, 768)
      .greyscale()
      .normalise()
      .blur(0.65)
      .webp({ quality: 68, effort: 5 })
      .toFile(path.join(outputDirectory, `${id}-bump.webp`)),
    sharp(sourceBuffer)
      .rotate()
      .resize(360, 240, { fit: "cover", position: "centre" })
      .webp({ quality: 82, effort: 5 })
      .toFile(path.join(thumbDirectory, `${id}.webp`)),
  ]);
}

async function writeHearthAssets(slug: string, sourceUrl: string) {
  if (slug === "kentucky" || slug === "brown") return;
  const sourceBuffer = await fetchBuffer(sourceUrl);
  const color = await sharp(sourceBuffer)
    .rotate()
    .resize({ width: 1536, kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  await Promise.all([
    sharp(color)
      .webp({ quality: 84, effort: 5 })
      .toFile(path.join(hearthDirectory, `${slug}.webp`)),
    sharp(color)
      .greyscale()
      .normalise()
      .blur(0.55)
      .webp({ quality: 68, effort: 5 })
      .toFile(path.join(hearthDirectory, `${slug}-bump.webp`)),
  ]);
}

await Promise.all(
  [
    sourceDirectory,
    outputDirectory,
    thumbDirectory,
    hearthDirectory,
    path.dirname(generatedPath),
  ].map((directory) => mkdir(directory, { recursive: true })),
);

const products: Record<string, unknown>[] = [];
const swatchUrlByColor = new Map<string, string>();
const sourceFieldWidthByProductId = new Map<string, number>();
for (const pattern of patterns) {
  const sourceUrl = `https://www.centurionstone.com/pattern/${pattern.slug}/`;
  const html = await (await fetch(sourceUrl)).text();
  const imageTags = [...html.matchAll(/<img[^>]+class="color-variation-image"[^>]*>/gi)].map(
    (match) => match[0],
  );
  for (const imageTag of imageTags) {
    const colorName = decodeName(imageTag.match(/alt="([^"]+)"/i)?.[1] ?? "").trim();
    const swatchUrl = imageTag.match(/src="([^"]+)"/i)?.[1];
    if (!colorName || !swatchUrl) continue;
    const colorSlug = slugify(colorName);
    const id = pattern.slug === "ledge" ? `${colorSlug}-ledge` : `${colorSlug}-${pattern.slug}`;
    const productCode = colorCodes[colorSlug]
      ? `${pattern.patternCode}-${colorCodes[colorSlug]}`
      : undefined;
    const accessoryName = accessoryByColor[colorSlug] ?? colorName;
    const accessorySlug = slugify(accessoryName);
    swatchUrlByColor.set(colorSlug, swatchUrl);
    sourceFieldWidthByProductId.set(id, pattern.sourceFieldWidth);
    const wallBase = `/assets/centurion/${id}`;
    const thumbPath = `/assets/centurion/thumbs/${id}.webp`;
    const legacyHearth = accessorySlug === "kentucky" || accessorySlug === "brown";
    const hearthBase = legacyHearth
      ? `/assets/centurion-hearthstone-${accessorySlug}`
      : `/assets/centurion/hearth/${accessorySlug}`;
    products.push({
      id,
      brandId: "centurion-stone",
      manufacturer: "Centurion Stone",
      status: "approved",
      name: `${colorName} ${pattern.name}`,
      patternName: pattern.name,
      colorName,
      patternCode: pattern.patternCode,
      colorCode: colorCodes[colorSlug],
      productCode,
      sourceUrl,
      joint: pattern.joint,
      pieceRange: pattern.pieceRange,
      textureCoverage: {
        width: ATLAS_PHYSICAL_WIDTH,
        height: ATLAS_PHYSICAL_HEIGHT,
      },
      assets: [
        {
          localPath: `${wallBase}.webp`,
          sourceUrl: swatchUrl,
          retrievedAt: "2026-08-13",
          label: `Official Centurion ${colorName} ${pattern.name} showroom texture`,
        },
        {
          localPath: `${wallBase}-bump.webp`,
          sourceUrl: swatchUrl,
          retrievedAt: "2026-08-13",
          label: `Deterministic relief map derived from official ${colorName} ${pattern.name} swatch`,
        },
      ],
      thumbnailAsset: {
        localPath: thumbPath,
        sourceUrl: swatchUrl,
        retrievedAt: "2026-08-13",
        label: `Official Centurion ${colorName} ${pattern.name} catalog swatch`,
      },
      hearthstone: {
        manufacturer: "Centurion Stone",
        name: "Hearthstone",
        patternCode: "860",
        colorName: accessoryName,
        colorCode: colorCodes[accessorySlug] ?? colorCodes[colorSlug] ?? "visual-reference",
        dimensions: { width: 18, depth: 20, thickness: 1.5 },
        assets: [
          {
            localPath: `${hearthBase}.webp`,
            sourceUrl: officialAccessoryUrls[accessorySlug] ?? swatchUrl,
            retrievedAt: "2026-08-13",
            label: `Official Centurion ${accessoryName} accessory-color reference`,
          },
          {
            localPath: `${hearthBase}-bump.webp`,
            sourceUrl: officialAccessoryUrls[accessorySlug] ?? swatchUrl,
            retrievedAt: "2026-08-13",
            label: `Deterministic relief map derived from official ${accessoryName} color reference`,
          },
        ],
      },
    });
  }
}

if (products.length !== 122)
  throw new Error(`Expected 122 official Centurion swatches, found ${products.length}`);

if (!process.argv.includes("--catalog-only")) {
  const onlyId = process.argv.find((argument) => argument.startsWith("--only="))?.slice(7);
  const assetProducts = onlyId
    ? products.filter((product) => (product as { id: string }).id === onlyId)
    : products;
  if (onlyId && assetProducts.length !== 1)
    throw new Error(`Unknown Centurion product: ${onlyId}`);
  // Texture quilting is intentionally memory-heavy; serialize asset construction so
  // the full 122-swatch release is deterministic on showroom/developer hardware.
  const concurrency = 1;
  let cursor = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (cursor < assetProducts.length) {
        const product = assetProducts[cursor++] as {
          id: string;
          assets: { sourceUrl: string }[];
        };
        process.stdout.write(`Preparing ${cursor}/${assetProducts.length} ${product.id}\n`);
        await writeWallAssets(
          product.id,
          product.assets[0]!.sourceUrl,
          sourceFieldWidthByProductId.get(product.id)!,
        );
      }
    }),
  );
}

const hearthSources = new Map<string, string>();
for (const product of products as Array<{
  hearthstone: { colorName: string; assets: { sourceUrl: string }[] };
}>) {
  hearthSources.set(
    slugify(product.hearthstone.colorName),
    product.hearthstone.assets[0]!.sourceUrl,
  );
}
if (!process.argv.includes("--catalog-only")) {
  for (const [slug, url] of hearthSources) await writeHearthAssets(slug, url);
}

await writeFile(
  generatedPath,
  `/** Generated from current official Centurion pattern pages by scripts/sync-centurion-stones.mts. */\nexport const generatedCenturionStoneProducts = ${JSON.stringify(products, null, 2)} as const;\n`,
);

const existingProductPage = await readFile(
  path.join(root, "tmp", "pdfs", "centurion-products.html"),
  "utf8",
).catch(() => "");
console.log(
  `Prepared ${products.length} official swatches across ${patterns.length} patterns${existingProductPage ? "." : " (live source)."}`,
);
