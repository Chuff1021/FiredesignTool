import { describe, expect, it, vi } from "vitest";
import { DEFAULT_CONFIGURATION } from "@/domain/configuration";
import {
  LEGACY_STORAGE_KEY,
  LEGACY_V2_STORAGE_KEY,
  LEGACY_V3_STORAGE_KEY,
  LEGACY_V4_STORAGE_KEY,
  LEGACY_V5_STORAGE_KEY,
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

  it("retains freely positioned non-combustible mantel heights", () => {
    const saved = {
      ...DEFAULT_CONFIGURATION,
      mantelHeightAboveBase: 44.75,
      mantelProductId: "zachary-smooth",
      mantelWidth: 72,
      mantelFinishId: "graywash",
    };
    const storage = {
      getItem: vi.fn((key: string) => (key === STORAGE_KEY ? JSON.stringify(saved) : null)),
    };
    expect(readPersistedConfiguration(storage).configuration.mantelHeightAboveBase).toBe(44.75);
  });

  it("migrates version-three hearths to the stone-matched model", () => {
    const legacy = {
      ...DEFAULT_CONFIGURATION,
      schemaVersion: 3,
      stoneWidth: 90,
      hearthEnabled: true,
      hearthStoneCount: 5,
    };
    const storage = {
      getItem: vi.fn((key: string) =>
        key === LEGACY_V3_STORAGE_KEY ? JSON.stringify(legacy) : null,
      ),
    };
    const result = readPersistedConfiguration(storage);
    expect(result.configuration).toMatchObject({
      schemaVersion: 6,
      catalogVersion: "2026.08.13-1",
      stoneWidth: 90,
      hearthEnabled: true,
    });
    expect(result.configuration).not.toHaveProperty("hearthStoneCount");
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
      schemaVersion: 6,
      wallWidth: 168,
      fireplaceElevation: 4,
      mantelHeightAboveBase: 46.75,
      fireplaceId: "864-trv-31k-clean-face",
    });
  });

  it("migrates version-two mantel selections without changing the approved product", () => {
    const legacy = {
      schemaVersion: 2,
      wallWidth: 144,
      wallHeight: 108,
      stoneWidth: 96,
      fireplaceElevation: 0,
      mantelHeightAboveBase: 44.75,
      fireplaceId: "864-trv-31k-clean-face",
      faceOptionId: "clean-face",
      stoneId: "kentucky-ledge",
      mantelWidth: 84,
      mantelFinishId: "onyx",
      cameraMode: "front",
      showDimensions: true,
    };
    const storage = {
      getItem: vi.fn((key: string) =>
        key === LEGACY_V2_STORAGE_KEY ? JSON.stringify(legacy) : null,
      ),
    };
    expect(readPersistedConfiguration(storage)).toMatchObject({
      configuration: {
        schemaVersion: 6,
        mantelProductId: "linear",
        mantelWidth: 84,
        mantelFinishId: "onyx",
        hearthEnabled: false,
      },
      recovered: false,
    });
  });

  it("attaches the approved catalog release when migrating version four", () => {
    const legacy = {
      schemaVersion: 4,
      wallWidth: 180,
      wallHeight: 108,
      stoneWidth: 100,
      fireplaceElevation: 8,
      mantelHeightAboveBase: 50,
      fireplaceId: "864-trv-31k-deluxe",
      faceOptionId: "metropolitan",
      stoneId: "brown-ledge",
      mantelProductId: "linear",
      mantelWidth: 84,
      mantelFinishId: "onyx",
      hearthEnabled: true,
      cameraMode: "front",
      showDimensions: true,
    };
    const storage = {
      getItem: vi.fn((key: string) =>
        key === LEGACY_V4_STORAGE_KEY ? JSON.stringify(legacy) : null,
      ),
    };
    expect(readPersistedConfiguration(storage)).toMatchObject({
      configuration: {
        schemaVersion: 6,
        catalogVersion: "2026.08.13-1",
        fireplaceId: "864-trv-31k-deluxe",
        faceOptionId: "metropolitan",
        stoneId: "brown-ledge",
      },
      recovered: false,
    });
  });

  it("adds the model default fireback when migrating version five", () => {
    const legacy: Record<string, unknown> = { ...DEFAULT_CONFIGURATION, schemaVersion: 5 };
    delete legacy.firebackOptionId;
    const storage = {
      getItem: vi.fn((key: string) =>
        key === LEGACY_V5_STORAGE_KEY ? JSON.stringify(legacy) : null,
      ),
    };
    expect(readPersistedConfiguration(storage)).toMatchObject({
      configuration: {
        schemaVersion: 6,
        fireplaceId: DEFAULT_CONFIGURATION.fireplaceId,
        firebackOptionId: "common-brick",
      },
      recovered: false,
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
