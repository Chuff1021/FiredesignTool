import { z } from "zod";

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/, "Expected a lowercase SHA-256 digest");

const relativeDeliveryPathSchema = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) =>
      !value.startsWith("/") &&
      !value.startsWith("\\") &&
      !/^[a-z]:/i.test(value) &&
      !value.split(/[\\/]/).includes(".."),
    "Delivery files must use a relative path contained by the package",
  );

const productIdentitySchema = z.object({
  brandId: z.string().min(1),
  productId: z.string().min(1),
  model: z.string().min(1),
  skus: z.array(z.string().min(1)).min(1),
});

const assetBaseSchema = z.object({
  id: z.string().min(1),
  file: relativeDeliveryPathSchema,
  sha256: sha256Schema,
  sourceReference: z.string().min(1),
  identity: productIdentitySchema,
  notes: z.string().min(1).optional(),
});

const openingSchema = z.object({
  left: z.number().int().nonnegative(),
  top: z.number().int().nonnegative(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  minimumTransparentRatio: z.number().min(0.95).max(1).default(0.95),
});

export const visualRasterRoleSchema = z.enum([
  "appliance",
  "face",
  "trim",
  "surround",
  "fireback",
  "logs-media",
  "screen",
  "lighting-overlay",
  "reference",
]);

const openingRequiredRoles = new Set<z.infer<typeof visualRasterRoleSchema>>([
  "appliance",
  "face",
  "trim",
  "surround",
  "screen",
  "lighting-overlay",
]);

export const visualRasterDeliveryAssetSchema = assetBaseSchema
  .extend({
    kind: z.literal("raster"),
    role: visualRasterRoleSchema,
    registrationGroup: z.string().min(1),
    minimumWidth: z.number().int().min(2400),
    minimumHeight: z.number().int().min(1800),
    declaredColorSpace: z.literal("sRGB"),
    requireEmbeddedIcc: z.boolean(),
    requireTransparentBackground: z.boolean(),
    opening: openingSchema.optional(),
  })
  .superRefine((asset, context) => {
    if (openingRequiredRoles.has(asset.role) && !asset.opening) {
      context.addIssue({
        code: "custom",
        message: `${asset.role} raster requires calibrated transparent firebox-opening bounds`,
        path: ["opening"],
      });
    }
    if (asset.role !== "reference" && !asset.requireTransparentBackground) {
      context.addIssue({
        code: "custom",
        message: "Production raster layers must require a transparent background",
        path: ["requireTransparentBackground"],
      });
    }
  });

export const visualCadFormatSchema = z.enum([
  "rfa",
  "dwg",
  "dxf",
  "step",
  "iges",
  "fbx",
  "obj",
  "glb",
  "gltf",
  "skp",
  "zip",
]);

export const visualCadDeliveryAssetSchema = assetBaseSchema.extend({
  kind: z.literal("cad-bim"),
  format: visualCadFormatSchema,
  nativeUnits: z.enum(["inches", "feet", "millimeters", "meters"]),
  frontDirection: z.string().min(1),
  productOrigin: z.string().min(1),
  installationDatum: z.string().min(1),
  visibleObjects: z.array(z.string().min(1)).min(3),
  materialsIncluded: z.boolean(),
  texturesIncluded: z.boolean(),
});

export const visualDeliveryAssetSchema = z.discriminatedUnion("kind", [
  visualRasterDeliveryAssetSchema,
  visualCadDeliveryAssetSchema,
]);

export const visualDeliveryManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    deliveryId: z.string().min(1),
    deliveredAt: z.string().datetime(),
    deliveredBy: z.string().min(1),
    permission: z.object({
      rightsHolder: z.string().min(1),
      writtenApprovalReference: z.string().min(1),
      evidenceFile: relativeDeliveryPathSchema,
      evidenceSha256: sha256Schema,
      offlinePackagingApproved: z.literal(true),
      customerConceptExportApproved: z.literal(true),
    }),
    assets: z.array(visualDeliveryAssetSchema).min(1),
  })
  .superRefine((manifest, context) => {
    const ids = new Set<string>();
    const files = new Set<string>();
    manifest.assets.forEach((asset, index) => {
      if (ids.has(asset.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate delivery asset id: ${asset.id}`,
          path: ["assets", index, "id"],
        });
      }
      if (files.has(asset.file)) {
        context.addIssue({
          code: "custom",
          message: `Delivery file is referenced more than once: ${asset.file}`,
          path: ["assets", index, "file"],
        });
      }
      ids.add(asset.id);
      files.add(asset.file);
    });
  });

export type VisualDeliveryManifest = z.infer<typeof visualDeliveryManifestSchema>;
export type VisualDeliveryAsset = z.infer<typeof visualDeliveryAssetSchema>;
export type VisualRasterDeliveryAsset = z.infer<typeof visualRasterDeliveryAssetSchema>;
