import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONFIGURATION,
  calculateOrthographicZoom,
  getHearthStoneSegments,
  getMantelBottom,
  getMantelCenter,
  getMinimumMantelHeight,
  getMinimumNonCombustibleMantelHeight,
  getHearthWidth,
  inchesLabel,
  normalizeConfiguration,
} from "@/domain/configuration";

describe("feature wall dimensions", () => {
  it("allows free placement for approved non-combustible mantels", () => {
    const configuration = normalizeConfiguration({
      ...DEFAULT_CONFIGURATION,
      mantelHeightAboveBase: -10,
    });
    expect(configuration.mantelHeightAboveBase).toBe(0);
    expect(getMantelBottom(configuration)).toBe(0);
    expect(getMantelCenter(configuration)).toBe(2.5);

    const linear = normalizeConfiguration({
      ...configuration,
      mantelProductId: "linear",
      mantelWidth: 60,
      mantelFinishId: "pearl",
      mantelHeightAboveBase: -10,
    });
    expect(linear.mantelHeightAboveBase).toBe(0);
  });

  it("uses the current 4237 manual's fireplace-base datum", () => {
    const configuration = normalizeConfiguration({
      ...DEFAULT_CONFIGURATION,
      fireplaceId: "4237-ember-glo-clean-face",
      faceOptionId: "4237-clean-face",
      fireplaceElevation: 6,
      mantelHeightAboveBase: 44,
    });
    expect(configuration.mantelHeightAboveBase).toBe(44);
    expect(getMantelBottom(configuration)).toBe(50);
    expect(getMinimumMantelHeight("4237-ember-glo-clean-face", 10)).toBe(59);
  });

  it("falls back to a compatible face when the fireplace model changes", () => {
    expect(
      normalizeConfiguration({
        fireplaceId: "864-trv-31k-deluxe",
        faceOptionId: "4237-clean-face",
      }).faceOptionId,
    ).toBe("classic-arch");
  });

  it("recovers unknown catalog IDs without substituting unchecked products", () => {
    expect(
      normalizeConfiguration({
        fireplaceId: "retired-unknown-fireplace",
        faceOptionId: "unknown-face",
        stoneId: "unknown-stone",
        mantelProductId: "unknown-mantel",
        mantelFinishId: "unknown-finish",
      }),
    ).toMatchObject({
      fireplaceId: DEFAULT_CONFIGURATION.fireplaceId,
      faceOptionId: DEFAULT_CONFIGURATION.faceOptionId,
      stoneId: DEFAULT_CONFIGURATION.stoneId,
      mantelProductId: DEFAULT_CONFIGURATION.mantelProductId,
      mantelFinishId: DEFAULT_CONFIGURATION.mantelFinishId,
    });
  });

  it("keeps stone width independent with an exact 50-inch minimum", () => {
    const configuration = normalizeConfiguration({
      wallWidth: 180,
      stoneWidth: 20,
      mantelWidth: 84,
    });
    expect(configuration.wallWidth).toBe(180);
    expect(configuration.stoneWidth).toBe(50);
  });

  it("matches the hearth to the stone field with centered end cuts", () => {
    const configuration = normalizeConfiguration({
      ...DEFAULT_CONFIGURATION,
      stoneWidth: 50,
      hearthEnabled: true,
      fireplaceElevation: 0,
    });
    expect(configuration.fireplaceElevation).toBe(1.5);
    expect(getHearthWidth(configuration)).toBe(50);
    expect(getHearthStoneSegments(configuration.stoneWidth)).toEqual([
      { centerX: -17, width: 16 },
      { centerX: 0, width: 18 },
      { centerX: 17, width: 16 },
    ]);
  });

  it("enforces the wood manuals' mantel, hearth, and raised-height limits", () => {
    const apex = normalizeConfiguration({
      ...DEFAULT_CONFIGURATION,
      fireplaceId: "42-apex-nexgen-hybrid",
      faceOptionId: "metropolitan",
      stoneWidth: 50,
      fireplaceElevation: 20,
      mantelHeightAboveBase: 10,
      hearthEnabled: false,
    });
    expect(apex).toMatchObject({
      hearthEnabled: true,
      stoneWidth: 50,
      fireplaceElevation: 6.375,
      mantelHeightAboveBase: 47.375,
    });
    expect(getMinimumNonCombustibleMantelHeight(apex.fireplaceId)).toBe(47.375);

    const elite = normalizeConfiguration({
      ...DEFAULT_CONFIGURATION,
      fireplaceId: "36-elite-nexgen-hybrid",
      faceOptionId: "classic-arch-single-door",
      stoneWidth: 50,
      fireplaceElevation: 20,
      hearthEnabled: false,
    });
    expect(elite).toMatchObject({
      hearthEnabled: true,
      stoneWidth: 60,
      fireplaceElevation: 6.5,
    });
    expect(getMinimumNonCombustibleMantelHeight(elite.fireplaceId)).toBe(0);
  });

  it("allows a required wood-fireplace hearth to remain flush with the floor", () => {
    const configuration = normalizeConfiguration({
      ...DEFAULT_CONFIGURATION,
      fireplaceId: "36-elite-nexgen-hybrid",
      faceOptionId: "classic-arch-single-door",
      fireplaceElevation: 0,
      hearthEnabled: false,
    });

    expect(configuration.hearthEnabled).toBe(true);
    expect(configuration.fireplaceElevation).toBe(0);
  });

  it("clamps every adjustable physical dimension to its approved range", () => {
    expect(
      normalizeConfiguration({
        wallWidth: 500,
        wallHeight: 1,
        stoneWidth: 500,
        fireplaceElevation: 100,
        mantelHeightAboveBase: 999,
      }),
    ).toMatchObject({
      wallWidth: 240,
      wallHeight: 96,
      stoneWidth: 192,
      fireplaceElevation: 24,
      mantelHeightAboveBase: 84,
    });
  });

  it("calculates deterministic orthographic framing", () => {
    expect(calculateOrthographicZoom(1440, 1000, 144, 108)).toBeCloseTo(1000 / 130);
    expect(calculateOrthographicZoom(0, 1000, 144, 108)).toBe(1);
  });

  it("formats quarter-inch manufacturer dimensions without decimal noise", () => {
    expect(inchesLabel(60)).toBe("60″");
    expect(inchesLabel(44.75)).toBe("44¾″");
    expect(inchesLabel(39.875)).toBe("39⅞″");
  });
});
