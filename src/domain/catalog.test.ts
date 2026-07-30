import { describe, expect, it } from "vitest";
import {
  fireplaceProduct,
  fireplaceProductSchema,
  mantelProduct,
  mantelProductSchema,
  stoneProduct,
  stoneProductSchema,
} from "@/domain/catalog";

describe("approved product catalog", () => {
  it("validates the exact single-combination release", () => {
    expect(fireplaceProductSchema.parse(fireplaceProduct).sku).toBe("98500187");
    expect(mantelProductSchema.parse(mantelProduct).dimensions).toEqual({
      width: 60,
      height: 4,
      depth: 8,
    });
    expect(stoneProductSchema.parse(stoneProduct).colorCode).toBe("260");
  });

  it("rejects unchecked substitutions", () => {
    expect(() =>
      fireplaceProductSchema.parse({ ...fireplaceProduct, sku: "unknown" }),
    ).toThrow();
  });
});
