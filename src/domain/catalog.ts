import { z } from "zod";

const positiveInches = z.number().positive().finite();

export const assetSourceSchema = z.object({
  localPath: z.string().startsWith("/"),
  sourceUrl: z.string().url(),
  retrievedAt: z.string(),
  label: z.string().min(1),
});

export const fireplaceProductSchema = z.object({
  manufacturer: z.literal("Fireplace Xtrordinair"),
  model: z.literal("864 TRV 31K Clean Face Deluxe"),
  sku: z.literal("98500187"),
  visibleFace: z.object({
    width: positiveInches,
    height: positiveInches,
  }),
  applianceHeight: positiveInches,
  viewingArea: z.object({
    width: positiveInches,
    height: positiveInches,
  }),
  asset: assetSourceSchema,
});

export const mantelProductSchema = z.object({
  manufacturer: z.literal("Pearl Mantels"),
  model: z.literal("NCL-60Pearl"),
  name: z.literal("Linear Non-Combustible Mantel Shelf"),
  dimensions: z.object({
    width: positiveInches,
    height: positiveInches,
    depth: positiveInches,
  }),
  minimumClearance: positiveInches,
  assets: z.array(assetSourceSchema).min(1),
});

export const stoneProductSchema = z.object({
  manufacturer: z.literal("Centurion Stone"),
  name: z.literal("Kentucky Ledge"),
  patternCode: z.literal("150"),
  colorCode: z.literal("260"),
  pieceRange: z.object({
    widthMin: positiveInches,
    widthMax: positiveInches,
    heightMin: positiveInches,
    heightMax: positiveInches,
  }),
  assets: z.array(assetSourceSchema).min(1),
});

const retrievedAt = "2026-07-30";

export const fireplaceProduct = fireplaceProductSchema.parse({
  manufacturer: "Fireplace Xtrordinair",
  model: "864 TRV 31K Clean Face Deluxe",
  sku: "98500187",
  visibleFace: {
    width: 41,
    height: 30.75,
  },
  applianceHeight: 36.75,
  viewingArea: {
    width: 34.25,
    height: 22.25,
  },
  asset: {
    localPath: "/assets/fpx-864-trv-31k-clean-face.png",
    sourceUrl:
      "https://firebuilder.travisindustries.com/fbimages/LayeredImages/750/98500187_94500721.png",
    retrievedAt,
    label: "Official FireBuilder product layer",
  },
});

export const mantelProduct = mantelProductSchema.parse({
  manufacturer: "Pearl Mantels",
  model: "NCL-60Pearl",
  name: "Linear Non-Combustible Mantel Shelf",
  dimensions: {
    width: 60,
    height: 4,
    depth: 8,
  },
  minimumClearance: 8,
  assets: [
    {
      localPath: "/assets/pearl-ncl-60-pearl.webp",
      sourceUrl: "https://www.pearlmantels.com/images/products/linear/PearlFrontTop__LG.jpg",
      retrievedAt,
      label: "Official front and top finish reference",
    },
    {
      localPath: "/assets/pearl-ncl-60-pearl-bump.webp",
      sourceUrl: "https://www.pearlmantels.com/images/products/linear/PearlDetailA_LG.jpg",
      retrievedAt,
      label: "Deterministic relief map derived from official detail photography",
    },
  ],
});

export const stoneProduct = stoneProductSchema.parse({
  manufacturer: "Centurion Stone",
  name: "Kentucky Ledge",
  patternCode: "150",
  colorCode: "260",
  pieceRange: {
    widthMin: 6.5,
    widthMax: 16.75,
    heightMin: 1,
    heightMax: 2.5,
  },
  assets: [
    {
      localPath: "/assets/centurion-kentucky-ledge.webp",
      sourceUrl:
        "https://www.centurionstone.com/wp-content/uploads/2024/03/Kentucky-Ledge-Swatch-scaled.jpg",
      retrievedAt,
      label: "Official Kentucky Ledge swatch",
    },
    {
      localPath: "/assets/centurion-kentucky-ledge-bump.webp",
      sourceUrl:
        "https://www.centurionstone.com/wp-content/uploads/2024/03/Kentucky-Ledge-Swatch-scaled.jpg",
      retrievedAt,
      label: "Deterministic relief map derived from official swatch",
    },
  ],
});

export const APP_VERSION = "0.1.0";
export const ASSET_VERSION = "2026.07.30-2";

export type FireplaceProduct = z.infer<typeof fireplaceProductSchema>;
export type MantelProduct = z.infer<typeof mantelProductSchema>;
export type StoneProduct = z.infer<typeof stoneProductSchema>;
