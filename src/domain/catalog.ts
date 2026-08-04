import { z } from "zod";

const positiveInches = z.number().positive().finite();
const catalogIdSchema = z
  .string()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

export const assetSourceSchema = z.object({
  localPath: z.string().startsWith("/"),
  sourceUrl: z.string().url(),
  retrievedAt: z.string(),
  label: z.string().min(1),
});

export const fireplaceIdSchema = catalogIdSchema;

export const faceOptionIdSchema = catalogIdSchema;

const faceOptionSchema = z.object({
  id: faceOptionIdSchema,
  name: z.string().min(1),
  shape: z.enum(["clean", "arched", "rectangular"]),
  sku: z.string().min(1),
  visibleFace: z.object({
    width: positiveInches,
    height: positiveInches,
  }),
  mediaWindow: z.object({
    width: positiveInches,
    height: positiveInches,
    offsetX: z.number().finite(),
    offsetY: z.number().finite(),
  }),
  asset: assetSourceSchema,
  overlayAsset: assetSourceSchema,
  maskAsset: assetSourceSchema,
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

export const burnMediaSchema = z.object({
  video: assetSourceSchema,
  poster: assetSourceSchema,
  codec: z.literal("H.264/AVC"),
  durationSeconds: z.number().positive().max(20),
  logSet: z.string().min(1),
  sourceTimecode: z.string().min(1),
});

export const fireplaceProductSchema = z.object({
  id: fireplaceIdSchema,
  brandId: catalogIdSchema,
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  shortLabel: z.string().min(1),
  sku: z.string().min(1),
  status: z.literal("approved"),
  applianceType: z.enum(["fireplace", "insert"]),
  fuel: z.enum(["gas", "wood", "electric", "pellet"]),
  style: z.enum(["traditional", "linear", "portrait", "see-through"]),
  viewingArea: z.object({
    width: positiveInches,
    height: positiveInches,
  }),
  faceOptions: z.array(faceOptionSchema).min(1),
  defaultFaceOptionId: faceOptionIdSchema,
  mantelRule: mantelRuleSchema,
  burnMedia: burnMediaSchema,
});

export const mantelProductIdSchema = catalogIdSchema;

export const mantelFinishIdSchema = catalogIdSchema;

export const mantelWidthSchema = z.number().positive().max(144).finite();

export const mantelSizeSchema = z.object({
  width: mantelWidthSchema,
  height: positiveInches,
  depth: positiveInches,
  weight: positiveInches,
  modelCode: z.string().min(1),
});

export const mantelProductSchema = z.object({
  id: mantelProductIdSchema,
  brandId: catalogIdSchema,
  manufacturer: z.string().min(1),
  classification: z.string().min(1),
  status: z.literal("approved"),
  name: z.string().min(1),
  shortLabel: z.string().min(1),
  sourceUrl: z.string().url(),
  sizes: z.array(mantelSizeSchema).min(1),
  finishIds: z.array(mantelFinishIdSchema).min(1),
  defaultWidth: mantelWidthSchema,
  defaultFinishId: mantelFinishIdSchema,
});

export const mantelFinishSchema = z.object({
  id: mantelFinishIdSchema,
  name: z.string().min(1),
  colorHex: z.string().regex(/^#[a-f0-9]{6}$/i),
  compatibleProductIds: z.array(mantelProductIdSchema).min(1),
  assets: z.array(assetSourceSchema).length(3),
});

export const stoneIdSchema = catalogIdSchema;

export const stoneProductSchema = z.object({
  id: stoneIdSchema,
  brandId: catalogIdSchema,
  manufacturer: z.string().min(1),
  status: z.literal("approved"),
  name: z.string().min(1),
  patternCode: z.string().min(1),
  colorCode: z.string().min(1),
  productCode: z.string().min(1),
  pieceRange: z.object({
    widthMin: positiveInches,
    widthMax: positiveInches,
    heightMin: positiveInches,
    heightMax: positiveInches,
  }),
  assets: z.array(assetSourceSchema).length(2),
  hearthstone: z.object({
    manufacturer: z.string().min(1),
    name: z.string().min(1),
    patternCode: z.string().min(1),
    colorName: z.string().min(1),
    colorCode: z.string().min(1),
    dimensions: z.object({
      width: positiveInches,
      depth: positiveInches,
      thickness: positiveInches,
    }),
    assets: z.array(assetSourceSchema).length(2),
  }),
});

const retrievedAt = "2026-08-04";

const officialLayer = (localPath: string, sourceUrl: string, label: string) => ({
  localPath,
  sourceUrl,
  retrievedAt,
  label,
});

const mantelClearance564 = [
  { depth: 0.75, minimumHeight: 35.5 },
  { depth: 2, minimumHeight: 36 },
  { depth: 4, minimumHeight: 36.5 },
  { depth: 6, minimumHeight: 37 },
  { depth: 8, minimumHeight: 37.5 },
  { depth: 10, minimumHeight: 38 },
  { depth: 12, minimumHeight: 38.5 },
];

const faceDefinitions564 = [
  {
    id: "classic-arch",
    name: "Classic Arch · Black",
    shape: "arched" as const,
    sku: "95400402",
    visibleFace: { width: 36.125, height: 29 },
    mediaWindow: { width: 29.08, height: 16.01, offsetX: 0.02, offsetY: -0.17 },
  },
  {
    id: "french-country",
    name: "French Country · Black",
    shape: "arched" as const,
    sku: "95400408",
    visibleFace: { width: 36.125, height: 29 },
    mediaWindow: { width: 29.03, height: 15.94, offsetX: 0, offsetY: -0.1 },
  },
  {
    id: "metropolitan",
    name: "Metropolitan · Black",
    shape: "rectangular" as const,
    sku: "95400411",
    visibleFace: { width: 36.125, height: 29 },
    mediaWindow: { width: 29.15, height: 16.15, offsetX: 0.02, offsetY: -0.03 },
  },
  {
    id: "rectangle-double-door",
    name: "Rectangle Double Door · Black",
    shape: "rectangular" as const,
    sku: "95400467",
    visibleFace: { width: 36.125, height: 29.125 },
    mediaWindow: { width: 29.56, height: 16.64, offsetX: 0.02, offsetY: -0.1 },
  },
];

function faces564(modelAssetId: "trv-25k" | "tv-35k", baseSku: string) {
  return faceDefinitions564.map((face) => ({
    ...face,
    asset: officialLayer(
      `/assets/fpx-564-${modelAssetId}-${face.id}.png`,
      `https://firebuilder.travisindustries.com/fbimages/LayeredImages/${baseSku}_94500626.png`,
      `Official 1800 px Travis FireBuilder ${modelAssetId} Oak layer composited with the official ${face.name} face`,
    ),
    overlayAsset: officialLayer(
      `/assets/fpx-564-${face.id}-overlay.png`,
      `https://firebuilder.travisindustries.com/fbimages/LayeredImages/${face.sku}.png`,
      `Complete official Travis FireBuilder ${face.name} layer`,
    ),
    maskAsset: officialLayer(
      `/assets/fpx-564-${face.id}-media-mask.png`,
      `https://firebuilder.travisindustries.com/fbimages/LayeredImages/${face.sku}.png`,
      `Glass mask extracted from the enclosed opening of the official ${face.name} layer`,
    ),
  }));
}

function cleanFace564(modelAssetId: "trv-25k" | "tv-35k", baseSku: string) {
  return {
    id: "clean-face",
    name: "2″ Clean Face Trim · Black",
    shape: "clean" as const,
    sku: "95900370",
    visibleFace: { width: 36, height: 23.6875 },
    mediaWindow: { width: 29.375, height: 16.375, offsetX: 0.14, offsetY: -0.26 },
    asset: officialLayer(
      `/assets/fpx-564-${modelAssetId}-clean-face.png`,
      `https://firebuilder.travisindustries.com/fbimages/LayeredImages/${baseSku}_94500626.png`,
      `Official 1800 px Travis FireBuilder ${modelAssetId} Oak layer with 2-inch clean-face trim`,
    ),
    overlayAsset: officialLayer(
      "/assets/fpx-564-clean-face-overlay.png",
      "https://firebuilder.travisindustries.com/fbimages/LayeredImages/95900370.png",
      "Complete official Travis FireBuilder 2-inch clean-face trim layer",
    ),
    maskAsset: officialLayer(
      "/assets/fpx-564-clean-face-media-mask.png",
      "https://firebuilder.travisindustries.com/fbimages/LayeredImages/95900370.png",
      "Rectangular glass mask extracted from the official 2-inch clean-face trim layer",
    ),
  };
}

function burnMedia564(model: "25k" | "35k") {
  const is25k = model === "25k";
  const sourceUrl = is25k
    ? "https://www.travisindustries.com/download/BurningVideos/FPX_BurningFootage/F_564TRV25K_MissionFootage.mp4"
    : "https://www.travisindustries.com/download/BurningVideos/FPX_BurningFootage/564TV35KCF_BurningFootage.mp4";
  return {
    video: officialLayer(
      `/assets/fpx-564-${model}-burn.mp4`,
      sourceUrl,
      `Calibrated glass-area loop from official Travis Industries 564 ${model.toUpperCase()} burn footage`,
    ),
    poster: officialLayer(
      `/assets/fpx-564-${model}-burn-poster.webp`,
      is25k
        ? "https://www.travisindustries.com/download/Dragon/56425K_LogSets/Oak/564SSCF_OakLogs_HandMadeBrick_S_ON_638.tif"
        : "https://www.travisindustries.com/download/Dragon/564_35K_Images/Oak/564_35K_Oak_Handmade_S_674.tif",
      `High-resolution official Travis ${model.toUpperCase()} Oak and handmade-brick fallback master`,
    ),
    codec: "H.264/AVC" as const,
    durationSeconds: is25k ? 10 : 12,
    logSet: "Classic Oak",
    sourceTimecode: is25k ? "00:16–00:26" : "00:08–00:20",
  };
}

export const fireplaceProducts = z.array(fireplaceProductSchema).parse([
  {
    id: "564-trv-25k-deluxe",
    brandId: "fireplace-xtrordinair",
    manufacturer: "Fireplace Xtrordinair",
    model: "564 TRV 25K Deluxe",
    shortLabel: "564 25K Designer Face",
    sku: "98500277",
    status: "approved",
    applianceType: "fireplace",
    fuel: "gas",
    style: "traditional",
    viewingArea: { width: 29.375, height: 16.375 },
    defaultFaceOptionId: "classic-arch",
    faceOptions: faces564("trv-25k", "98500277"),
    mantelRule: {
      datum: "fireplace-base",
      manualUrl: "https://www.travisindustries.com/docs/100-01564.pdf",
      manualPage: 47,
      manualRevision: "2024-04-02",
      depthToMinimumHeight: mantelClearance564,
      note: "The manual measures mantel height from the fireplace base; a 6″ mantel requires 37″ and an 8″ mantel requires 37½″.",
    },
    burnMedia: burnMedia564("25k"),
  },
  {
    id: "564-trv-25k-clean-face",
    brandId: "fireplace-xtrordinair",
    manufacturer: "Fireplace Xtrordinair",
    model: "564 TRV 25K Clean Face Deluxe",
    shortLabel: "564 25K Clean Face",
    sku: "98500278",
    status: "approved",
    applianceType: "fireplace",
    fuel: "gas",
    style: "traditional",
    viewingArea: { width: 29.375, height: 16.375 },
    defaultFaceOptionId: "clean-face",
    faceOptions: [cleanFace564("trv-25k", "98500278")],
    mantelRule: {
      datum: "fireplace-base",
      manualUrl: "https://www.travisindustries.com/docs/100-01565.pdf",
      manualPage: 42,
      manualRevision: "2024-04-02",
      depthToMinimumHeight: mantelClearance564,
      note: "The manual measures mantel height from the fireplace base; a 6″ mantel requires 37″ and an 8″ mantel requires 37½″.",
    },
    burnMedia: burnMedia564("25k"),
  },
  {
    id: "564-tv-35k-deluxe",
    brandId: "fireplace-xtrordinair",
    manufacturer: "Fireplace Xtrordinair",
    model: "564 TV 35K Deluxe",
    shortLabel: "564 35K Designer Face",
    sku: "98500297",
    status: "approved",
    applianceType: "fireplace",
    fuel: "gas",
    style: "traditional",
    viewingArea: { width: 29.375, height: 16.375 },
    defaultFaceOptionId: "classic-arch",
    faceOptions: faces564("tv-35k", "98500297"),
    mantelRule: {
      datum: "fireplace-base",
      manualUrl: "https://www.travisindustries.com/docs/100-01551.pdf",
      manualPage: 42,
      manualRevision: "2024-04-02",
      depthToMinimumHeight: mantelClearance564,
      note: "The manual measures mantel height from the fireplace base; a 6″ mantel requires 37″ and an 8″ mantel requires 37½″.",
    },
    burnMedia: burnMedia564("35k"),
  },
  {
    id: "564-tv-35k-clean-face",
    brandId: "fireplace-xtrordinair",
    manufacturer: "Fireplace Xtrordinair",
    model: "564 TV 35K Clean Face Deluxe",
    shortLabel: "564 35K Clean Face",
    sku: "98500298",
    status: "approved",
    applianceType: "fireplace",
    fuel: "gas",
    style: "traditional",
    viewingArea: { width: 29.375, height: 16.375 },
    defaultFaceOptionId: "clean-face",
    faceOptions: [cleanFace564("tv-35k", "98500298")],
    mantelRule: {
      datum: "fireplace-base",
      manualUrl: "https://www.travisindustries.com/docs/100-01552.pdf",
      manualPage: 37,
      manualRevision: "2024-04-02",
      depthToMinimumHeight: mantelClearance564,
      note: "The manual measures mantel height from the fireplace base; a 6″ mantel requires 37″ and an 8″ mantel requires 37½″.",
    },
    burnMedia: burnMedia564("35k"),
  },
  {
    id: "864-trv-31k-clean-face",
    brandId: "fireplace-xtrordinair",
    manufacturer: "Fireplace Xtrordinair",
    model: "864 TRV 31K Clean Face Deluxe",
    shortLabel: "864 Clean Face",
    sku: "98500187",
    status: "approved",
    applianceType: "fireplace",
    fuel: "gas",
    style: "traditional",
    viewingArea: { width: 34.25, height: 22.25 },
    defaultFaceOptionId: "clean-face",
    faceOptions: [
      {
        id: "clean-face",
        name: "Clean Face",
        shape: "clean",
        sku: "98500187",
        visibleFace: { width: 41, height: 30.75 },
        mediaWindow: { width: 34.25, height: 22.25, offsetX: 0, offsetY: 0 },
        asset: officialLayer(
          "/assets/fpx-864-trv-31k-clean-face.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/98500187_94500721.png",
          "Official FireBuilder 900 px clean-face layer with Classic Oak logs",
        ),
        overlayAsset: officialLayer(
          "/assets/fpx-864-trv-31k-clean-face-overlay.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/98500187_94500721.png",
          "Official clean-face layer with the published glass opening isolated",
        ),
        maskAsset: officialLayer(
          "/assets/firebox-media-mask-rect.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/98500187_94500721.png",
          "Rectangular mask calibrated to the official clean-face glass opening",
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
    burnMedia: {
      video: officialLayer(
        "/assets/fpx-864-burn.mp4",
        "https://vimeo.com/468202425",
        "Official Travis Industries 864 Clean Face brick-fireback burn footage",
      ),
      poster: officialLayer(
        "/assets/fpx-864-burn-poster.webp",
        "https://vimeo.com/468202425",
        "Poster extracted from the approved 864 burn loop",
      ),
      codec: "H.264/AVC",
      durationSeconds: 12,
      logSet: "Classic Oak",
      sourceTimecode: "00:08–00:20",
    },
  },
  {
    id: "864-trv-31k-deluxe",
    brandId: "fireplace-xtrordinair",
    manufacturer: "Fireplace Xtrordinair",
    model: "864 TRV 31K Deluxe",
    shortLabel: "864 Designer Face",
    sku: "98500186",
    status: "approved",
    applianceType: "fireplace",
    fuel: "gas",
    style: "traditional",
    viewingArea: { width: 34.25, height: 22.25 },
    defaultFaceOptionId: "classic-arch",
    faceOptions: [
      {
        id: "classic-arch",
        name: "Classic Arch · Black",
        shape: "arched",
        sku: "99300497",
        visibleFace: { width: 40.75, height: 35.5 },
        mediaWindow: {
          width: 30.37,
          height: 20.06,
          offsetX: -0.03,
          offsetY: -1.65,
        },
        asset: officialLayer(
          "/assets/fpx-864-classic-arch.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/99300497.png",
          "Official FireBuilder Classic Arch face composited with the official 864 layer",
        ),
        overlayAsset: officialLayer(
          "/assets/fpx-864-classic-arch-overlay.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/99300497.png",
          "Complete official Classic Arch face layer without inferred cropping",
        ),
        maskAsset: officialLayer(
          "/assets/fpx-864-classic-arch-media-mask.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/99300497.png",
          "Glass mask extracted from the enclosed opening in the official Classic Arch layer",
        ),
      },
      {
        id: "arched-french-country",
        name: "Arched French Country · Black",
        shape: "arched",
        sku: "95800616",
        visibleFace: { width: 40.75, height: 35.5 },
        mediaWindow: {
          width: 31.74,
          height: 21.18,
          offsetX: -0.03,
          offsetY: -1.53,
        },
        asset: officialLayer(
          "/assets/fpx-864-arched-french-country.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/95800616.png",
          "Official FireBuilder French Country face composited with the official 864 layer",
        ),
        overlayAsset: officialLayer(
          "/assets/fpx-864-arched-french-country-overlay.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/95800616.png",
          "Complete official French Country face layer without inferred cropping",
        ),
        maskAsset: officialLayer(
          "/assets/fpx-864-arched-french-country-media-mask.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/95800616.png",
          "Glass mask extracted from the enclosed opening in the official French Country layer",
        ),
      },
      {
        id: "metropolitan",
        name: "Metropolitan · Black",
        shape: "rectangular",
        sku: "95800623",
        visibleFace: { width: 40.875, height: 35.625 },
        mediaWindow: {
          width: 32.63,
          height: 21.06,
          offsetX: 0.25,
          offsetY: -0.31,
        },
        asset: officialLayer(
          "/assets/fpx-864-metropolitan.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/95800623.png",
          "Official FireBuilder Metropolitan face composited with the official 864 layer",
        ),
        overlayAsset: officialLayer(
          "/assets/fpx-864-metropolitan-overlay.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/95800623.png",
          "Complete official Metropolitan face layer without inferred cropping",
        ),
        maskAsset: officialLayer(
          "/assets/fpx-864-metropolitan-media-mask.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/95800623.png",
          "Glass mask extracted from the enclosed opening in the official Metropolitan layer",
        ),
      },
      {
        id: "rectangle-double-door",
        name: "Rectangle Double Door · Black",
        shape: "rectangular",
        sku: "95800743",
        visibleFace: { width: 40.875, height: 35.625 },
        mediaWindow: {
          width: 34.26,
          height: 19.24,
          offsetX: 0.06,
          offsetY: -1.59,
        },
        asset: officialLayer(
          "/assets/fpx-864-rectangle-double-door.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/95800743.png",
          "Official FireBuilder Rectangle Double Door face composited with the official 864 layer",
        ),
        overlayAsset: officialLayer(
          "/assets/fpx-864-rectangle-double-door-overlay.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/95800743.png",
          "Complete official Double Door face layer without inferred cropping",
        ),
        maskAsset: officialLayer(
          "/assets/fpx-864-rectangle-double-door-media-mask.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/95800743.png",
          "Four-panel glass mask extracted from the official Double Door layer",
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
    burnMedia: {
      video: officialLayer(
        "/assets/fpx-864-burn.mp4",
        "https://vimeo.com/468202425",
        "Official Travis Industries 864 Clean Face brick-fireback burn footage",
      ),
      poster: officialLayer(
        "/assets/fpx-864-burn-poster.webp",
        "https://vimeo.com/468202425",
        "Poster extracted from the approved 864 burn loop",
      ),
      codec: "H.264/AVC",
      durationSeconds: 12,
      logSet: "Classic Oak",
      sourceTimecode: "00:08–00:20",
    },
  },
  {
    id: "4237-ember-glo-clean-face",
    brandId: "fireplace-xtrordinair",
    manufacturer: "Fireplace Xtrordinair",
    model: "4237 Ember-Glo Clean Face Deluxe",
    shortLabel: "4237 Clean Face",
    sku: "98500344",
    status: "approved",
    applianceType: "fireplace",
    fuel: "gas",
    style: "traditional",
    viewingArea: { width: 39.875, height: 34.875 },
    defaultFaceOptionId: "4237-clean-face",
    faceOptions: [
      {
        id: "4237-clean-face",
        name: "Clean Face",
        shape: "clean",
        sku: "98500344",
        visibleFace: { width: 43.75, height: 39 },
        mediaWindow: { width: 39.875, height: 34.875, offsetX: 0, offsetY: 0 },
        asset: officialLayer(
          "/assets/fpx-4237-clean-face.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/98500344_96100884_94500982.png",
          "Official FireBuilder 4237 clean-face layer with black glass and Birch logs",
        ),
        overlayAsset: officialLayer(
          "/assets/fpx-4237-clean-face-overlay.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/98500344_96100884_94500982.png",
          "Official 4237 clean-face layer with the published glass opening isolated",
        ),
        maskAsset: officialLayer(
          "/assets/firebox-media-mask-rect.png",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/900/98500344_96100884_94500982.png",
          "Rectangular mask calibrated to the official 4237 glass opening",
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
    burnMedia: {
      video: officialLayer(
        "/assets/fpx-4237-burn.mp4",
        "https://vimeo.com/639273752",
        "Official Travis Industries 4237 Ember-Glo burn footage",
      ),
      poster: officialLayer(
        "/assets/fpx-4237-burn-poster.webp",
        "https://vimeo.com/639273752",
        "Poster extracted from the approved 4237 burn loop",
      ),
      codec: "H.264/AVC",
      durationSeconds: 6,
      logSet: "Classic Oak",
      sourceTimecode: "02:23–02:29",
    },
  },
]);

const finishAssets = (
  id: z.infer<typeof mantelFinishIdSchema>,
  frontUrl: string,
  topUrl: string,
  bumpUrl: string,
) => [
  officialLayer(
    `/assets/pearl-${id}-front.webp`,
    frontUrl,
    `Official Pearl Mantels ${id} front-face reference`,
  ),
  officialLayer(
    `/assets/pearl-${id}-top.webp`,
    topUrl,
    `Official Pearl Mantels ${id} top-face reference`,
  ),
  officialLayer(
    `/assets/pearl-${id}-bump.webp`,
    bumpUrl,
    `Deterministic relief map derived from official Pearl Mantels ${id} photography`,
  ),
];

export const mantelProducts = z.array(mantelProductSchema).parse([
  {
    id: "zachary-smooth",
    brandId: "pearl-mantels",
    manufacturer: "Pearl Mantels",
    classification: "ASTM E136 non-combustible",
    status: "approved",
    name: "Zachary Smooth Non-Combustible Shelf",
    shortLabel: "Zachary Smooth",
    sourceUrl: "https://www.pearlmantels.com/zacharysmoothwhitewash.html",
    sizes: [
      { width: 48, height: 5, depth: 9, weight: 26, modelCode: "NC-48" },
      { width: 60, height: 5, depth: 9, weight: 35, modelCode: "NC-60" },
      { width: 72, height: 5, depth: 9, weight: 42, modelCode: "NC-72" },
      { width: 84, height: 5, depth: 9, weight: 55, modelCode: "NC-84" },
    ],
    finishIds: ["whitewash", "graywash"],
    defaultWidth: 72,
    defaultFinishId: "graywash",
  },
  {
    id: "zachary-wood",
    brandId: "pearl-mantels",
    manufacturer: "Pearl Mantels",
    classification: "ASTM E136 non-combustible",
    status: "approved",
    name: "Zachary Wood Texture Non-Combustible Shelf",
    shortLabel: "Zachary Wood Look",
    sourceUrl: "https://pearlmantels.com/zacharywoodlooklitriv.html",
    sizes: [
      { width: 48, height: 5, depth: 7.87, weight: 21, modelCode: "NC-48" },
      { width: 60, height: 5, depth: 7.87, weight: 26, modelCode: "NC-60" },
      { width: 72, height: 5, depth: 7.87, weight: 30, modelCode: "NC-72" },
      { width: 84, height: 5, depth: 7.87, weight: 48, modelCode: "NC-84" },
    ],
    finishIds: ["little-river"],
    defaultWidth: 72,
    defaultFinishId: "little-river",
  },
  {
    id: "linear",
    brandId: "pearl-mantels",
    manufacturer: "Pearl Mantels",
    classification: "ASTM E136 non-combustible",
    status: "approved",
    name: "Linear Non-Combustible Mantel Shelf",
    shortLabel: "Linear",
    sourceUrl: "https://www.pearlmantels.com/linearpearl.html",
    sizes: [
      { width: 60, height: 4, depth: 8, weight: 87, modelCode: "NCL-60" },
      { width: 84, height: 4, depth: 8, weight: 132, modelCode: "NCL-84" },
    ],
    finishIds: ["pearl", "graphite", "mocha", "onyx", "saddle"],
    defaultWidth: 60,
    defaultFinishId: "pearl",
  },
  {
    id: "tavern",
    brandId: "pearl-mantels",
    manufacturer: "Pearl Mantels",
    classification: "ASTM E136 non-combustible",
    status: "approved",
    name: "Tavern Timbered Beam Non-Combustible Mantel Shelf",
    shortLabel: "Tavern Timbered Beam",
    sourceUrl: "https://www.pearlmantels.com/tavernfieldstone.html",
    sizes: [
      { width: 60, height: 8, depth: 8, weight: 129, modelCode: "NCT-60" },
      { width: 72, height: 8, depth: 8, weight: 157, modelCode: "NCT-72" },
    ],
    finishIds: ["tavern-fieldstone", "tavern-river-rock", "tavern-toasted-rye", "tavern-wheat"],
    defaultWidth: 72,
    defaultFinishId: "tavern-fieldstone",
  },
  {
    id: "natural-cut-stone",
    brandId: "pearl-mantels",
    manufacturer: "Pearl Mantels",
    classification: "ASTM E136 non-combustible",
    status: "approved",
    name: "Natural Cut Stone Non-Combustible Mantel Shelf",
    shortLabel: "Natural Cut Stone",
    sourceUrl: "https://www.pearlmantels.com/cutstonearcticblast.html",
    sizes: [
      { width: 60, height: 5, depth: 9, weight: 100, modelCode: "NCCS-60" },
      { width: 72, height: 5, depth: 9, weight: 115, modelCode: "NCCS-72" },
      { width: 84, height: 5.25, depth: 9.5, weight: 130, modelCode: "NCCS-84" },
    ],
    finishIds: [
      "cut-stone-mist",
      "cut-stone-dusk",
      "cut-stone-arctic-blast",
      "cut-stone-greystone",
    ],
    defaultWidth: 84,
    defaultFinishId: "cut-stone-greystone",
  },
]);

export const mantelFinishes = z.array(mantelFinishSchema).parse([
  {
    id: "whitewash",
    name: "Whitewash",
    colorHex: "#d9d5c8",
    compatibleProductIds: ["zachary-smooth"],
    assets: finishAssets(
      "whitewash",
      "https://www.pearlmantels.com/images/products/ZachsmoothwhtFrontNew.jpg",
      "https://www.pearlmantels.com/images/products/ZachsmwhttopLG.jpg",
      "https://www.pearlmantels.com/images/products/ZachsmoothwhtFrontNew.jpg",
    ),
  },
  {
    id: "graywash",
    name: "Graywash",
    colorHex: "#85847c",
    compatibleProductIds: ["zachary-smooth"],
    assets: finishAssets(
      "graywash",
      "https://www.pearlmantels.com/images/products/ZachsmoothGrtFrontNew.jpg",
      "https://www.pearlmantels.com/images/products/ZachsmGrytopLG.jpg",
      "https://www.pearlmantels.com/images/products/ZachsmoothGrtFrontNew.jpg",
    ),
  },
  {
    id: "little-river",
    name: "Little River",
    colorHex: "#6e625d",
    compatibleProductIds: ["zachary-wood"],
    assets: finishAssets(
      "little-river",
      "https://www.pearlmantels.com/images/products/ZacharyLitRivFrontNew.jpg",
      "https://www.pearlmantels.com/images/products/ZachwdLkLitRivtopLG.jpg",
      "https://www.pearlmantels.com/images/products/ZacharyLitRivFrontNew.jpg",
    ),
  },
  {
    id: "pearl",
    name: "Pearl",
    colorHex: "#e8e3d8",
    compatibleProductIds: ["linear"],
    assets: finishAssets(
      "pearl",
      "https://www.pearlmantels.com/images/products/linear/PearlFrontTop__LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/PearlFrontTop__LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/PearlDetailA_LG.jpg",
    ),
  },
  {
    id: "graphite",
    name: "Graphite",
    colorHex: "#53504b",
    compatibleProductIds: ["linear"],
    assets: finishAssets(
      "graphite",
      "https://www.pearlmantels.com/images/products/linear/GraphiteFrontTop_LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/GraphiteFrontTop_LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/GraphiteDetailA_LG.jpg",
    ),
  },
  {
    id: "mocha",
    name: "Mocha",
    colorHex: "#765a46",
    compatibleProductIds: ["linear"],
    assets: finishAssets(
      "mocha",
      "https://www.pearlmantels.com/images/products/linear/MochaFrontHigh_LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/MochaFrontHigh_LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/MochaTopDetailA_LG.jpg",
    ),
  },
  {
    id: "onyx",
    name: "Onyx",
    colorHex: "#2c2b29",
    compatibleProductIds: ["linear"],
    assets: finishAssets(
      "onyx",
      "https://www.pearlmantels.com/images/products/linear/OnyxFrontTop_LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/OnyxFrontTop_LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/OnyxTopDetailA_LG.jpg",
    ),
  },
  {
    id: "saddle",
    name: "Saddle",
    colorHex: "#8b6848",
    compatibleProductIds: ["linear"],
    assets: finishAssets(
      "saddle",
      "https://www.pearlmantels.com/images/products/linear/SaddleFrontHigh_LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/SaddleFrontHigh_LG.jpg",
      "https://www.pearlmantels.com/images/products/linear/SaddleTopDetail_LG.jpg",
    ),
  },
  {
    id: "tavern-fieldstone",
    name: "Fieldstone",
    colorHex: "#76685a",
    compatibleProductIds: ["tavern"],
    assets: finishAssets(
      "tavern-fieldstone",
      "https://pearlmantels.com/images/products/7205_LG_Web_JPEG/7205_6ft_Tavern_Mantel_Fieldstone_Front.jpg",
      "https://pearlmantels.com/images/products/7208_LG_WEB_JPEG/7208_5ft_TavernMantel_Fieldstone_LeftAngle1.jpg",
      "https://pearlmantels.com/images/products/7205_LG_Web_JPEG/7205_6ft_Tavern_Mantel_Fieldstone_Front.jpg",
    ),
  },
  {
    id: "tavern-river-rock",
    name: "River Rock",
    colorHex: "#6b5b50",
    compatibleProductIds: ["tavern"],
    assets: finishAssets(
      "tavern-river-rock",
      "https://pearlmantels.com/images/products/7206_LG_WEB_JPEG/7206_6ft_TavernMantel_RiverRock_Front.jpg",
      "https://pearlmantels.com/images/products/7209_LG_WEB_JPEG/7209_5ft_TavernMantel_RiverRock_LeftAngle1.jpg",
      "https://pearlmantels.com/images/products/7206_LG_WEB_JPEG/7206_6ft_TavernMantel_RiverRock_Front.jpg",
    ),
  },
  {
    id: "tavern-toasted-rye",
    name: "Toasted Rye",
    colorHex: "#8d6847",
    compatibleProductIds: ["tavern"],
    assets: finishAssets(
      "tavern-toasted-rye",
      "https://pearlmantels.com/images/products/7204_LG_Web_JPEG/7204_6ft_Tavern_ToastedRye_Front.jpg",
      "https://pearlmantels.com/images/products/7207_LG_WEB_JPG/7207_5ft_TavernMantel_ToastedRye_LeftAngle1.jpg",
      "https://pearlmantels.com/images/products/7204_LG_Web_JPEG/7204_6ft_Tavern_ToastedRye_Front.jpg",
    ),
  },
  {
    id: "tavern-wheat",
    name: "Wheat",
    colorHex: "#a88762",
    compatibleProductIds: ["tavern"],
    assets: finishAssets(
      "tavern-wheat",
      "https://pearlmantels.com/images/products/7228_LG_WEB_JPEG/7228_6ft_Tavern_Mantel_Wheat_Front.jpg",
      "https://pearlmantels.com/images/products/7229_LG_WEB_JPEG/7229_Pearl_5ft_Tavern_Mantel_Wheat_LeftAngle1.jpg",
      "https://pearlmantels.com/images/products/7228_LG_WEB_JPEG/7228_6ft_Tavern_Mantel_Wheat_Front.jpg",
    ),
  },
  {
    id: "cut-stone-mist",
    name: "Mist",
    colorHex: "#aaa89f",
    compatibleProductIds: ["natural-cut-stone"],
    assets: finishAssets(
      "cut-stone-mist",
      "https://pearlmantels.com/images/products/CutStoneMistFrontLG.jpg",
      "https://pearlmantels.com/images/products/CutStone_Mist_Right%20High%20AngleLG.jpg",
      "https://pearlmantels.com/images/products/CutStoneMistFrontLG.jpg",
    ),
  },
  {
    id: "cut-stone-dusk",
    name: "Dusk",
    colorHex: "#827870",
    compatibleProductIds: ["natural-cut-stone"],
    assets: finishAssets(
      "cut-stone-dusk",
      "https://pearlmantels.com/images/products/CutStoneDuskFrontLG.jpg",
      "https://pearlmantels.com/images/products/CutStone_Dusk_Right%20High%20AngleLG.jpg",
      "https://pearlmantels.com/images/products/CutStoneDuskFrontLG.jpg",
    ),
  },
  {
    id: "cut-stone-arctic-blast",
    name: "Arctic Blast",
    colorHex: "#d1d0c8",
    compatibleProductIds: ["natural-cut-stone"],
    assets: finishAssets(
      "cut-stone-arctic-blast",
      "https://pearlmantels.com/images/products/CutStoneArcticBlastFrontLG.jpg",
      "https://pearlmantels.com/images/products/7223_LG_WEB_JPEG/7223_5ft_Arctic%20Blast_AboveLeft1.jpg",
      "https://pearlmantels.com/images/products/CutStoneArcticBlastFrontLG.jpg",
    ),
  },
  {
    id: "cut-stone-greystone",
    name: "Greystone",
    colorHex: "#77736d",
    compatibleProductIds: ["natural-cut-stone"],
    assets: finishAssets(
      "cut-stone-greystone",
      "https://pearlmantels.com/images/products/CutStoneGreystoneFrontLG.jpg",
      "https://pearlmantels.com/images/products/7222_LG_Web_JPEG/7222_5ft_GreystoneAboveLeft1.jpg",
      "https://pearlmantels.com/images/products/CutStoneGreystoneFrontLG.jpg",
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
    brandId: "centurion-stone",
    manufacturer: "Centurion Stone",
    status: "approved",
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
    hearthstone: {
      manufacturer: "Centurion Stone",
      name: "Hearthstone",
      patternCode: "860",
      colorName: "Kentucky",
      colorCode: "260-15",
      dimensions: { width: 18, depth: 20, thickness: 1.5 },
      assets: [
        officialLayer(
          "/assets/centurion-hearthstone-kentucky.webp",
          "https://www.centurionstone.com/wp-content/uploads/2024/08/Kentucky.webp",
          "Official Centurion Kentucky accessory-color reference",
        ),
        officialLayer(
          "/assets/centurion-hearthstone-kentucky-bump.webp",
          "https://www.centurionstone.com/wp-content/uploads/2024/08/Kentucky.webp",
          "Deterministic relief map derived from the official Kentucky accessory swatch",
        ),
      ],
    },
  },
  {
    id: "brown-ledge",
    brandId: "centurion-stone",
    manufacturer: "Centurion Stone",
    status: "approved",
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
    hearthstone: {
      manufacturer: "Centurion Stone",
      name: "Hearthstone",
      patternCode: "860",
      colorName: "Brown",
      colorCode: "200-25",
      dimensions: { width: 18, depth: 20, thickness: 1.5 },
      assets: [
        officialLayer(
          "/assets/centurion-hearthstone-brown.webp",
          "https://www.centurionstone.com/wp-content/uploads/2024/08/Brown.webp",
          "Official Centurion Brown accessory-color reference",
        ),
        officialLayer(
          "/assets/centurion-hearthstone-brown-bump.webp",
          "https://www.centurionstone.com/wp-content/uploads/2024/08/Brown.webp",
          "Deterministic relief map derived from the official Brown accessory swatch",
        ),
      ],
    },
  },
]);

export const APP_VERSION = "0.21.0";

export type FireplaceId = z.infer<typeof fireplaceIdSchema>;
export type FaceOptionId = z.infer<typeof faceOptionIdSchema>;
export type MantelFinishId = z.infer<typeof mantelFinishIdSchema>;
export type MantelProductId = z.infer<typeof mantelProductIdSchema>;
export type MantelWidth = z.infer<typeof mantelWidthSchema>;
export type StoneId = z.infer<typeof stoneIdSchema>;
export type FireplaceProduct = z.infer<typeof fireplaceProductSchema>;
export type BurnMedia = z.infer<typeof burnMediaSchema>;
export type MantelProduct = z.infer<typeof mantelProductSchema>;
export type StoneProduct = z.infer<typeof stoneProductSchema>;
