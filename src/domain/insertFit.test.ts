import { describe, expect, it } from "vitest";
import { FPX_CURRENT_INTAKE } from "@/catalog/intake";
import {
  insertOpeningMeasurementsSchema,
  listInsertFitProfiles,
  screenInsertFit,
  screenInsertProduct,
  summarizeInsertFitResults,
} from "@/domain/insertFit";

function intakeProduct(id: string) {
  const product = FPX_CURRENT_INTAKE.products.find((candidate) => candidate.id === id);
  if (!product) throw new Error(`Missing intake fixture: ${id}`);
  return product;
}

describe("insert fit screening", () => {
  it("requires positive physical measurements and allows explicitly unknown values", () => {
    expect(
      insertOpeningMeasurementsSchema.parse({
        frontWidth: 36,
        height: 28,
        rearWidth: null,
        depth: null,
      }),
    ).toBeTruthy();
    expect(() =>
      insertOpeningMeasurementsSchema.parse({
        frontWidth: 0,
        height: 28,
        rearWidth: 24,
        depth: 16,
      }),
    ).toThrow();
  });

  it("never reports a fit while a profile-required field measurement is missing", () => {
    const profile = listInsertFitProfiles(intakeProduct("34-dvl-deluxe-ember-glo"))[0]!;
    const result = screenInsertFit(
      { frontWidth: 33, height: 25, rearWidth: null, depth: null },
      profile,
    );
    expect(result.status).toBe("needs-measurements");
    expect(result.missingMeasurements).toEqual(["rearWidth", "depth"]);
    expect(result.deficits).toEqual([]);
  });

  it("rules out a known undersized dimension even when another measurement is missing", () => {
    const profile = listInsertFitProfiles(intakeProduct("34-dvl-deluxe-ember-glo"))[0]!;
    const result = screenInsertFit(
      { frontWidth: 32, height: 25, rearWidth: 20, depth: null },
      profile,
    );
    expect(result.status).toBe("does-not-fit");
    expect(result.deficits).toEqual([
      { dimension: "frontWidth", available: 32, required: 32.5, margin: -0.5 },
    ]);
    expect(result.missingMeasurements).toEqual(["depth"]);
  });

  it("distinguishes 32 DVS standard, arched, and trimmed depth profiles", () => {
    const results = screenInsertProduct(
      { frontWidth: 29, height: 20.625, rearWidth: 18, depth: 16.5 },
      intakeProduct("32-dvs-deluxe-ember-glo"),
    );
    expect(results.map(({ profile, status }) => [profile.variantId, status])).toEqual([
      ["one-piece-panel-standard-face", "fits-measured-opening"],
      ["one-piece-panel-arched-face", "does-not-fit"],
      ["one-piece-panel-with-trim-standard-face", "fits-measured-opening"],
      ["one-piece-panel-with-trim-arched-face", "fits-measured-opening"],
    ]);
    expect(results[1]!.deficits).toEqual([
      { dimension: "depth", available: 16.5, required: 16.875, margin: -0.375 },
    ]);
  });

  it("accepts a profile at its exact published minimum with zero margins", () => {
    const profile = listInsertFitProfiles(intakeProduct("34-dvl-deluxe-ember-glo"))[0]!;
    const result = screenInsertFit(
      { frontWidth: 32.5, height: 24.875, rearWidth: 20, depth: 15.75 },
      profile,
    );
    expect(result.status).toBe("fits-measured-opening");
    expect(result.comparisons.every((comparison) => comparison.margin === 0)).toBe(true);
  });

  it("does not expose fit profiles for a non-insert intake product", () => {
    expect(listInsertFitProfiles(intakeProduct("564-trv-25k-clean-face"))).toEqual([]);
  });

  it("summarizes the safest overall result without hiding failed variants", () => {
    const complete = screenInsertProduct(
      { frontWidth: 29, height: 20.625, rearWidth: 18, depth: 16.5 },
      intakeProduct("32-dvs-deluxe-ember-glo"),
    );
    expect(summarizeInsertFitResults(complete)).toEqual({
      status: "fits-measured-opening",
      passingProfiles: 3,
      failedProfiles: 1,
      pendingProfiles: 0,
    });

    const incomplete = screenInsertProduct(
      { frontWidth: 29, height: 20.625, rearWidth: null, depth: null },
      intakeProduct("32-dvs-deluxe-ember-glo"),
    );
    expect(summarizeInsertFitResults(incomplete).status).toBe("needs-measurements");
    expect(summarizeInsertFitResults([]).status).toBe("unavailable");
  });
});
