import { describe, expect, it } from "vitest";
import { createRoomProject } from "@/domain/roomProject";
import { DEFAULT_CONFIGURATION } from "@/domain/configuration";
import { projectedHearthGeometry, projectedPixelsPerInch } from "@/lib/roomRenderer";

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

describe("customer room hearth projection", () => {
  it("uses the operator-selected front center without changing the stone width", () => {
    const project = createRoomProject({
      dataUrl: "data:image/jpeg;base64,AA==",
      fileName: "room.jpg",
      width: 1600,
      height: 900,
    });
    project.hearthFrontCenter = { x: 0.5, y: 0.86 };
    const configuration = {
      ...DEFAULT_CONFIGURATION,
      wallWidth: 144,
      wallHeight: 108,
      stoneWidth: 96,
      fireplaceElevation: 12,
      hearthEnabled: true,
    };
    const geometry = projectedHearthGeometry(
      [
        { x: 160, y: 90 },
        { x: 1440, y: 90 },
        { x: 1360, y: 810 },
        { x: 240, y: 810 },
      ],
      project,
      configuration,
    );
    expect((geometry.frontLeftTop.x + geometry.frontRightTop.x) / 2).toBeCloseTo(800);
    expect((geometry.frontLeftTop.y + geometry.frontRightTop.y) / 2).toBeCloseTo(774);
    expect(geometry.depthInches).toBe(20);
    expect(geometry.riserHeight).toBe(10.5);
    const rearWidth = Math.hypot(
      geometry.rearRightTop.x - geometry.rearLeftTop.x,
      geometry.rearRightTop.y - geometry.rearLeftTop.y,
    );
    const frontWidth = Math.hypot(
      geometry.frontRightTop.x - geometry.frontLeftTop.x,
      geometry.frontRightTop.y - geometry.frontLeftTop.y,
    );
    expect(frontWidth / rearWidth).toBeGreaterThanOrEqual(1);
    expect(frontWidth / rearWidth).toBeLessThanOrEqual(1.06);
  });
});
