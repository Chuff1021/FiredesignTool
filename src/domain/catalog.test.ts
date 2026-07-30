import { describe, expect, it } from "vitest";
import {
  ALL_ASSET_PATHS,
  fireplaceProductSchema,
  fireplaceProducts,
  mantelFinishes,
  mantelProducts,
  stoneProductSchema,
  stoneProducts,
} from "@/domain/catalog";

describe("approved product catalog", () => {
  it("validates the expanded manufacturer catalog", () => {
    expect(fireplaceProducts.map((product) => product.sku)).toEqual([
      "98500187",
      "98500186",
      "98500344",
    ]);
    expect(
      fireplaceProducts.find((product) => product.sku === "98500186")?.faceOptions,
    ).toHaveLength(4);
    expect(mantelProducts.map((product) => product.id)).toEqual([
      "zachary-smooth",
      "zachary-wood",
      "linear",
    ]);
    expect(
      mantelProducts
        .find((product) => product.id === "zachary-smooth")
        ?.sizes.map((size) => size.width),
    ).toEqual([48, 60, 72, 84]);
    expect(mantelFinishes.map((finish) => finish.id)).toEqual([
      "whitewash",
      "graywash",
      "little-river",
      "pearl",
      "graphite",
      "mocha",
      "onyx",
      "saddle",
    ]);
    expect(stoneProducts.map((stone) => stone.productCode)).toEqual([
      "150-260-15",
      "150-200-25",
    ]);
  });

  it("keeps every runtime asset local, unique, and readiness-gated", () => {
    expect(ALL_ASSET_PATHS).toHaveLength(38);
    expect(new Set(ALL_ASSET_PATHS).size).toBe(ALL_ASSET_PATHS.length);
    expect(ALL_ASSET_PATHS.every((path) => path.startsWith("/assets/"))).toBe(true);
  });

  it("rejects unchecked substitutions", () => {
    expect(() => fireplaceProductSchema.parse({ ...fireplaceProducts[0], sku: "" })).toThrow();
    expect(() =>
      stoneProductSchema.parse({ ...stoneProducts[0], manufacturer: "Generic Stone" }),
    ).toThrow();
  });
});
