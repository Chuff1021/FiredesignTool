import { describe, expect, it, vi } from "vitest";
import {
  calibrationLabel,
  builtInAvailableWidth,
  builtInFits,
  createRoomProject,
  faceBoundsWithinOpening,
  isInsertOpeningCalibrated,
  isInsertOpeningFitMeasured,
  isRoomProjectCalibrated,
  isRoomProjectReady,
  isValidForegroundPolygon,
  parseRoomProject,
  pixelsPerInch,
  roomProjectSchema,
} from "@/domain/roomProject";

describe("customer room projects", () => {
  it("creates a validated project with safe defaults", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "project-1" });
    const project = createRoomProject(
      {
        dataUrl: "data:image/jpeg;base64,AA==",
        fileName: "room.jpg",
        width: 1600,
        height: 900,
      },
      new Date("2026-07-31T12:00:00.000Z"),
    );
    expect(roomProjectSchema.parse(project).id).toBe("project-1");
    expect(project.schemaVersion).toBe(7);
    expect(project.scenario).toBe("full-remodel");
    expect(project.openingQuad).toEqual([]);
    expect(project.openingDepthInches).toBeNull();
    expect(project.openingRearWidthInches).toBeNull();
    expect(project.foregroundPolygons).toEqual([]);
    expect(project.accessories.left.enabled).toBe(false);
    expect(project.hearthFrontCenter).toBeNull();
    expect(project.cleanedSource).toBeNull();
    expect(project.configuration).toMatchObject({
      fireplaceId: "864-trv-31k-clean-face",
      wallWidth: 144,
      cameraMode: "front",
      showDimensions: false,
    });
    vi.unstubAllGlobals();
  });

  it("migrates saved version 1 projects without losing customer work", () => {
    const migrated = parseRoomProject({
      schemaVersion: 1,
      id: "legacy-project",
      name: "Legacy room",
      createdAt: "2026-07-30T12:00:00.000Z",
      updatedAt: "2026-07-31T12:00:00.000Z",
      source: {
        dataUrl: "data:image/jpeg;base64,AA==",
        fileName: "legacy.jpg",
        width: 1600,
        height: 900,
      },
      wallQuad: [],
      referenceSegment: [],
      referenceInches: 144,
      comparison: 0.75,
      scenario: "insert",
    });
    expect(migrated).toMatchObject({
      schemaVersion: 7,
      id: "legacy-project",
      comparison: 0.75,
      openingQuad: [],
      openingWidthInches: 36,
      openingHeightInches: 30,
      openingDepthInches: null,
      openingRearWidthInches: null,
      foregroundPolygons: [],
      configuration: { wallWidth: 144 },
    });
  });

  it("migrates version 2 projects to empty foreground restoration", () => {
    const migrated = parseRoomProject({
      schemaVersion: 2,
      id: "version-two-project",
      name: "Measured insert",
      createdAt: "2026-07-30T12:00:00.000Z",
      updatedAt: "2026-07-31T12:00:00.000Z",
      source: {
        dataUrl: "data:image/jpeg;base64,AA==",
        fileName: "insert.jpg",
        width: 1600,
        height: 900,
      },
      wallQuad: [],
      referenceSegment: [],
      referenceInches: 144,
      comparison: 1,
      scenario: "insert",
      openingQuad: [],
      openingWidthInches: 40,
      openingHeightInches: 30,
    });
    expect(migrated).toMatchObject({
      schemaVersion: 7,
      id: "version-two-project",
      openingWidthInches: 40,
      openingDepthInches: null,
      openingRearWidthInches: null,
      foregroundPolygons: [],
    });
  });

  it("migrates version 3 foreground projects without inventing fit measurements", () => {
    const migrated = parseRoomProject({
      schemaVersion: 3,
      id: "version-three-project",
      name: "Foreground insert",
      createdAt: "2026-07-30T12:00:00.000Z",
      updatedAt: "2026-07-31T12:00:00.000Z",
      source: {
        dataUrl: "data:image/jpeg;base64,AA==",
        fileName: "insert.jpg",
        width: 1600,
        height: 900,
      },
      wallQuad: [],
      referenceSegment: [],
      referenceInches: 144,
      comparison: 1,
      scenario: "insert",
      openingQuad: [],
      openingWidthInches: 40,
      openingHeightInches: 30,
      foregroundPolygons: [
        [
          { x: 0.2, y: 0.2 },
          { x: 0.4, y: 0.2 },
          { x: 0.4, y: 0.4 },
        ],
      ],
    });
    expect(migrated).toMatchObject({
      schemaVersion: 7,
      openingDepthInches: null,
      openingRearWidthInches: null,
    });
    expect(migrated.foregroundPolygons).toHaveLength(1);
  });

  it("migrates version 4 projects with the last known design configuration", () => {
    const migrated = parseRoomProject(
      {
        schemaVersion: 4,
        id: "version-four-project",
        name: "Configured room",
        createdAt: "2026-07-30T12:00:00.000Z",
        updatedAt: "2026-07-31T12:00:00.000Z",
        source: {
          dataUrl: "data:image/jpeg;base64,AA==",
          fileName: "room.jpg",
          width: 1600,
          height: 900,
        },
        wallQuad: [],
        referenceSegment: [],
        referenceInches: 180,
        comparison: 1,
        scenario: "full-remodel",
        openingQuad: [],
        openingWidthInches: 36,
        openingHeightInches: 30,
        openingDepthInches: null,
        openingRearWidthInches: null,
        foregroundPolygons: [],
      },
      {
        ...createRoomProject(
          {
            dataUrl: "data:image/jpeg;base64,AA==",
            fileName: "fallback.jpg",
            width: 1600,
            height: 900,
          },
          new Date("2026-07-31T12:00:00.000Z"),
        ).configuration,
        fireplaceId: "4237-ember-glo-clean-face",
        faceOptionId: "4237-clean-face",
        stoneId: "brown-ledge",
      },
    );
    expect(migrated).toMatchObject({
      schemaVersion: 7,
      configuration: {
        wallWidth: 180,
        fireplaceId: "4237-ember-glo-clean-face",
        faceOptionId: "4237-clean-face",
        stoneId: "brown-ledge",
      },
    });
  });

  it("migrates version 5 designs with safe, disabled architectural accessories", () => {
    const current = createRoomProject(
      {
        dataUrl: "data:image/jpeg;base64,AA==",
        fileName: "room.jpg",
        width: 1600,
        height: 900,
      },
      new Date("2026-07-31T12:00:00.000Z"),
    );
    const migrated = parseRoomProject({ ...current, schemaVersion: 5, accessories: undefined });
    expect(migrated.schemaVersion).toBe(7);
    expect(migrated.accessories.left.enabled).toBe(false);
    expect(migrated.accessories.right.enabled).toBe(false);
  });

  it("migrates version 6 projects without inventing photo edits", () => {
    const current = createRoomProject(
      {
        dataUrl: "data:image/jpeg;base64,AA==",
        fileName: "room.jpg",
        width: 1600,
        height: 900,
      },
      new Date("2026-07-31T12:00:00.000Z"),
    );
    const migrated = parseRoomProject({
      ...current,
      schemaVersion: 6,
      hearthFrontCenter: undefined,
      cleanedSource: undefined,
    });
    expect(migrated).toMatchObject({
      schemaVersion: 7,
      hearthFrontCenter: null,
      cleanedSource: null,
    });
  });

  it("checks measured built-ins against the space beside the stone", () => {
    const side = {
      enabled: true,
      style: "bookcase" as const,
      finish: "warm-white" as const,
      width: 36,
      height: 84,
      gap: 6,
      shelfCount: 4,
      baseCabinet: true,
    };
    expect(builtInAvailableWidth(144, 60, side)).toBe(36);
    expect(builtInFits(144, 60, side)).toBe(true);
    expect(builtInFits(132, 60, side)).toBe(false);
  });

  it("accepts ordered foreground outlines and rejects crossing or tiny masks", () => {
    expect(
      isValidForegroundPolygon([
        { x: 0.2, y: 0.2 },
        { x: 0.4, y: 0.2 },
        { x: 0.4, y: 0.5 },
        { x: 0.2, y: 0.5 },
      ]),
    ).toBe(true);
    expect(
      isValidForegroundPolygon([
        { x: 0.2, y: 0.2 },
        { x: 0.4, y: 0.5 },
        { x: 0.4, y: 0.2 },
        { x: 0.2, y: 0.5 },
      ]),
    ).toBe(false);
    expect(
      isValidForegroundPolygon([
        { x: 0.2, y: 0.2 },
        { x: 0.201, y: 0.2 },
        { x: 0.201, y: 0.201 },
      ]),
    ).toBe(false);
  });

  it("calculates physical scale only after a complete reference segment", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "project-1" });
    const project = createRoomProject({
      dataUrl: "data:image/jpeg;base64,AA==",
      fileName: "room.jpg",
      width: 1600,
      height: 900,
    });
    expect(pixelsPerInch(project)).toBeNull();
    project.referenceSegment = [
      { x: 0.1, y: 0.5 },
      { x: 0.55, y: 0.5 },
    ];
    project.referenceInches = 72;
    expect(pixelsPerInch(project)).toBeCloseTo(10);
    vi.unstubAllGlobals();
  });

  it("requires both the wall plane and known measurement", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "project-1" });
    const project = createRoomProject({
      dataUrl: "data:image/jpeg;base64,AA==",
      fileName: "room.jpg",
      width: 1000,
      height: 1000,
    });
    expect(calibrationLabel(project)).toBe("Mark the four wall corners");
    project.wallQuad = [
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.1 },
      { x: 0.9, y: 0.9 },
      { x: 0.1, y: 0.9 },
    ];
    expect(calibrationLabel(project)).toBe("Mark a known measurement");
    project.referenceSegment = [
      { x: 0.1, y: 0.7 },
      { x: 0.9, y: 0.7 },
    ];
    expect(isRoomProjectCalibrated(project)).toBe(true);
    expect(calibrationLabel(project)).toBe("Dimensionally scaled");
    vi.unstubAllGlobals();
  });

  it("requires a measured four-corner opening for insert presentation", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "insert-project" });
    const project = createRoomProject({
      dataUrl: "data:image/jpeg;base64,AA==",
      fileName: "insert.jpg",
      width: 1000,
      height: 1000,
    });
    project.wallQuad = [
      { x: 0.05, y: 0.05 },
      { x: 0.95, y: 0.05 },
      { x: 0.95, y: 0.95 },
      { x: 0.05, y: 0.95 },
    ];
    project.referenceSegment = [
      { x: 0.05, y: 0.8 },
      { x: 0.95, y: 0.8 },
    ];
    project.scenario = "insert";
    expect(isRoomProjectCalibrated(project)).toBe(true);
    expect(isRoomProjectReady(project)).toBe(false);
    expect(calibrationLabel(project)).toBe("Mark the existing fireplace opening");
    project.openingQuad = [
      { x: 0.65, y: 0.4 },
      { x: 0.35, y: 0.4 },
      { x: 0.35, y: 0.7 },
      { x: 0.65, y: 0.7 },
    ];
    expect(isInsertOpeningCalibrated(project)).toBe(false);
    expect(calibrationLabel(project)).toBe("Opening calibration needs attention");
    project.openingQuad = [
      { x: 0.35, y: 0.4 },
      { x: 0.65, y: 0.4 },
      { x: 0.65, y: 0.7 },
      { x: 0.35, y: 0.7 },
    ];
    expect(isInsertOpeningCalibrated(project)).toBe(true);
    expect(isInsertOpeningFitMeasured(project)).toBe(false);
    expect(isRoomProjectReady(project)).toBe(true);
    expect(calibrationLabel(project)).toBe("Dimensionally scaled");
    project.openingDepthInches = 16.5;
    project.openingRearWidthInches = 24;
    expect(isInsertOpeningFitMeasured(project)).toBe(true);
    vi.unstubAllGlobals();
  });

  it("scales an appliance face from the measured opening instead of the wall", () => {
    vi.stubGlobal("crypto", { randomUUID: () => "fit-project" });
    const project = createRoomProject({
      dataUrl: "data:image/jpeg;base64,AA==",
      fileName: "fit.jpg",
      width: 1200,
      height: 800,
    });
    project.openingWidthInches = 40;
    project.openingHeightInches = 30;
    const bounds = faceBoundsWithinOpening(project, 48, 36);
    expect(bounds.left).toBeCloseTo(-0.1);
    expect(bounds.top).toBeCloseTo(-0.1);
    expect(bounds.right).toBeCloseTo(1.1);
    expect(bounds.bottom).toBeCloseTo(1.1);
    vi.unstubAllGlobals();
  });
});
