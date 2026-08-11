import { describe, expect, it } from "vitest";
import {
  FPX_CURRENT_GAS_LINEUP,
  FPX_LEGACY_GAS_LINEUP,
  summarizeFpxCurrentGasLineup,
} from "@/catalog/fpxGasLineup";
import { FPX_CURRENT_INTAKE } from "@/catalog/intake";

describe("canonical FPX gas lineup", () => {
  it("accounts for every model in the five current official categories", () => {
    expect(summarizeFpxCurrentGasLineup()).toEqual({
      total: 27,
      byCategory: {
        "premium-traditional": 10,
        "premium-linear": 2,
        "probuilder-traditional": 5,
        "probuilder-linear": 4,
        "gas-insert": 6,
      },
    });
  });

  it("maps every current model to exactly one intake record", () => {
    const intakeIds = new Set(FPX_CURRENT_INTAKE.products.map((product) => product.id));
    expect(FPX_CURRENT_GAS_LINEUP.every((product) => intakeIds.has(product.intakeId))).toBe(
      true,
    );
    expect(new Set(FPX_CURRENT_GAS_LINEUP.map((product) => product.id)).size).toBe(27);
  });

  it("keeps live availability qualifiers and legacy products explicit", () => {
    expect(
      FPX_CURRENT_GAS_LINEUP.find((product) => product.id === "430-mod-fyre")
        ?.factoryAvailability,
    ).toBe("limited-stock");
    expect(
      FPX_CURRENT_GAS_LINEUP.find((product) => product.id === "616-mod-fyre")
        ?.factoryAvailability,
    ).toBe("sold-out-at-factory");
    expect(FPX_LEGACY_GAS_LINEUP.map((product) => product.id)).toContain(
      "probuilder-24-clean-face",
    );
    expect(
      FPX_LEGACY_GAS_LINEUP.find((product) => product.id === "4415-see-through-high-output"),
    ).toMatchObject({
      marketingStatus: "legacy",
      factoryAvailability: "discontinued",
    });
    expect(
      FPX_CURRENT_GAS_LINEUP.some((product) => product.id === "4415-see-through-high-output"),
    ).toBe(false);
    expect(FPX_LEGACY_GAS_LINEUP.every((product) => product.marketingStatus === "legacy")).toBe(
      true,
    );
  });
});
