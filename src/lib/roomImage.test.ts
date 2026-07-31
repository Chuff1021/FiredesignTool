import { describe, expect, it } from "vitest";
import {
  calculateRoomImageDimensions,
  MAX_ROOM_IMAGE_EDGE,
  MAX_ROOM_IMAGE_PIXELS,
} from "@/lib/roomImage";

describe("room photograph preparation", () => {
  it("preserves common 4K and twelve-megapixel photographs", () => {
    expect(calculateRoomImageDimensions(3840, 2160)).toEqual({ width: 3840, height: 2160 });
    expect(calculateRoomImageDimensions(4032, 3024)).toEqual({ width: 4032, height: 3024 });
  });

  it("constrains oversized photographs by edge and total pixels", () => {
    const landscape = calculateRoomImageDimensions(6000, 4000);
    expect(landscape).toEqual({ width: 4096, height: 2731 });
    expect(landscape.width).toBeLessThanOrEqual(MAX_ROOM_IMAGE_EDGE);
    expect(landscape.width * landscape.height).toBeLessThanOrEqual(MAX_ROOM_IMAGE_PIXELS);

    const square = calculateRoomImageDimensions(5000, 5000);
    expect(square.width).toBe(square.height);
    expect(square.width * square.height).toBeLessThanOrEqual(MAX_ROOM_IMAGE_PIXELS);
  });

  it("rejects corrupt image dimensions", () => {
    expect(() => calculateRoomImageDimensions(0, 2160)).toThrow(/invalid dimensions/);
    expect(() => calculateRoomImageDimensions(Number.NaN, 2160)).toThrow(/invalid dimensions/);
  });
});
