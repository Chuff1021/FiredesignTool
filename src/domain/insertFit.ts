import { z } from "zod";
import type { CatalogIntakeProduct } from "@/catalog/intakeSchema";

const measuredDimensionSchema = z.number().positive().max(240).nullable();

export const insertOpeningMeasurementsSchema = z.object({
  frontWidth: measuredDimensionSchema,
  height: measuredDimensionSchema,
  rearWidth: measuredDimensionSchema,
  depth: measuredDimensionSchema,
});

export type InsertOpeningMeasurements = z.infer<typeof insertOpeningMeasurementsSchema>;
export type InsertFitDimension = keyof InsertOpeningMeasurements;

export type InsertFitProfile = {
  productId: string;
  model: string;
  variantId: string;
  minimumOpening: {
    frontWidth: number;
    height: number;
    rearWidth?: number;
    depth: number;
  };
  surroundForwardExtension: number;
};

export type InsertFitComparison = {
  dimension: InsertFitDimension;
  available: number;
  required: number;
  margin: number;
};

export type InsertFitResult = {
  profile: InsertFitProfile;
  status: "fits-measured-opening" | "does-not-fit" | "needs-measurements";
  comparisons: InsertFitComparison[];
  deficits: InsertFitComparison[];
  missingMeasurements: InsertFitDimension[];
};

export type InsertFitSummary = {
  status: "fits-measured-opening" | "does-not-fit" | "needs-measurements" | "unavailable";
  passingProfiles: number;
  failedProfiles: number;
  pendingProfiles: number;
};

const dimensionOrder: InsertFitDimension[] = ["frontWidth", "height", "rearWidth", "depth"];

function roundToThousandth(value: number): number {
  return Math.round(value * 1000) / 1000;
}

export function listInsertFitProfiles(product: CatalogIntakeProduct): InsertFitProfile[] {
  if (
    product.applianceType !== "insert" ||
    !product.evidence ||
    !("variants" in product.evidence)
  ) {
    return [];
  }

  return product.evidence.variants.flatMap((variant) =>
    variant.minimumOpening
      ? [
          {
            productId: product.id,
            model: product.model,
            variantId: variant.id,
            minimumOpening: variant.minimumOpening,
            surroundForwardExtension: variant.surroundForwardExtension ?? 0,
          },
        ]
      : [],
  );
}

export function screenInsertFit(
  candidate: InsertOpeningMeasurements,
  profile: InsertFitProfile,
): InsertFitResult {
  const measurements = insertOpeningMeasurementsSchema.parse(candidate);
  const comparisons: InsertFitComparison[] = [];
  const missingMeasurements: InsertFitDimension[] = [];

  dimensionOrder.forEach((dimension) => {
    const required = profile.minimumOpening[dimension];
    if (required === undefined) return;
    const available = measurements[dimension];
    if (available === null) {
      missingMeasurements.push(dimension);
      return;
    }
    comparisons.push({
      dimension,
      available,
      required,
      margin: roundToThousandth(available - required),
    });
  });

  const deficits = comparisons.filter((comparison) => comparison.margin < 0);
  const status =
    deficits.length > 0
      ? "does-not-fit"
      : missingMeasurements.length > 0
        ? "needs-measurements"
        : "fits-measured-opening";

  return { profile, status, comparisons, deficits, missingMeasurements };
}

export function screenInsertProduct(
  opening: InsertOpeningMeasurements,
  product: CatalogIntakeProduct,
): InsertFitResult[] {
  return listInsertFitProfiles(product).map((profile) => screenInsertFit(opening, profile));
}

export function summarizeInsertFitResults(results: InsertFitResult[]): InsertFitSummary {
  const passingProfiles = results.filter(
    (result) => result.status === "fits-measured-opening",
  ).length;
  const failedProfiles = results.filter((result) => result.status === "does-not-fit").length;
  const pendingProfiles = results.filter(
    (result) => result.status === "needs-measurements",
  ).length;
  const status =
    results.length === 0
      ? "unavailable"
      : passingProfiles > 0
        ? "fits-measured-opening"
        : pendingProfiles > 0
          ? "needs-measurements"
          : "does-not-fit";
  return { status, passingProfiles, failedProfiles, pendingProfiles };
}
