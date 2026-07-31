import { describe, expect, it, vi } from "vitest";
import {
  calibrationLabel,
  createRoomProject,
  faceBoundsWithinOpening,
  isInsertOpeningCalibrated,
  isRoomProjectCalibrated,
  isRoomProjectReady,
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
    expect(project.schemaVersion).toBe(2);
    expect(project.scenario).toBe("full-remodel");
    expect(project.openingQuad).toEqual([]);
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
      schemaVersion: 2,
      id: "legacy-project",
      comparison: 0.75,
      openingQuad: [],
      openingWidthInches: 36,
      openingHeightInches: 30,
    });
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
    expect(isRoomProjectReady(project)).toBe(true);
    expect(calibrationLabel(project)).toBe("Dimensionally scaled");
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
