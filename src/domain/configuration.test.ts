import { describe, expect, it } from "vitest";
import {
  DEFAULT_CONFIGURATION,
  calculateOrthographicZoom,
  getMantelBottom,
  getMantelCenter,
  inchesLabel,
  normalizeConfiguration,
} from "@/domain/configuration";

describe("feature wall dimensions", () => {
  it("keeps the mantel at least eight inches above the appliance face", () => {
    const configuration = normalizeConfiguration({
      ...DEFAULT_CONFIGURATION,
      mantelClearance: -10,
    });
    expect(configuration.mantelClearance).toBe(8);
    expect(getMantelBottom(configuration)).toBe(44.75);
    expect(getMantelCenter(configuration)).toBe(46.75);
  });

  it("clamps every adjustable physical dimension to its approved range", () => {
    expect(
      normalizeConfiguration({
        wallWidth: 500,
        wallHeight: 1,
        fireplaceElevation: 100,
        mantelClearance: 99,
      }),
    ).toMatchObject({
      wallWidth: 192,
      wallHeight: 96,
      fireplaceElevation: 24,
      mantelClearance: 24,
    });
  });

  it("calculates deterministic orthographic framing", () => {
    expect(calculateOrthographicZoom(1440, 1000, 144, 108)).toBeCloseTo(1000 / 130);
    expect(calculateOrthographicZoom(0, 1000, 144, 108)).toBe(1);
  });

  it("formats showroom dimensions without decimal noise", () => {
    expect(inchesLabel(60)).toBe("60″");
    expect(inchesLabel(8.5)).toBe("8½″");
    expect(inchesLabel(8.25)).toBe("8.3″");
  });
});
