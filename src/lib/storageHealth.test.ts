import { describe, expect, it } from "vitest";
import {
  backupFreshness,
  formatStorageBytes,
  normalizeProjectStorageError,
  projectImageStorageBytes,
  readRoomProjectBackupRecord,
  readStorageHealth,
  requireStorageCapacity,
  writeRoomProjectBackupRecord,
} from "@/lib/storageHealth";

describe("customer project storage health", () => {
  it("classifies available capacity and persistent storage", async () => {
    await expect(
      readStorageHealth({
        estimate: async () => ({ usage: 1_000_000_000, quota: 10_000_000_000 }),
        persisted: async () => true,
      }),
    ).resolves.toMatchObject({
      status: "ready",
      availableBytes: 9_000_000_000,
      persistent: true,
    });
    await expect(
      readStorageHealth({
        estimate: async () => ({ usage: 950 * 1024 * 1024, quota: 1024 * 1024 * 1024 }),
        persisted: async () => false,
      }),
    ).resolves.toMatchObject({ status: "critical", persistent: false });
  });

  it("allows unsupported estimates but blocks a write before the safety reserve is consumed", async () => {
    await expect(requireStorageCapacity(10_000, undefined)).resolves.toBeUndefined();
    await expect(
      requireStorageCapacity(40 * 1024 * 1024, {
        estimate: async () => ({ usage: 940 * 1024 * 1024, quota: 1024 * 1024 * 1024 }),
      }),
    ).rejects.toThrow("Not enough browser storage remains");
  });

  it("conservatively budgets encoded images and formats operator-facing capacity", () => {
    expect(projectImageStorageBytes(["data:image/jpeg;base64,AA=="])).toBeGreaterThan(
      1024 * 1024,
    );
    expect(formatStorageBytes(2.25 * 1024 * 1024 * 1024)).toBe("2.3 GB");
    expect(formatStorageBytes(320 * 1024 * 1024)).toBe("320 MB");
  });

  it("records the exact backed-up project set and detects later changes", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };
    const projects = [
      { id: "b", updatedAt: "2026-08-01T12:00:00.000Z" },
      { id: "a", updatedAt: "2026-08-01T11:00:00.000Z" },
    ];
    const record = writeRoomProjectBackupRecord(
      storage,
      projects,
      new Date("2026-08-01T13:00:00.000Z"),
    );
    expect(readRoomProjectBackupRecord(storage)).toEqual(record);
    expect(backupFreshness(projects, record)).toBe("current");
    expect(
      backupFreshness(
        [{ ...projects[0]!, updatedAt: "2026-08-01T14:00:00.000Z" }, projects[1]!],
        record,
      ),
    ).toBe("outdated");
    expect(backupFreshness(projects, null)).toBe("never");
    expect(backupFreshness([], record)).toBe("empty");
  });

  it("ignores corrupt backup metadata and explains native quota failures", () => {
    expect(readRoomProjectBackupRecord({ getItem: () => "{broken" })).toBeNull();
    expect(
      normalizeProjectStorageError(
        new DOMException("Quota reached", "QuotaExceededError"),
        "Save failed",
      ).message,
    ).toContain("Existing customer work is unchanged");
    const unknown = new Error("Disk unavailable");
    expect(normalizeProjectStorageError(unknown, "Save failed")).toBe(unknown);
  });
});
