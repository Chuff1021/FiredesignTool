import { describe, expect, it } from "vitest";
import { fireplaceProducts } from "@/domain/catalog";
import {
  DEFAULT_CATALOG_BROWSE_FILTERS,
  createCatalogBrowserEntries,
  filterCatalogBrowserEntries,
  getCatalogBrowserFamily,
  groupCatalogBrowserEntries,
  parseCatalogPreferences,
  recordRecentProduct,
} from "@/domain/catalogBrowser";

describe("catalog browser", () => {
  const entries = createCatalogBrowserEntries(fireplaceProducts);

  it("separates approved product families from exact sellable variants", () => {
    expect(entries).toHaveLength(30);
    expect(groupCatalogBrowserEntries(entries)).toHaveLength(19);
    expect(getCatalogBrowserFamily(entries, "864-trv-31k-clean-face")?.products).toHaveLength(
      2,
    );
    expect(
      getCatalogBrowserFamily(entries, "864-trv-31k-clean-face")?.products.map(
        (entry) => entry.variantLabel,
      ),
    ).toEqual(["Clean Face Deluxe", "Designer Face Deluxe"]);
  });

  it("filters by searchable product data and physical product categories", () => {
    expect(
      filterCatalogBrowserEntries(entries, {
        ...DEFAULT_CATALOG_BROWSE_FILTERS,
        query: "98500187",
      }).map((entry) => entry.product.id),
    ).toEqual(["864-trv-31k-clean-face"]);
    expect(
      filterCatalogBrowserEntries(entries, {
        ...DEFAULT_CATALOG_BROWSE_FILTERS,
        fuel: "wood",
        installation: "built-in",
      }),
    ).toHaveLength(3);
    expect(
      filterCatalogBrowserEntries(entries, {
        ...DEFAULT_CATALOG_BROWSE_FILTERS,
        installation: "insert",
      }),
    ).toHaveLength(6);
  });

  it("supports reliable favorites and recent-product recovery", () => {
    const approved = new Set(fireplaceProducts.map((product) => product.id));
    expect(
      parseCatalogPreferences(
        {
          version: 1,
          favoriteIds: ["864-trv-31k-clean-face", "not-approved"],
          recentIds: ["4237-ember-glo-clean-face", "4237-ember-glo-clean-face"],
        },
        approved,
      ),
    ).toEqual({
      version: 1,
      favoriteIds: ["864-trv-31k-clean-face"],
      recentIds: ["4237-ember-glo-clean-face"],
    });
    expect(parseCatalogPreferences({ broken: true }, approved).recentIds).toEqual([]);
    expect(
      recordRecentProduct(
        { version: 1, favoriteIds: [], recentIds: ["4237-ember-glo-clean-face"] },
        "864-trv-31k-clean-face",
      ).recentIds,
    ).toEqual(["864-trv-31k-clean-face", "4237-ember-glo-clean-face"]);
  });
});
