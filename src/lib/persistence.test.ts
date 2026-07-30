import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIGURATION } from "@/domain/configuration";
import {
  STORAGE_KEY,
  readPersistedConfiguration,
  writePersistedConfiguration,
} from "@/lib/persistence";

describe("configuration persistence", () => {
  it("restores a validated last-known-good configuration", () => {
    const saved = { ...DEFAULT_CONFIGURATION, wallWidth: 168 };
    const storage = { getItem: vi.fn(() => JSON.stringify(saved)) };
    expect(readPersistedConfiguration(storage)).toEqual({
      configuration: saved,
      recovered: false,
    });
  });

  it("recovers safely from corrupt state", () => {
    const storage = { getItem: vi.fn(() => "{not-json") };
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
