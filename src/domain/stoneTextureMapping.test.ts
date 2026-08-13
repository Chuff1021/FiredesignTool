import { describe, expect, it } from "vitest";
import {
  centeredStoneTextureTransform,
  centeredStoneTileOrigin,
} from "@/domain/stoneTextureMapping";

describe("physical stone texture mapping", () => {
  it("shows one exact 96 by 72 inch atlas over an equal physical surface", () => {
    expect(centeredStoneTextureTransform(96, 72, { width: 96, height: 72 })).toEqual({
      repeatX: 1,
      repeatY: 1,
      offsetX: 0,
      offsetY: 0,
    });
  });

  it("centers a partial atlas without enlarging its published piece scale", () => {
    expect(centeredStoneTextureTransform(48, 36, { width: 96, height: 72 })).toEqual({
      repeatX: 0.5,
      repeatY: 0.5,
      offsetX: 0.25,
      offsetY: 0.25,
    });
    expect(centeredStoneTileOrigin(48, 36, { width: 96, height: 72 })).toEqual({
      x: -24,
      y: -18,
    });
  });

  it("repeats centered atlases on walls larger than the source field", () => {
    expect(centeredStoneTextureTransform(192, 108, { width: 96, height: 72 })).toEqual({
      repeatX: 2,
      repeatY: 1.5,
      offsetX: -0.5,
      offsetY: -0.25,
    });
  });
});
