import { describe, expect, it } from "vitest";
import { homographyForQuad, invertMatrix3 } from "@/lib/roomPerspective";

function transform(matrix: number[], x: number, y: number) {
  const scale = matrix[6]! * x + matrix[7]! * y + matrix[8]!;
  return {
    x: (matrix[0]! * x + matrix[1]! * y + matrix[2]!) / scale,
    y: (matrix[3]! * x + matrix[4]! * y + matrix[5]!) / scale,
  };
}

describe("room perspective homography", () => {
  it("maps every unit-square corner to the calibrated wall without a mesh", () => {
    const quad = [
      { x: 120, y: 80 },
      { x: 940, y: 110 },
      { x: 860, y: 720 },
      { x: 180, y: 690 },
    ];
    const matrix = homographyForQuad(quad);
    expect(matrix).not.toBeNull();
    if (!matrix) return;
    expect(transform(matrix, 0, 0)).toEqual(quad[0]);
    expect(transform(matrix, 1, 0).x).toBeCloseTo(quad[1]!.x);
    expect(transform(matrix, 1, 0).y).toBeCloseTo(quad[1]!.y);
    expect(transform(matrix, 1, 1).x).toBeCloseTo(quad[2]!.x);
    expect(transform(matrix, 1, 1).y).toBeCloseTo(quad[2]!.y);
    expect(transform(matrix, 0, 1).x).toBeCloseTo(quad[3]!.x);
    expect(transform(matrix, 0, 1).y).toBeCloseTo(quad[3]!.y);
  });

  it("round-trips destination pixels back into normalized design coordinates", () => {
    const matrix = homographyForQuad([
      { x: 10, y: 20 },
      { x: 410, y: 40 },
      { x: 370, y: 330 },
      { x: 35, y: 350 },
    ]);
    const inverse = matrix ? invertMatrix3(matrix) : null;
    expect(inverse).not.toBeNull();
    if (!matrix || !inverse) return;
    const destination = transform(matrix, 0.37, 0.68);
    const source = transform(inverse, destination.x, destination.y);
    expect(source.x).toBeCloseTo(0.37, 8);
    expect(source.y).toBeCloseTo(0.68, 8);
  });

  it("rejects degenerate wall planes", () => {
    expect(
      homographyForQuad([
        { x: 1, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 1 },
        { x: 1, y: 1 },
      ]),
    ).toBeNull();
  });
});
