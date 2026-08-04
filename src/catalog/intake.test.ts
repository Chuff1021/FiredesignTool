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
      approvedCatalogProducts: 7,
      remainingFamilies: 30,
    });
    expect(summary.byStage.approved).toBe(6);
    expect(summary.byStage["documents-verified"]).toBe(4);
    expect(summary.byStage["source-indexed"]).toBe(26);
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
    const queued = premature.products.find((product) => product.id === "864-tv-40k-clean-face");
    if (!queued) throw new Error("Queued intake fixture is missing");
    queued.approvedCatalogIds = ["864-trv-31k-clean-face"];
    expect(() => catalogIntakeSchema.parse(premature)).toThrow(
      /Unapproved intake product .* cannot map to a live catalog product/,
    );
  });

  it("publishes the verified 564 family through the high-resolution visual gate", () => {
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
          product.stage === "approved" &&
          product.evidence &&
          "viewingArea" in product.evidence &&
          product.evidence.viewingArea.width === 29.375 &&
          product.evidence.viewingArea.height === 16.375 &&
          product.evidence.assetQualityGate === "approved",
      ),
    ).toBe(true);
    expect(
      models.map((product) =>
        product.evidence && "maximumOfficialLayerPixels" in product.evidence
          ? product.evidence.maximumOfficialLayerPixels
          : undefined,
      ),
    ).toEqual([4603, 4603]);
    expect(
      models.every(
        (product) =>
          product.evidence &&
          "visualMaster" in product.evidence &&
          product.evidence.visualMaster.candidates[0]?.sourceUrl.includes(
            "/fbimages/LayeredImages/",
          ),
      ),
    ).toBe(true);
  });

  it("records the 616 insert opening profiles and base-referenced clearance rules", () => {
    const product = FPX_CURRENT_INTAKE.products.find(
      (candidate) => candidate.id === "616-deluxe-ember-glo",
    );
    expect(product?.stage).toBe("documents-verified");
    const evidence = product?.evidence;
    if (!evidence || !("variants" in evidence)) {
      throw new Error("616 manufacturer evidence is missing");
    }
    expect(evidence.variants).toMatchObject([
      {
        id: "one-piece-panel",
        viewingArea: { width: 27.5, height: 19.75 },
        minimumOpening: { frontWidth: 35, height: 24, depth: 16.5 },
        surroundForwardExtension: 0,
      },
      {
        id: "one-piece-panel-with-trim",
        minimumOpening: { frontWidth: 34.625, height: 23.5, depth: 15.25 },
        surroundForwardExtension: 1.25,
      },
    ]);
    expect(evidence.fireplaceInteriorClearances).toEqual({
      side: 0.5,
      back: 0.5,
      top: 0.625,
    });
    expect(evidence.clearanceRules).toMatchObject({
      mantel: {
        measurementFrom: "appliance-base",
        profiles: [
          {
            material: "combustible",
            points: [
              { projection: 4, minimumClearance: 33 },
              { projection: 12, minimumClearance: 36.5 },
            ],
          },
          {
            material: "non-combustible",
            points: [
              { projection: 4, minimumClearance: 33 },
              { projection: 12, minimumClearance: 36.5 },
            ],
          },
        ],
      },
      facing: {
        measurementFrom: "appliance-base",
        minimumSideExtent: 5,
        minimumTopExtent: 35.5,
        topMayTerminateAtMantelBottom: true,
      },
      hearth: {
        minimumThickness: 0.5,
        placementProfiles: [{ applianceElevation: 0, minimumHorizontalExtension: 0 }],
      },
    });
    expect(evidence.assetQualityGate).toBe("blocked-high-resolution-master");
    expect(evidence.maximumOfficialLayerPixels).toBe(960);
  });

  it("records the current 32 DVS opening profiles and base-referenced rules", () => {
    const product = FPX_CURRENT_INTAKE.products.find(
      (candidate) => candidate.id === "32-dvs-deluxe-ember-glo",
    );
    expect(product?.stage).toBe("documents-verified");
    const evidence = product?.evidence;
    if (!evidence || !("variants" in evidence)) {
      throw new Error("32 DVS manufacturer evidence is missing");
    }
    expect(evidence.productIdentifiers).toEqual([
      { id: "98400371", kind: "sku" },
      { id: "DVS EG GSR2", kind: "model" },
    ]);
    expect(evidence.installationManualRevision).toBe("100-01537, 7/28/2026");
    expect(evidence.variants).toMatchObject([
      {
        id: "one-piece-panel-standard-face",
        viewingArea: { width: 24.25, height: 12.75 },
        minimumOpening: {
          frontWidth: 29,
          height: 20.625,
          rearWidth: 18,
          depth: 16.375,
        },
        surroundForwardExtension: 0,
      },
      {
        id: "one-piece-panel-arched-face",
        minimumOpening: { depth: 16.875 },
      },
      {
        id: "one-piece-panel-with-trim-standard-face",
        minimumOpening: {
          frontWidth: 26.5,
          height: 19.5,
          rearWidth: 18,
          depth: 15.125,
        },
        surroundForwardExtension: 1.25,
      },
      {
        id: "one-piece-panel-with-trim-arched-face",
        minimumOpening: { depth: 15.625 },
        surroundForwardExtension: 1.25,
      },
    ]);
    expect(evidence.clearanceRules).toMatchObject({
      mantel: {
        measurementFrom: "appliance-base",
        profiles: [
          {
            material: "combustible",
            points: [
              { projection: 4, minimumClearance: 33 },
              { projection: 12, minimumClearance: 35 },
            ],
          },
          {
            material: "non-combustible",
            points: [
              { projection: 4, minimumClearance: 33 },
              { projection: 12, minimumClearance: 35 },
            ],
          },
        ],
      },
      sideWall: { measurementFrom: "appliance-side", minimumClearance: 4.5 },
      facing: {
        measurementFrom: "appliance-base",
        minimumSideExtent: 4.5,
        minimumTopExtent: 35,
        topMayTerminateAtMantelBottom: true,
      },
      hearth: {
        placementProfiles: [{ applianceElevation: 0, minimumHorizontalExtension: 0 }],
      },
    });
    expect(evidence.visualOptionIds).toContain("95300192");
    expect(evidence.visualOptionIds).toContain("94500953");
    expect(evidence.maximumOfficialLayerPixels).toBe(960);
    expect(evidence.assetQualityGate).toBe("blocked-high-resolution-master");
  });

  it("records the 430 insert fit profiles and its distinct clearance datum", () => {
    const product = FPX_CURRENT_INTAKE.products.find(
      (candidate) => candidate.id === "430-deluxe-ember-glo",
    );
    expect(product?.stage).toBe("documents-verified");
    const evidence = product?.evidence;
    if (!evidence || !("variants" in evidence)) {
      throw new Error("430 manufacturer evidence is missing");
    }
    expect(evidence.variants).toMatchObject([
      {
        id: "one-piece-panel",
        viewingArea: { width: 23, height: 16 },
        minimumOpening: { frontWidth: 30.5, height: 20.25, depth: 15.5 },
        surroundForwardExtension: 0,
      },
      {
        id: "one-piece-panel-with-trim",
        minimumOpening: { frontWidth: 30.25, height: 19.75, depth: 14.25 },
        surroundForwardExtension: 1.25,
      },
    ]);
    expect(evidence.fireplaceInteriorClearances).toEqual({
      side: 0.5,
      back: 0.5,
      top: 0.75,
    });
    expect(evidence.clearanceRules).toMatchObject({
      mantel: {
        measurementFrom: "appliance-base",
        profiles: [
          {
            material: "combustible",
            points: [
              { projection: 4, minimumClearance: 33.5 },
              { projection: 12, minimumClearance: 34.5 },
            ],
          },
          {
            material: "non-combustible",
            points: [
              { projection: 4, minimumClearance: 33.5 },
              { projection: 12, minimumClearance: 34.5 },
            ],
          },
        ],
      },
      sideWall: { measurementFrom: "appliance-side", minimumClearance: 5 },
      facing: {
        minimumSideExtent: 3.375,
        minimumTopExtent: 32.375,
        topMayTerminateAtMantelBottom: true,
      },
    });
    expect(evidence.visualOptionIds).toContain("96800705");
    expect(evidence.assetQualityGate).toBe("blocked-high-resolution-master");
  });

  it("preserves the 34 DVL face-dependent depth and trim fit profiles", () => {
    const product = FPX_CURRENT_INTAKE.products.find(
      (candidate) => candidate.id === "34-dvl-deluxe-ember-glo",
    );
    expect(product?.stage).toBe("documents-verified");
    const evidence = product?.evidence;
    if (!evidence || !("variants" in evidence)) {
      throw new Error("34 DVL manufacturer evidence is missing");
    }
    expect(evidence.productIdentifiers).toEqual([
      { id: "98400376", kind: "sku" },
      { id: "DVL EG GSR2", kind: "model" },
    ]);
    expect(evidence.variants).toMatchObject([
      {
        id: "one-piece-panel-standard-face",
        viewingArea: { width: 27, height: 16.125 },
        minimumOpening: {
          frontWidth: 32.5,
          height: 24.875,
          rearWidth: 20,
          depth: 15.75,
        },
        surroundForwardExtension: 0,
      },
      {
        id: "one-piece-panel-arched-face",
        minimumOpening: { depth: 16.25 },
      },
      {
        id: "one-piece-panel-with-trim-standard-face",
        minimumOpening: {
          frontWidth: 31.5,
          height: 23.75,
          rearWidth: 20,
          depth: 14.5,
        },
        surroundForwardExtension: 1.25,
      },
      {
        id: "one-piece-panel-with-trim-arched-face",
        minimumOpening: { depth: 15 },
        surroundForwardExtension: 1.25,
      },
    ]);
    expect(evidence.clearanceRules).toMatchObject({
      mantel: {
        measurementFrom: "appliance-base",
        profiles: [
          {
            material: "combustible",
            points: [
              { projection: 4, minimumClearance: 33 },
              { projection: 12, minimumClearance: 35.5 },
            ],
          },
          {
            material: "non-combustible",
            points: [
              { projection: 4, minimumClearance: 33 },
              { projection: 12, minimumClearance: 35.5 },
            ],
          },
        ],
      },
      sideWall: { measurementFrom: "appliance-side", minimumClearance: 4 },
      facing: {
        measurementFrom: "appliance-base",
        minimumSideExtent: 4,
        minimumTopExtent: 35.5,
        topMayTerminateAtMantelBottom: true,
      },
      hearth: {
        placementProfiles: [{ applianceElevation: 0, minimumHorizontalExtension: 0 }],
      },
    });
    expect(evidence.visualOptionIds).toContain("95300591");
    expect(evidence.visualOptionIds).toContain("94500958");
    expect(evidence.maximumOfficialLayerPixels).toBe(960);
    expect(evidence.assetQualityGate).toBe("blocked-high-resolution-master");
  });

  it("cannot approve a visual master that fails its recorded 4K requirements", () => {
    const intake = structuredClone(FPX_CURRENT_INTAKE);
    const product = intake.products.find(
      (candidate) => candidate.id === "564-trv-25k-clean-face",
    );
    const evidence = product?.evidence;
    if (!evidence || !("visualMaster" in evidence)) {
      throw new Error("Visual master evidence is missing");
    }
    const candidate = evidence.visualMaster.candidates[0]!;
    candidate.transparentMediaOpening = false;
    expect(() => catalogIntakeSchema.parse(intake)).toThrow(
      /cannot be approved without a qualifying recorded candidate/,
    );

    candidate.transparentMediaOpening = true;
    expect(catalogIntakeSchema.parse(intake)).toBeTruthy();

    evidence.maximumOfficialLayerPixels = 4602;
    expect(() => catalogIntakeSchema.parse(intake)).toThrow(
      /must match the largest recorded candidate edge/,
    );
  });
});
