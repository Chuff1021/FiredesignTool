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
    expect(superiorInserts[0]?.stage).toBe("documents-verified");
    expect(majesticInserts.find((product) => product.id === "ruby-platinum")?.stage).toBe(
      "documents-verified",
    );
    expect(
      majesticInserts
        .filter((product) => product.id !== "ruby-platinum")
        .every((product) => product.stage === "source-indexed"),
    ).toBe(true);
    expect(
      [...superiorInserts, ...majesticInserts].every((product) =>
        product.officialIndexUrl.startsWith("https://"),
      ),
    ).toBe(true);
    const evidence = superiorInserts[0]?.evidence;
    expect(evidence && "variants" in evidence ? evidence.variants : []).toMatchObject([
      {
        id: "DRI2027",
        minimumOpening: { frontWidth: 27, height: 18, rearWidth: 17, depth: 15 },
      },
      {
        id: "DRI2032TEN",
        minimumOpening: { frontWidth: 32, height: 19.5, rearWidth: 22, depth: 16 },
      },
    ]);
    expect(evidence?.assetQualityGate).toBe("blocked-high-resolution-master");

    const rubyEvidence = majesticInserts.find(
      (product) => product.id === "ruby-platinum",
    )?.evidence;
    expect(
      rubyEvidence && "variants" in rubyEvidence ? rubyEvidence.variants : [],
    ).toMatchObject([
      {
        id: "Ruby Platinum 30",
        viewingArea: { width: 27.5, height: 15.9375 },
        minimumOpening: { frontWidth: 31.625, height: 21, rearWidth: 20.125, depth: 15 },
      },
      {
        id: "Ruby Platinum 35",
        viewingArea: { width: 32.5, height: 19.375 },
        minimumOpening: { frontWidth: 36.625, height: 24.25, rearWidth: 25.125, depth: 15 },
      },
    ]);
    expect(rubyEvidence?.assetQualityGate).toBe("blocked-high-resolution-master");
    expect(
      rubyEvidence && "clearanceRules" in rubyEvidence
        ? rubyEvidence.clearanceRules.mantel
        : undefined,
    ).toMatchObject({
      measurementFrom: "top-of-surround-opening",
      profiles: [
        { material: "combustible", points: [{ projection: 12, minimumClearance: 12 }] },
        {
          material: "non-combustible",
          points: [
            { projection: 6, minimumClearance: 6 },
            { projection: 12, minimumClearance: 12 },
          ],
        },
      ],
    });
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
      productIdentifiers: [
        { id: "DRI2027", kind: "model" },
        { id: "DRI2032", kind: "model" },
      ],
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
      dimensionPages: [13],
      clearanceRulePages: [1],
      clearanceRules: {
        mantel: {
          measurementFrom: "appliance-base",
          profiles: [
            {
              material: "combustible",
              points: [{ projection: 10, minimumClearance: 32 }],
            },
          ],
        },
      },
      optionPages: [],
      visualOptionIds: [],
      visualSourceUrls: [
        "https://superiorfireplaces.us.com/wp-content/uploads/sites/7/2021/05/Superior-dvin-dri2000_PD-1136x852-1.jpg",
      ],
      maximumOfficialLayerPixels: 701,
      assetQualityGate: "blocked-high-resolution-master",
    };
    expect(catalogIntakeSchema.parse(verified).products[0]?.stage).toBe("documents-verified");
    dri.stage = "assets-prepared";
    expect(() => catalogIntakeSchema.parse(verified)).toThrow(
      /cannot advance with a blocked visual master/,
    );
  });

  it("rejects ambiguous or unsafe clearance curves", () => {
    const invalid = structuredClone(MAJESTIC_CURRENT_INTAKE);
    const evidence = invalid.products.find(
      (product) => product.id === "ruby-platinum",
    )?.evidence;
    if (!evidence || !("clearanceRules" in evidence)) {
      throw new Error("Ruby Platinum clearance evidence is missing");
    }
    evidence.clearanceRules.mantel.profiles[1]!.points = [
      { projection: 12, minimumClearance: 12 },
      { projection: 6, minimumClearance: 6 },
    ];
    expect(() => catalogIntakeSchema.parse(invalid)).toThrow(
      /projection points must be strictly increasing/,
    );

    const duplicate = structuredClone(MAJESTIC_CURRENT_INTAKE);
    const duplicateEvidence = duplicate.products.find(
      (product) => product.id === "ruby-platinum",
    )?.evidence;
    if (!duplicateEvidence || !("clearanceRules" in duplicateEvidence)) {
      throw new Error("Ruby Platinum clearance evidence is missing");
    }
    duplicateEvidence.clearanceRules.mantel.profiles[1]!.material = "combustible";
    expect(() => catalogIntakeSchema.parse(duplicate)).toThrow(
      /Duplicate mantel material profile/,
    );
  });
});
