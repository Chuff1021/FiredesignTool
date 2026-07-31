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
      "98500187",
      "98500186",
      "98500344",
    ]);
    expect(
      fireplaceProducts.find((product) => product.sku === "98500186")?.faceOptions,
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
    expect(APPROVED_ASSET_PATHS).toHaveLength(77);
    expect(new Set(APPROVED_ASSET_PATHS).size).toBe(APPROVED_ASSET_PATHS.length);
    expect(APPROVED_ASSET_PATHS.every((path) => path.startsWith("/assets/"))).toBe(true);
  });

  it("maps each fireplace to an approved local burn loop and matching poster", () => {
    expect(fireplaceProducts[0]?.burnMedia.video.localPath).toBe(
      fireplaceProducts[1]?.burnMedia.video.localPath,
    );
    expect(fireplaceProducts[2]?.burnMedia.video.localPath).toBe("/assets/fpx-4237-burn.mp4");
    expect(
      fireplaceProducts.every(
        (product) =>
          product.burnMedia.video.localPath.endsWith(".mp4") &&
          product.burnMedia.poster.localPath.endsWith(".webp"),
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
    expect(fireplaceProducts[2]?.burnMedia.sourceTimecode).toBe("01:42–01:54");
  });

  it("rejects unchecked substitutions", () => {
    expect(() => fireplaceProductSchema.parse({ ...fireplaceProducts[0], sku: "" })).toThrow();
    expect(() =>
      stoneProductSchema.parse({ ...stoneProducts[0], id: "Not a stable ID" }),
    ).toThrow();
  });
});
