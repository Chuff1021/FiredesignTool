import { z } from "zod";
import { catalogRepository } from "@/domain/catalogRepository";

export const intakeStageSchema = z.enum([
  "source-indexed",
  "documents-verified",
  "assets-prepared",
  "visual-qa",
  "approved",
]);

export const applianceTypeSchema = z.enum(["fireplace", "insert"]);
export const fuelSchema = z.enum(["gas", "wood", "electric"]);
export const styleSchema = z.enum(["traditional", "linear", "portrait", "see-through"]);
export const ventingSchema = z.enum([
  "direct-vent",
  "b-vent",
  "vent-free",
  "natural-draft",
  "electric",
  "unknown",
]);

const assetQualityGateSchema = z.enum(["blocked-high-resolution-master", "approved"]);

const visualMasterSchema = z.object({
  requirement: z.object({
    minimumWidth: z.number().int().positive(),
    minimumHeight: z.number().int().positive(),
    requiresIsolation: z.boolean(),
    requiresTransparentMediaOpening: z.boolean(),
  }),
  candidates: z
    .array(
      z.object({
        id: z.string().min(1),
        sourceUrl: z.string().url(),
        kind: z.enum(["configurator-layer", "isolated-product", "lifestyle", "cad-bim"]),
        width: z.number().int().positive(),
        height: z.number().int().positive(),
        isolated: z.boolean(),
        transparentMediaOpening: z.boolean(),
      }),
    )
    .min(1),
});

type VisualGateEvidence = z.infer<typeof visualMasterSchema> & {
  maximumOfficialLayerPixels: number;
  assetQualityGate: z.infer<typeof assetQualityGateSchema>;
};

function validateVisualGate(evidence: VisualGateEvidence, context: z.RefinementCtx): void {
  const largestCandidateEdge = Math.max(
    ...evidence.candidates.flatMap((candidate) => [candidate.width, candidate.height]),
  );
  if (largestCandidateEdge !== evidence.maximumOfficialLayerPixels) {
    context.addIssue({
      code: "custom",
      message: "Maximum official layer pixels must match the largest recorded candidate edge",
      path: ["maximumOfficialLayerPixels"],
    });
  }
  const requirement = evidence.requirement;
  const qualifyingCandidate = evidence.candidates.some(
    (candidate) =>
      candidate.width >= requirement.minimumWidth &&
      candidate.height >= requirement.minimumHeight &&
      (!requirement.requiresIsolation || candidate.isolated) &&
      (!requirement.requiresTransparentMediaOpening || candidate.transparentMediaOpening),
  );
  if (evidence.assetQualityGate === "approved" && !qualifyingCandidate) {
    context.addIssue({
      code: "custom",
      message: "Visual master cannot be approved without a qualifying recorded candidate",
      path: ["assetQualityGate"],
    });
  }
}

const clearancePointSchema = z.object({
  projection: z.number().nonnegative(),
  minimumClearance: z.number().nonnegative(),
});

const mantelClearanceProfileSchema = z
  .object({
    material: z.enum(["combustible", "non-combustible"]),
    points: z.array(clearancePointSchema).min(1),
  })
  .superRefine((profile, context) => {
    profile.points.forEach((point, index) => {
      const previous = profile.points[index - 1];
      if (previous && point.projection <= previous.projection) {
        context.addIssue({
          code: "custom",
          message: "Mantel projection points must be strictly increasing",
          path: ["points", index, "projection"],
        });
      }
      if (previous && point.minimumClearance < previous.minimumClearance) {
        context.addIssue({
          code: "custom",
          message: "Mantel clearance cannot decrease as projection increases",
          path: ["points", index, "minimumClearance"],
        });
      }
    });
  });

const clearanceRulesSchema = z.object({
  mantel: z
    .object({
      measurementFrom: z.enum(["appliance-base", "top-of-surround-opening"]),
      profiles: z.array(mantelClearanceProfileSchema).min(1),
    })
    .superRefine((mantel, context) => {
      const materials = new Set<string>();
      mantel.profiles.forEach((profile, index) => {
        if (materials.has(profile.material)) {
          context.addIssue({
            code: "custom",
            message: `Duplicate mantel material profile: ${profile.material}`,
            path: ["profiles", index, "material"],
          });
        }
        materials.add(profile.material);
      });
    }),
  sideWall: z
    .object({
      measurementFrom: z.enum(["appliance-side", "surround-opening-edge"]),
      minimumClearance: z.number().nonnegative(),
    })
    .optional(),
  facing: z
    .object({
      measurementFrom: z.literal("appliance-base"),
      minimumSideExtent: z.number().nonnegative(),
      minimumTopExtent: z.number().nonnegative(),
      topMayTerminateAtMantelBottom: z.boolean(),
    })
    .optional(),
  hearth: z
    .object({
      measurementFrom: z.literal("appliance-base"),
      placementProfiles: z
        .array(
          z.object({
            applianceElevation: z.number().nonnegative(),
            minimumHorizontalExtension: z.number().nonnegative(),
          }),
        )
        .min(1)
        .optional(),
      minimumThickness: z.number().positive().optional(),
      minimumWidth: z.number().positive().optional(),
      maximumRaisedHeight: z.number().positive().optional(),
      minimumRValue: z.number().positive().optional(),
      minimumFrontGap: z.number().nonnegative().optional(),
      minimumApplianceFloorGap: z.number().nonnegative().optional(),
      mustRemainBelowSurround: z.boolean().optional(),
    })
    .optional(),
});

const configuratorEvidenceSchema = z
  .object({
    productSku: z.string().min(1),
    fireBuilderProductId: z.number().int().positive(),
    fireBuilderModelId: z.number().int().positive(),
    viewingArea: z.object({
      width: z.number().positive(),
      height: z.number().positive(),
    }),
    installationManualUrl: z.string().url(),
    installationManualRevision: z.string().min(1),
    mantelRulePage: z.number().int().positive(),
    visualOptionSkus: z.array(z.string().min(1)).min(1),
    visualMaster: visualMasterSchema,
    maximumOfficialLayerPixels: z.number().int().positive(),
    assetQualityGate: assetQualityGateSchema,
  })
  .superRefine((evidence, context) =>
    validateVisualGate(
      {
        ...evidence.visualMaster,
        maximumOfficialLayerPixels: evidence.maximumOfficialLayerPixels,
        assetQualityGate: evidence.assetQualityGate,
      },
      context,
    ),
  );

const manufacturerEvidenceSchema = z
  .object({
    productIdentifiers: z
      .array(
        z.object({
          id: z.string().min(1),
          kind: z.enum(["sku", "catalog-number", "model"]),
        }),
      )
      .min(1),
    variants: z
      .array(
        z.object({
          id: z.string().min(1),
          viewingArea: z
            .object({ width: z.number().positive(), height: z.number().positive() })
            .optional(),
          framing: z
            .object({
              width: z.number().positive(),
              height: z.number().positive(),
              depth: z.number().positive(),
            })
            .optional(),
          minimumOpening: z
            .object({
              frontWidth: z.number().positive(),
              height: z.number().positive(),
              rearWidth: z.number().positive().optional(),
              depth: z.number().positive(),
              frontWidthRequiredDepth: z.number().positive().optional(),
            })
            .optional(),
          surroundForwardExtension: z.number().nonnegative().optional(),
        }),
      )
      .min(1),
    fireplaceInteriorClearances: z
      .object({
        side: z.number().nonnegative(),
        back: z.number().nonnegative(),
        top: z.number().nonnegative(),
      })
      .optional(),
    installationManualUrl: z.string().url(),
    installationManualRevision: z.string().min(1),
    dimensionPages: z.array(z.number().int().positive()).min(1),
    clearanceRulePages: z.array(z.number().int().positive()).min(1),
    clearanceRules: clearanceRulesSchema,
    optionPages: z.array(z.number().int().positive()),
    visualOptionIds: z.array(z.string().min(1)),
    visualSourceUrls: z.array(z.string().url()).min(1),
    visualMaster: visualMasterSchema,
    maximumOfficialLayerPixels: z.number().int().positive(),
    assetQualityGate: assetQualityGateSchema,
  })
  .superRefine((evidence, context) =>
    validateVisualGate(
      {
        ...evidence.visualMaster,
        maximumOfficialLayerPixels: evidence.maximumOfficialLayerPixels,
        assetQualityGate: evidence.assetQualityGate,
      },
      context,
    ),
  );

export const intakeProductSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  brandId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  model: z.string().min(1),
  applianceType: applianceTypeSchema,
  fuel: fuelSchema,
  style: styleSchema,
  venting: ventingSchema.default("unknown"),
  stage: intakeStageSchema,
  approvedCatalogIds: z.array(z.string()).default([]),
  productUrl: z.string().url(),
  officialIndexUrl: z.string().url(),
  sourceCheckedAt: z.string().date(),
  notes: z.string().min(1),
  evidence: z.union([configuratorEvidenceSchema, manufacturerEvidenceSchema]).optional(),
});

export const catalogIntakeSchema = z
  .object({
    schemaVersion: z.literal(2),
    snapshotId: z.string().regex(/^[a-z0-9-]+-\d{4}\.\d{2}\.\d{2}-\d+$/),
    brandId: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    brandName: z.string().min(1),
    manufacturer: z.string().min(1),
    sourceCheckedAt: z.string().date(),
    sourceUrls: z.array(z.string().url()).min(1),
    products: z.array(intakeProductSchema).min(1),
  })
  .superRefine((intake, context) => {
    const seen = new Set<string>();
    const approvedProducts = new Map(
      catalogRepository.listFireplaces().map((product) => [product.id, product]),
    );
    const mappedApprovedIds = new Set<string>();

    intake.products.forEach((product, index) => {
      if (product.sourceCheckedAt !== intake.sourceCheckedAt) {
        context.addIssue({
          code: "custom",
          message: `Product ${product.id} was not checked with snapshot ${intake.snapshotId}`,
          path: ["products", index, "sourceCheckedAt"],
        });
      }
      if (product.brandId !== intake.brandId) {
        context.addIssue({
          code: "custom",
          message: `Product ${product.id} does not match snapshot brand ${intake.brandId}`,
          path: ["products", index, "brandId"],
        });
      }
      if (seen.has(product.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate intake product ID: ${product.id}`,
          path: ["products", index, "id"],
        });
      }
      seen.add(product.id);

      if (product.stage === "approved" && product.approvedCatalogIds.length === 0) {
        context.addIssue({
          code: "custom",
          message: `Approved intake product ${product.id} has no catalog mapping`,
          path: ["products", index, "approvedCatalogIds"],
        });
      }
      if (
        product.stage !== "source-indexed" &&
        product.stage !== "approved" &&
        !product.evidence
      ) {
        context.addIssue({
          code: "custom",
          message: `Intake product ${product.id} cannot advance without verified evidence`,
          path: ["products", index, "evidence"],
        });
      }
      if (
        (product.stage === "assets-prepared" || product.stage === "visual-qa") &&
        product.evidence?.assetQualityGate !== "approved"
      ) {
        context.addIssue({
          code: "custom",
          message: `Intake product ${product.id} cannot advance with a blocked visual master`,
          path: ["products", index, "evidence", "assetQualityGate"],
        });
      }
      if (product.stage !== "approved" && product.approvedCatalogIds.length > 0) {
        context.addIssue({
          code: "custom",
          message: `Unapproved intake product ${product.id} cannot map to a live catalog product`,
          path: ["products", index, "approvedCatalogIds"],
        });
      }
      product.approvedCatalogIds.forEach((catalogId) => {
        const approved = approvedProducts.get(catalogId);
        if (!approved) {
          context.addIssue({
            code: "custom",
            message: `Unknown approved catalog ID: ${catalogId}`,
            path: ["products", index, "approvedCatalogIds"],
          });
        } else if (approved.brandId !== intake.brandId) {
          context.addIssue({
            code: "custom",
            message: `Catalog product ${catalogId} belongs to ${approved.brandId}, not ${intake.brandId}`,
            path: ["products", index, "approvedCatalogIds"],
          });
        }
        if (mappedApprovedIds.has(catalogId)) {
          context.addIssue({
            code: "custom",
            message: `Catalog product is mapped by more than one intake record: ${catalogId}`,
            path: ["products", index, "approvedCatalogIds"],
          });
        }
        mappedApprovedIds.add(catalogId);
      });
    });
  });

export const catalogIntakeRegistrySchema = z
  .array(catalogIntakeSchema)
  .min(1)
  .superRefine((snapshots, context) => {
    const snapshotIds = new Set<string>();
    const brands = new Set<string>();
    const mappedCatalogIds = new Set<string>();
    snapshots.forEach((snapshot, snapshotIndex) => {
      if (snapshotIds.has(snapshot.snapshotId)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate intake snapshot ID: ${snapshot.snapshotId}`,
          path: [snapshotIndex, "snapshotId"],
        });
      }
      snapshotIds.add(snapshot.snapshotId);
      if (brands.has(snapshot.brandId)) {
        context.addIssue({
          code: "custom",
          message: `More than one current intake snapshot exists for ${snapshot.brandId}`,
          path: [snapshotIndex, "brandId"],
        });
      }
      brands.add(snapshot.brandId);
      snapshot.products.forEach((product) =>
        product.approvedCatalogIds.forEach((catalogId) => {
          if (mappedCatalogIds.has(catalogId)) {
            context.addIssue({
              code: "custom",
              message: `Catalog product is mapped across multiple snapshots: ${catalogId}`,
              path: [snapshotIndex, "products"],
            });
          }
          mappedCatalogIds.add(catalogId);
        }),
      );
    });
    catalogRepository.listFireplaces().forEach((product) => {
      if (!mappedCatalogIds.has(product.id)) {
        context.addIssue({
          code: "custom",
          message: `Live catalog product is missing from the intake registry: ${product.id}`,
          path: [],
        });
      }
    });
  });

export type CatalogIntake = z.infer<typeof catalogIntakeSchema>;
export type CatalogIntakeProduct = z.infer<typeof intakeProductSchema>;

export function summarizeCatalogIntake(intake: CatalogIntake) {
  const byStage = Object.fromEntries(
    intakeStageSchema.options.map((stage) => [
      stage,
      intake.products.filter((product) => product.stage === stage).length,
    ]),
  ) as Record<z.infer<typeof intakeStageSchema>, number>;
  const approvedCatalogProducts = intake.products.reduce(
    (total, product) => total + product.approvedCatalogIds.length,
    0,
  );
  return {
    brandId: intake.brandId,
    totalFamilies: intake.products.length,
    approvedCatalogProducts,
    remainingFamilies: intake.products.filter((product) => product.stage !== "approved").length,
    byStage,
  };
}
