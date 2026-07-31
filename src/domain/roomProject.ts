import { z } from "zod";

export const normalizedPointSchema = z.object({
  x: z.number().min(0).max(1).finite(),
  y: z.number().min(0).max(1).finite(),
});

export type NormalizedPoint = z.infer<typeof normalizedPointSchema>;

export const roomProjectSchema = z.object({
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

export type RoomProject = z.infer<typeof roomProjectSchema>;

export function createRoomProject(
  source: RoomProject["source"],
  now = new Date(),
): RoomProject {
  const timestamp = now.toISOString();
  return roomProjectSchema.parse({
    schemaVersion: 1,
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

export function isRoomProjectCalibrated(project: RoomProject): boolean {
  const consistency = wallReferenceConsistency(project);
  return (
    project.wallQuad.length === 4 &&
    pixelsPerInch(project) !== null &&
    consistency !== null &&
    consistency >= 0.7 &&
    consistency <= 1.3
  );
}

export function calibrationLabel(project: RoomProject): string {
  if (project.wallQuad.length < 4) return "Mark the four wall corners";
  if (project.referenceSegment.length < 2) return "Mark a known measurement";
  if (!isRoomProjectCalibrated(project)) return "Measurement must span the wall";
  return "Dimensionally scaled";
}
