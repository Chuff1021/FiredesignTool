import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONFIGURATION,
  calculateOrthographicZoom,
  getMantelBottom,
  getMantelCenter,
  getMinimumMantelHeight,
  inchesLabel,
  normalizeConfiguration,
} from "@/domain/configuration";

describe("feature wall dimensions", () => {
  it("uses the 864 manual's fireplace-base datum for an 8-inch mantel", () => {
    const configuration = normalizeConfiguration({
      ...DEFAULT_CONFIGURATION,
      mantelHeightAboveBase: -10,
    });
    expect(configuration.mantelHeightAboveBase).toBe(44.75);
    expect(getMantelBottom(configuration)).toBe(44.75);
    expect(getMantelCenter(configuration)).toBe(46.75);
  });

  it("uses the current 4237 manual's fireplace-base datum", () => {
    const configuration = normalizeConfiguration({
      ...DEFAULT_CONFIGURATION,
      fireplaceId: "4237-ember-glo-clean-face",
      faceOptionId: "4237-clean-face",
      fireplaceElevation: 6,
      mantelHeightAboveBase: 44,
    });
    expect(configuration.mantelHeightAboveBase).toBe(57);
    expect(getMantelBottom(configuration)).toBe(63);
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

  it("keeps stone width separate from wall width and large enough for the shelf", () => {
    const configuration = normalizeConfiguration({
      wallWidth: 180,
      stoneWidth: 60,
      mantelWidth: 84,
    });
    expect(configuration.wallWidth).toBe(180);
    expect(configuration.stoneWidth).toBe(96);
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
