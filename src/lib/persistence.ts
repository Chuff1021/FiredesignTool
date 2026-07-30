import {
  DEFAULT_CONFIGURATION,
  featureWallConfigurationSchema,
  type FeatureWallConfiguration,
} from "@/domain/configuration";

export const STORAGE_KEY = "firedesign:feature-wall:v1";

export type PersistenceResult = {
  configuration: FeatureWallConfiguration;
  recovered: boolean;
  reason?: string;
};

export function readPersistedConfiguration(
  storage: Pick<Storage, "getItem">,
): PersistenceResult {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) {
    return { configuration: DEFAULT_CONFIGURATION, recovered: false };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    const result = featureWallConfigurationSchema.safeParse(parsed);
    if (result.success) {
      return { configuration: result.data, recovered: false };
    }

    return {
      configuration: DEFAULT_CONFIGURATION,
      recovered: true,
      reason: "Saved layout was invalid and safe defaults were restored.",
    };
  } catch {
    return {
      configuration: DEFAULT_CONFIGURATION,
      recovered: true,
      reason: "Saved layout was unreadable and safe defaults were restored.",
    };
  }
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
}
