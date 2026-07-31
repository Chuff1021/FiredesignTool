import { z } from "zod";

const MEBIBYTE = 1024 * 1024;
const MINIMUM_STORAGE_RESERVE_BYTES = 32 * MEBIBYTE;
const BACKUP_RECORD_KEY = "firedesign:room-project-backup:v1";

export type StorageHealth = {
  status: "ready" | "warning" | "critical" | "unavailable";
  usageBytes: number | null;
  quotaBytes: number | null;
  availableBytes: number | null;
  persistent: boolean | null;
};

export const UNAVAILABLE_STORAGE_HEALTH: StorageHealth = Object.freeze({
  status: "unavailable",
  usageBytes: null,
  quotaBytes: null,
  availableBytes: null,
  persistent: null,
});

type StorageManagerLike = {
  estimate?: () => Promise<{ usage?: number; quota?: number }>;
  persisted?: () => Promise<boolean>;
};

const backupRecordSchema = z
  .object({
    schemaVersion: z.literal(1),
    backedUpAt: z.string().datetime(),
    projects: z
      .array(
        z
          .object({
            id: z.string().min(1),
            updatedAt: z.string().datetime(),
          })
          .strict(),
      )
      .max(100),
  })
  .strict();

export type RoomProjectBackupRecord = z.infer<typeof backupRecordSchema>;

export type BackupFreshness = "empty" | "current" | "outdated" | "never";

export function formatStorageBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return "Unavailable";
  if (bytes >= 1024 * MEBIBYTE) return `${(bytes / (1024 * MEBIBYTE)).toFixed(1)} GB`;
  return `${Math.max(0, Math.round(bytes / MEBIBYTE))} MB`;
}

export async function readStorageHealth(
  manager: StorageManagerLike | undefined = globalThis.navigator?.storage,
): Promise<StorageHealth> {
  if (!manager?.estimate) return UNAVAILABLE_STORAGE_HEALTH;
  try {
    const [estimate, persistent] = await Promise.all([
      manager.estimate(),
      manager.persisted ? manager.persisted().catch(() => null) : Promise.resolve(null),
    ]);
    const usageBytes =
      typeof estimate.usage === "number" && Number.isFinite(estimate.usage)
        ? Math.max(0, estimate.usage)
        : null;
    const quotaBytes =
      typeof estimate.quota === "number" && Number.isFinite(estimate.quota)
        ? Math.max(0, estimate.quota)
        : null;
    const availableBytes =
      usageBytes !== null && quotaBytes !== null ? Math.max(0, quotaBytes - usageBytes) : null;
    const usageRatio =
      usageBytes !== null && quotaBytes !== null && quotaBytes > 0
        ? usageBytes / quotaBytes
        : null;
    const status =
      availableBytes !== null &&
      (availableBytes < 128 * MEBIBYTE || (usageRatio !== null && usageRatio >= 0.9))
        ? "critical"
        : availableBytes !== null &&
            (availableBytes < 512 * MEBIBYTE || (usageRatio !== null && usageRatio >= 0.75))
          ? "warning"
          : "ready";
    return { status, usageBytes, quotaBytes, availableBytes, persistent };
  } catch {
    return UNAVAILABLE_STORAGE_HEALTH;
  }
}

export async function requireStorageCapacity(
  requiredBytes: number,
  manager: StorageManagerLike | undefined = globalThis.navigator?.storage,
): Promise<void> {
  if (!Number.isFinite(requiredBytes) || requiredBytes < 0) {
    throw new Error("The required project storage size is invalid.");
  }
  const health = await readStorageHealth(manager);
  if (health.availableBytes === null || health.quotaBytes === null) return;
  const reserve = Math.max(
    MINIMUM_STORAGE_RESERVE_BYTES,
    Math.min(256 * MEBIBYTE, health.quotaBytes * 0.05),
  );
  if (health.availableBytes < requiredBytes + reserve) {
    throw new Error(
      "Not enough browser storage remains for this customer project. Back up the project library, then remove older projects before trying again.",
    );
  }
}

export function projectImageStorageBytes(dataUrls: readonly string[]): number {
  return dataUrls.reduce(
    (total, dataUrl) => total + new TextEncoder().encode(dataUrl).byteLength * 2 + MEBIBYTE,
    0,
  );
}

export function readRoomProjectBackupRecord(
  storage: Pick<Storage, "getItem">,
): RoomProjectBackupRecord | null {
  try {
    const value = storage.getItem(BACKUP_RECORD_KEY);
    if (!value) return null;
    const parsed = backupRecordSchema.safeParse(JSON.parse(value));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeRoomProjectBackupRecord(
  storage: Pick<Storage, "setItem">,
  projects: readonly { id: string; updatedAt: string }[],
  now = new Date(),
): RoomProjectBackupRecord {
  const record = backupRecordSchema.parse({
    schemaVersion: 1,
    backedUpAt: now.toISOString(),
    projects: projects
      .map(({ id, updatedAt }) => ({ id, updatedAt }))
      .sort((left, right) => left.id.localeCompare(right.id)),
  });
  storage.setItem(BACKUP_RECORD_KEY, JSON.stringify(record));
  return record;
}

export function backupFreshness(
  projects: readonly { id: string; updatedAt: string }[],
  record: RoomProjectBackupRecord | null,
): BackupFreshness {
  if (projects.length === 0) return "empty";
  if (!record) return "never";
  const current = projects
    .map(({ id, updatedAt }) => ({ id, updatedAt }))
    .sort((left, right) => left.id.localeCompare(right.id));
  if (current.length !== record.projects.length) return "outdated";
  return current.every(
    (project, index) =>
      project.id === record.projects[index]?.id &&
      project.updatedAt === record.projects[index]?.updatedAt,
  )
    ? "current"
    : "outdated";
}

export function normalizeProjectStorageError(error: unknown, fallback: string): Error {
  if (
    error instanceof DOMException &&
    (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")
  ) {
    return new Error(
      "Browser storage is full. Existing customer work is unchanged; back up the library and remove older projects before trying again.",
    );
  }
  return error instanceof Error ? error : new Error(fallback);
}
