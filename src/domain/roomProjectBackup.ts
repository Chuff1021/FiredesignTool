import { z } from "zod";
import { APP_VERSION } from "@/domain/catalog";
import { catalogRepository } from "@/domain/catalogRepository";
import { MAX_ROOM_IMAGE_EDGE, MAX_ROOM_IMAGE_PIXELS } from "@/domain/roomImageConstraints";
import { parseRoomProject, roomProjectSchema, type RoomProject } from "@/domain/roomProject";

export const ROOM_PROJECT_BACKUP_KIND = "firedesign-room-project-library";
export const ROOM_PROJECT_BACKUP_EXTENSION = ".firedesign";
export const MAX_ROOM_PROJECTS = 100;
export const MAX_ROOM_BACKUP_BYTES = 512 * 1024 * 1024;
export const MAX_ROOM_PROJECT_IMAGE_DATA_URL_BYTES = 42 * 1024 * 1024;

const backupEnvelopeSchema = z
  .object({
    kind: z.literal(ROOM_PROJECT_BACKUP_KIND),
    schemaVersion: z.literal(1),
    exportedAt: z.string().datetime(),
    applicationVersion: z.string().min(1).max(40),
    catalogVersion: z.string().min(1).max(80),
    projects: z.array(z.unknown()).min(1).max(MAX_ROOM_PROJECTS),
    integrity: z
      .object({
        algorithm: z.literal("SHA-256"),
        value: z.string().regex(/^[a-f0-9]{64}$/),
      })
      .strict(),
  })
  .strict();

type BackupPayload = Omit<z.infer<typeof backupEnvelopeSchema>, "integrity">;

export type RoomProjectBackup = BackupPayload & {
  projects: RoomProject[];
  integrity: {
    algorithm: "SHA-256";
    value: string;
  };
};

function encodedBytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

async function sha256(value: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("This browser cannot verify project backup integrity.");
  }
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join(
    "",
  );
}

function validateProjectImage(project: RoomProject): void {
  const dataUrl = project.source.dataUrl;
  const prefix = /^data:image\/(?:jpeg|png|webp);base64,/i.exec(dataUrl);
  if (!prefix) {
    throw new Error(`${project.name} does not contain a supported room photograph.`);
  }
  if (encodedBytes(dataUrl) > MAX_ROOM_PROJECT_IMAGE_DATA_URL_BYTES) {
    throw new Error(`${project.name} contains a room photograph that is too large.`);
  }
  const payload = dataUrl.slice(prefix[0].length);
  if (payload.length === 0 || /[^a-z0-9+/=]/i.test(payload)) {
    throw new Error(`${project.name} contains an invalid room photograph.`);
  }
  if (
    Math.max(project.source.width, project.source.height) > MAX_ROOM_IMAGE_EDGE ||
    project.source.width * project.source.height > MAX_ROOM_IMAGE_PIXELS
  ) {
    throw new Error(`${project.name} exceeds the supported room photograph dimensions.`);
  }
}

function validateProjects(candidates: unknown[]): RoomProject[] {
  const projects = candidates.map((candidate) => parseRoomProject(candidate));
  const identifiers = new Set<string>();
  for (const project of projects) {
    if (identifiers.has(project.id)) {
      throw new Error(`The backup contains duplicate project ID ${project.id}.`);
    }
    identifiers.add(project.id);
    validateProjectImage(project);
  }
  return projects;
}

function payloadFromEnvelope(envelope: z.infer<typeof backupEnvelopeSchema>): BackupPayload {
  return {
    kind: envelope.kind,
    schemaVersion: envelope.schemaVersion,
    exportedAt: envelope.exportedAt,
    applicationVersion: envelope.applicationVersion,
    catalogVersion: envelope.catalogVersion,
    projects: envelope.projects,
  };
}

export async function createRoomProjectBackup(
  candidates: readonly RoomProject[],
  now = new Date(),
): Promise<RoomProjectBackup> {
  const projects = validateProjects([...candidates]).map((project) =>
    roomProjectSchema.parse(project),
  );
  const payload: BackupPayload = {
    kind: ROOM_PROJECT_BACKUP_KIND,
    schemaVersion: 1,
    exportedAt: now.toISOString(),
    applicationVersion: APP_VERSION,
    catalogVersion: catalogRepository.release.version,
    projects,
  };
  const value = await sha256(JSON.stringify(payload));
  const backup: RoomProjectBackup = {
    ...payload,
    projects,
    integrity: { algorithm: "SHA-256", value },
  };
  if (encodedBytes(JSON.stringify(backup)) > MAX_ROOM_BACKUP_BYTES) {
    throw new Error("The project library is too large for one backup file.");
  }
  return backup;
}

export async function parseRoomProjectBackup(text: string): Promise<RoomProjectBackup> {
  if (encodedBytes(text) > MAX_ROOM_BACKUP_BYTES) {
    throw new Error("The selected project backup is too large.");
  }
  let candidate: unknown;
  try {
    candidate = JSON.parse(text);
  } catch {
    throw new Error("The selected file is not a valid FireDesign project backup.");
  }
  const parsed = backupEnvelopeSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new Error("The selected file is not a supported FireDesign project backup.");
  }
  const payload = payloadFromEnvelope(parsed.data);
  const expected = await sha256(JSON.stringify(payload));
  if (expected !== parsed.data.integrity.value) {
    throw new Error("The project backup failed its integrity check and was not restored.");
  }
  const projects = validateProjects(parsed.data.projects);
  return { ...parsed.data, projects };
}

export function serializeRoomProjectBackup(backup: RoomProjectBackup): string {
  return JSON.stringify(backup, null, 2);
}
