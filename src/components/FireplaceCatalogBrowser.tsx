"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FireplaceId, FireplaceProduct } from "@/domain/catalog";
import type { CatalogBrand } from "@/domain/catalogRepository";
import {
  DEFAULT_CATALOG_BROWSE_FILTERS,
  EMPTY_CATALOG_PREFERENCES,
  createCatalogBrowserEntries,
  filterCatalogBrowserEntries,
  getCatalogBrowserFamily,
  groupCatalogBrowserEntries,
  parseCatalogPreferences,
  recordRecentProduct,
  type CatalogBrowseFilters,
  type CatalogPreferences,
} from "@/domain/catalogBrowser";

const PREFERENCES_KEY = "firedesign:catalog-preferences:v1";

const fuelLabels: Record<FireplaceProduct["fuel"], string> = {
  gas: "Gas",
  wood: "Wood",
  electric: "Electric",
  pellet: "Pellet",
};

const styleLabels: Record<FireplaceProduct["style"], string> = {
  traditional: "Traditional",
  linear: "Linear",
  portrait: "Portrait",
  "see-through": "See-through",
};

type FireplaceCatalogBrowserProps = {
  brands: readonly CatalogBrand[];
  currentProductId: FireplaceId;
  onSelect: (productId: FireplaceId) => void;
  products: readonly FireplaceProduct[];
};

function persistPreferences(preferences: CatalogPreferences) {
  try {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  } catch {
    // The browser can deny storage in private/restricted modes. Catalog selection
    // remains fully functional for the session even when preferences cannot persist.
  }
}

function loadPreferences(approvedProductIds: ReadonlySet<string>) {
  try {
    const saved = localStorage.getItem(PREFERENCES_KEY);
    return saved
      ? parseCatalogPreferences(JSON.parse(saved), approvedProductIds)
      : EMPTY_CATALOG_PREFERENCES;
  } catch {
    return EMPTY_CATALOG_PREFERENCES;
  }
}

export function FireplaceCatalogBrowser({
  brands,
  currentProductId,
  onSelect,
  products,
}: FireplaceCatalogBrowserProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<CatalogBrowseFilters>(DEFAULT_CATALOG_BROWSE_FILTERS);
  const [preferences, setPreferences] = useState<CatalogPreferences>(EMPTY_CATALOG_PREFERENCES);
  const preferencesLoadedRef = useRef(false);
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const entries = useMemo(() => createCatalogBrowserEntries(products), [products]);
  const approvedIds = useMemo(() => new Set(products.map((product) => product.id)), [products]);
  const applianceBrands = useMemo(
    () => brands.filter((brand) => brand.productKinds.includes("appliance")),
    [brands],
  );
  const selectedEntry = entries.find((entry) => entry.product.id === currentProductId);
  const selectedFamily = getCatalogBrowserFamily(entries, currentProductId);
  const favorites = useMemo(() => new Set(preferences.favoriteIds), [preferences.favoriteIds]);
  const filteredEntries = useMemo(
    () => filterCatalogBrowserEntries(entries, filters, favorites, preferences.recentIds),
    [entries, favorites, filters, preferences.recentIds],
  );
  const filteredFamilies = useMemo(
    () => groupCatalogBrowserEntries(filteredEntries),
    [filteredEntries],
  );

  const openBrowser = () => {
    setFilters(DEFAULT_CATALOG_BROWSE_FILTERS);
    setPreferences((current) => {
      const source = preferencesLoadedRef.current ? current : loadPreferences(approvedIds);
      preferencesLoadedRef.current = true;
      const next = recordRecentProduct(source, currentProductId);
      persistPreferences(next);
      return next;
    });
    setOpen(true);
  };

  const closeBrowser = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => searchRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeBrowser();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeBrowser, open]);

  const updateFilter = <Key extends keyof CatalogBrowseFilters>(
    key: Key,
    value: CatalogBrowseFilters[Key],
  ) => setFilters((current) => ({ ...current, [key]: value }));

  const selectProduct = (productId: string, shouldClose = true) => {
    if (!approvedIds.has(productId)) return;
    setPreferences((current) => {
      const next = recordRecentProduct(current, productId);
      persistPreferences(next);
      return next;
    });
    onSelect(productId as FireplaceId);
    if (shouldClose) {
      closeBrowser();
    }
  };

  const toggleFavorite = (productId: string) => {
    setPreferences((current) => {
      const isFavorite = current.favoriteIds.includes(productId);
      const next = {
        ...current,
        favoriteIds: isFavorite
          ? current.favoriteIds.filter((id) => id !== productId)
          : [...current.favoriteIds, productId],
      };
      persistPreferences(next);
      return next;
    });
  };

  if (!selectedEntry || !selectedFamily) return null;

  return (
    <div className="catalog-selector">
      <button
        aria-haspopup="dialog"
        className="catalog-selector__trigger"
        data-product-id={currentProductId}
        onClick={openBrowser}
        ref={triggerRef}
        type="button"
      >
        <span>
          <small>Product family</small>
          <strong>{selectedFamily.name}</strong>
          <em>{selectedEntry.variantLabel}</em>
        </span>
        <span className="catalog-selector__action">Browse catalog</span>
      </button>

      {selectedFamily.products.length > 1 ? (
        <label className="select-control catalog-selector__variant">
          <span>Model variant</span>
          <select
            aria-label="Model variant"
            onChange={(event) => selectProduct(event.target.value, false)}
            value={currentProductId}
          >
            {selectedFamily.products.map((entry) => (
              <option key={entry.product.id} value={entry.product.id}>
                {entry.variantLabel}
              </option>
            ))}
          </select>
          <small>Exact approved SKU {selectedEntry.product.sku}</small>
        </label>
      ) : (
        <p className="catalog-selector__single">
          Exact approved SKU {selectedEntry.product.sku}
        </p>
      )}

      {open ? (
        <div
          className="modal-backdrop catalog-browser-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              closeBrowser();
            }
          }}
        >
          <section
            aria-labelledby="catalog-browser-title"
            aria-modal="true"
            className="catalog-browser"
            ref={dialogRef}
            role="dialog"
          >
            <header className="catalog-browser__header">
              <div>
                <p className="eyebrow">Approved product library</p>
                <h2 id="catalog-browser-title">Choose a fireplace</h2>
                <p>
                  {products.length} exact models across{" "}
                  {groupCatalogBrowserEntries(entries).length} product families
                </p>
              </div>
              <button className="close-button" onClick={closeBrowser} type="button">
                Close
              </button>
            </header>

            <div className="catalog-browser__collections" aria-label="Catalog collection">
              {(["all", "favorites", "recent"] as const).map((collection) => (
                <button
                  aria-pressed={filters.collection === collection}
                  key={collection}
                  onClick={() => updateFilter("collection", collection)}
                  type="button"
                >
                  {collection === "all"
                    ? "All products"
                    : collection === "favorites"
                      ? `Favorites · ${preferences.favoriteIds.length}`
                      : `Recent · ${preferences.recentIds.length}`}
                </button>
              ))}
            </div>

            <div className="catalog-browser__toolbar">
              <label className="catalog-browser__search">
                <span className="sr-only">Search fireplaces</span>
                <input
                  aria-label="Search fireplaces"
                  onChange={(event) => updateFilter("query", event.target.value)}
                  placeholder="Search model, family, or SKU"
                  ref={searchRef}
                  type="search"
                  value={filters.query}
                />
              </label>
              <div className="catalog-browser__filters">
                <label>
                  <span>Brand</span>
                  <select
                    aria-label="Filter by brand"
                    onChange={(event) => updateFilter("brandId", event.target.value)}
                    value={filters.brandId}
                  >
                    <option value="all">All brands</option>
                    {applianceBrands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Fuel</span>
                  <select
                    aria-label="Filter by fuel"
                    onChange={(event) =>
                      updateFilter("fuel", event.target.value as CatalogBrowseFilters["fuel"])
                    }
                    value={filters.fuel}
                  >
                    <option value="all">All fuels</option>
                    <option value="gas">Gas</option>
                    <option value="wood">Wood</option>
                    <option value="electric">Electric</option>
                    <option value="pellet">Pellet</option>
                  </select>
                </label>
                <label>
                  <span>Installation</span>
                  <select
                    aria-label="Filter by installation"
                    onChange={(event) =>
                      updateFilter(
                        "installation",
                        event.target.value as CatalogBrowseFilters["installation"],
                      )
                    }
                    value={filters.installation}
                  >
                    <option value="all">All types</option>
                    <option value="built-in">Built-in fireplace</option>
                    <option value="insert">Insert</option>
                    <option value="freestanding">Freestanding</option>
                  </select>
                </label>
                <label>
                  <span>Style</span>
                  <select
                    aria-label="Filter by style"
                    onChange={(event) =>
                      updateFilter("style", event.target.value as CatalogBrowseFilters["style"])
                    }
                    value={filters.style}
                  >
                    <option value="all">All styles</option>
                    <option value="traditional">Traditional</option>
                    <option value="linear">Linear</option>
                    <option value="portrait">Portrait</option>
                    <option value="see-through">See-through</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="catalog-browser__results-heading" aria-live="polite">
              <strong>
                {filteredEntries.length} model{filteredEntries.length === 1 ? "" : "s"}
              </strong>
              <span>
                {filteredFamilies.length} famil{filteredFamilies.length === 1 ? "y" : "ies"}
              </span>
              {filters.query ||
              filters.brandId !== "all" ||
              filters.fuel !== "all" ||
              filters.installation !== "all" ||
              filters.style !== "all" ||
              filters.collection !== "all" ? (
                <button
                  onClick={() => setFilters(DEFAULT_CATALOG_BROWSE_FILTERS)}
                  type="button"
                >
                  Clear filters
                </button>
              ) : null}
            </div>

            <div className="catalog-browser__results">
              {filteredFamilies.map((catalogFamily) => {
                const representative = catalogFamily.products[0];
                if (!representative) return null;
                return (
                  <article className="catalog-family" key={catalogFamily.id}>
                    <div className="catalog-family__heading">
                      <div
                        aria-hidden="true"
                        className="catalog-family__aperture"
                        style={{
                          aspectRatio: `${representative.product.viewingArea.width} / ${representative.product.viewingArea.height}`,
                        }}
                      >
                        <span />
                      </div>
                      <div>
                        <p>{catalogFamily.manufacturer}</p>
                        <h3>{catalogFamily.name}</h3>
                        <span>
                          {fuelLabels[representative.product.fuel]} ·{" "}
                          {representative.installation === "insert" ? "Insert" : "Built-in"} ·{" "}
                          {styleLabels[representative.product.style]}
                        </span>
                      </div>
                    </div>
                    <div className="catalog-family__variants">
                      {catalogFamily.products.map((entry) => {
                        const isCurrent = entry.product.id === currentProductId;
                        const isFavorite = favorites.has(entry.product.id);
                        return (
                          <div data-current={isCurrent || undefined} key={entry.product.id}>
                            <button
                              aria-label={`${isFavorite ? "Remove" : "Add"} ${entry.product.model} ${isFavorite ? "from" : "to"} favorites`}
                              className="catalog-family__favorite"
                              onClick={() => toggleFavorite(entry.product.id)}
                              title={isFavorite ? "Remove favorite" : "Add favorite"}
                              type="button"
                            >
                              {isFavorite ? "★" : "☆"}
                            </button>
                            <button
                              aria-label={`Select ${entry.product.model}`}
                              className="catalog-family__select"
                              data-testid={`catalog-product-${entry.product.id}`}
                              onClick={() => selectProduct(entry.product.id)}
                              type="button"
                            >
                              <span>
                                <strong>{entry.variantLabel}</strong>
                                <small>SKU {entry.product.sku}</small>
                              </span>
                              <em>{isCurrent ? "Selected" : "Choose"}</em>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
              {filteredFamilies.length === 0 ? (
                <div className="catalog-browser__empty">
                  <strong>No approved fireplaces match those filters.</strong>
                  <p>Clear the filters or search by a different model or SKU.</p>
                  <button
                    className="secondary-button"
                    onClick={() => setFilters(DEFAULT_CATALOG_BROWSE_FILTERS)}
                    type="button"
                  >
                    Show all products
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
