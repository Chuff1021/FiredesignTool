import { describe, expect, it } from "vitest";
import { projectedPixelsPerInch } from "@/lib/roomRenderer";

describe("customer room render density", () => {
  it("matches the destination density for a calibrated wall", () => {
    expect(
      projectedPixelsPerInch(
        [
          { x: 0, y: 0 },
          { x: 2400, y: 0 },
          { x: 2400, y: 1800 },
          { x: 0, y: 1800 },
        ],
        120,
        90,
      ),
    ).toBe(20);
  });

  it("keeps small previews sharp without exceeding the 4K canvas budget", () => {
    expect(
      projectedPixelsPerInch(
        [
          { x: 0, y: 0 },
          { x: 300, y: 0 },
          { x: 300, y: 200 },
          { x: 0, y: 200 },
        ],
        120,
        90,
      ),
    ).toBe(6);

    const density = projectedPixelsPerInch(
      [
        { x: 0, y: 0 },
        { x: 8000, y: 0 },
        { x: 8000, y: 5000 },
        { x: 0, y: 5000 },
      ],
      240,
      144,
    );
    expect(240 * density).toBeLessThanOrEqual(4096);
    expect(240 * density * (144 * density)).toBeLessThanOrEqual(4096 * 2160);
  });
});
