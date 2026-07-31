import { describe, expect, it } from "vitest";
import {
  catalogIntakeSchema,
  FPX_CURRENT_INTAKE,
  summarizeCatalogIntake,
} from "@/catalog/intake";

describe("FPX catalog intake queue", () => {
  it("indexes current official families without publishing incomplete products", () => {
    const summary = summarizeCatalogIntake(FPX_CURRENT_INTAKE);
    expect(summary).toMatchObject({
      totalFamilies: 36,
      approvedCatalogProducts: 3,
      remainingFamilies: 34,
    });
    expect(summary.byStage.approved).toBe(2);
    expect(summary.byStage["documents-verified"]).toBe(2);
    expect(summary.byStage["source-indexed"]).toBe(32);
    expect(
      FPX_CURRENT_INTAKE.products
        .filter((product) => product.stage !== "approved")
        .every((product) => product.approvedCatalogIds.length === 0),
    ).toBe(true);
  });

  it("covers fireplaces and inserts across official gas, wood, and electric families", () => {
    expect(
      new Set(FPX_CURRENT_INTAKE.products.map((product) => product.applianceType)),
    ).toEqual(new Set(["fireplace", "insert"]));
    expect(new Set(FPX_CURRENT_INTAKE.products.map((product) => product.fuel))).toEqual(
      new Set(["gas", "wood", "electric"]),
    );
    expect(
      FPX_CURRENT_INTAKE.products.every(
        (product) =>
          product.productUrl.startsWith("https://www.fireplacex.com/") &&
          product.officialIndexUrl.startsWith("https://www.fireplacex.com/"),
      ),
    ).toBe(true);
  });

  it("rejects duplicate records and premature live-catalog mappings", () => {
    const duplicate = structuredClone(FPX_CURRENT_INTAKE);
    duplicate.products.push({ ...duplicate.products[0]! });
    expect(() => catalogIntakeSchema.parse(duplicate)).toThrow(/Duplicate intake product ID/);

    const premature = structuredClone(FPX_CURRENT_INTAKE);
    premature.products[0]!.approvedCatalogIds = ["864-trv-31k-clean-face"];
    expect(() => catalogIntakeSchema.parse(premature)).toThrow(
      /Unapproved intake product .* cannot map to a live catalog product/,
    );
  });

  it("holds verified 564 data behind the high-resolution visual gate", () => {
    const models = FPX_CURRENT_INTAKE.products.filter((product) =>
      product.id.startsWith("564-trv-25k"),
    );
    expect(models).toHaveLength(2);
    expect(
      models.map((product) =>
        product.evidence && "productSku" in product.evidence
          ? product.evidence.productSku
          : undefined,
      ),
    ).toEqual(["98500277", "98500278"]);
    expect(
      models.every(
        (product) =>
          product.stage === "documents-verified" &&
          product.evidence &&
          "viewingArea" in product.evidence &&
          product.evidence.viewingArea.width === 29.375 &&
          product.evidence.viewingArea.height === 16.375 &&
          product.evidence.assetQualityGate === "blocked-high-resolution-master",
      ),
    ).toBe(true);
  });
});
