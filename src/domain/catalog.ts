import { z } from "zod";

const positiveInches = z.number().positive().finite();

export const assetSourceSchema = z.object({
  localPath: z.string().startsWith("/"),
  sourceUrl: z.string().url(),
  retrievedAt: z.string(),
  label: z.string().min(1),
});

export const fireplaceIdSchema = z.enum([
  "864-trv-31k-clean-face",
  "864-trv-31k-deluxe",
  "4237-ember-glo-clean-face",
]);

export const faceOptionIdSchema = z.enum([
  "clean-face",
  "classic-arch",
  "arched-french-country",
  "metropolitan",
  "rectangle-double-door",
  "4237-clean-face",
]);

const faceOptionSchema = z.object({
  id: faceOptionIdSchema,
  name: z.string().min(1),
  shape: z.enum(["clean", "arched", "rectangular"]),
  sku: z.string().min(1),
  visibleFace: z.object({
    width: positiveInches,
    height: positiveInches,
  }),
  asset: assetSourceSchema,
});

const mantelRuleSchema = z.object({
  datum: z.literal("fireplace-base"),
  manualUrl: z.string().url(),
  manualPage: z.number().int().positive(),
  manualRevision: z.string().min(1),
  depthToMinimumHeight: z
    .array(
      z.object({
        depth: positiveInches,
        minimumHeight: positiveInches,
      }),
    )
    .min(2),
  note: z.string().min(1),
});

export const fireplaceProductSchema = z.object({
  id: fireplaceIdSchema,
  manufacturer: z.literal("Fireplace Xtrordinair"),
  model: z.string().min(1),
  shortLabel: z.string().min(1),
  sku: z.string().min(1),
  viewingArea: z.object({
    width: positiveInches,
    height: positiveInches,
  }),
  faceOptions: z.array(faceOptionSchema).min(1),
  defaultFaceOptionId: faceOptionIdSchema,
  mantelRule: mantelRuleSchema,
});

export const mantelSizeSchema = z.object({
  width: z.union([z.literal(60), z.literal(84)]),
  height: z.literal(4),
  depth: z.literal(8),
  weight: positiveInches,
});

export const mantelFinishIdSchema = z.enum(["pearl", "graphite", "mocha", "onyx", "saddle"]);

export const mantelFinishSchema = z.object({
  id: mantelFinishIdSchema,
  name: z.string().min(1),
  colorHex: z.string().regex(/^#[a-f0-9]{6}$/i),
  assets: z.array(assetSourceSchema).length(2),
});

export const stoneIdSchema = z.enum(["kentucky-ledge", "brown-ledge"]);

export const stoneProductSchema = z.object({
  id: stoneIdSchema,
  manufacturer: z.literal("Centurion Stone"),
  name: z.string().min(1),
  patternCode: z.literal("150"),
  colorCode: z.string().min(1),
  productCode: z.string().min(1),
  pieceRange: z.object({
    widthMin: positiveInches,
    widthMax: positiveInches,
    heightMin: positiveInches,
    heightMax: positiveInches,
  }),
  assets: z.array(assetSourceSchema).length(2),
});

const retrievedAt = "2026-07-30";

const officialLayer = (localPath: string, sourceUrl: string, label: string) => ({
  localPath,
  sourceUrl,
  retrievedAt,
  label,
});

export const fireplaceProducts = z.array(fireplaceProductSchema).parse([
  {
    id: "864-trv-31k-clean-face",
    manufacturer: "Fireplace Xtrordinair",
    model: "864 TRV 31K Clean Face Deluxe",
    shortLabel: "864 Clean Face",
    sku: "98500187",
    viewingArea: { width: 34.25, height: 22.25 },
    defaultFaceOptionId: "clean-face",
    faceOptions: [
      {
        id: "clean-face",
        name: "Clean Face",
        shape: "clean",
        sku: "98500187",
        visibleFace: { width: 41, height: 30.75 },
        asset: officialLayer(
          "/assets/fpx-864-trv-31k-clean-face.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/98500187_94500721.png",
          "Official FireBuilder 900 px clean-face layer with Classic Oak logs",
        ),
      },
    ],
    mantelRule: {
      datum: "fireplace-base",
      manualUrl: "https://www.travisindustries.com/docs/100-01483.pdf",
      manualPage: 43,
      manualRevision: "2023-04-12",
      depthToMinimumHeight: [
        { depth: 1, minimumHeight: 43.75 },
        { depth: 7, minimumHeight: 43.75 },
        { depth: 8, minimumHeight: 44.75 },
        { depth: 12, minimumHeight: 48.75 },
      ],
      note: "An 8″ deep mantel must be at least 44¾″ above the base of the fireplace.",
    },
  },
  {
    id: "864-trv-31k-deluxe",
    manufacturer: "Fireplace Xtrordinair",
    model: "864 TRV 31K Deluxe",
    shortLabel: "864 Designer Face",
    sku: "98500186",
    viewingArea: { width: 34.25, height: 22.25 },
    defaultFaceOptionId: "classic-arch",
    faceOptions: [
      {
        id: "classic-arch",
        name: "Classic Arch · Black",
        shape: "arched",
        sku: "99300497",
        visibleFace: { width: 40.75, height: 35.5 },
        asset: officialLayer(
          "/assets/fpx-864-classic-arch.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/99300497.png",
          "Official FireBuilder Classic Arch face composited with the official 864 layer",
        ),
      },
      {
        id: "arched-french-country",
        name: "Arched French Country · Black",
        shape: "arched",
        sku: "95800616",
        visibleFace: { width: 40.75, height: 35.5 },
        asset: officialLayer(
          "/assets/fpx-864-arched-french-country.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/95800616.png",
          "Official FireBuilder French Country face composited with the official 864 layer",
        ),
      },
      {
        id: "metropolitan",
        name: "Metropolitan · Black",
        shape: "rectangular",
        sku: "95800623",
        visibleFace: { width: 40.875, height: 35.625 },
        asset: officialLayer(
          "/assets/fpx-864-metropolitan.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/95800623.png",
          "Official FireBuilder Metropolitan face composited with the official 864 layer",
        ),
      },
      {
        id: "rectangle-double-door",
        name: "Rectangle Double Door · Black",
        shape: "rectangular",
        sku: "95800743",
        visibleFace: { width: 40.875, height: 35.625 },
        asset: officialLayer(
          "/assets/fpx-864-rectangle-double-door.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/95800743.png",
          "Official FireBuilder Rectangle Double Door face composited with the official 864 layer",
        ),
      },
    ],
    mantelRule: {
      datum: "fireplace-base",
      manualUrl: "https://www.travisindustries.com/docs/100-01482.pdf",
      manualPage: 46,
      manualRevision: "2023-04-12",
      depthToMinimumHeight: [
        { depth: 1, minimumHeight: 43.75 },
        { depth: 7, minimumHeight: 43.75 },
        { depth: 8, minimumHeight: 44.75 },
        { depth: 12, minimumHeight: 48.75 },
      ],
      note: "An 8″ deep mantel must be at least 8″ above the fireplace face, equal to 44¾″ above the base.",
    },
  },
  {
    id: "4237-ember-glo-clean-face",
    manufacturer: "Fireplace Xtrordinair",
    model: "4237 Ember-Glo Clean Face Deluxe",
    shortLabel: "4237 Clean Face",
    sku: "98500344",
    viewingArea: { width: 39.875, height: 34.875 },
    defaultFaceOptionId: "4237-clean-face",
    faceOptions: [
      {
        id: "4237-clean-face",
        name: "Clean Face",
        shape: "clean",
        sku: "98500344",
        visibleFace: { width: 43.75, height: 39 },
        asset: officialLayer(
          "/assets/fpx-4237-clean-face.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/98500344_96100884_94500982.png",
          "Official FireBuilder 4237 clean-face layer with black glass and Birch logs",
        ),
      },
    ],
    mantelRule: {
      datum: "fireplace-base",
      manualUrl: "https://www.travisindustries.com/docs/100-01561.pdf",
      manualPage: 35,
      manualRevision: "2026-06-09",
      depthToMinimumHeight: [
        { depth: 2, minimumHeight: 51 },
        { depth: 4, minimumHeight: 53 },
        { depth: 6, minimumHeight: 55 },
        { depth: 8, minimumHeight: 57 },
        { depth: 10, minimumHeight: 59 },
        { depth: 12, minimumHeight: 61 },
      ],
      note: "An 8″ deep mantel must be at least 57″ above the base of the fireplace.",
    },
  },
]);

export const mantelSizes = z.array(mantelSizeSchema).parse([
  { width: 60, height: 4, depth: 8, weight: 87 },
  { width: 84, height: 4, depth: 8, weight: 132 },
]);

const finishAssets = (
  id: z.infer<typeof mantelFinishIdSchema>,
  frontUrl: string,
  detailUrl: string,
) => [
  officialLayer(
    `/assets/pearl-linear-${id}.webp`,
    frontUrl,
    `Official Pearl Mantels ${id} finish reference`,
  ),
  officialLayer(
    `/assets/pearl-linear-${id}-bump.webp`,
    detailUrl,
    `Deterministic relief map derived from official Pearl Mantels ${id} detail photography`,
  ),
];

export const mantelFinishes = z.array(mantelFinishSchema).parse([
  {
    id: "pearl",
    name: "Pearl",
    colorHex: "#e8e3d8",
    assets: finishAssets(
      "pearl",
      "https://www.pearlmantels.com/images/products/linear/PearlFrontTop__LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/PearlDetailA_LG.jpg",
    ),
  },
  {
    id: "graphite",
    name: "Graphite",
    colorHex: "#53504b",
    assets: finishAssets(
      "graphite",
      "https://www.pearlmantels.com/images/products/linear/GraphiteFrontTop_LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/GraphiteDetailA_LG.jpg",
    ),
  },
  {
    id: "mocha",
    name: "Mocha",
    colorHex: "#765a46",
    assets: finishAssets(
      "mocha",
      "https://www.pearlmantels.com/images/products/linear/MochaFrontHigh_LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/MochaTopDetailA_LG.jpg",
    ),
  },
  {
    id: "onyx",
    name: "Onyx",
    colorHex: "#2c2b29",
    assets: finishAssets(
      "onyx",
      "https://www.pearlmantels.com/images/products/linear/OnyxFrontTop_LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/OnyxTopDetailA_LG.jpg",
    ),
  },
  {
    id: "saddle",
    name: "Saddle",
    colorHex: "#8b6848",
    assets: finishAssets(
      "saddle",
      "https://www.pearlmantels.com/images/products/linear/SaddleFrontHigh_LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/SaddleTopDetail_LG.jpg",
    ),
  },
]);

const ledgePieceRange = {
  widthMin: 6.5,
  widthMax: 16.75,
  heightMin: 1,
  heightMax: 2.5,
};

export const stoneProducts = z.array(stoneProductSchema).parse([
  {
    id: "kentucky-ledge",
    manufacturer: "Centurion Stone",
    name: "Kentucky Ledge",
    patternCode: "150",
    colorCode: "260",
    productCode: "150-260-15",
    pieceRange: ledgePieceRange,
    assets: [
      officialLayer(
        "/assets/centurion-kentucky-ledge.webp",
        "https://www.centurionstone.com/wp-content/uploads/2024/03/Kentucky-Ledge-Swatch-scaled.jpg",
        "Official Kentucky Ledge swatch",
      ),
      officialLayer(
        "/assets/centurion-kentucky-ledge-bump.webp",
        "https://www.centurionstone.com/wp-content/uploads/2024/03/Kentucky-Ledge-Swatch-scaled.jpg",
        "Deterministic relief map derived from the official swatch",
      ),
    ],
  },
  {
    id: "brown-ledge",
    manufacturer: "Centurion Stone",
    name: "Brown Ledge",
    patternCode: "150",
    colorCode: "200",
    productCode: "150-200-25",
    pieceRange: ledgePieceRange,
    assets: [
      officialLayer(
        "/assets/centurion-brown-ledge.webp",
        "https://www.centurionstone.com/wp-content/uploads/2024/03/Brown_Ledge_Swatch.webp",
        "Official Brown Ledge swatch",
      ),
      officialLayer(
        "/assets/centurion-brown-ledge-bump.webp",
        "https://www.centurionstone.com/wp-content/uploads/2024/03/Brown_Ledge_Swatch.webp",
        "Deterministic relief map derived from the official swatch",
      ),
    ],
  },
]);

export function getFireplaceProduct(id: z.infer<typeof fireplaceIdSchema>) {
  const product = fireplaceProducts.find((candidate) => candidate.id === id);
  if (!product) throw new Error(`Unknown approved fireplace: ${id}`);
  return product;
}

export function getFaceOption(
  fireplaceId: z.infer<typeof fireplaceIdSchema>,
  faceOptionId: z.infer<typeof faceOptionIdSchema>,
) {
  const product = getFireplaceProduct(fireplaceId);
  const selected = product.faceOptions.find((candidate) => candidate.id === faceOptionId);
  if (selected) return selected;
  const fallback = product.faceOptions.find(
    (candidate) => candidate.id === product.defaultFaceOptionId,
  );
  if (fallback) return fallback;
  throw new Error(`Fireplace ${fireplaceId} has no approved face option.`);
}

export function getStoneProduct(id: z.infer<typeof stoneIdSchema>) {
  const product = stoneProducts.find((candidate) => candidate.id === id);
  if (!product) throw new Error(`Unknown approved stone: ${id}`);
  return product;
}

export function getMantelSize(width: 60 | 84) {
  const size = mantelSizes.find((candidate) => candidate.width === width);
  if (!size) throw new Error(`Unknown approved mantel size: ${width}`);
  return size;
}

export function getMantelFinish(id: z.infer<typeof mantelFinishIdSchema>) {
  const finish = mantelFinishes.find((candidate) => candidate.id === id);
  if (!finish) throw new Error(`Unknown approved mantel finish: ${id}`);
  return finish;
}

export const ALL_ASSET_PATHS = [
  ...fireplaceProducts.flatMap((product) =>
    product.faceOptions.map((option) => option.asset.localPath),
  ),
  ...stoneProducts.flatMap((product) => product.assets.map((asset) => asset.localPath)),
  ...mantelFinishes.flatMap((finish) => finish.assets.map((asset) => asset.localPath)),
].filter((path, index, all) => all.indexOf(path) === index);

export const APP_VERSION = "0.2.0";
export const ASSET_VERSION = "2026.07.30-3";

export type FireplaceId = z.infer<typeof fireplaceIdSchema>;
export type FaceOptionId = z.infer<typeof faceOptionIdSchema>;
export type MantelFinishId = z.infer<typeof mantelFinishIdSchema>;
export type StoneId = z.infer<typeof stoneIdSchema>;
export type FireplaceProduct = z.infer<typeof fireplaceProductSchema>;
export type StoneProduct = z.infer<typeof stoneProductSchema>;
