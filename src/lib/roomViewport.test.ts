import { describe, expect, it } from "vitest";
import { fitContainedSize } from "@/lib/roomViewport";

describe("fitContainedSize", () => {
  it("fits a wide photograph without changing its aspect ratio", () => {
    expect(fitContainedSize(900, 700, 1600, 900)).toEqual({
      width: 900,
      height: 506.25,
    });
  });

  it("fits a portrait photograph by the available height", () => {
    const fitted = fitContainedSize(900, 700, 1200, 1800);
    expect(fitted.width).toBeCloseTo(466.67, 2);
    expect(fitted.height).toBe(700);
  });

  it("fails closed for incomplete layout measurements", () => {
    expect(fitContainedSize(0, 700, 1600, 900)).toEqual({ width: 0, height: 0 });
    expect(fitContainedSize(900, 700, Number.NaN, 900)).toEqual({
      width: 0,
      height: 0,
    });
  });
});
