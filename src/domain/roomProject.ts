import { z } from "zod";
import {
  DEFAULT_CONFIGURATION,
  featureWallConfigurationSchema,
  normalizeConfiguration,
  type FeatureWallConfiguration,
} from "@/domain/configuration";

export const normalizedPointSchema = z.object({
  x: z.number().min(0).max(1).finite(),
  y: z.number().min(0).max(1).finite(),
});

export type NormalizedPoint = z.infer<typeof normalizedPointSchema>;

function polygonArea(points: NormalizedPoint[]): number {
  if (points.length < 3) return 0;
  return Math.abs(
    points.reduce((sum, point, index) => {
      const next = points[(index + 1) % points.length]!;
      return sum + point.x * next.y - next.x * point.y;
    }, 0) / 2,
  );
}

function segmentsIntersect(
  firstStart: NormalizedPoint,
  firstEnd: NormalizedPoint,
  secondStart: NormalizedPoint,
  secondEnd: NormalizedPoint,
): boolean {
  const cross = (start: NormalizedPoint, end: NormalizedPoint, point: NormalizedPoint) =>
    (end.x - start.x) * (point.y - start.y) - (end.y - start.y) * (point.x - start.x);
  const firstA = cross(firstStart, firstEnd, secondStart);
  const firstB = cross(firstStart, firstEnd, secondEnd);
  const secondA = cross(secondStart, secondEnd, firstStart);
  const secondB = cross(secondStart, secondEnd, firstEnd);
  return firstA * firstB < 0 && secondA * secondB < 0;
}

export function isValidForegroundPolygon(points: NormalizedPoint[]): boolean {
  if (points.length < 3 || points.length > 24 || polygonArea(points) < 0.0005) return false;
  for (let first = 0; first < points.length; first += 1) {
    const firstNext = (first + 1) % points.length;
    for (let second = first + 1; second < points.length; second += 1) {
      const secondNext = (second + 1) % points.length;
      if (first === second || firstNext === second || secondNext === first) continue;
      if (
        segmentsIntersect(
          points[first]!,
          points[firstNext]!,
          points[second]!,
          points[secondNext]!,
        )
      ) {
        return false;
      }
    }
  }
  return true;
}

const foregroundPolygonSchema = z
  .array(normalizedPointSchema)
  .min(3)
  .max(24)
  .refine(isValidForegroundPolygon, "Foreground outlines must be simple, ordered polygons");

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

const roomProjectV2Schema = roomProjectV1Schema.extend({
  schemaVersion: z.literal(2),
  openingQuad: z.array(normalizedPointSchema).max(4),
  openingWidthInches: z.number().positive().max(240),
  openingHeightInches: z.number().positive().max(120),
});

const roomProjectV3Schema = roomProjectV2Schema.extend({
  schemaVersion: z.literal(3),
  foregroundPolygons: z.array(foregroundPolygonSchema).max(8),
});

const roomProjectV4Schema = roomProjectV3Schema.extend({
  schemaVersion: z.literal(4),
  openingDepthInches: z.number().positive().max(120).nullable(),
  openingRearWidthInches: z.number().positive().max(240).nullable(),
});

const roomProjectV5Schema = roomProjectV4Schema.extend({
  schemaVersion: z.literal(5),
  configuration: featureWallConfigurationSchema,
});

export const builtInSideSchema = z.object({
  enabled: z.boolean(),
  style: z.enum(["bookcase", "floating-shelves"]),
  finish: z.enum(["warm-white", "white-oak", "walnut", "charcoal"]),
  width: z.number().min(18).max(72),
  height: z.number().min(48).max(120),
  gap: z.number().min(0).max(36),
  shelfCount: z.number().int().min(2).max(8),
  baseCabinet: z.boolean(),
});

export const roomAccessoriesSchema = z.object({
  left: builtInSideSchema,
  right: builtInSideSchema,
});

const cleanedRoomSourceSchema = z.object({
  dataUrl: z.string().startsWith("data:image/"),
  fileName: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export type BuiltInSide = z.infer<typeof builtInSideSchema>;
export type RoomAccessories = z.infer<typeof roomAccessoriesSchema>;

export const DEFAULT_ROOM_ACCESSORIES: RoomAccessories = {
  left: {
    enabled: false,
    style: "bookcase",
    finish: "warm-white",
    width: 36,
    height: 84,
    gap: 6,
    shelfCount: 4,
    baseCabinet: true,
  },
  right: {
    enabled: false,
    style: "bookcase",
    finish: "warm-white",
    width: 36,
    height: 84,
    gap: 6,
    shelfCount: 4,
    baseCabinet: true,
  },
};

const roomProjectV6Schema = roomProjectV5Schema.extend({
  schemaVersion: z.literal(6),
  accessories: roomAccessoriesSchema,
});

export const roomProjectSchema = roomProjectV6Schema.extend({
  schemaVersion: z.literal(7),
  hearthFrontCenter: normalizedPointSchema.nullable(),
  cleanedSource: cleanedRoomSourceSchema.nullable(),
});

export type RoomProject = z.infer<typeof roomProjectSchema>;

export function createRoomProject(
  source: RoomProject["source"],
  now = new Date(),
  configuration: FeatureWallConfiguration = DEFAULT_CONFIGURATION,
): RoomProject {
  const timestamp = now.toISOString();
  const projectConfiguration = normalizeConfiguration({
    ...configuration,
    cameraMode: "front",
    showDimensions: false,
  });
  return roomProjectSchema.parse({
    schemaVersion: 7,
    id: crypto.randomUUID(),
    name: "Customer fireplace concept",
    createdAt: timestamp,
    updatedAt: timestamp,
    source,
    wallQuad: [],
    referenceSegment: [],
    referenceInches: projectConfiguration.wallWidth,
    comparison: 1,
    scenario: "full-remodel",
    openingQuad: [],
    openingWidthInches: 36,
    openingHeightInches: 30,
    openingDepthInches: null,
    openingRearWidthInches: null,
    foregroundPolygons: [],
    configuration: projectConfiguration,
    accessories: DEFAULT_ROOM_ACCESSORIES,
    hearthFrontCenter: null,
    cleanedSource: null,
  });
}

function migrateVersionFour(
  project: z.infer<typeof roomProjectV4Schema>,
  configuration: FeatureWallConfiguration,
): RoomProject {
  return roomProjectSchema.parse({
    ...project,
    schemaVersion: 7,
    configuration: normalizeConfiguration({
      ...configuration,
      wallWidth: project.referenceInches,
      cameraMode: "front",
      showDimensions: false,
    }),
    accessories: DEFAULT_ROOM_ACCESSORIES,
    hearthFrontCenter: null,
    cleanedSource: null,
  });
}

function migrateVersionFive(project: z.infer<typeof roomProjectV5Schema>): RoomProject {
  return roomProjectSchema.parse({
    ...project,
    schemaVersion: 7,
    accessories: DEFAULT_ROOM_ACCESSORIES,
    hearthFrontCenter: null,
    cleanedSource: null,
  });
}

function migrateVersionSix(project: z.infer<typeof roomProjectV6Schema>): RoomProject {
  return roomProjectSchema.parse({
    ...project,
    schemaVersion: 7,
    hearthFrontCenter: null,
    cleanedSource: null,
  });
}

export function parseRoomProject(
  candidate: unknown,
  legacyConfiguration: FeatureWallConfiguration = DEFAULT_CONFIGURATION,
): RoomProject {
  const current = roomProjectSchema.safeParse(candidate);
  if (current.success) return current.data;
  const versionSix = roomProjectV6Schema.safeParse(candidate);
  if (versionSix.success) return migrateVersionSix(versionSix.data);
  const versionFive = roomProjectV5Schema.safeParse(candidate);
  if (versionFive.success) return migrateVersionFive(versionFive.data);
  const versionFour = roomProjectV4Schema.safeParse(candidate);
  if (versionFour.success) return migrateVersionFour(versionFour.data, legacyConfiguration);
  const versionThree = roomProjectV3Schema.safeParse(candidate);
  if (versionThree.success) {
    return migrateVersionFour(
      roomProjectV4Schema.parse({
        ...versionThree.data,
        schemaVersion: 4,
        openingDepthInches: null,
        openingRearWidthInches: null,
      }),
      legacyConfiguration,
    );
  }
  const versionTwo = roomProjectV2Schema.safeParse(candidate);
  if (versionTwo.success) {
    return migrateVersionFour(
      roomProjectV4Schema.parse({
        ...versionTwo.data,
        schemaVersion: 4,
        openingDepthInches: null,
        openingRearWidthInches: null,
        foregroundPolygons: [],
      }),
      legacyConfiguration,
    );
  }
  const legacy = roomProjectV1Schema.parse(candidate);
  return migrateVersionFour(
    roomProjectV4Schema.parse({
      ...legacy,
      schemaVersion: 4,
      openingQuad: [],
      openingWidthInches: 36,
      openingHeightInches: 30,
      openingDepthInches: null,
      openingRearWidthInches: null,
      foregroundPolygons: [],
    }),
    legacyConfiguration,
  );
}

export function builtInAvailableWidth(
  wallWidth: number,
  stoneWidth: number,
  side: BuiltInSide,
): number {
  return Math.max(0, (wallWidth - stoneWidth) / 2 - side.gap);
}

export function builtInFits(wallWidth: number, stoneWidth: number, side: BuiltInSide): boolean {
  return !side.enabled || side.width <= builtInAvailableWidth(wallWidth, stoneWidth, side);
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

export function isInsertOpeningCalibrated(project: RoomProject): boolean {
  return (
    project.openingQuad.length === 4 &&
    isOrderedQuadrilateral(project.openingQuad) &&
    polygonArea(project.openingQuad) >= 0.0025 &&
    project.openingWidthInches > 0 &&
    project.openingHeightInches > 0
  );
}

export function isInsertOpeningFitMeasured(project: RoomProject): boolean {
  return (
    project.scenario === "insert" &&
    isInsertOpeningCalibrated(project) &&
    project.openingDepthInches !== null &&
    project.openingRearWidthInches !== null
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
