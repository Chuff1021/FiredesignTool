import { z } from "zod";
import type { StoneProduct } from "@/domain/catalog";

export const stoneBrowseFiltersSchema = z.object({
  query: z.string(),
  pattern: z.string(),
  joint: z.enum(["all", "dry-stack", "mortar"]),
});

export type StoneBrowseFilters = z.infer<typeof stoneBrowseFiltersSchema>;

export const DEFAULT_STONE_BROWSE_FILTERS: StoneBrowseFilters = {
  query: "",
  pattern: "all",
  joint: "all",
};

export type StonePatternFamily = {
  name: string;
  patternCode: string;
  joint: StoneProduct["joint"];
  products: StoneProduct[];
};

export function filterStoneProducts(
  products: readonly StoneProduct[],
  filters: StoneBrowseFilters,
) {
  const query = filters.query.trim().toLocaleLowerCase();
  return products.filter((product) => {
    const searchable = [
      product.name,
      product.patternName,
      product.colorName,
      product.patternCode,
      product.colorCode,
      product.productCode,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();
    return (
      (!query || searchable.includes(query)) &&
      (filters.pattern === "all" || product.patternName === filters.pattern) &&
      (filters.joint === "all" || product.joint === filters.joint)
    );
  });
}

export function groupStoneProducts(products: readonly StoneProduct[]): StonePatternFamily[] {
  const families = new Map<string, StonePatternFamily>();
  for (const product of products) {
    const existing = families.get(product.patternName);
    if (existing) {
      existing.products.push(product);
    } else {
      families.set(product.patternName, {
        name: product.patternName,
        patternCode: product.patternCode,
        joint: product.joint,
        products: [product],
      });
    }
  }
  return [...families.values()];
}

export function getStonePatternFamily(products: readonly StoneProduct[], stoneId: string) {
  const selected = products.find((product) => product.id === stoneId);
  return selected
    ? groupStoneProducts(
        products.filter((product) => product.patternName === selected.patternName),
      )[0]
    : undefined;
}
