import { z } from "zod";
import {
  DEFAULT_CONFIGURATION,
  featureWallConfigurationSchema,
  normalizeConfiguration,
  type FeatureWallConfiguration,
} from "@/domain/configuration";

export const STORAGE_KEY = "firedesign:feature-wall:v2";
export const LEGACY_STORAGE_KEY = "firedesign:feature-wall:v1";

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
      return { configuration: result.data, recovered: false };
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

function migrateLegacy(raw: string): PersistenceResult {
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

  const legacy = storage.getItem(LEGACY_STORAGE_KEY);
  if (legacy) return migrateLegacy(legacy);

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
  storage.removeItem(LEGACY_STORAGE_KEY);
}
