import { describe, expect, it } from "vitest";
import { CURRENT_CATALOG_INTAKES, summarizeIntakeRegistry } from "@/catalog/intakeRegistry";
import { catalogIntakeRegistrySchema, catalogIntakeSchema } from "@/catalog/intakeSchema";
import { MAJESTIC_CURRENT_INTAKE } from "@/catalog/intakes/majestic-2026.07.31";
import { SUPERIOR_CURRENT_INTAKE } from "@/catalog/intakes/superior-2026.07.31";

describe("manufacturer-neutral catalog intake registry", () => {
  it("indexes FPX, Superior, and Majestic without publishing queued products", () => {
    const summary = summarizeIntakeRegistry();
    expect(summary).toMatchObject({
      totalFamilies: 85,
      approvedCatalogProducts: 3,
      remainingFamilies: 83,
    });
    expect(summary.brands.map((brand) => brand.brandId)).toEqual([
      "fireplace-xtrordinair",
      "superior-fireplaces",
      "majestic",
    ]);
    expect(
      CURRENT_CATALOG_INTAKES.flatMap((snapshot) => snapshot.products)
        .filter((product) => product.stage !== "approved")
        .every((product) => product.approvedCatalogIds.length === 0),
    ).toBe(true);
  });

  it("prioritizes current official insert families for room-design intake", () => {
    const superiorInserts = SUPERIOR_CURRENT_INTAKE.products.filter(
      (product) => product.applianceType === "insert",
    );
    const majesticInserts = MAJESTIC_CURRENT_INTAKE.products.filter(
      (product) => product.applianceType === "insert",
    );
    expect(superiorInserts.map((product) => product.id)).toEqual(["dri2000"]);
    expect(majesticInserts.map((product) => product.id)).toEqual([
      "jasper-series",
      "ruby-series",
      "trilliant-series",
      "ruby-platinum",
    ]);
    expect(
      [...superiorInserts, ...majesticInserts].every(
        (product) =>
          product.stage === "source-indexed" && product.officialIndexUrl.startsWith("https://"),
      ),
    ).toBe(true);
  });

  it("rejects brand drift and duplicate current snapshots", () => {
    const wrongBrand = structuredClone(SUPERIOR_CURRENT_INTAKE);
    wrongBrand.products[0]!.brandId = "majestic";
    expect(() => catalogIntakeSchema.parse(wrongBrand)).toThrow(
      /does not match snapshot brand/,
    );

    expect(() =>
      catalogIntakeRegistrySchema.parse([
        ...CURRENT_CATALOG_INTAKES,
        structuredClone(MAJESTIC_CURRENT_INTAKE),
      ]),
    ).toThrow(/More than one current intake snapshot exists for majestic/);
  });

  it("supports document evidence for non-configurator brands without bypassing assets", () => {
    const verified = structuredClone(SUPERIOR_CURRENT_INTAKE);
    const dri = verified.products[0]!;
    dri.stage = "documents-verified";
    dri.evidence = {
      productSkus: ["DRI2027", "DRI2032"],
      variants: [
        {
          id: "DRI2027",
          framing: { width: 27, height: 18, depth: 15 },
        },
        {
          id: "DRI2032",
          framing: { width: 32, height: 19.5, depth: 16 },
        },
      ],
      installationManualUrl:
        "https://superiorfireplaces.us.com/products/stoves-inserts/dri2000/",
      installationManualRevision: "pending-file-revision-capture",
      clearanceRulePages: [1],
      visualOptionIds: [],
      maximumOfficialLayerPixels: 701,
      assetQualityGate: "blocked-high-resolution-master",
    };
    expect(catalogIntakeSchema.parse(verified).products[0]?.stage).toBe("documents-verified");
    dri.stage = "assets-prepared";
    expect(() => catalogIntakeSchema.parse(verified)).toThrow(
      /cannot advance with a blocked visual master/,
    );
  });
});
