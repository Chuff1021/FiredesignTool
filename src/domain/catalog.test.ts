import { describe, expect, it } from "vitest";
import {
  fireplaceProductSchema,
  fireplaceProducts,
  mantelFinishes,
  mantelProducts,
  stoneProductSchema,
  stoneProducts,
} from "@/domain/catalog";
import { APPROVED_ASSET_PATHS } from "@/domain/catalogRepository";

describe("approved product catalog", () => {
  it("validates the expanded manufacturer catalog", () => {
    expect(fireplaceProducts.map((product) => product.sku)).toEqual([
      "98500277",
      "98500278",
      "98500297",
      "98500298",
      "98500187",
      "98500186",
      "98500344",
      "98500189",
      "98500188",
      "98500343",
      "98500328",
      "98500334",
      "98500222",
      "98500223",
      "98500231",
      "98500237",
      "98500232",
      "98500264",
      "98500268",
      "98500263",
      "98500266",
      "98400371",
      "98400113",
      "98400114",
      "98400376",
      "98400120",
      "98400121",
    ]);
    expect(
      fireplaceProducts.find((product) => product.sku === "98500186")?.faceOptions,
    ).toHaveLength(4);
    expect(
      fireplaceProducts.find((product) => product.sku === "98500277")?.faceOptions,
    ).toHaveLength(4);
    expect(mantelProducts.map((product) => product.id)).toEqual([
      "zachary-smooth",
      "zachary-wood",
      "linear",
      "tavern",
      "natural-cut-stone",
    ]);
    expect(
      mantelProducts
        .find((product) => product.id === "zachary-smooth")
        ?.sizes.map((size) => size.width),
    ).toEqual([48, 60, 72, 84]);
    expect(mantelFinishes.map((finish) => finish.id)).toEqual([
      "whitewash",
      "graywash",
      "little-river",
      "pearl",
      "graphite",
      "mocha",
      "onyx",
      "saddle",
      "tavern-fieldstone",
      "tavern-river-rock",
      "tavern-toasted-rye",
      "tavern-wheat",
      "cut-stone-mist",
      "cut-stone-dusk",
      "cut-stone-arctic-blast",
      "cut-stone-greystone",
    ]);
    expect(stoneProducts.map((stone) => stone.productCode)).toEqual([
      "150-260-15",
      "150-200-25",
    ]);
  });

  it("keeps every runtime asset local, unique, and readiness-gated", () => {
    expect(APPROVED_ASSET_PATHS).toHaveLength(123);
    expect(new Set(APPROVED_ASSET_PATHS).size).toBe(APPROVED_ASSET_PATHS.length);
    expect(APPROVED_ASSET_PATHS.every((path) => path.startsWith("/assets/"))).toBe(true);
  });

  it("maps each fireplace to an approved local burn loop and matching poster", () => {
    expect(
      fireplaceProducts.find((product) => product.id === "564-trv-25k-deluxe")?.burnMedia?.video
        .localPath,
    ).toBe(
      fireplaceProducts.find((product) => product.id === "564-trv-25k-clean-face")?.burnMedia
        ?.video.localPath,
    );
    expect(
      fireplaceProducts.find((product) => product.id === "4237-ember-glo-clean-face")?.burnMedia
        ?.video.localPath,
    ).toBe("/assets/fpx-4237-burn.mp4");
    expect(
      fireplaceProducts.every(
        (product) =>
          !product.burnMedia ||
          (product.burnMedia.video.localPath.endsWith(".mp4") &&
            product.burnMedia.poster.localPath.endsWith(".webp")),
      ),
    ).toBe(true);
    expect(
      fireplaceProducts.every((product) =>
        product.faceOptions.every(
          (face) =>
            face.maskAsset.localPath.endsWith(".png") &&
            face.mediaWindow.width <= face.visibleFace.width &&
            face.mediaWindow.height <= face.visibleFace.height,
        ),
      ),
    ).toBe(true);
    expect(
      fireplaceProducts.find((product) => product.id === "4237-ember-glo-clean-face")?.burnMedia
        ?.sourceTimecode,
    ).toBe("02:23–02:29");
  });

  it("registers only the oblique 564 25K media without shifting fireplace geometry", () => {
    const designer = fireplaceProducts.find((product) => product.id === "564-trv-25k-deluxe");
    const cleanFace = fireplaceProducts.find(
      (product) => product.id === "564-trv-25k-clean-face",
    );
    expect(designer?.burnMedia?.registration).toEqual({
      repeatX: 0.88,
      repeatY: 1,
      offsetX: 0,
      offsetY: 0,
    });
    expect(cleanFace?.burnMedia?.registration).toEqual(designer?.burnMedia?.registration);
    expect(
      fireplaceProducts.find((product) => product.id === "564-tv-35k-clean-face")?.burnMedia
        ?.registration,
    ).toEqual({ repeatX: 1, repeatY: 1, offsetX: 0, offsetY: 0 });
  });

  it("rejects unchecked substitutions", () => {
    expect(() => fireplaceProductSchema.parse({ ...fireplaceProducts[0], sku: "" })).toThrow();
    expect(() =>
      stoneProductSchema.parse({ ...stoneProducts[0], id: "Not a stable ID" }),
    ).toThrow();
  });
});
