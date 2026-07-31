import { describe, expect, it } from "vitest";
import deliveryExample from "../../examples/visual-delivery.manifest.json";
import { visualDeliveryManifestSchema } from "@/catalog/visualDelivery";

const digest = "a".repeat(64);

function validManifest() {
  return {
    schemaVersion: 1 as const,
    deliveryId: "travis-2026-08-01-864",
    deliveredAt: "2026-08-01T12:00:00.000Z",
    deliveredBy: "Travis Industries media team",
    permission: {
      rightsHolder: "Travis Industries",
      writtenApprovalReference: "dealer-media-approval-2026-08-01.pdf",
      evidenceFile: "permissions/dealer-media-approval-2026-08-01.pdf",
      evidenceSha256: digest,
      offlinePackagingApproved: true as const,
      customerConceptExportApproved: true as const,
    },
    assets: [
      {
        id: "864-clean-face-base",
        kind: "raster" as const,
        role: "appliance" as const,
        file: "raster/864-clean-face-base.png",
        sha256: digest,
        sourceReference: "Travis delivery 2026-08-01",
        identity: {
          brandId: "fireplace-xtrordinair",
          productId: "864-trv-31k-clean-face",
          model: "864 TRV 31K Clean Face Deluxe",
          skus: ["98500187"],
        },
        registrationGroup: "864-clean-face",
        minimumWidth: 2400,
        minimumHeight: 1800,
        declaredColorSpace: "sRGB" as const,
        requireEmbeddedIcc: true,
        requireTransparentBackground: true,
        opening: { left: 500, top: 400, width: 1400, height: 900 },
      },
    ],
  };
}

describe("visual delivery manifest", () => {
  it("keeps the manufacturer-facing example synchronized with the runtime contract", () => {
    expect(visualDeliveryManifestSchema.parse(deliveryExample).assets).toHaveLength(3);
  });

  it("accepts an identified, authorized, measurable raster delivery", () => {
    expect(visualDeliveryManifestSchema.parse(validManifest()).assets[0]).toMatchObject({
      kind: "raster",
      minimumWidth: 2400,
      minimumHeight: 1800,
      opening: { minimumTransparentRatio: 0.95 },
    });
  });

  it("rejects missing export authority and paths outside the delivery", () => {
    const manifest = validManifest();
    manifest.permission.customerConceptExportApproved = false as true;
    manifest.assets[0]!.file = "../uncontrolled.png";
    expect(() => visualDeliveryManifestSchema.parse(manifest)).toThrow();
  });

  it("requires visible front layers to declare the calibrated glass opening", () => {
    const manifest = validManifest();
    delete (manifest.assets[0] as Partial<(typeof manifest.assets)[number]>).opening;
    expect(() => visualDeliveryManifestSchema.parse(manifest)).toThrow(
      /requires calibrated transparent firebox-opening bounds/,
    );
  });

  it("rejects duplicate asset identities and files", () => {
    const manifest = validManifest();
    manifest.assets.push(structuredClone(manifest.assets[0]!));
    expect(() => visualDeliveryManifestSchema.parse(manifest)).toThrow(/Duplicate delivery/);
  });

  it("accepts CAD only with explicit geometry orientation and native units", () => {
    const rasterManifest = validManifest();
    const manifest = {
      ...rasterManifest,
      assets: [
        {
          id: "864-visible-cad",
          kind: "cad-bim",
          format: "step",
          file: "cad/864-visible.step",
          sha256: digest,
          sourceReference: "Travis engineering export 2026-08-01",
          identity: rasterManifest.assets[0]!.identity,
          nativeUnits: "inches",
          frontDirection: "+Y",
          productOrigin: "center of appliance base",
          installationDatum: "finished appliance base",
          visibleObjects: ["face", "glass", "firebox"],
          materialsIncluded: true,
          texturesIncluded: true,
        },
      ],
    };
    expect(visualDeliveryManifestSchema.parse(manifest).assets[0]).toMatchObject({
      kind: "cad-bim",
      nativeUnits: "inches",
    });
  });
});
