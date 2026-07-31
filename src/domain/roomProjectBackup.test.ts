import { describe, expect, it } from "vitest";
import { createRoomProject } from "@/domain/roomProject";
import {
  createRoomProjectBackup,
  parseRoomProjectBackup,
  serializeRoomProjectBackup,
} from "@/domain/roomProjectBackup";

function project(id: string) {
  return {
    ...createRoomProject(
      {
        dataUrl: "data:image/jpeg;base64,AA==",
        fileName: `${id}.jpg`,
        width: 1600,
        height: 900,
      },
      new Date("2026-08-01T12:00:00.000Z"),
    ),
    id,
    name: `Project ${id}`,
  };
}

describe("customer project library backups", () => {
  it("round-trips complete projects through a checksummed format", async () => {
    const original = project("smith-room");
    original.configuration = {
      ...original.configuration,
      fireplaceId: "4237-ember-glo-clean-face",
      faceOptionId: "4237-clean-face",
      stoneId: "brown-ledge",
    };
    const backup = await createRoomProjectBackup(
      [original],
      new Date("2026-08-01T18:00:00.000Z"),
    );
    const restored = await parseRoomProjectBackup(serializeRoomProjectBackup(backup));

    expect(restored).toMatchObject({
      kind: "firedesign-room-project-library",
      schemaVersion: 1,
      exportedAt: "2026-08-01T18:00:00.000Z",
      projects: [
        {
          id: "smith-room",
          source: { dataUrl: "data:image/jpeg;base64,AA==" },
          configuration: {
            fireplaceId: "4237-ember-glo-clean-face",
            stoneId: "brown-ledge",
          },
        },
      ],
      integrity: { algorithm: "SHA-256" },
    });
    expect(restored.integrity.value).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects any content changed after export", async () => {
    const backup = await createRoomProjectBackup([project("original")]);
    const tampered = JSON.parse(serializeRoomProjectBackup(backup)) as {
      projects: Array<{ name: string }>;
    };
    tampered.projects[0]!.name = "Changed after export";

    await expect(parseRoomProjectBackup(JSON.stringify(tampered))).rejects.toThrow(
      "failed its integrity check",
    );
  });

  it("rejects duplicate identifiers and unsupported image payloads", async () => {
    const duplicate = project("duplicate");
    await expect(createRoomProjectBackup([duplicate, duplicate])).rejects.toThrow(
      "duplicate project ID",
    );
    await expect(
      createRoomProjectBackup([
        {
          ...project("unsupported"),
          source: {
            ...project("unsupported").source,
            dataUrl: "data:image/svg+xml;base64,PHN2Zy8+",
          },
        },
      ]),
    ).rejects.toThrow("supported room photograph");
  });

  it("rejects malformed files before attempting a restore", async () => {
    await expect(parseRoomProjectBackup("{not-json")).rejects.toThrow(
      "not a valid FireDesign project backup",
    );
    await expect(parseRoomProjectBackup(JSON.stringify({ schemaVersion: 1 }))).rejects.toThrow(
      "not a supported FireDesign project backup",
    );
  });
});
