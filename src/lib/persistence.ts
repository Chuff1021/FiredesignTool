import { z } from "zod";
import {
  DEFAULT_CONFIGURATION,
  featureWallConfigurationSchema,
  normalizeConfiguration,
  type FeatureWallConfiguration,
} from "@/domain/configuration";

export const STORAGE_KEY = "firedesign:feature-wall:v5";
export const LEGACY_V4_STORAGE_KEY = "firedesign:feature-wall:v4";
export const LEGACY_V3_STORAGE_KEY = "firedesign:feature-wall:v3";
export const LEGACY_V2_STORAGE_KEY = "firedesign:feature-wall:v2";
export const LEGACY_STORAGE_KEY = "firedesign:feature-wall:v1";

const legacyV4ConfigurationSchema = z.object({
  schemaVersion: z.literal(4),
  wallWidth: z.number().finite(),
  wallHeight: z.number().finite(),
  stoneWidth: z.number().finite(),
  fireplaceElevation: z.number().finite(),
  mantelHeightAboveBase: z.number().finite(),
  fireplaceId: z.string(),
  faceOptionId: z.string(),
  stoneId: z.string(),
  mantelProductId: z.string(),
  mantelWidth: z.number().positive(),
  mantelFinishId: z.string(),
  hearthEnabled: z.boolean(),
  cameraMode: z.enum(["front", "perspective"]),
  showDimensions: z.boolean(),
});

const legacyV3ConfigurationSchema = z.object({
  schemaVersion: z.literal(3),
  wallWidth: z.number().finite(),
  wallHeight: z.number().finite(),
  stoneWidth: z.number().finite(),
  fireplaceElevation: z.number().finite(),
  mantelHeightAboveBase: z.number().finite(),
  fireplaceId: z.enum([
    "864-trv-31k-clean-face",
    "864-trv-31k-deluxe",
    "4237-ember-glo-clean-face",
  ]),
  faceOptionId: z.enum([
    "clean-face",
    "classic-arch",
    "arched-french-country",
    "metropolitan",
    "rectangle-double-door",
    "4237-clean-face",
  ]),
  stoneId: z.enum(["kentucky-ledge", "brown-ledge"]),
  mantelProductId: z.enum(["zachary-smooth", "zachary-wood", "linear"]),
  mantelWidth: z.union([z.literal(48), z.literal(60), z.literal(72), z.literal(84)]),
  mantelFinishId: z.enum([
    "whitewash",
    "graywash",
    "little-river",
    "pearl",
    "graphite",
    "mocha",
    "onyx",
    "saddle",
  ]),
  hearthEnabled: z.boolean(),
  hearthStoneCount: z.union([z.literal(3), z.literal(4), z.literal(5)]),
  cameraMode: z.enum(["front", "perspective"]),
  showDimensions: z.boolean(),
});

const legacyV2ConfigurationSchema = z.object({
  schemaVersion: z.literal(2),
  wallWidth: z.number().finite(),
  wallHeight: z.number().finite(),
  stoneWidth: z.number().finite(),
  fireplaceElevation: z.number().finite(),
  mantelHeightAboveBase: z.number().finite(),
  fireplaceId: z.enum([
    "864-trv-31k-clean-face",
    "864-trv-31k-deluxe",
    "4237-ember-glo-clean-face",
  ]),
  faceOptionId: z.enum([
    "clean-face",
    "classic-arch",
    "arched-french-country",
    "metropolitan",
    "rectangle-double-door",
    "4237-clean-face",
  ]),
  stoneId: z.enum(["kentucky-ledge", "brown-ledge"]),
  mantelWidth: z.union([z.literal(60), z.literal(84)]),
  mantelFinishId: z.enum(["pearl", "graphite", "mocha", "onyx", "saddle"]),
  cameraMode: z.enum(["front", "perspective"]),
  showDimensions: z.boolean(),
});

const legacyConfigurationSchema = z.object({
  schemaVersion: z.literal(1),
  wallWidth: z.number().finite(),
  wallHeight: z.number().finite(),
  fireplaceElevation: z.number().finite(),
  mantelClearance: z.number().finite(),
  cameraMode: z.enum(["front", "perspective"]),
  showDimensions: z.boolean(),
});

export type PersistenceResult = {
  configuration: FeatureWallConfiguration;
  recovered: boolean;
  reason?: string;
};

function parseCurrent(raw: string): PersistenceResult {
  try {
    const parsed: unknown = JSON.parse(raw);
    const result = featureWallConfigurationSchema.safeParse(parsed);
    if (result.success) {
      return { configuration: normalizeConfiguration(result.data), recovered: false };
    }
  } catch {
    // The common recovery response is returned below.
  }
  return {
    configuration: DEFAULT_CONFIGURATION,
    recovered: true,
    reason: "Saved layout was unreadable and safe defaults were restored.",
  };
}

function migrateV3(raw: string): PersistenceResult {
  try {
    const legacy = legacyV3ConfigurationSchema.parse(JSON.parse(raw));
    return {
      configuration: normalizeConfiguration({
        ...legacy,
        schemaVersion: undefined,
      }),
      recovered: false,
    };
  } catch {
    return {
      configuration: DEFAULT_CONFIGURATION,
      recovered: true,
      reason: "Saved layout was invalid and safe defaults were restored.",
    };
  }
}

function migrateV4(raw: string): PersistenceResult {
  try {
    const legacy = legacyV4ConfigurationSchema.parse(JSON.parse(raw));
    return {
      configuration: normalizeConfiguration({
        ...legacy,
        schemaVersion: undefined,
      }),
      recovered: false,
    };
  } catch {
    return {
      configuration: DEFAULT_CONFIGURATION,
      recovered: true,
      reason: "Saved layout was invalid and safe defaults were restored.",
    };
  }
}

function migrateV2(raw: string): PersistenceResult {
  try {
    const legacy = legacyV2ConfigurationSchema.parse(JSON.parse(raw));
    return {
      configuration: normalizeConfiguration({
        ...legacy,
        schemaVersion: undefined,
        mantelProductId: "linear",
        hearthEnabled: false,
      }),
      recovered: false,
    };
  } catch {
    return {
      configuration: DEFAULT_CONFIGURATION,
      recovered: true,
      reason: "Saved layout was invalid and safe defaults were restored.",
    };
  }
}

function migrateV1(raw: string): PersistenceResult {
  try {
    const legacy = legacyConfigurationSchema.parse(JSON.parse(raw));
    return {
      configuration: normalizeConfiguration({
        wallWidth: legacy.wallWidth,
        wallHeight: legacy.wallHeight,
        fireplaceElevation: legacy.fireplaceElevation,
        mantelHeightAboveBase: 36.75 + legacy.mantelClearance,
        cameraMode: legacy.cameraMode,
        showDimensions: legacy.showDimensions,
      }),
      recovered: false,
    };
  } catch {
    return {
      configuration: DEFAULT_CONFIGURATION,
      recovered: true,
      reason: "Saved layout was invalid and safe defaults were restored.",
    };
  }
}

export function readPersistedConfiguration(
  storage: Pick<Storage, "getItem">,
): PersistenceResult {
  const current = storage.getItem(STORAGE_KEY);
  if (current) return parseCurrent(current);

  const legacyV4 = storage.getItem(LEGACY_V4_STORAGE_KEY);
  if (legacyV4) return migrateV4(legacyV4);

  const legacyV3 = storage.getItem(LEGACY_V3_STORAGE_KEY);
  if (legacyV3) return migrateV3(legacyV3);

  const legacyV2 = storage.getItem(LEGACY_V2_STORAGE_KEY);
  if (legacyV2) return migrateV2(legacyV2);

  const legacy = storage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) return migrateV1(legacy);

  return { configuration: DEFAULT_CONFIGURATION, recovered: false };
}

export function writePersistedConfiguration(
  storage: Pick<Storage, "setItem">,
  configuration: FeatureWallConfiguration,
): void {
  const validated = featureWallConfigurationSchema.parse(configuration);
  storage.setItem(STORAGE_KEY, JSON.stringify(validated));
}

export function clearPersistedConfiguration(storage: Pick<Storage, "removeItem">): void {
  storage.removeItem(STORAGE_KEY);
  storage.removeItem(LEGACY_V4_STORAGE_KEY);
  storage.removeItem(LEGACY_V3_STORAGE_KEY);
  storage.removeItem(LEGACY_V2_STORAGE_KEY);
  storage.removeItem(LEGACY_STORAGE_KEY);
}
