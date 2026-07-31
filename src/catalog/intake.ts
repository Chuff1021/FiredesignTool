import { z } from "zod";
import { catalogRepository } from "@/domain/catalogRepository";

export const intakeStageSchema = z.enum([
  "source-indexed",
  "documents-verified",
  "assets-prepared",
  "visual-qa",
  "approved",
]);

const intakeProductSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  brandId: z.literal("fireplace-xtrordinair"),
  model: z.string().min(1),
  applianceType: z.enum(["fireplace", "insert"]),
  fuel: z.enum(["gas", "wood", "electric"]),
  style: z.enum(["traditional", "linear", "portrait", "see-through"]),
  stage: intakeStageSchema,
  approvedCatalogIds: z.array(z.string()).default([]),
  productUrl: z.string().url(),
  officialIndexUrl: z.string().url(),
  sourceCheckedAt: z.string().date(),
  notes: z.string().min(1),
});

export const catalogIntakeSchema = z
  .object({
    schemaVersion: z.literal(1),
    snapshotId: z.string().regex(/^fpx-\d{4}\.\d{2}\.\d{2}-\d+$/),
    sourceCheckedAt: z.string().date(),
    sourceUrls: z.array(z.string().url()).min(1),
    products: z.array(intakeProductSchema).min(1),
  })
  .superRefine((intake, context) => {
    const seen = new Set<string>();
    const approvedIds = new Set(
      catalogRepository.listFireplaces().map((product) => product.id),
    );
    const mappedApprovedIds = new Set<string>();

    intake.products.forEach((product, index) => {
      if (seen.has(product.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate intake product ID: ${product.id}`,
          path: ["products", index, "id"],
        });
      }
      seen.add(product.id);

      if (product.stage === "approved" && product.approvedCatalogIds.length === 0) {
        context.addIssue({
          code: "custom",
          message: `Approved intake product ${product.id} has no catalog mapping`,
          path: ["products", index, "approvedCatalogIds"],
        });
      }
      if (product.stage !== "approved" && product.approvedCatalogIds.length > 0) {
        context.addIssue({
          code: "custom",
          message: `Unapproved intake product ${product.id} cannot map to a live catalog product`,
          path: ["products", index, "approvedCatalogIds"],
        });
      }
      product.approvedCatalogIds.forEach((catalogId) => {
        if (!approvedIds.has(catalogId)) {
          context.addIssue({
            code: "custom",
            message: `Unknown approved catalog ID: ${catalogId}`,
            path: ["products", index, "approvedCatalogIds"],
          });
        }
        if (mappedApprovedIds.has(catalogId)) {
          context.addIssue({
            code: "custom",
            message: `Catalog product is mapped by more than one intake record: ${catalogId}`,
            path: ["products", index, "approvedCatalogIds"],
          });
        }
        mappedApprovedIds.add(catalogId);
      });
    });

    approvedIds.forEach((catalogId) => {
      if (!mappedApprovedIds.has(catalogId)) {
        context.addIssue({
          code: "custom",
          message: `Live catalog product is missing from the intake snapshot: ${catalogId}`,
          path: ["products"],
        });
      }
    });
  });

const specsUrl = "https://www.fireplacex.com/professionals/specs-and-drawings/";
const checkedAt = "2026-07-31";

const gasFireplace = (
  id: string,
  model: string,
  style: "traditional" | "linear" | "portrait" | "see-through",
  options: {
    productUrl?: string;
    stage?: z.infer<typeof intakeStageSchema>;
    approvedCatalogIds?: string[];
    notes?: string;
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

const electricUrl = "https://www.fireplacex.com/electric-fireplaces/";

export const FPX_CURRENT_INTAKE = catalogIntakeSchema.parse({
  schemaVersion: 1,
  snapshotId: "fpx-2026.07.31-1",
  sourceCheckedAt: checkedAt,
  sourceUrls: [
    specsUrl,
    "https://www.fireplacex.com/products/gas-fireplaces/",
    electricUrl,
    "https://www.fireplacex.com/products/wood-fireplaces/",
    "https://www.fireplacex.com/products/gas-fireplace-inserts/",
    "https://www.fireplacex.com/products/wood-fireplace-inserts/",
  ],
  products: [
    gasFireplace("564-trv-25k-deluxe", "564 TRV 25K Deluxe", "traditional"),
    gasFireplace("564-trv-25k-clean-face", "564 TRV 25K Clean Face Deluxe", "traditional"),
    gasFireplace("564-tv-35k-deluxe", "564 TV 35K Deluxe", "traditional", {
      productUrl: "https://www.fireplacex.com/product/564-trv-35k-deluxe/",
    }),
    gasFireplace("564-tv-35k-clean-face", "564 TV 35K Clean Face Deluxe", "traditional"),
    gasFireplace("864-trv-31k-family", "864 TRV 31K Deluxe Collection", "traditional", {
      stage: "approved",
      approvedCatalogIds: ["864-trv-31k-clean-face", "864-trv-31k-deluxe"],
      notes: "The clean-face and designer-face 31K configurations are approved and live.",
    }),
    gasFireplace("864-tv-40k-deluxe", "864 TV 40K Deluxe", "traditional"),
    gasFireplace("864-tv-40k-clean-face", "864 TV 40K Clean Face Deluxe", "traditional"),
    gasFireplace("4237-tv-deluxe", "4237 TV Deluxe", "traditional"),
    gasFireplace("4237-tv-clean-face", "4237 TV Clean Face Deluxe", "traditional", {
      stage: "approved",
      approvedCatalogIds: ["4237-ember-glo-clean-face"],
      notes: "The clean-face Birch configuration is approved and live.",
    }),
    gasFireplace("3615-high-output", "3615 High Output Linear", "linear"),
    gasFireplace("4415-high-output", "4415 High Output Linear", "linear", {
      productUrl: "https://www.fireplacex.com/product/4415-high-output-deluxe/",
    }),
    gasFireplace(
      "4415-see-through-high-output",
      "4415 See-Thru High Output Linear",
      "see-through",
    ),
    gasFireplace("6015-high-output", "6015 High Output Linear", "linear"),
    gasFireplace("24-probuilder-clean-face", "24 ProBuilder Clean Face Collection", "portrait"),
    gasFireplace(
      "36-probuilder-clean-face",
      "36 ProBuilder Clean Face Collection",
      "traditional",
      {
        productUrl: "https://www.fireplacex.com/product/probuilder-36-clean-face-deluxe/",
      },
    ),
    gasFireplace("42-probuilder-clean-face", "42 ProBuilder Clean Face Deluxe", "traditional", {
      productUrl: "https://www.fireplacex.com/product/probuilder-42-clean-face-deluxe/",
    }),
    gasFireplace("42-probuilder-linear", "42 ProBuilder Linear Deluxe", "linear"),
    gasFireplace("54-probuilder-linear", "54 ProBuilder Linear Deluxe", "linear"),
    gasFireplace("72-probuilder-linear", "72 ProBuilder Linear Collection", "linear", {
      productUrl: "https://www.fireplacex.com/product/probuilder-72-linear-deluxe/",
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
    indexedProduct(
      "42-apex-nexgen-hybrid",
      "42 Apex NexGen-Hybrid",
      "fireplace",
      "wood",
      "traditional",
      "https://www.fireplacex.com/product/42-apex/",
    ),
    indexedProduct(
      "36-elite-nexgen-hybrid",
      "36 Elite NexGen-Hybrid",
      "fireplace",
      "wood",
      "traditional",
      "https://www.fireplacex.com/product/36-elite-nexgen-hybrid/",
    ),
    indexedProduct(
      "44-elite-nexgen-hybrid",
      "44 Elite NexGen-Hybrid",
      "fireplace",
      "wood",
      "traditional",
      "https://www.fireplacex.com/product/44-elite-nexgen-hybrid/",
    ),
    indexedProduct(
      "32-dvs-deluxe-ember-glo",
      "32 DVS Deluxe Ember-Glo",
      "insert",
      "gas",
      "traditional",
      "https://www.fireplacex.com/product/32-dvs-deluxe-ember-glo/",
    ),
    indexedProduct(
      "430-deluxe-ember-glo",
      "430 Deluxe Ember-Glo",
      "insert",
      "gas",
      "traditional",
      "https://www.fireplacex.com/product/430-gsr-deluxe/",
    ),
    indexedProduct(
      "430-mod-fyre",
      "430 Mod-Fyre",
      "insert",
      "gas",
      "traditional",
      "https://www.fireplacex.com/product/430-modfyre/",
    ),
    indexedProduct(
      "34-dvl-deluxe-ember-glo",
      "34 DVL Deluxe Ember-Glo",
      "insert",
      "gas",
      "traditional",
      "https://www.fireplacex.com/product/34-dvl-deluxe-ember-glo/",
    ),
    indexedProduct(
      "616-deluxe-ember-glo",
      "616 Deluxe Ember-Glo",
      "insert",
      "gas",
      "traditional",
      "https://www.fireplacex.com/product/616-gsr/",
    ),
    indexedProduct(
      "616-mod-fyre",
      "616 Mod-Fyre",
      "insert",
      "gas",
      "traditional",
      "https://www.fireplacex.com/product/616-modfyre/",
    ),
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

export type CatalogIntake = z.infer<typeof catalogIntakeSchema>;
export type CatalogIntakeProduct = z.infer<typeof intakeProductSchema>;

export function summarizeCatalogIntake(intake: CatalogIntake) {
  const byStage = Object.fromEntries(
    intakeStageSchema.options.map((stage) => [
      stage,
      intake.products.filter((product) => product.stage === stage).length,
    ]),
  ) as Record<z.infer<typeof intakeStageSchema>, number>;
  const approvedCatalogProducts = intake.products.reduce(
    (total, product) => total + product.approvedCatalogIds.length,
    0,
  );
  return {
    totalFamilies: intake.products.length,
    approvedCatalogProducts,
    remainingFamilies: intake.products.filter((product) => product.stage !== "approved").length,
    byStage,
  };
}
