import { describe, expect, it } from "vitest";
import { FPX_CURRENT_WOOD_LINEUP } from "@/catalog/fpxWoodLineup";
import { fireplaceProducts } from "@/domain/catalog";

describe("current FPX wood fireplace lineup", () => {
  it("tracks the complete current three-model official collection", () => {
    expect(FPX_CURRENT_WOOD_LINEUP.map((product) => product.id)).toEqual([
      "42-apex-nexgen-hybrid",
      "36-elite-nexgen-hybrid",
      "44-elite-nexgen-hybrid",
    ]);
    expect(FPX_CURRENT_WOOD_LINEUP.map((product) => product.sku)).toEqual([
      "98500115",
      "98500109",
      "98500114",
    ]);
  });

  it("maps every current wood model to one approved showroom product", () => {
    const approvedWood = fireplaceProducts.filter((product) => product.fuel === "wood");
    expect(approvedWood).toHaveLength(3);
    expect(new Set(approvedWood.map((product) => product.id))).toEqual(
      new Set(FPX_CURRENT_WOOD_LINEUP.map((product) => product.id)),
    );
  });

  it("retains exact manual hearth and mantel rules by model", () => {
    const apex = fireplaceProducts.find((product) => product.id === "42-apex-nexgen-hybrid");
    const elite36 = fireplaceProducts.find(
      (product) => product.id === "36-elite-nexgen-hybrid",
    );
    const elite44 = fireplaceProducts.find(
      (product) => product.id === "44-elite-nexgen-hybrid",
    );

    expect(apex?.mantelRule).toMatchObject({
      nonCombustibleOnly: true,
      nonCombustibleMinimumHeight: 47.375,
      maximumNonCombustibleDepth: 18,
    });
    expect(apex?.hearthRule).toMatchObject({
      minimumWidth: 44,
      floorExtension: 20,
      raisedExtension: 18,
      maximumRaisedHeight: 6.375,
      minimumRValue: 1,
    });
    expect(elite36?.hearthRule).toMatchObject({ minimumWidth: 60, minimumRValue: 0.78 });
    expect(elite44?.hearthRule).toMatchObject({ minimumWidth: 60, minimumRValue: 0.78 });
    expect(elite36?.mantelRule.nonCombustibleMinimumHeight).toBe(0);
    expect(elite44?.mantelRule.nonCombustibleMinimumHeight).toBe(0);
  });
});
