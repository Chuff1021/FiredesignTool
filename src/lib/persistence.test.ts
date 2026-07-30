import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIGURATION } from "@/domain/configuration";
import {
  LEGACY_STORAGE_KEY,
  STORAGE_KEY,
  readPersistedConfiguration,
  writePersistedConfiguration,
} from "@/lib/persistence";

describe("configuration persistence", () => {
  it("restores a validated last-known-good configuration", () => {
    const saved = { ...DEFAULT_CONFIGURATION, wallWidth: 168, stoneWidth: 108 };
    const storage = {
      getItem: vi.fn((key: string) => (key === STORAGE_KEY ? JSON.stringify(saved) : null)),
    };
    expect(readPersistedConfiguration(storage)).toEqual({
      configuration: saved,
      recovered: false,
    });
  });

  it("migrates the original single-combination layout", () => {
    const legacy = {
      schemaVersion: 1,
      wallWidth: 168,
      wallHeight: 108,
      fireplaceElevation: 4,
      mantelClearance: 10,
      cameraMode: "front",
      showDimensions: true,
    };
    const storage = {
      getItem: vi.fn((key: string) =>
        key === LEGACY_STORAGE_KEY ? JSON.stringify(legacy) : null,
      ),
    };
    const result = readPersistedConfiguration(storage);
    expect(result.recovered).toBe(false);
    expect(result.configuration).toMatchObject({
      schemaVersion: 2,
      wallWidth: 168,
      fireplaceElevation: 4,
      mantelHeightAboveBase: 46.75,
      fireplaceId: "864-trv-31k-clean-face",
    });
  });

  it("recovers safely from corrupt state", () => {
    const storage = {
      getItem: vi.fn((key: string) => (key === STORAGE_KEY ? "{not-json" : null)),
    };
    const result = readPersistedConfiguration(storage);
    expect(result.configuration).toEqual(DEFAULT_CONFIGURATION);
    expect(result.recovered).toBe(true);
  });

  it("validates before writing", () => {
    const storage = { setItem: vi.fn() };
    writePersistedConfiguration(storage, DEFAULT_CONFIGURATION);
    expect(storage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      JSON.stringify(DEFAULT_CONFIGURATION),
    );
  });
});
