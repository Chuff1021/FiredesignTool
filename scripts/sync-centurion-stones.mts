import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

type PieceRange = { widthMin: number; widthMax: number; heightMin: number; heightMax: number };
type PatternDefinition = {
  slug: string;
  name: string;
  patternCode: string;
  pieceRange: PieceRange;
  joint: "dry-stack" | "mortar";
};

const patterns: PatternDefinition[] = [
  {
    slug: "ashlar",
    name: "Ashlar",
    patternCode: "230",
    pieceRange: { widthMin: 5.75, widthMax: 20.75, heightMin: 2.25, heightMax: 11 },
    joint: "mortar",
  },
  {
    slug: "biltmore",
    name: "Biltmore",
    patternCode: "400",
    pieceRange: { widthMin: 11.75, widthMax: 23.5, heightMin: 6, heightMax: 11.75 },
    joint: "dry-stack",
  },
  {
    slug: "brick-stone",
    name: "Brick Stone",
    patternCode: "110",
    pieceRange: { widthMin: 7.5, widthMax: 7.5, heightMin: 2.25, heightMax: 2.25 },
    joint: "mortar",
  },
  {
    slug: "brookstone",
    name: 'Brookstone 2"',
    patternCode: "186",
    pieceRange: { widthMin: 6, widthMax: 16, heightMin: 2, heightMax: 2 },
    joint: "dry-stack",
  },
  {
    slug: "brookstone-4",
    name: 'Brookstone 4"',
    patternCode: "187",
    pieceRange: { widthMin: 6, widthMax: 16, heightMin: 4, heightMax: 4 },
    joint: "dry-stack",
  },
  {
    slug: "brookstone-6",
    name: 'Brookstone 6"',
    patternCode: "188",
    pieceRange: { widthMin: 6, widthMax: 16, heightMin: 6, heightMax: 6 },
    joint: "dry-stack",
  },
  {
    slug: "brookstone-blend",
    name: "Brookstone Blend",
    patternCode: "189",
    pieceRange: { widthMin: 6, widthMax: 16, heightMin: 2, heightMax: 6 },
    joint: "dry-stack",
  },
  {
    slug: "canyon-ledge",
    name: "Canyon Ledge",
    patternCode: "280",
    pieceRange: { widthMin: 5.5, widthMax: 19, heightMin: 1.5, heightMax: 4 },
    joint: "mortar",
  },
  {
    slug: "cathedral-stone",
    name: "Cathedral Stone",
    patternCode: "140",
    pieceRange: { widthMin: 11, widthMax: 22.5, heightMin: 3.25, heightMax: 11 },
    joint: "mortar",
  },
  {
    slug: "centurion-castle",
    name: "Centurion Castle",
    patternCode: "070",
    pieceRange: { widthMin: 5.5, widthMax: 11.5, heightMin: 5.5, heightMax: 11.5 },
    joint: "mortar",
  },
  {
    slug: "cherokee-blend",
    name: "Cherokee Blend",
    patternCode: "450",
    pieceRange: { widthMin: 4, widthMax: 20.75, heightMin: 1, heightMax: 10.5 },
    joint: "dry-stack",
  },
  {
    slug: "cheyenne",
    name: "Cheyenne",
    patternCode: "480",
    pieceRange: { widthMin: 5, widthMax: 23, heightMin: 1.25, heightMax: 15.5 },
    joint: "dry-stack",
  },
  {
    slug: "creekstone",
    name: "Creekstone",
    patternCode: "425",
    pieceRange: { widthMin: 6, widthMax: 16, heightMin: 1.5, heightMax: 6 },
    joint: "mortar",
  },
  {
    slug: "cutface",
    name: "Cutface",
    patternCode: "270",
    pieceRange: { widthMin: 4, widthMax: 19, heightMin: 1, heightMax: 5.5 },
    joint: "dry-stack",
  },
  {
    slug: "design-series",
    name: "Design Series",
    patternCode: "290",
    pieceRange: { widthMin: 4, widthMax: 16, heightMin: 1.75, heightMax: 1.75 },
    joint: "dry-stack",
  },
  {
    slug: "elkmont",
    name: "Elkmont",
    patternCode: "460",
    pieceRange: { widthMin: 5, widthMax: 21.75, heightMin: 1, heightMax: 20 },
    joint: "dry-stack",
  },
  {
    slug: "fieldstone",
    name: "Fieldstone",
    patternCode: "020",
    pieceRange: { widthMin: 2, widthMax: 13.75, heightMin: 4.75, heightMax: 18.75 },
    joint: "mortar",
  },
  {
    slug: "flint-ridge",
    name: "Flint Ridge",
    patternCode: "430",
    pieceRange: { widthMin: 2, widthMax: 21.75, heightMin: 1.25, heightMax: 18.75 },
    joint: "dry-stack",
  },
  {
    slug: "foundation",
    name: "Foundation Stone",
    patternCode: "530",
    pieceRange: { widthMin: 22.75, widthMax: 22.75, heightMin: 6.75, heightMax: 6.75 },
    joint: "mortar",
  },
  {
    slug: "georgetown",
    name: "Georgetown",
    patternCode: "440",
    pieceRange: { widthMin: 4, widthMax: 20, heightMin: 1, heightMax: 6 },
    joint: "dry-stack",
  },
  {
    slug: "hackett",
    name: "Hackett",
    patternCode: "050",
    pieceRange: { widthMin: 4, widthMax: 14, heightMin: 2, heightMax: 4 },
    joint: "dry-stack",
  },
  {
    slug: "ledge",
    name: "Ledge",
    patternCode: "150",
    pieceRange: { widthMin: 6.75, widthMax: 16.75, heightMin: 1, heightMax: 3 },
    joint: "dry-stack",
  },
  {
    slug: "mesa",
    name: "Mesa",
    patternCode: "420",
    pieceRange: { widthMin: 4, widthMax: 18, heightMin: 2, heightMax: 12 },
    joint: "dry-stack",
  },
  {
    slug: "milano",
    name: "Milano",
    patternCode: "485",
    pieceRange: { widthMin: 4, widthMax: 18, heightMin: 2, heightMax: 6 },
    joint: "dry-stack",
  },
  {
    slug: "mt-ledge",
    name: "Mountain Ledge",
    patternCode: "210",
    pieceRange: { widthMin: 8, widthMax: 12, heightMin: 4, heightMax: 4 },
    joint: "dry-stack",
  },
  {
    slug: "ohio-limestone",
    name: "Ohio Limestone",
    patternCode: "190",
    pieceRange: { widthMin: 5, widthMax: 17.5, heightMin: 1.75, heightMax: 8.5 },
    joint: "mortar",
  },
  {
    slug: "omaha",
    name: "Omaha",
    patternCode: "475",
    pieceRange: { widthMin: 4, widthMax: 18, heightMin: 2, heightMax: 6 },
    joint: "dry-stack",
  },
  {
    slug: "palos-verdes",
    name: "Palos Verdes",
    patternCode: "040",
    pieceRange: { widthMin: 5, widthMax: 20.5, heightMin: 1.75, heightMax: 13.5 },
    joint: "mortar",
  },
  {
    slug: "plantation",
    name: "Plantation",
    patternCode: "295",
    pieceRange: { widthMin: 4, widthMax: 21, heightMin: 1.75, heightMax: 13 },
    joint: "mortar",
  },
  {
    slug: "quarry-stone",
    name: "Quarry Stone",
    patternCode: "255",
    pieceRange: { widthMin: 6, widthMax: 20, heightMin: 1.75, heightMax: 11 },
    joint: "mortar",
  },
  {
    slug: "river-rock",
    name: "River Rock",
    patternCode: "080",
    pieceRange: { widthMin: 4, widthMax: 15, heightMin: 4, heightMax: 15 },
    joint: "mortar",
  },
  {
    slug: "rubble",
    name: "Rubble",
    patternCode: "250",
    pieceRange: { widthMin: 4.75, widthMax: 20, heightMin: 2.5, heightMax: 8.75 },
    joint: "mortar",
  },
  {
    slug: "rustic",
    name: "Rustic",
    patternCode: "900",
    pieceRange: { widthMin: 4, widthMax: 20, heightMin: 2, heightMax: 6 },
    joint: "dry-stack",
  },
  {
    slug: "silhoutte-ledge",
    name: "Silhouette Ledge",
    patternCode: "160",
    pieceRange: { widthMin: 4.5, widthMax: 19, heightMin: 1.25, heightMax: 5.5 },
    joint: "mortar",
  },
  {
    slug: "splitface",
    name: "Splitface",
    patternCode: "200",
    pieceRange: { widthMin: 4, widthMax: 16.75, heightMin: 2.75, heightMax: 13 },
    joint: "mortar",
  },
  {
    slug: "stack",
    name: "Stack",
    patternCode: "100",
    pieceRange: { widthMin: 3.5, widthMax: 18, heightMin: 1, heightMax: 4 },
    joint: "dry-stack",
  },
  {
    slug: "topeka",
    name: "Topeka",
    patternCode: "175",
    pieceRange: { widthMin: 2, widthMax: 12, heightMin: 3.75, heightMax: 22 },
    joint: "mortar",
  },
  {
    slug: "vine-hill",
    name: "Vine Hill",
    patternCode: "410",
    pieceRange: { widthMin: 4, widthMax: 23, heightMin: 2.25, heightMax: 12 },
    joint: "dry-stack",
  },
  {
    slug: "weather-edge",
    name: "Weatheredge",
    patternCode: "260",
    pieceRange: { widthMin: 6.5, widthMax: 23, heightMin: 1, heightMax: 7 },
    joint: "dry-stack",
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

async function makeAtlas(sourceBuffer: Buffer) {
  const rotated = await sharp(sourceBuffer).rotate().toBuffer();
  const metadata = await sharp(rotated).metadata();
  if (!metadata.width || !metadata.height) throw new Error("Invalid Centurion swatch image");
  const insetX = Math.max(2, Math.round(metadata.width * 0.025));
  const insetY = Math.max(2, Math.round(metadata.height * 0.025));
  const cropped = await sharp(rotated)
    .extract({
      left: insetX,
      top: insetY,
      width: metadata.width - insetX * 2,
      height: metadata.height - insetY * 2,
    })
    .png()
    .toBuffer();
  const variants: { input: Buffer; left: number; top: number }[] = [];
  for (let index = 0; index < 4; index += 1) {
    let image = sharp(cropped).resize(1088, 832, {
      fit: "cover",
      position: "centre",
      kernel: sharp.kernel.lanczos3,
    });
    if (index % 2) image = image.flop();
    if (index > 1) image = image.flip();
    const buffer = await image
      .extract({ left: (index * 19) % 65, top: (index * 13) % 65, width: 1024, height: 768 })
      .png()
      .toBuffer();
    variants.push({
      input: buffer,
      left: (index % 2) * 1024,
      top: Math.floor(index / 2) * 768,
    });
  }
  return sharp({ create: { width: 2048, height: 1536, channels: 3, background: "#71685e" } })
    .composite(variants)
    .png()
    .toBuffer();
}

async function writeWallAssets(id: string, sourceUrl: string) {
  const legacy = id === "kentucky-ledge" || id === "brown-ledge";
  if (legacy) return;
  const sourceBuffer = await fetchBuffer(sourceUrl);
  await writeFile(path.join(sourceDirectory, `${id}.source`), sourceBuffer);
  const atlas = await makeAtlas(sourceBuffer);
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
    const legacy = id === "kentucky-ledge" || id === "brown-ledge";
    const wallBase = legacy ? `/assets/centurion-${id}` : `/assets/centurion/${id}`;
    const thumbPath = legacy ? `${wallBase}.webp` : `/assets/centurion/thumbs/${id}.webp`;
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
  const concurrency = 3;
  let cursor = 0;
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      while (cursor < products.length) {
        const product = products[cursor++] as { id: string; assets: { sourceUrl: string }[] };
        process.stdout.write(`Preparing ${cursor}/${products.length} ${product.id}\n`);
        await writeWallAssets(product.id, product.assets[0]!.sourceUrl);
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
