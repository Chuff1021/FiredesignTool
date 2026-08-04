import { z } from "zod";

export const FPX_GAS_LINEUP_CHECKED_AT = "2026-08-04";

export const FPX_GAS_LINEUP_SOURCES = {
  gasFireplaces: "https://www.fireplacex.com/products/gas-fireplaces/",
  premiumTraditional:
    "https://www.fireplacex.com/products/gas-fireplaces/traditional-premium-gas-fireplaces/",
  premiumLinear:
    "https://www.fireplacex.com/products/gas-fireplaces/linear-premium-gas-fireplaces/",
  proBuilderTraditional:
    "https://www.fireplacex.com/products/gas-fireplaces/traditional-probuilder-gas-fireplaces/",
  proBuilderLinear:
    "https://www.fireplacex.com/products/gas-fireplaces/linear-probuilder-gas-fireplaces/",
  gasInserts: "https://www.fireplacex.com/products/gas-inserts/",
  professionalSpecs: "https://www.fireplacex.com/professionals/specs-and-drawings/",
  discontinuedManuals:
    "https://www.fireplacex.com/owner-resources/manuals/manuals-discontinued/",
  fireBuilder: "https://firebuilder.travisindustries.com/",
} as const;

const lineupEntrySchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  name: z.string().min(1),
  category: z.enum([
    "premium-traditional",
    "premium-linear",
    "probuilder-traditional",
    "probuilder-linear",
    "gas-insert",
  ]),
  applianceType: z.enum(["fireplace", "insert"]),
  marketingStatus: z.enum(["current", "legacy"]),
  factoryAvailability: z.enum([
    "current-production",
    "limited-stock",
    "sold-out-at-factory",
    "dealer-confirmation",
  ]),
  sku: z.string().min(1).optional(),
  fireBuilderProductId: z.number().int().positive().optional(),
  intakeId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  sourceUrl: z.string().url(),
});

export type FpxGasLineupEntry = z.infer<typeof lineupEntrySchema>;

const current = (
  entry: Omit<FpxGasLineupEntry, "marketingStatus" | "factoryAvailability"> &
    Partial<Pick<FpxGasLineupEntry, "factoryAvailability">>,
): FpxGasLineupEntry => ({
  ...entry,
  marketingStatus: "current",
  factoryAvailability: entry.factoryAvailability ?? "current-production",
});

/**
 * Canonical model-level FPX gas scope. Collection pages decide whether a
 * product is currently marketed; FireBuilder supplies live factory-availability
 * qualifiers. The two concepts intentionally remain separate.
 */
export const FPX_CURRENT_GAS_LINEUP = z.array(lineupEntrySchema).parse([
  current({
    id: "564-trv-25k-deluxe",
    name: "564 TRV 25K Deluxe",
    category: "premium-traditional",
    applianceType: "fireplace",
    sku: "98500277",
    fireBuilderProductId: 103,
    intakeId: "564-trv-25k-deluxe",
    sourceUrl: "https://www.fireplacex.com/product/564-trv-25k/",
  }),
  current({
    id: "564-trv-25k-clean-face",
    name: "564 TRV 25K Clean Face Deluxe",
    category: "premium-traditional",
    applianceType: "fireplace",
    sku: "98500278",
    fireBuilderProductId: 105,
    intakeId: "564-trv-25k-clean-face",
    sourceUrl: "https://www.fireplacex.com/product/564-trv-25k-clean-face/",
  }),
  current({
    id: "564-tv-35k-deluxe",
    name: "564 TV 35K Deluxe",
    category: "premium-traditional",
    applianceType: "fireplace",
    sku: "98500297",
    fireBuilderProductId: 130,
    intakeId: "564-tv-35k-deluxe",
    sourceUrl: "https://www.fireplacex.com/product/564-trv-35k-deluxe/",
  }),
  current({
    id: "564-tv-35k-clean-face",
    name: "564 TV 35K Clean Face Deluxe",
    category: "premium-traditional",
    applianceType: "fireplace",
    sku: "98500298",
    fireBuilderProductId: 131,
    intakeId: "564-tv-35k-clean-face",
    sourceUrl: "https://www.fireplacex.com/product/564-tv-35k-deluxe-clean-face/",
  }),
  current({
    id: "864-trv-31k-deluxe",
    name: "864 TRV 31K Deluxe",
    category: "premium-traditional",
    applianceType: "fireplace",
    sku: "98500186",
    fireBuilderProductId: 101,
    intakeId: "864-trv-31k-deluxe",
    sourceUrl: "https://www.fireplacex.com/product/864-trv-31k/",
  }),
  current({
    id: "864-trv-31k-clean-face",
    name: "864 TRV 31K Clean Face Deluxe",
    category: "premium-traditional",
    applianceType: "fireplace",
    sku: "98500187",
    fireBuilderProductId: 97,
    intakeId: "864-trv-31k-clean-face",
    sourceUrl: "https://www.fireplacex.com/product/864-trv-31k-clean-face/",
  }),
  current({
    id: "864-tv-40k-deluxe",
    name: "864 TV 40K Deluxe",
    category: "premium-traditional",
    applianceType: "fireplace",
    sku: "98500188",
    fireBuilderProductId: 184,
    intakeId: "864-tv-40k-deluxe",
    sourceUrl: "https://www.fireplacex.com/product/864-tv-40k-deluxe/",
  }),
  current({
    id: "864-tv-40k-clean-face",
    name: "864 TV 40K Clean Face Deluxe",
    category: "premium-traditional",
    applianceType: "fireplace",
    sku: "98500189",
    fireBuilderProductId: 183,
    intakeId: "864-tv-40k-clean-face",
    sourceUrl: "https://www.fireplacex.com/product/864-tv-40k-clean-face-deluxe/",
  }),
  current({
    id: "4237-ember-glo-deluxe",
    name: "4237 TV Ember-Glo Deluxe",
    category: "premium-traditional",
    applianceType: "fireplace",
    intakeId: "4237-tv-deluxe",
    sourceUrl: "https://www.fireplacex.com/product/4237-ember-glo-deluxe/",
  }),
  current({
    id: "4237-ember-glo-clean-face",
    name: "4237 Ember-Glo TV Clean Face Deluxe",
    category: "premium-traditional",
    applianceType: "fireplace",
    sku: "98500344",
    fireBuilderProductId: 135,
    intakeId: "4237-tv-clean-face",
    sourceUrl: "https://www.fireplacex.com/product/4237-ember-glo-clean-face-deluxe/",
  }),
  current({
    id: "4415-high-output-deluxe",
    name: "4415 High Output Deluxe",
    category: "premium-linear",
    applianceType: "fireplace",
    sku: "98500328",
    fireBuilderProductId: 18,
    intakeId: "4415-high-output",
    sourceUrl: "https://www.fireplacex.com/product/4415-high-output-deluxe/",
  }),
  current({
    id: "6015-high-output-deluxe",
    name: "6015 High Output Deluxe",
    category: "premium-linear",
    applianceType: "fireplace",
    sku: "98500334",
    fireBuilderProductId: 19,
    intakeId: "6015-high-output",
    sourceUrl: "https://www.fireplacex.com/product/6015-high-output-deluxe/",
  }),
  current({
    id: "probuilder-36-clean-face-mv",
    name: "ProBuilder 36 Clean Face MV",
    category: "probuilder-traditional",
    applianceType: "fireplace",
    sku: "98500222",
    fireBuilderProductId: 176,
    intakeId: "36-probuilder-clean-face-mv",
    sourceUrl: FPX_GAS_LINEUP_SOURCES.proBuilderTraditional,
  }),
  current({
    id: "probuilder-36-clean-face-gsb",
    name: "ProBuilder 36 Clean Face GSB",
    category: "probuilder-traditional",
    applianceType: "fireplace",
    sku: "98500223",
    fireBuilderProductId: 176,
    intakeId: "36-probuilder-clean-face-gsb",
    sourceUrl: FPX_GAS_LINEUP_SOURCES.proBuilderTraditional,
  }),
  current({
    id: "probuilder-36-clean-face-deluxe",
    name: "ProBuilder 36 Clean Face Deluxe",
    category: "probuilder-traditional",
    applianceType: "fireplace",
    sku: "98500231",
    fireBuilderProductId: 100,
    intakeId: "36-probuilder-clean-face-deluxe",
    sourceUrl: "https://www.fireplacex.com/product/probuilder-36-clean-face-deluxe/",
  }),
  current({
    id: "probuilder-36-clean-face-see-thru",
    name: "ProBuilder 36 Clean Face See-Thru Deluxe",
    category: "probuilder-traditional",
    applianceType: "fireplace",
    sku: "98500237",
    fireBuilderProductId: 139,
    intakeId: "36-probuilder-clean-face-see-thru",
    sourceUrl: FPX_GAS_LINEUP_SOURCES.proBuilderTraditional,
  }),
  current({
    id: "probuilder-42-clean-face-deluxe",
    name: "ProBuilder 42 Clean Face Deluxe",
    category: "probuilder-traditional",
    applianceType: "fireplace",
    sku: "98500232",
    fireBuilderProductId: 107,
    intakeId: "42-probuilder-clean-face",
    sourceUrl: "https://www.fireplacex.com/product/probuilder-42-clean-face-deluxe/",
  }),
  current({
    id: "probuilder-42-linear-deluxe",
    name: "ProBuilder 42 Linear Deluxe",
    category: "probuilder-linear",
    applianceType: "fireplace",
    sku: "98500264",
    fireBuilderProductId: 117,
    intakeId: "42-probuilder-linear",
    sourceUrl: "https://www.fireplacex.com/product/probuilder-42-linear-deluxe/",
  }),
  current({
    id: "probuilder-54-linear-deluxe",
    name: "ProBuilder 54 Linear Deluxe",
    category: "probuilder-linear",
    applianceType: "fireplace",
    sku: "98500268",
    fireBuilderProductId: 167,
    intakeId: "54-probuilder-linear",
    sourceUrl: "https://www.fireplacex.com/product/probuilder-54-linear-deluxe/",
  }),
  current({
    id: "probuilder-72-linear-gsb",
    name: "ProBuilder 72 Linear GSB",
    category: "probuilder-linear",
    applianceType: "fireplace",
    sku: "98500263",
    fireBuilderProductId: 91,
    intakeId: "72-probuilder-linear-gsb",
    sourceUrl: FPX_GAS_LINEUP_SOURCES.proBuilderLinear,
  }),
  current({
    id: "probuilder-72-linear-deluxe",
    name: "ProBuilder 72 Linear Deluxe",
    category: "probuilder-linear",
    applianceType: "fireplace",
    sku: "98500266",
    fireBuilderProductId: 118,
    intakeId: "72-probuilder-linear-deluxe",
    sourceUrl: "https://www.fireplacex.com/product/probuilder-72-linear-deluxe/",
  }),
  current({
    id: "32-dvs-deluxe-ember-glo",
    name: "32 DVS Deluxe Ember-Glo",
    category: "gas-insert",
    applianceType: "insert",
    sku: "98400371",
    fireBuilderProductId: 128,
    intakeId: "32-dvs-deluxe-ember-glo",
    sourceUrl: "https://www.fireplacex.com/product/32-dvs-deluxe-ember-glo/",
  }),
  current({
    id: "430-deluxe-ember-glo",
    name: "430 Deluxe Ember-Glo",
    category: "gas-insert",
    applianceType: "insert",
    sku: "98400113",
    fireBuilderProductId: 115,
    intakeId: "430-deluxe-ember-glo",
    sourceUrl: "https://www.fireplacex.com/product/430-deluxe-ember-glo/",
  }),
  current({
    id: "430-mod-fyre",
    name: "430 Mod-Fyre Deluxe",
    category: "gas-insert",
    applianceType: "insert",
    factoryAvailability: "limited-stock",
    sku: "98400114",
    fireBuilderProductId: 132,
    intakeId: "430-mod-fyre",
    sourceUrl: "https://www.fireplacex.com/product/430-mod-fyre/",
  }),
  current({
    id: "34-dvl-deluxe-ember-glo",
    name: "34 DVL Deluxe Ember-Glo",
    category: "gas-insert",
    applianceType: "insert",
    sku: "98400376",
    fireBuilderProductId: 127,
    intakeId: "34-dvl-deluxe-ember-glo",
    sourceUrl: "https://www.fireplacex.com/product/34-dvl-deluxe-ember-glo/",
  }),
  current({
    id: "616-deluxe-ember-glo",
    name: "616 Deluxe Ember-Glo",
    category: "gas-insert",
    applianceType: "insert",
    sku: "98400120",
    fireBuilderProductId: 111,
    intakeId: "616-deluxe-ember-glo",
    sourceUrl: "https://www.fireplacex.com/product/616-deluxe-ember-glo/",
  }),
  current({
    id: "616-mod-fyre",
    name: "616 Mod-Fyre Deluxe",
    category: "gas-insert",
    applianceType: "insert",
    factoryAvailability: "sold-out-at-factory",
    sku: "98400121",
    fireBuilderProductId: 133,
    intakeId: "616-mod-fyre",
    sourceUrl: "https://www.fireplacex.com/product/616-mod-fyre/",
  }),
]);

/** Products still visible in official support/spec resources but not in the
 * current collection scope. They are never silently mixed into the live list. */
export const FPX_LEGACY_GAS_LINEUP = z.array(lineupEntrySchema).parse([
  {
    id: "probuilder-24-clean-face",
    name: "ProBuilder 24 Clean Face Series",
    category: "probuilder-traditional",
    applianceType: "fireplace",
    marketingStatus: "legacy",
    factoryAvailability: "dealer-confirmation",
    intakeId: "24-probuilder-clean-face",
    sourceUrl:
      "https://www.fireplacex.com/products/gas-fireplaces/probuilder-24-clean-face-series/",
  },
  {
    id: "564-tv-high-output",
    name: "564 TV High Output Deluxe",
    category: "premium-traditional",
    applianceType: "fireplace",
    marketingStatus: "legacy",
    factoryAvailability: "limited-stock",
    intakeId: "564-tv-high-output",
    sourceUrl: "https://www.fireplacex.com/product/564-tv-high-output-deluxe/",
  },
  {
    id: "3615-high-output",
    name: "3615 High Output Deluxe",
    category: "premium-linear",
    applianceType: "fireplace",
    marketingStatus: "legacy",
    factoryAvailability: "dealer-confirmation",
    intakeId: "3615-high-output",
    sourceUrl: FPX_GAS_LINEUP_SOURCES.professionalSpecs,
  },
  {
    id: "4415-see-through-high-output",
    name: "4415 See-Thru High Output Deluxe",
    category: "premium-linear",
    applianceType: "fireplace",
    marketingStatus: "legacy",
    factoryAvailability: "dealer-confirmation",
    intakeId: "4415-see-through-high-output",
    sourceUrl: FPX_GAS_LINEUP_SOURCES.discontinuedManuals,
  },
]);

export function summarizeFpxCurrentGasLineup() {
  return FPX_CURRENT_GAS_LINEUP.reduce(
    (summary, product) => {
      summary.total += 1;
      summary.byCategory[product.category] += 1;
      return summary;
    },
    {
      total: 0,
      byCategory: {
        "premium-traditional": 0,
        "premium-linear": 0,
        "probuilder-traditional": 0,
        "probuilder-linear": 0,
        "gas-insert": 0,
      },
    },
  );
}
