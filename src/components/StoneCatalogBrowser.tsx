"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StoneId, StoneProduct } from "@/domain/catalog";
import {
  DEFAULT_STONE_BROWSE_FILTERS,
  filterStoneProducts,
  getStonePatternFamily,
  groupStoneProducts,
  type StoneBrowseFilters,
} from "@/domain/stoneCatalogBrowser";

type StoneCatalogBrowserProps = {
  currentStoneId: StoneId;
  onSelect: (stoneId: StoneId) => void;
  products: readonly StoneProduct[];
};

export function StoneCatalogBrowser({
  currentStoneId,
  onSelect,
  products,
}: StoneCatalogBrowserProps) {
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState<StoneBrowseFilters>(DEFAULT_STONE_BROWSE_FILTERS);
  const dialogRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const approvedIds = useMemo(() => new Set(products.map((product) => product.id)), [products]);
  const selected = products.find((product) => product.id === currentStoneId);
  const selectedFamily = getStonePatternFamily(products, currentStoneId);
  const allFamilies = useMemo(() => groupStoneProducts(products), [products]);
  const filtered = useMemo(() => filterStoneProducts(products, filters), [filters, products]);
  const filteredFamilies = useMemo(() => groupStoneProducts(filtered), [filtered]);

  const closeBrowser = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  }, []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeBrowser();
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
      window.clearTimeout(timer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeBrowser, open]);

  if (!selected || !selectedFamily) return null;

  const choose = (id: string, close = true) => {
    if (!approvedIds.has(id)) return;
    onSelect(id as StoneId);
    if (close) closeBrowser();
  };

  const updateFilter = <Key extends keyof StoneBrowseFilters>(
    key: Key,
    value: StoneBrowseFilters[Key],
  ) => setFilters((current) => ({ ...current, [key]: value }));

  return (
    <div className="catalog-selector stone-selector">
      <button
        aria-haspopup="dialog"
        className="stone-selector__trigger"
        data-stone-id={currentStoneId}
        onClick={() => {
          setFilters(DEFAULT_STONE_BROWSE_FILTERS);
          setOpen(true);
        }}
        ref={triggerRef}
        type="button"
      >
        <Image
          alt=""
          height={88}
          src={selected.thumbnailAsset.localPath}
          unoptimized
          width={132}
        />
        <span>
          <small>Centurion pattern</small>
          <strong>{selected.patternName}</strong>
          <em>{selected.colorName}</em>
        </span>
        <span className="catalog-selector__action">Browse stone</span>
      </button>

      <label className="select-control catalog-selector__variant">
        <span>Stone color</span>
        <select
          aria-label="Stone color"
          onChange={(event) => choose(event.target.value, false)}
          value={currentStoneId}
        >
          {selectedFamily.products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.colorName}
              {product.productCode ? ` · ${product.productCode}` : ""}
            </option>
          ))}
        </select>
        <small>
          Pattern #{selected.patternCode} ·{" "}
          {selected.joint === "dry-stack" ? "Dry-stack" : "Mortar joint"}
        </small>
      </label>

      {open ? (
        <div
          className="modal-backdrop catalog-browser-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeBrowser();
          }}
        >
          <section
            aria-labelledby="stone-browser-title"
            aria-modal="true"
            className="catalog-browser stone-browser"
            ref={dialogRef}
            role="dialog"
          >
            <header className="catalog-browser__header">
              <div>
                <p className="eyebrow">Official Centurion visual library</p>
                <h2 id="stone-browser-title">Choose stone</h2>
                <p>
                  {products.length} published colors across {allFamilies.length} pattern lines
                </p>
              </div>
              <button className="close-button" onClick={closeBrowser} type="button">
                Close
              </button>
            </header>

            <div className="catalog-browser__toolbar stone-browser__toolbar">
              <label className="catalog-browser__search">
                <span className="sr-only">Search stone</span>
                <input
                  aria-label="Search stone"
                  onChange={(event) => updateFilter("query", event.target.value)}
                  placeholder="Search color, pattern, or code"
                  ref={searchRef}
                  type="search"
                  value={filters.query}
                />
              </label>
              <div className="catalog-browser__filters stone-browser__filters">
                <label>
                  <span>Pattern</span>
                  <select
                    aria-label="Filter stone pattern"
                    onChange={(event) => updateFilter("pattern", event.target.value)}
                    value={filters.pattern}
                  >
                    <option value="all">All 39 patterns</option>
                    {allFamilies.map((family) => (
                      <option key={family.name} value={family.name}>
                        {family.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Installation</span>
                  <select
                    aria-label="Filter stone joint"
                    onChange={(event) =>
                      updateFilter("joint", event.target.value as StoneBrowseFilters["joint"])
                    }
                    value={filters.joint}
                  >
                    <option value="all">All joint styles</option>
                    <option value="dry-stack">Dry-stack</option>
                    <option value="mortar">Mortar joint</option>
                  </select>
                </label>
              </div>
            </div>

            <div className="catalog-browser__results-heading" aria-live="polite">
              <strong>
                {filtered.length} color{filtered.length === 1 ? "" : "s"}
              </strong>
              <span>
                {filteredFamilies.length} pattern{filteredFamilies.length === 1 ? "" : "s"}
              </span>
              {filters.query || filters.pattern !== "all" || filters.joint !== "all" ? (
                <button onClick={() => setFilters(DEFAULT_STONE_BROWSE_FILTERS)} type="button">
                  Clear filters
                </button>
              ) : null}
            </div>

            <div className="catalog-browser__results stone-browser__results">
              {filteredFamilies.map((family, familyIndex) => (
                <article className="stone-family" key={family.name}>
                  <header>
                    <div>
                      <p>Pattern #{family.patternCode}</p>
                      <h3>{family.name}</h3>
                    </div>
                    <span>{family.joint === "dry-stack" ? "Dry-stack" : "Mortar joint"}</span>
                  </header>
                  <div className="stone-family__swatches">
                    {family.products.map((product) => {
                      const current = product.id === currentStoneId;
                      return (
                        <button
                          aria-label={`Select ${product.name}`}
                          data-current={current || undefined}
                          data-testid={`stone-product-${product.id}`}
                          key={product.id}
                          onClick={() => choose(product.id)}
                          type="button"
                        >
                          <Image
                            alt=""
                            height={160}
                            loading={familyIndex < 2 ? "eager" : "lazy"}
                            src={product.thumbnailAsset.localPath}
                            unoptimized
                            width={240}
                          />
                          <span>
                            <strong>{product.colorName}</strong>
                            <small>
                              {product.productCode ?? `Pattern #${product.patternCode}`}
                            </small>
                          </span>
                          <em>{current ? "Selected" : "Choose"}</em>
                        </button>
                      );
                    })}
                  </div>
                </article>
              ))}
              {filteredFamilies.length === 0 ? (
                <div className="catalog-browser__empty">
                  <strong>No official stone colors match those filters.</strong>
                  <p>Clear the filters or search by a different color, pattern, or code.</p>
                  <button
                    className="secondary-button"
                    onClick={() => setFilters(DEFAULT_STONE_BROWSE_FILTERS)}
                    type="button"
                  >
                    Show all stone
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
