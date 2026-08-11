import { describe, expect, it } from "vitest";
import sharp from "sharp";
import { FPX_OFFICIAL_FIREBACK_SETS } from "@/catalog/fpxFirebacks";
import { fireplaceProducts } from "@/domain/catalog";

describe("official FPX FireBuilder firebacks", () => {
  it("publishes every audited model-specific option without cross-model substitutions", () => {
    expect(FPX_OFFICIAL_FIREBACK_SETS["564-trv-25k-deluxe"]?.options).toHaveLength(8);
    expect(FPX_OFFICIAL_FIREBACK_SETS["864-tv-40k-clean-face"]?.options).toHaveLength(8);
    expect(FPX_OFFICIAL_FIREBACK_SETS["4237-ember-glo-clean-face"]?.options).toHaveLength(5);
    expect(FPX_OFFICIAL_FIREBACK_SETS["32-dvs-deluxe-ember-glo"]?.options).toHaveLength(7);
    expect(FPX_OFFICIAL_FIREBACK_SETS["616-mod-fyre"]?.options).toHaveLength(2);
    expect(FPX_OFFICIAL_FIREBACK_SETS["4237-ember-glo-deluxe"]).toBeUndefined();
  });

  it("uses exact local FireBuilder configurations for selectable firebacks", () => {
    for (const product of fireplaceProducts) {
      const officialSet = FPX_OFFICIAL_FIREBACK_SETS[product.id];
      if (!officialSet) {
        expect(product.firebackOptions).toHaveLength(1);
        expect(product.firebackOptions[0]?.renderMode).toBe("complete-composite");
        continue;
      }
      expect(product.firebackOptions).toHaveLength(officialSet.options.length);
      expect(product.defaultFirebackOptionId).toBe(officialSet.defaultFirebackId);
      expect(
        product.firebackOptions.every(
          (fireback) =>
            fireback.renderMode === "base-layer" &&
            fireback.asset.localPath.startsWith(`/assets/firebacks/${product.id}-`) &&
            fireback.asset.sourceUrl.includes(
              `${officialSet.modelSku}_${fireback.fireBuilderSku}`,
            ),
        ),
      ).toBe(true);
    }
  });

  it("only enables video on the fireback filmed in the approved source", () => {
    for (const product of fireplaceProducts.filter((item) => item.burnMedia)) {
      expect(product.burnMedia?.compatibleFirebackIds).toHaveLength(1);
      expect(
        product.firebackOptions.some(
          (fireback) => fireback.id === product.burnMedia?.compatibleFirebackIds[0],
        ),
      ).toBe(true);
    }
  });

  it("registers every model to its published glass opening", () => {
    for (const product of fireplaceProducts) {
      const officialSet = FPX_OFFICIAL_FIREBACK_SETS[product.id];
      if (!officialSet) continue;
      expect(officialSet.viewingArea).toEqual(product.viewingArea);
      for (const face of product.faceOptions) {
        expect(face.mediaWindow.width).toBeLessThanOrEqual(face.visibleFace.width);
        expect(face.mediaWindow.height).toBeLessThanOrEqual(face.visibleFace.height);
      }
    }
  });

  it("keeps every option for a model on one shared, undistorted source frame", async () => {
    for (const [productId, officialSet] of Object.entries(FPX_OFFICIAL_FIREBACK_SETS)) {
      const dimensions = await Promise.all(
        officialSet.options.map((fireback) =>
          sharp(`public/assets/firebacks/${productId}-${fireback.id}.png`).metadata(),
        ),
      );
      const reference = dimensions[0];
      expect(reference?.width).toBeGreaterThan(0);
      expect(reference?.height).toBeGreaterThan(0);
      const targetAspect = officialSet.viewingArea.width / officialSet.viewingArea.height;
      expect((reference?.width ?? 0) / (reference?.height ?? 1)).toBeCloseTo(targetAspect, 2);
      for (const dimension of dimensions) {
        expect({ width: dimension.width, height: dimension.height }).toEqual({
          width: reference?.width,
          height: reference?.height,
        });
      }
    }
  });
});
