import { describe, expect, it, vi } from "vitest";
import {
  calibrationLabel,
  createRoomProject,
  isRoomProjectCalibrated,
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
    expect(project.scenario).toBe("full-remodel");
    vi.unstubAllGlobals();
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
});
