import { z } from "zod";
import {
  catalogIntakeSchema,
  intakeProductSchema,
  intakeStageSchema,
} from "@/catalog/intakeSchema";

export { catalogIntakeSchema, summarizeCatalogIntake } from "@/catalog/intakeSchema";

const specsUrl = "https://www.fireplacex.com/professionals/specs-and-drawings/";
const checkedAt = "2026-08-05";

const gasFireplace = (
  id: string,
  model: string,
  style: "traditional" | "linear" | "portrait" | "see-through",
  options: {
    productUrl?: string;
    stage?: z.infer<typeof intakeStageSchema>;
    approvedCatalogIds?: string[];
    notes?: string;
    evidence?: z.input<typeof intakeProductSchema>["evidence"];
  } = {},
) => ({
  id,
  brandId: "fireplace-xtrordinair" as const,
  model,
  applianceType: "fireplace" as const,
  fuel: "gas" as const,
  style,
  stage: options.stage ?? ("source-indexed" as const),
  approvedCatalogIds: options.approvedCatalogIds ?? [],
  productUrl: options.productUrl ?? specsUrl,
  officialIndexUrl: specsUrl,
  sourceCheckedAt: checkedAt,
  notes:
    options.notes ??
    "Official product family is indexed; manuals, option SKUs, visual layers, and burn media remain gated.",
  evidence: options.evidence,
});

const indexedProduct = (
  id: string,
  model: string,
  applianceType: "fireplace" | "insert",
  fuel: "gas" | "wood" | "electric",
  style: "traditional" | "linear" | "portrait",
  productUrl: string,
  officialIndexUrl = productUrl,
) => ({
  id,
  brandId: "fireplace-xtrordinair" as const,
  model,
  applianceType,
  fuel,
  style,
  stage: "source-indexed" as const,
  approvedCatalogIds: [],
  productUrl,
  officialIndexUrl,
  sourceCheckedAt: checkedAt,
  notes:
    "Official current product page is indexed; dimensions, current manual revision, options, and production visuals remain gated.",
});

const verifiedWoodFireplace = (options: {
  id: string;
  model: string;
  productUrl: string;
  sku: string;
  fireBuilderProductId: number;
  fireBuilderModelId: number;
  variants: { id: string; viewingArea: { width: number; height: number } }[];
  manualUrl: string;
  manualRevision: string;
  dimensionPage: number;
  mantelPage: number;
  hearthPage: number;
  mantelProfiles: {
    material: "combustible" | "non-combustible";
    points: { projection: number; minimumClearance: number }[];
  }[];
  hearth: {
    minimumWidth: number;
    maximumRaisedHeight: number;
    minimumRValue: number;
    placementProfiles: { applianceElevation: number; minimumHorizontalExtension: number }[];
  };
  visualOptionIds: string[];
  visualSourceSku: string;
}) => ({
  ...indexedProduct(
    options.id,
    options.model,
    "fireplace",
    "wood",
    "traditional",
    options.productUrl,
    "https://www.fireplacex.com/products/wood-fireplaces/",
  ),
  stage: "approved" as const,
  approvedCatalogIds: [options.id],
  notes:
    "Current model identity, manual dimensions, mantel and hearth rules, live FireBuilder options, and exact official static composites are verified. The 960 px isolated configurator master remains below the 4K visual-source gate.",
  evidence: {
    productIdentifiers: [
      { id: options.sku, kind: "sku" as const },
      { id: options.model, kind: "model" as const },
    ],
    variants: options.variants,
    installationManualUrl: options.manualUrl,
    installationManualRevision: options.manualRevision,
    dimensionPages: [options.dimensionPage],
    clearanceRulePages: [options.mantelPage, options.hearthPage],
    clearanceRules: {
      mantel: {
        measurementFrom: "appliance-base" as const,
        profiles: options.mantelProfiles,
      },
      hearth: {
        measurementFrom: "appliance-base" as const,
        placementProfiles: options.hearth.placementProfiles,
        minimumThickness: 1,
        minimumWidth: options.hearth.minimumWidth,
        maximumRaisedHeight: options.hearth.maximumRaisedHeight,
        minimumRValue: options.hearth.minimumRValue,
      },
    },
    optionPages: [],
    visualOptionIds: options.visualOptionIds,
    visualSourceUrls: [
      `https://firebuilder.travisindustries.com/api/product/${options.fireBuilderProductId}/pl/1/cy/1`,
      `https://firebuilder.travisindustries.com/api/product/${options.fireBuilderProductId}/pl/1/accessory`,
      `https://firebuilder.travisindustries.com/fbimages/LayeredImages/${options.visualSourceSku}.png`,
    ],
    visualMaster: {
      requirement: {
        minimumWidth: 2400,
        minimumHeight: 1800,
        requiresIsolation: true,
        requiresTransparentMediaOpening: false,
      },
      candidates: [
        {
          id: `firebuilder-${options.visualSourceSku}`,
          sourceUrl: `https://firebuilder.travisindustries.com/fbimages/LayeredImages/${options.visualSourceSku}.png`,
          kind: "configurator-layer" as const,
          width: 960,
          height: 960,
          isolated: true,
          transparentMediaOpening: false,
        },
      ],
    },
    maximumOfficialLayerPixels: 960,
    assetQualityGate: "blocked-high-resolution-master" as const,
  },
});

const electricUrl = "https://www.fireplacex.com/electric-fireplaces/";

export const FPX_CURRENT_INTAKE = catalogIntakeSchema.parse({
  schemaVersion: 2,
  snapshotId: "fpx-2026.08.05-1",
  brandId: "fireplace-xtrordinair",
  brandName: "Fireplace Xtrordinair",
  manufacturer: "Travis Industries",
  sourceCheckedAt: checkedAt,
  sourceUrls: [
    specsUrl,
    "https://www.fireplacex.com/products/gas-fireplaces/",
    electricUrl,
    "https://www.fireplacex.com/products/wood-fireplaces/",
    "https://www.fireplacex.com/gallery/gas-fireplace-inserts-gallery/",
    "https://www.fireplacex.com/gallery/wood-fireplace-inserts-gallery/",
  ],
  products: [
    gasFireplace("564-trv-25k-deluxe", "564 TRV 25K Deluxe", "traditional", {
      productUrl: "https://www.fireplacex.com/product/564-trv-25k/",
      stage: "approved",
      approvedCatalogIds: ["564-trv-25k-deluxe"],
      evidence: {
        productSku: "98500277",
        fireBuilderProductId: 103,
        fireBuilderModelId: 546,
        viewingArea: { width: 29.375, height: 16.375 },
        installationManualUrl: "https://www.travisindustries.com/docs/100-01564.pdf",
        installationManualRevision: "2024-04-02",
        mantelRulePage: 42,
        visualOptionSkus: [
          "95400402",
          "95400408",
          "95400443",
          "95400467",
          "95400411",
          "95400442",
          "95400444",
          "95400415",
          "96200808",
          "96200801",
          "96200804",
          "94500626",
          "94500624",
        ],
        visualMaster: {
          requirement: {
            minimumWidth: 1800,
            minimumHeight: 1800,
            requiresIsolation: true,
            requiresTransparentMediaOpening: true,
          },
          candidates: [
            {
              id: "firebuilder-raw-face-layer",
              sourceUrl:
                "https://firebuilder.travisindustries.com/fbimages/LayeredImages/95400402.png",
              kind: "configurator-layer",
              width: 1800,
              height: 1800,
              isolated: true,
              transparentMediaOpening: true,
            },
            {
              id: "official-25k-lossless-master",
              sourceUrl:
                "https://www.travisindustries.com/download/Dragon/56425K_LogSets/Oak/564SSCF_OakLogs_HandMadeBrick_S_ON_638.tif",
              kind: "isolated-product",
              width: 4603,
              height: 2825,
              isolated: false,
              transparentMediaOpening: false,
            },
          ],
        },
        maximumOfficialLayerPixels: 4603,
        assetQualityGate: "approved",
      },
      notes:
        "Approved from the current manual, official 1800 px transparent face layers, a lossless 4603 px Travis firebox master, and locally packaged official burn footage.",
    }),
    gasFireplace("564-trv-25k-clean-face", "564 TRV 25K Clean Face Deluxe", "traditional", {
      productUrl: "https://www.fireplacex.com/product/564-trv-25k-clean-face/",
      stage: "approved",
      approvedCatalogIds: ["564-trv-25k-clean-face"],
      evidence: {
        productSku: "98500278",
        fireBuilderProductId: 105,
        fireBuilderModelId: 547,
        viewingArea: { width: 29.375, height: 16.375 },
        installationManualUrl: "https://www.travisindustries.com/docs/100-01565.pdf",
        installationManualRevision: "2024-04-02",
        mantelRulePage: 42,
        visualOptionSkus: ["95900370", "95900380", "95900382", "94500626", "94500624"],
        visualMaster: {
          requirement: {
            minimumWidth: 1800,
            minimumHeight: 1800,
            requiresIsolation: true,
            requiresTransparentMediaOpening: true,
          },
          candidates: [
            {
              id: "firebuilder-raw-trim-layer",
              sourceUrl:
                "https://firebuilder.travisindustries.com/fbimages/LayeredImages/95900370.png",
              kind: "configurator-layer",
              width: 1800,
              height: 1800,
              isolated: true,
              transparentMediaOpening: true,
            },
            {
              id: "official-25k-lossless-master",
              sourceUrl:
                "https://www.travisindustries.com/download/Dragon/56425K_LogSets/Oak/564SSCF_OakLogs_HandMadeBrick_S_ON_638.tif",
              kind: "isolated-product",
              width: 4603,
              height: 2825,
              isolated: false,
              transparentMediaOpening: false,
            },
          ],
        },
        maximumOfficialLayerPixels: 4603,
        assetQualityGate: "approved",
      },
      notes:
        "Approved from the current manual, official 1800 px transparent trim layer, a lossless 4603 px Travis firebox master, and locally packaged official burn footage.",
    }),
    gasFireplace("564-tv-35k-deluxe", "564 TV 35K Deluxe", "traditional", {
      productUrl: "https://www.fireplacex.com/product/564-trv-35k-deluxe/",
      stage: "approved",
      approvedCatalogIds: ["564-tv-35k-deluxe"],
      evidence: {
        productSku: "98500297",
        fireBuilderProductId: 130,
        fireBuilderModelId: 590,
        viewingArea: { width: 29.375, height: 16.375 },
        installationManualUrl: "https://www.travisindustries.com/docs/100-01551.pdf",
        installationManualRevision: "2024-04-02",
        mantelRulePage: 42,
        visualOptionSkus: [
          "95400402",
          "95400408",
          "95400411",
          "95400467",
          "94500626",
          "94500624",
        ],
        visualMaster: {
          requirement: {
            minimumWidth: 1800,
            minimumHeight: 1800,
            requiresIsolation: true,
            requiresTransparentMediaOpening: true,
          },
          candidates: [
            {
              id: "firebuilder-raw-face-layer",
              sourceUrl:
                "https://firebuilder.travisindustries.com/fbimages/LayeredImages/95400402.png",
              kind: "configurator-layer",
              width: 1800,
              height: 1800,
              isolated: true,
              transparentMediaOpening: true,
            },
            {
              id: "official-35k-lossless-master",
              sourceUrl:
                "https://www.travisindustries.com/download/Dragon/564_35K_Images/Oak/564_35K_Oak_Handmade_S_674.tif",
              kind: "isolated-product",
              width: 4870,
              height: 3105,
              isolated: false,
              transparentMediaOpening: false,
            },
          ],
        },
        maximumOfficialLayerPixels: 4870,
        assetQualityGate: "approved",
      },
      notes:
        "Approved from the current manual, official 1800 px transparent face layers, a lossless 4870 px Travis firebox master, and locally packaged official burn footage.",
    }),
    gasFireplace("564-tv-35k-clean-face", "564 TV 35K Clean Face Deluxe", "traditional", {
      productUrl: "https://www.fireplacex.com/product/564-tv-35k-deluxe-clean-face/",
      stage: "approved",
      approvedCatalogIds: ["564-tv-35k-clean-face"],
      evidence: {
        productSku: "98500298",
        fireBuilderProductId: 131,
        fireBuilderModelId: 591,
        viewingArea: { width: 29.375, height: 16.375 },
        installationManualUrl: "https://www.travisindustries.com/docs/100-01552.pdf",
        installationManualRevision: "2024-04-02",
        mantelRulePage: 37,
        visualOptionSkus: ["95900370", "95900380", "95900382", "94500626", "94500624"],
        visualMaster: {
          requirement: {
            minimumWidth: 1800,
            minimumHeight: 1800,
            requiresIsolation: true,
            requiresTransparentMediaOpening: true,
          },
          candidates: [
            {
              id: "firebuilder-raw-trim-layer",
              sourceUrl:
                "https://firebuilder.travisindustries.com/fbimages/LayeredImages/95900370.png",
              kind: "configurator-layer",
              width: 1800,
              height: 1800,
              isolated: true,
              transparentMediaOpening: true,
            },
            {
              id: "official-35k-lossless-master",
              sourceUrl:
                "https://www.travisindustries.com/download/Dragon/564_35K_Images/Oak/564_35K_Oak_Handmade_S_674.tif",
              kind: "isolated-product",
              width: 4870,
              height: 3105,
              isolated: false,
              transparentMediaOpening: false,
            },
          ],
        },
        maximumOfficialLayerPixels: 4870,
        assetQualityGate: "approved",
      },
      notes:
        "Approved from the current manual, official 1800 px transparent trim layer, a lossless 4870 px Travis firebox master, and locally packaged official burn footage.",
    }),
    gasFireplace("864-trv-31k-deluxe", "864 TRV 31K Deluxe", "traditional", {
      stage: "approved",
      approvedCatalogIds: ["864-trv-31k-deluxe"],
      notes: "The designer-face 31K configuration is approved and live.",
    }),
    gasFireplace("864-trv-31k-clean-face", "864 TRV 31K Clean Face Deluxe", "traditional", {
      stage: "approved",
      approvedCatalogIds: ["864-trv-31k-clean-face"],
      notes: "The clean-face 31K configuration is approved and live.",
    }),
    gasFireplace("864-tv-40k-deluxe", "864 TV 40K Deluxe", "traditional", {
      stage: "approved",
      approvedCatalogIds: ["864-tv-40k-deluxe"],
    }),
    gasFireplace("864-tv-40k-clean-face", "864 TV 40K Clean Face Deluxe", "traditional", {
      stage: "approved",
      approvedCatalogIds: ["864-tv-40k-clean-face"],
    }),
    gasFireplace("4237-tv-deluxe", "4237 TV Deluxe", "traditional", {
      stage: "approved",
      approvedCatalogIds: ["4237-ember-glo-deluxe"],
    }),
    gasFireplace("4237-tv-clean-face", "4237 TV Clean Face Deluxe", "traditional", {
      stage: "approved",
      approvedCatalogIds: ["4237-ember-glo-clean-face"],
      notes: "The clean-face Birch configuration is approved and live.",
    }),
    gasFireplace("3615-high-output", "3615 High Output Linear", "linear"),
    gasFireplace("4415-high-output", "4415 High Output Linear", "linear", {
      productUrl: "https://www.fireplacex.com/product/4415-high-output-deluxe/",
      stage: "approved",
      approvedCatalogIds: ["4415-high-output-deluxe"],
    }),
    gasFireplace(
      "4415-see-through-high-output",
      "4415 See-Thru High Output Linear",
      "see-through",
    ),
    gasFireplace("6015-high-output", "6015 High Output Linear", "linear", {
      stage: "approved",
      approvedCatalogIds: ["6015-high-output-deluxe"],
    }),
    gasFireplace("24-probuilder-clean-face", "24 ProBuilder Clean Face Collection", "portrait"),
    gasFireplace("36-probuilder-clean-face-mv", "ProBuilder 36 Clean Face MV", "traditional", {
      productUrl:
        "https://www.fireplacex.com/products/gas-fireplaces/traditional-probuilder-gas-fireplaces/",
      stage: "approved",
      approvedCatalogIds: ["probuilder-36-clean-face-mv"],
    }),
    gasFireplace(
      "36-probuilder-clean-face-gsb",
      "ProBuilder 36 Clean Face GSB",
      "traditional",
      {
        productUrl:
          "https://www.fireplacex.com/products/gas-fireplaces/traditional-probuilder-gas-fireplaces/",
        stage: "approved",
        approvedCatalogIds: ["probuilder-36-clean-face-gsb"],
      },
    ),
    gasFireplace(
      "36-probuilder-clean-face-deluxe",
      "ProBuilder 36 Clean Face Deluxe",
      "traditional",
      {
        productUrl: "https://www.fireplacex.com/product/probuilder-36-clean-face-deluxe/",
        stage: "approved",
        approvedCatalogIds: ["probuilder-36-clean-face-deluxe"],
      },
    ),
    gasFireplace(
      "36-probuilder-clean-face-see-thru",
      "ProBuilder 36 Clean Face See-Thru Deluxe",
      "see-through",
      {
        productUrl:
          "https://www.fireplacex.com/products/gas-fireplaces/traditional-probuilder-gas-fireplaces/",
        stage: "approved",
        approvedCatalogIds: ["probuilder-36-clean-face-see-thru"],
      },
    ),
    gasFireplace("42-probuilder-clean-face", "42 ProBuilder Clean Face Deluxe", "traditional", {
      productUrl: "https://www.fireplacex.com/product/probuilder-42-clean-face-deluxe/",
      stage: "approved",
      approvedCatalogIds: ["probuilder-42-clean-face-deluxe"],
    }),
    gasFireplace("42-probuilder-linear", "42 ProBuilder Linear Deluxe", "linear", {
      stage: "approved",
      approvedCatalogIds: ["probuilder-42-linear-deluxe"],
    }),
    gasFireplace("54-probuilder-linear", "54 ProBuilder Linear Deluxe", "linear", {
      stage: "approved",
      approvedCatalogIds: ["probuilder-54-linear-deluxe"],
    }),
    gasFireplace("72-probuilder-linear-gsb", "ProBuilder 72 Linear GSB", "linear", {
      productUrl:
        "https://www.fireplacex.com/products/gas-fireplaces/linear-probuilder-gas-fireplaces/",
      stage: "approved",
      approvedCatalogIds: ["probuilder-72-linear-gsb"],
    }),
    gasFireplace("72-probuilder-linear-deluxe", "ProBuilder 72 Linear Deluxe", "linear", {
      productUrl: "https://www.fireplacex.com/product/probuilder-72-linear-deluxe/",
      stage: "approved",
      approvedCatalogIds: ["probuilder-72-linear-deluxe"],
    }),
    indexedProduct(
      "39-greensmart-electric",
      "39 GreenSmart Electric",
      "fireplace",
      "electric",
      "linear",
      electricUrl,
    ),
    indexedProduct(
      "51-greensmart-electric",
      "51 GreenSmart Electric",
      "fireplace",
      "electric",
      "linear",
      electricUrl,
    ),
    indexedProduct(
      "59-greensmart-electric",
      "59 GreenSmart Electric",
      "fireplace",
      "electric",
      "linear",
      electricUrl,
    ),
    indexedProduct(
      "71-greensmart-electric",
      "71 GreenSmart Electric",
      "fireplace",
      "electric",
      "linear",
      electricUrl,
    ),
    verifiedWoodFireplace({
      id: "42-apex-nexgen-hybrid",
      model: "42 Apex NexGen-Hybrid",
      productUrl: "https://www.fireplacex.com/product/42-apex/",
      sku: "98500115",
      fireBuilderProductId: 138,
      fireBuilderModelId: 682,
      variants: [{ id: "designer-face", viewingArea: { width: 25.625, height: 12.875 } }],
      manualUrl: "https://www.travisindustries.com/docs/100-01577.pdf",
      manualRevision: "100-01577, 4/13/2021",
      dimensionPage: 5,
      mantelPage: 32,
      hearthPage: 33,
      mantelProfiles: [
        {
          material: "non-combustible",
          points: [
            { projection: 1, minimumClearance: 47.375 },
            { projection: 18, minimumClearance: 47.375 },
          ],
        },
      ],
      hearth: {
        minimumWidth: 44,
        maximumRaisedHeight: 6.375,
        minimumRValue: 1,
        placementProfiles: [
          { applianceElevation: 0, minimumHorizontalExtension: 20 },
          { applianceElevation: 6, minimumHorizontalExtension: 18 },
        ],
      },
      visualOptionIds: ["95500451", "95500452", "95500453"],
      visualSourceSku: "95500452",
    }),
    verifiedWoodFireplace({
      id: "36-elite-nexgen-hybrid",
      model: "36 Elite NexGen-Hybrid",
      productUrl: "https://www.fireplacex.com/product/36-elite-nexgen-hybrid/",
      sku: "98500109",
      fireBuilderProductId: 160,
      fireBuilderModelId: 720,
      variants: [
        { id: "single-door", viewingArea: { width: 25.25, height: 14.5 } },
        { id: "double-door", viewingArea: { width: 22.5, height: 14.5 } },
      ],
      manualUrl: "https://www.travisindustries.com/docs/100-01584.pdf",
      manualRevision: "100-01584, 5/20/2024",
      dimensionPage: 6,
      mantelPage: 30,
      hearthPage: 32,
      mantelProfiles: [
        {
          material: "combustible",
          points: [
            { projection: 1, minimumClearance: 57.5 },
            { projection: 8.5, minimumClearance: 57.5 },
          ],
        },
        {
          material: "non-combustible",
          points: [{ projection: 0, minimumClearance: 0 }],
        },
      ],
      hearth: {
        minimumWidth: 60,
        maximumRaisedHeight: 6.5,
        minimumRValue: 0.78,
        placementProfiles: [
          { applianceElevation: 0, minimumHorizontalExtension: 20 },
          { applianceElevation: 6.5, minimumHorizontalExtension: 18 },
        ],
      },
      visualOptionIds: ["98500556", "98500559", "98500458", "98500456", "98500459"],
      visualSourceSku: "98500556",
    }),
    verifiedWoodFireplace({
      id: "44-elite-nexgen-hybrid",
      model: "44 Elite NexGen-Hybrid",
      productUrl: "https://www.fireplacex.com/product/44-elite-nexgen-hybrid/",
      sku: "98500114",
      fireBuilderProductId: 141,
      fireBuilderModelId: 690,
      variants: [{ id: "double-door", viewingArea: { width: 28.75, height: 18.25 } }],
      manualUrl: "https://www.travisindustries.com/docs/100-01582.pdf",
      manualRevision: "100-01582, 10/30/2024",
      dimensionPage: 6,
      mantelPage: 30,
      hearthPage: 32,
      mantelProfiles: [
        {
          material: "combustible",
          points: [
            { projection: 1, minimumClearance: 61 },
            { projection: 8.5, minimumClearance: 61 },
          ],
        },
        {
          material: "non-combustible",
          points: [{ projection: 0, minimumClearance: 0 }],
        },
      ],
      hearth: {
        minimumWidth: 60,
        maximumRaisedHeight: 6.5,
        minimumRValue: 0.78,
        placementProfiles: [
          { applianceElevation: 0, minimumHorizontalExtension: 20 },
          { applianceElevation: 6.5, minimumHorizontalExtension: 18 },
        ],
      },
      visualOptionIds: ["98500575", "98500590", "98500471", "98500472"],
      visualSourceSku: "98500575",
    }),
    {
      ...indexedProduct(
        "32-dvs-deluxe-ember-glo",
        "32 DVS Deluxe Ember-Glo",
        "insert",
        "gas",
        "traditional",
        "https://www.fireplacex.com/product/32-dvs-deluxe-ember-glo/",
      ),
      stage: "approved" as const,
      approvedCatalogIds: ["32-dvs-deluxe-ember-glo"],
      evidence: {
        productIdentifiers: [
          { id: "98400371", kind: "sku" as const },
          { id: "DVS EG GSR2", kind: "model" as const },
        ],
        variants: [
          {
            id: "one-piece-panel-standard-face",
            viewingArea: { width: 24.25, height: 12.75 },
            minimumOpening: {
              frontWidth: 29,
              height: 20.625,
              rearWidth: 18,
              depth: 16.375,
            },
            surroundForwardExtension: 0,
          },
          {
            id: "one-piece-panel-arched-face",
            viewingArea: { width: 24.25, height: 12.75 },
            minimumOpening: {
              frontWidth: 29,
              height: 20.625,
              rearWidth: 18,
              depth: 16.875,
            },
            surroundForwardExtension: 0,
          },
          {
            id: "one-piece-panel-with-trim-standard-face",
            viewingArea: { width: 24.25, height: 12.75 },
            minimumOpening: {
              frontWidth: 26.5,
              height: 19.5,
              rearWidth: 18,
              depth: 15.125,
            },
            surroundForwardExtension: 1.25,
          },
          {
            id: "one-piece-panel-with-trim-arched-face",
            viewingArea: { width: 24.25, height: 12.75 },
            minimumOpening: {
              frontWidth: 26.5,
              height: 19.5,
              rearWidth: 18,
              depth: 15.625,
            },
            surroundForwardExtension: 1.25,
          },
        ],
        installationManualUrl: "https://www.travisindustries.com/Docs/100-01537.pdf",
        installationManualRevision: "100-01537, 7/28/2026",
        dimensionPages: [6, 8],
        clearanceRulePages: [12],
        clearanceRules: {
          mantel: {
            measurementFrom: "appliance-base" as const,
            profiles: [
              {
                material: "combustible" as const,
                points: [
                  { projection: 4, minimumClearance: 33 },
                  { projection: 12, minimumClearance: 35 },
                ],
              },
              {
                material: "non-combustible" as const,
                points: [
                  { projection: 4, minimumClearance: 33 },
                  { projection: 12, minimumClearance: 35 },
                ],
              },
            ],
          },
          sideWall: {
            measurementFrom: "appliance-side" as const,
            minimumClearance: 4.5,
          },
          facing: {
            measurementFrom: "appliance-base" as const,
            minimumSideExtent: 4.5,
            minimumTopExtent: 35,
            topMayTerminateAtMantelBottom: true,
          },
          hearth: {
            measurementFrom: "appliance-base" as const,
            placementProfiles: [{ applianceElevation: 0, minimumHorizontalExtension: 0 }],
          },
        },
        optionPages: [],
        visualOptionIds: [
          "95100053",
          "95100059",
          "95300199",
          "95300412",
          "95300192",
          "95300198",
          "95300243",
          "95300407",
          "95300409",
          "95300406",
          "95300413",
          "96100473",
          "96100473HB",
          "96100477",
          "96100478",
          "96100476",
          "96100477GS",
          "96100475",
          "96100361",
          "96100362",
          "96100604",
          "94500957",
          "94500956",
          "94500953",
          "96500891",
          "96500892",
        ],
        visualSourceUrls: [
          "https://firebuilder.travisindustries.com/api/product/128/pl/1/cy/1",
          "https://firebuilder.travisindustries.com/api/product/128/pl/1/accessory",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/95300412.png",
          "https://www.fireplacex.com/wp-content/uploads/32DVSEG_MetroBP.jpg",
          "https://www.fireplacex.com/wp-content/uploads/32DVSEG_CABP.jpg",
          "https://www.fireplacex.com/wp-content/uploads/32DVSEG_FCBP.jpg",
          "https://vimeo.com/465443142",
        ],
        visualMaster: {
          requirement: {
            minimumWidth: 2400,
            minimumHeight: 1800,
            requiresIsolation: true,
            requiresTransparentMediaOpening: true,
          },
          candidates: [
            {
              id: "firebuilder-shadowbox-layer",
              sourceUrl:
                "https://firebuilder.travisindustries.com/fbimages/LayeredImages/95300412.png",
              kind: "configurator-layer" as const,
              width: 960,
              height: 960,
              isolated: true,
              transparentMediaOpening: false,
            },
          ],
        },
        maximumOfficialLayerPixels: 960,
        assetQualityGate: "blocked-high-resolution-master" as const,
      },
      notes:
        "Current appliance identity, glass area, standard and arched-face opening profiles, trim projection, base-referenced clearances, live FireBuilder options, official burn source, and visual sources are verified. The largest official isolated layer is 960 px and remains blocked from the 4K visual gate.",
    },
    {
      ...indexedProduct(
        "430-deluxe-ember-glo",
        "430 Deluxe Ember-Glo",
        "insert",
        "gas",
        "traditional",
        "https://www.fireplacex.com/product/430-gsr-deluxe/",
      ),
      stage: "approved" as const,
      approvedCatalogIds: ["430-deluxe-ember-glo"],
      evidence: {
        productIdentifiers: [
          { id: "98400113", kind: "sku" as const },
          { id: "430 EG GSR2", kind: "model" as const },
        ],
        variants: [
          {
            id: "one-piece-panel",
            viewingArea: { width: 23, height: 16 },
            minimumOpening: { frontWidth: 30.5, height: 20.25, depth: 15.5 },
            surroundForwardExtension: 0,
          },
          {
            id: "one-piece-panel-with-trim",
            viewingArea: { width: 23, height: 16 },
            minimumOpening: { frontWidth: 30.25, height: 19.75, depth: 14.25 },
            surroundForwardExtension: 1.25,
          },
        ],
        fireplaceInteriorClearances: { side: 0.5, back: 0.5, top: 0.75 },
        installationManualUrl: "https://www.travisindustries.com/docs/100-01521.pdf",
        installationManualRevision: "100-01521, 10/24/2023",
        dimensionPages: [6, 8],
        clearanceRulePages: [8, 9, 10],
        clearanceRules: {
          mantel: {
            measurementFrom: "appliance-base" as const,
            profiles: [
              {
                material: "combustible" as const,
                points: [
                  { projection: 4, minimumClearance: 33.5 },
                  { projection: 12, minimumClearance: 34.5 },
                ],
              },
              {
                material: "non-combustible" as const,
                points: [
                  { projection: 4, minimumClearance: 33.5 },
                  { projection: 12, minimumClearance: 34.5 },
                ],
              },
            ],
          },
          sideWall: {
            measurementFrom: "appliance-side" as const,
            minimumClearance: 5,
          },
          facing: {
            measurementFrom: "appliance-base" as const,
            minimumSideExtent: 3.375,
            minimumTopExtent: 32.375,
            topMayTerminateAtMantelBottom: true,
          },
          hearth: {
            measurementFrom: "appliance-base" as const,
            placementProfiles: [{ applianceElevation: 0, minimumHorizontalExtension: 0 }],
            minimumThickness: 0.5,
          },
        },
        optionPages: [7],
        visualOptionIds: [
          "96800703",
          "96800705",
          "96800706",
          "96800708",
          "96800711",
          "96800709",
          "96800209",
          "96100917HB",
          "96100917SB",
          "96100920",
          "96100921",
          "96100922",
          "96100923",
          "96100337",
          "96100338",
          "96100588",
          "94500957",
          "94500956",
          "94500953",
        ],
        visualSourceUrls: [
          "https://firebuilder.travisindustries.com/api/product/115/pl/1/cy/1",
          "https://firebuilder.travisindustries.com/api/product/115/pl/1/accessory",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/98400113_96100920_94500957.png",
          "https://www.fireplacex.com/wp-content/uploads/430_MetropolitanBP_Oak.jpg",
          "https://www.fireplacex.com/wp-content/uploads/430_ShadowboxBP_Oak.jpg",
          "https://vimeo.com/466357090",
        ],
        visualMaster: {
          requirement: {
            minimumWidth: 2400,
            minimumHeight: 1800,
            requiresIsolation: true,
            requiresTransparentMediaOpening: true,
          },
          candidates: [
            {
              id: "firebuilder-raw-layer",
              sourceUrl:
                "https://firebuilder.travisindustries.com/fbimages/LayeredImages/98400113_96100920_94500957.png",
              kind: "configurator-layer",
              width: 960,
              height: 960,
              isolated: true,
              transparentMediaOpening: false,
            },
          ],
        },
        maximumOfficialLayerPixels: 960,
        assetQualityGate: "blocked-high-resolution-master" as const,
      },
      notes:
        "Current appliance dimensions, two surround-fit opening profiles, cavity clearances, viewing area, manual clearance datum, live FireBuilder options, burn source, and visual sources are verified. The largest official isolated layer is 960 px and remains blocked from the 4K visual gate.",
    },
    {
      ...indexedProduct(
        "430-mod-fyre",
        "430 Mod-Fyre",
        "insert",
        "gas",
        "traditional",
        "https://www.fireplacex.com/product/430-modfyre/",
      ),
      stage: "approved" as const,
      approvedCatalogIds: ["430-mod-fyre"],
      notes:
        "Exact current FireBuilder Mod-Fyre composite is packaged locally; FireBuilder reports limited stock on hand.",
    },
    {
      ...indexedProduct(
        "34-dvl-deluxe-ember-glo",
        "34 DVL Deluxe Ember-Glo",
        "insert",
        "gas",
        "traditional",
        "https://www.fireplacex.com/product/34-dvl-deluxe-ember-glo/",
      ),
      stage: "approved" as const,
      approvedCatalogIds: ["34-dvl-deluxe-ember-glo"],
      evidence: {
        productIdentifiers: [
          { id: "98400376", kind: "sku" as const },
          { id: "DVL EG GSR2", kind: "model" as const },
        ],
        variants: [
          {
            id: "one-piece-panel-standard-face",
            viewingArea: { width: 27, height: 16.125 },
            minimumOpening: {
              frontWidth: 32.5,
              height: 24.875,
              rearWidth: 20,
              depth: 15.75,
            },
            surroundForwardExtension: 0,
          },
          {
            id: "one-piece-panel-arched-face",
            viewingArea: { width: 27, height: 16.125 },
            minimumOpening: {
              frontWidth: 32.5,
              height: 24.875,
              rearWidth: 20,
              depth: 16.25,
            },
            surroundForwardExtension: 0,
          },
          {
            id: "one-piece-panel-with-trim-standard-face",
            viewingArea: { width: 27, height: 16.125 },
            minimumOpening: {
              frontWidth: 31.5,
              height: 23.75,
              rearWidth: 20,
              depth: 14.5,
            },
            surroundForwardExtension: 1.25,
          },
          {
            id: "one-piece-panel-with-trim-arched-face",
            viewingArea: { width: 27, height: 16.125 },
            minimumOpening: {
              frontWidth: 31.5,
              height: 23.75,
              rearWidth: 20,
              depth: 15,
            },
            surroundForwardExtension: 1.25,
          },
        ],
        installationManualUrl: "https://www.travisindustries.com/docs/100-01536.pdf",
        installationManualRevision: "100-01536, 2/13/2026",
        dimensionPages: [6, 8],
        clearanceRulePages: [12],
        clearanceRules: {
          mantel: {
            measurementFrom: "appliance-base" as const,
            profiles: [
              {
                material: "combustible" as const,
                points: [
                  { projection: 4, minimumClearance: 33 },
                  { projection: 12, minimumClearance: 35.5 },
                ],
              },
              {
                material: "non-combustible" as const,
                points: [
                  { projection: 4, minimumClearance: 33 },
                  { projection: 12, minimumClearance: 35.5 },
                ],
              },
            ],
          },
          sideWall: {
            measurementFrom: "appliance-side" as const,
            minimumClearance: 4,
          },
          facing: {
            measurementFrom: "appliance-base" as const,
            minimumSideExtent: 4,
            minimumTopExtent: 35.5,
            topMayTerminateAtMantelBottom: true,
          },
          hearth: {
            measurementFrom: "appliance-base" as const,
            placementProfiles: [{ applianceElevation: 0, minimumHorizontalExtension: 0 }],
          },
        },
        optionPages: [],
        visualOptionIds: [
          "95300678",
          "95300596",
          "95300591",
          "95300595",
          "95300653",
          "95100058",
          "95300679",
          "95300675",
          "95300677",
          "95300676",
          "95300589",
          "95300657",
          "96100483",
          "96100483HB",
          "96100487",
          "96100488",
          "96100486",
          "96100485",
          "96100487GS",
          "96100364",
          "96100365",
          "96100605",
          "94500952",
          "94500951",
          "94500958",
          "96500893",
          "96500894",
        ],
        visualSourceUrls: [
          "https://firebuilder.travisindustries.com/api/product/127/pl/1/cy/1",
          "https://firebuilder.travisindustries.com/api/product/127/pl/1/accessory",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/95300678.png",
          "https://www.fireplacex.com/wp-content/uploads/34DVLEG_CA.jpg",
          "https://www.fireplacex.com/wp-content/uploads/34DVLEG_Metropolitan.jpg",
          "https://www.fireplacex.com/wp-content/uploads/34DVLEG_FC.jpg",
          "https://vimeo.com/465417115",
        ],
        visualMaster: {
          requirement: {
            minimumWidth: 2400,
            minimumHeight: 1800,
            requiresIsolation: true,
            requiresTransparentMediaOpening: true,
          },
          candidates: [
            {
              id: "firebuilder-shadowbox-layer",
              sourceUrl:
                "https://firebuilder.travisindustries.com/fbimages/LayeredImages/95300678.png",
              kind: "configurator-layer" as const,
              width: 960,
              height: 960,
              isolated: true,
              transparentMediaOpening: false,
            },
          ],
        },
        maximumOfficialLayerPixels: 960,
        assetQualityGate: "blocked-high-resolution-master" as const,
      },
      notes:
        "Current appliance identity, glass area, standard and arched-face opening profiles, trim projection, base-referenced clearances, live FireBuilder options, official burn source, and visual sources are verified. The largest official isolated layer is 960 px and remains blocked from the 4K visual gate.",
    },
    {
      ...indexedProduct(
        "616-deluxe-ember-glo",
        "616 Deluxe Ember-Glo",
        "insert",
        "gas",
        "traditional",
        "https://www.fireplacex.com/product/616-gsr/",
      ),
      stage: "approved" as const,
      approvedCatalogIds: ["616-deluxe-ember-glo"],
      evidence: {
        productIdentifiers: [
          { id: "98400120", kind: "sku" as const },
          { id: "616 EG GSR2", kind: "model" as const },
        ],
        variants: [
          {
            id: "one-piece-panel",
            viewingArea: { width: 27.5, height: 19.75 },
            minimumOpening: { frontWidth: 35, height: 24, depth: 16.5 },
            surroundForwardExtension: 0,
          },
          {
            id: "one-piece-panel-with-trim",
            viewingArea: { width: 27.5, height: 19.75 },
            minimumOpening: { frontWidth: 34.625, height: 23.5, depth: 15.25 },
            surroundForwardExtension: 1.25,
          },
        ],
        fireplaceInteriorClearances: { side: 0.5, back: 0.5, top: 0.625 },
        installationManualUrl: "https://www.travisindustries.com/docs/100-01519.pdf",
        installationManualRevision: "100-01519, 10/24/2023",
        dimensionPages: [6, 8],
        clearanceRulePages: [8, 9, 10],
        clearanceRules: {
          mantel: {
            measurementFrom: "appliance-base" as const,
            profiles: [
              {
                material: "combustible" as const,
                points: [
                  { projection: 4, minimumClearance: 33 },
                  { projection: 12, minimumClearance: 36.5 },
                ],
              },
              {
                material: "non-combustible" as const,
                points: [
                  { projection: 4, minimumClearance: 33 },
                  { projection: 12, minimumClearance: 36.5 },
                ],
              },
            ],
          },
          sideWall: {
            measurementFrom: "appliance-side" as const,
            minimumClearance: 6,
          },
          facing: {
            measurementFrom: "appliance-base" as const,
            minimumSideExtent: 5,
            minimumTopExtent: 35.5,
            topMayTerminateAtMantelBottom: true,
          },
          hearth: {
            measurementFrom: "appliance-base" as const,
            placementProfiles: [{ applianceElevation: 0, minimumHorizontalExtension: 0 }],
            minimumThickness: 0.5,
          },
        },
        optionPages: [7],
        visualOptionIds: [
          "96900761",
          "96900224",
          "96900759",
          "96900757",
          "96900763",
          "96900767",
          "96900765",
          "96100928",
          "96100931",
          "96100929",
          "96100924HB",
          "96100924SB",
          "96100925",
          "96100349",
          "96100350",
          "96100583",
          "94500952",
          "94500951",
          "94500958",
        ],
        visualSourceUrls: [
          "https://firebuilder.travisindustries.com/api/product/111/pl/1/cy/1",
          "https://firebuilder.travisindustries.com/api/product/111/pl/1/accessory",
          "https://firebuilder.travisindustries.com/fbimages/LayeredImages/98400120_96100928_94500952.png",
          "https://www.fireplacex.com/wp-content/uploads/616_Metropolitan.jpg",
          "https://www.fireplacex.com/wp-content/uploads/616_ShadowboxBP.jpg",
        ],
        visualMaster: {
          requirement: {
            minimumWidth: 2400,
            minimumHeight: 1800,
            requiresIsolation: true,
            requiresTransparentMediaOpening: true,
          },
          candidates: [
            {
              id: "firebuilder-raw-layer",
              sourceUrl:
                "https://firebuilder.travisindustries.com/fbimages/LayeredImages/98400120_96100928_94500952.png",
              kind: "configurator-layer",
              width: 960,
              height: 960,
              isolated: true,
              transparentMediaOpening: false,
            },
          ],
        },
        maximumOfficialLayerPixels: 960,
        assetQualityGate: "blocked-high-resolution-master" as const,
      },
      notes:
        "Current appliance dimensions, two surround-fit opening profiles, cavity clearances, viewing area, manual clearance datum, live FireBuilder options, and visual sources are verified. The largest official isolated layer is 960 px and remains blocked from the 4K visual gate.",
    },
    {
      ...indexedProduct(
        "616-mod-fyre",
        "616 Mod-Fyre",
        "insert",
        "gas",
        "traditional",
        "https://www.fireplacex.com/product/616-modfyre/",
      ),
      stage: "approved" as const,
      approvedCatalogIds: ["616-mod-fyre"],
      notes:
        "Exact current FireBuilder Mod-Fyre composite is packaged locally; FireBuilder reports sold out at the factory.",
    },
    indexedProduct(
      "medium-flush-wood-arched",
      "Medium Flush Wood Arched NexGen-Hybrid",
      "insert",
      "wood",
      "traditional",
      "https://www.fireplacex.com/product/medium-flush-wood-arched-nexgen-hybrid/",
    ),
    indexedProduct(
      "medium-flush-wood-rectangular",
      "Medium Flush Wood Rectangular NexGen-Hybrid",
      "insert",
      "wood",
      "traditional",
      "https://www.fireplacex.com/product/medium-flush-wood-rectangular-nexgen-hybrid/",
    ),
    indexedProduct(
      "large-flush-wood-arched",
      "Large Flush Wood Arched NexGen-Hybrid",
      "insert",
      "wood",
      "traditional",
      "https://www.fireplacex.com/product/large-flush-wood-arched-nexgen-hybrid/",
    ),
    indexedProduct(
      "large-flush-wood-rectangular",
      "Large Flush Wood Rectangular NexGen-Hybrid",
      "insert",
      "wood",
      "traditional",
      "https://www.fireplacex.com/product/large-flush-wood-rectangular-nexgen-hybrid/",
    ),
  ],
});
