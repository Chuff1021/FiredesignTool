import { z } from "zod";
import type { FireplaceProduct } from "@/domain/catalog";

export const catalogBrowseFiltersSchema = z.object({
  query: z.string(),
  brandId: z.string(),
  fuel: z.enum(["all", "gas", "wood", "electric", "pellet"]),
  installation: z.enum(["all", "built-in", "insert", "freestanding"]),
  style: z.enum(["all", "traditional", "linear", "portrait", "see-through"]),
  collection: z.enum(["all", "favorites", "recent"]),
});

export type CatalogBrowseFilters = z.infer<typeof catalogBrowseFiltersSchema>;

export const DEFAULT_CATALOG_BROWSE_FILTERS: CatalogBrowseFilters = {
  query: "",
  brandId: "all",
  fuel: "all",
  installation: "all",
  style: "all",
  collection: "all",
};

export type CatalogBrowserEntry = {
  product: FireplaceProduct;
  familyId: string;
  familyName: string;
  variantLabel: string;
  installation: "built-in" | "insert" | "freestanding";
  environment: "indoor" | "outdoor" | "indoor-outdoor";
};

export type CatalogBrowserFamily = {
  id: string;
  name: string;
  brandId: string;
  manufacturer: string;
  products: CatalogBrowserEntry[];
};

type FamilyOverride = Pick<CatalogBrowserEntry, "familyId" | "familyName" | "variantLabel">;

const family = (
  familyId: string,
  familyName: string,
  variantLabel: string,
): FamilyOverride => ({
  familyId,
  familyName,
  variantLabel,
});

/**
 * Approved presentation groupings for the current FPX release. These affect catalog
 * navigation only; exact product records, dimensions, clearances, and assets remain
 * authoritative in the approved catalog release.
 */
const FPX_FAMILY_OVERRIDES: Readonly<Record<string, FamilyOverride>> = {
  "564-trv-25k-deluxe": family("fpx-564-trv-25k", "564 TRV 25K", "Designer Face Deluxe"),
  "564-trv-25k-clean-face": family("fpx-564-trv-25k", "564 TRV 25K", "Clean Face Deluxe"),
  "564-tv-35k-deluxe": family("fpx-564-tv-35k", "564 TV 35K", "Designer Face Deluxe"),
  "564-tv-35k-clean-face": family("fpx-564-tv-35k", "564 TV 35K", "Clean Face Deluxe"),
  "864-trv-31k-clean-face": family("fpx-864-trv-31k", "864 TRV 31K", "Clean Face Deluxe"),
  "864-trv-31k-deluxe": family("fpx-864-trv-31k", "864 TRV 31K", "Designer Face Deluxe"),
  "4237-ember-glo-clean-face": family(
    "fpx-4237-ember-glo",
    "4237 Ember-Glo",
    "Clean Face Deluxe",
  ),
  "4237-ember-glo-deluxe": family(
    "fpx-4237-ember-glo",
    "4237 Ember-Glo",
    "IronWorks Doors Deluxe",
  ),
  "864-tv-40k-clean-face": family("fpx-864-tv-40k", "864 TV 40K", "Clean Face Deluxe"),
  "864-tv-40k-deluxe": family("fpx-864-tv-40k", "864 TV 40K", "Designer Face Deluxe"),
  "4415-high-output-deluxe": family("fpx-4415-ho", "4415 High Output", "Deluxe"),
  "6015-high-output-deluxe": family("fpx-6015-ho", "6015 High Output", "Deluxe"),
  "probuilder-36-clean-face-mv": family("fpx-probuilder-36", "ProBuilder 36", "Clean Face MV"),
  "probuilder-36-clean-face-gsb": family(
    "fpx-probuilder-36",
    "ProBuilder 36",
    "Clean Face GSB",
  ),
  "probuilder-36-clean-face-deluxe": family(
    "fpx-probuilder-36",
    "ProBuilder 36",
    "Clean Face Deluxe",
  ),
  "probuilder-36-clean-face-see-thru": family(
    "fpx-probuilder-36",
    "ProBuilder 36",
    "See-Thru Deluxe",
  ),
  "probuilder-42-clean-face-deluxe": family(
    "fpx-probuilder-42-traditional",
    "ProBuilder 42 Traditional",
    "Clean Face Deluxe",
  ),
  "probuilder-42-linear-deluxe": family(
    "fpx-probuilder-42-linear",
    "ProBuilder 42 Linear",
    "Deluxe",
  ),
  "probuilder-54-linear-deluxe": family(
    "fpx-probuilder-54-linear",
    "ProBuilder 54 Linear",
    "Deluxe",
  ),
  "probuilder-72-linear-gsb": family("fpx-probuilder-72-linear", "ProBuilder 72 Linear", "GSB"),
  "probuilder-72-linear-deluxe": family(
    "fpx-probuilder-72-linear",
    "ProBuilder 72 Linear",
    "Deluxe",
  ),
  "32-dvs-deluxe-ember-glo": family("fpx-32-dvs", "32 DVS Insert", "Deluxe Ember-Glo"),
  "430-deluxe-ember-glo": family("fpx-430-insert", "430 Gas Insert", "Deluxe Ember-Glo"),
  "430-mod-fyre": family("fpx-430-insert", "430 Gas Insert", "Mod-Fyre Deluxe"),
  "34-dvl-deluxe-ember-glo": family("fpx-34-dvl", "34 DVL Insert", "Deluxe Ember-Glo"),
  "616-deluxe-ember-glo": family("fpx-616-insert", "616 Gas Insert", "Deluxe Ember-Glo"),
  "616-mod-fyre": family("fpx-616-insert", "616 Gas Insert", "Mod-Fyre Deluxe"),
  "42-apex-nexgen-hybrid": family("fpx-42-apex", "42 Apex", "NexGen-Hybrid"),
  "36-elite-nexgen-hybrid": family("fpx-36-elite", "36 Elite", "NexGen-Hybrid"),
  "44-elite-nexgen-hybrid": family("fpx-44-elite", "44 Elite", "NexGen-Hybrid"),
};

export function createCatalogBrowserEntry(product: FireplaceProduct): CatalogBrowserEntry {
  const explicit = product.catalogPresentation;
  const currentReleaseOverride = FPX_FAMILY_OVERRIDES[product.id];
  const presentation =
    explicit ??
    (currentReleaseOverride
      ? {
          ...currentReleaseOverride,
          installation:
            product.applianceType === "insert" ? ("insert" as const) : ("built-in" as const),
          environment: "indoor" as const,
        }
      : {
          familyId: product.id,
          familyName: product.model,
          variantLabel: "Standard configuration",
          installation:
            product.applianceType === "insert" ? ("insert" as const) : ("built-in" as const),
          environment: "indoor" as const,
        });

  return { product, ...presentation };
}

export function createCatalogBrowserEntries(
  products: readonly FireplaceProduct[],
): CatalogBrowserEntry[] {
  return products.map(createCatalogBrowserEntry);
}

function includesSearch(entry: CatalogBrowserEntry, query: string) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) return true;
  return [
    entry.familyName,
    entry.variantLabel,
    entry.product.model,
    entry.product.shortLabel,
    entry.product.manufacturer,
    entry.product.sku,
  ]
    .join(" ")
    .toLocaleLowerCase()
    .includes(normalizedQuery);
}

export function filterCatalogBrowserEntries(
  entries: readonly CatalogBrowserEntry[],
  filters: CatalogBrowseFilters,
  favorites: ReadonlySet<string> = new Set(),
  recentIds: readonly string[] = [],
) {
  const recent = new Set(recentIds);
  return entries.filter((entry) => {
    const { product } = entry;
    return (
      includesSearch(entry, filters.query) &&
      (filters.brandId === "all" || product.brandId === filters.brandId) &&
      (filters.fuel === "all" || product.fuel === filters.fuel) &&
      (filters.installation === "all" || entry.installation === filters.installation) &&
      (filters.style === "all" || product.style === filters.style) &&
      (filters.collection === "all" ||
        (filters.collection === "favorites" && favorites.has(product.id)) ||
        (filters.collection === "recent" && recent.has(product.id)))
    );
  });
}

export function groupCatalogBrowserEntries(
  entries: readonly CatalogBrowserEntry[],
): CatalogBrowserFamily[] {
  const families = new Map<string, CatalogBrowserFamily>();
  for (const entry of entries) {
    const existing = families.get(entry.familyId);
    if (existing) {
      existing.products.push(entry);
      continue;
    }
    families.set(entry.familyId, {
      id: entry.familyId,
      name: entry.familyName,
      brandId: entry.product.brandId,
      manufacturer: entry.product.manufacturer,
      products: [entry],
    });
  }
  return [...families.values()];
}

export function getCatalogBrowserFamily(
  entries: readonly CatalogBrowserEntry[],
  productId: string,
) {
  const selected = entries.find((entry) => entry.product.id === productId);
  return selected
    ? groupCatalogBrowserEntries(
        entries.filter((entry) => entry.familyId === selected.familyId),
      )[0]
    : undefined;
}

export const catalogPreferencesSchema = z.object({
  version: z.literal(1),
  favoriteIds: z.array(z.string()).max(200),
  recentIds: z.array(z.string()).max(8),
});

export type CatalogPreferences = z.infer<typeof catalogPreferencesSchema>;

export const EMPTY_CATALOG_PREFERENCES: CatalogPreferences = {
  version: 1,
  favoriteIds: [],
  recentIds: [],
};

export function parseCatalogPreferences(
  value: unknown,
  approvedProductIds: ReadonlySet<string>,
): CatalogPreferences {
  const parsed = catalogPreferencesSchema.safeParse(value);
  if (!parsed.success) return EMPTY_CATALOG_PREFERENCES;
  const approvedUnique = (ids: readonly string[], maximum: number) =>
    [...new Set(ids.filter((id) => approvedProductIds.has(id)))].slice(0, maximum);
  return {
    version: 1,
    favoriteIds: approvedUnique(parsed.data.favoriteIds, 200),
    recentIds: approvedUnique(parsed.data.recentIds, 8),
  };
}

export function recordRecentProduct(
  preferences: CatalogPreferences,
  productId: string,
): CatalogPreferences {
  return {
    ...preferences,
    recentIds: [productId, ...preferences.recentIds.filter((id) => id !== productId)].slice(
      0,
      8,
    ),
  };
}
