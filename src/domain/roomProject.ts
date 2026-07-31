import { z } from "zod";

export const normalizedPointSchema = z.object({
  x: z.number().min(0).max(1).finite(),
  y: z.number().min(0).max(1).finite(),
});

export type NormalizedPoint = z.infer<typeof normalizedPointSchema>;

const roomProjectV1Schema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  source: z.object({
    dataUrl: z.string().startsWith("data:image/"),
    fileName: z.string().min(1),
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  wallQuad: z.array(normalizedPointSchema).max(4),
  referenceSegment: z.array(normalizedPointSchema).max(2),
  referenceInches: z.number().positive().max(600),
  comparison: z.number().min(0).max(1),
  scenario: z.enum(["full-remodel", "insert"]),
});

export const roomProjectSchema = roomProjectV1Schema.extend({
  schemaVersion: z.literal(2),
  openingQuad: z.array(normalizedPointSchema).max(4),
  openingWidthInches: z.number().positive().max(240),
  openingHeightInches: z.number().positive().max(120),
});

export type RoomProject = z.infer<typeof roomProjectSchema>;

export function createRoomProject(
  source: RoomProject["source"],
  now = new Date(),
): RoomProject {
  const timestamp = now.toISOString();
  return roomProjectSchema.parse({
    schemaVersion: 2,
    id: crypto.randomUUID(),
    name: "Customer fireplace concept",
    createdAt: timestamp,
    updatedAt: timestamp,
    source,
    wallQuad: [],
    referenceSegment: [],
    referenceInches: 144,
    comparison: 1,
    scenario: "full-remodel",
    openingQuad: [],
    openingWidthInches: 36,
    openingHeightInches: 30,
  });
}

export function parseRoomProject(candidate: unknown): RoomProject {
  const current = roomProjectSchema.safeParse(candidate);
  if (current.success) return current.data;
  const legacy = roomProjectV1Schema.parse(candidate);
  return roomProjectSchema.parse({
    ...legacy,
    schemaVersion: 2,
    openingQuad: [],
    openingWidthInches: 36,
    openingHeightInches: 30,
  });
}

export function imagePoint(
  point: NormalizedPoint,
  width: number,
  height: number,
): { x: number; y: number } {
  return { x: point.x * width, y: point.y * height };
}

export function segmentPixels(
  points: NormalizedPoint[],
  width: number,
  height: number,
): number | null {
  if (points.length !== 2) return null;
  const first = points[0];
  const second = points[1];
  if (!first || !second) return null;
  return Math.hypot((second.x - first.x) * width, (second.y - first.y) * height);
}

export function pixelsPerInch(project: RoomProject): number | null {
  const pixels = segmentPixels(
    project.referenceSegment,
    project.source.width,
    project.source.height,
  );
  return pixels && project.referenceInches > 0 ? pixels / project.referenceInches : null;
}

export function wallReferenceConsistency(project: RoomProject): number | null {
  if (project.wallQuad.length !== 4) return null;
  const reference = segmentPixels(
    project.referenceSegment,
    project.source.width,
    project.source.height,
  );
  const top = segmentPixels(
    [project.wallQuad[0]!, project.wallQuad[1]!],
    project.source.width,
    project.source.height,
  );
  const bottom = segmentPixels(
    [project.wallQuad[3]!, project.wallQuad[2]!],
    project.source.width,
    project.source.height,
  );
  if (!reference || !top || !bottom) return null;
  return reference / ((top + bottom) / 2);
}

function isOrderedQuadrilateral(points: NormalizedPoint[]): boolean {
  if (points.length !== 4) return false;
  const [topLeft, topRight, bottomRight, bottomLeft] = points;
  if (!topLeft || !topRight || !bottomRight || !bottomLeft) return false;
  const topY = (topLeft.y + topRight.y) / 2;
  const bottomY = (bottomLeft.y + bottomRight.y) / 2;
  const leftX = (topLeft.x + bottomLeft.x) / 2;
  const rightX = (topRight.x + bottomRight.x) / 2;
  if (topY >= bottomY || leftX >= rightX) return false;
  const crosses = points.map((point, index) => {
    const next = points[(index + 1) % points.length]!;
    const after = points[(index + 2) % points.length]!;
    return (next.x - point.x) * (after.y - next.y) - (next.y - point.y) * (after.x - next.x);
  });
  return crosses.every((cross) => cross > 0) || crosses.every((cross) => cross < 0);
}

export function isRoomProjectCalibrated(project: RoomProject): boolean {
  const consistency = wallReferenceConsistency(project);
  return (
    project.wallQuad.length === 4 &&
    isOrderedQuadrilateral(project.wallQuad) &&
    pixelsPerInch(project) !== null &&
    consistency !== null &&
    consistency >= 0.7 &&
    consistency <= 1.3
  );
}

function quadrilateralArea(points: NormalizedPoint[]): number {
  if (points.length !== 4) return 0;
  return Math.abs(
    points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length]!;
      return sum + point.x * next.y - next.x * point.y;
    }, 0) / 2,
  );
}

export function isInsertOpeningCalibrated(project: RoomProject): boolean {
  return (
    project.openingQuad.length === 4 &&
    isOrderedQuadrilateral(project.openingQuad) &&
    quadrilateralArea(project.openingQuad) >= 0.0025 &&
    project.openingWidthInches > 0 &&
    project.openingHeightInches > 0
  );
}

export function isRoomProjectReady(project: RoomProject): boolean {
  return (
    isRoomProjectCalibrated(project) &&
    (project.scenario === "full-remodel" || isInsertOpeningCalibrated(project))
  );
}

export function faceBoundsWithinOpening(
  project: RoomProject,
  faceWidthInches: number,
  faceHeightInches: number,
): { left: number; top: number; right: number; bottom: number } {
  const widthRatio = faceWidthInches / project.openingWidthInches;
  const heightRatio = faceHeightInches / project.openingHeightInches;
  return {
    left: (1 - widthRatio) / 2,
    right: (1 + widthRatio) / 2,
    top: (1 - heightRatio) / 2,
    bottom: (1 + heightRatio) / 2,
  };
}

export function calibrationLabel(project: RoomProject): string {
  if (project.wallQuad.length < 4) return "Mark the four wall corners";
  if (!isOrderedQuadrilateral(project.wallQuad)) return "Wall corners are out of order";
  if (project.referenceSegment.length < 2) return "Mark a known measurement";
  if (!isRoomProjectCalibrated(project)) return "Measurement must span the wall";
  if (project.scenario === "insert" && project.openingQuad.length < 4) {
    return "Mark the existing fireplace opening";
  }
  if (project.scenario === "insert" && !isInsertOpeningCalibrated(project)) {
    return "Opening calibration needs attention";
  }
  return "Dimensionally scaled";
}
