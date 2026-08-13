import { describe, expect, it } from "vitest";
import { stoneProducts } from "@/domain/catalog";
import {
  DEFAULT_STONE_BROWSE_FILTERS,
  filterStoneProducts,
  getStonePatternFamily,
  groupStoneProducts,
} from "@/domain/stoneCatalogBrowser";

describe("Centurion stone browser", () => {
  it("publishes every official visual swatch across every current pattern page", () => {
    expect(stoneProducts).toHaveLength(122);
    expect(groupStoneProducts(stoneProducts)).toHaveLength(39);
  });

  it("groups exact colors by pattern", () => {
    const ledge = getStonePatternFamily(stoneProducts, "kentucky-ledge");
    expect(ledge?.name).toBe("Ledge");
    expect(ledge?.products.map((product) => product.id)).toContain("brown-ledge");
  });

  it("searches names and verified codes and filters joint style", () => {
    expect(
      filterStoneProducts(stoneProducts, {
        ...DEFAULT_STONE_BROWSE_FILTERS,
        query: "150-260-15",
      }).map((product) => product.id),
    ).toEqual(["kentucky-ledge"]);
    expect(
      filterStoneProducts(stoneProducts, {
        ...DEFAULT_STONE_BROWSE_FILTERS,
        pattern: "Ledge",
        joint: "dry-stack",
      }).every((product) => product.patternName === "Ledge"),
    ).toBe(true);
  });
});
