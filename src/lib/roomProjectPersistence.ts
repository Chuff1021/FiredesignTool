import { z } from "zod";
import {
  isRoomProjectCalibrated,
  isRoomProjectReady,
  parseRoomProject,
  roomProjectSchema,
  type RoomProject,
} from "@/domain/roomProject";
import { MAX_ROOM_PROJECTS } from "@/domain/roomProjectBackup";
import { DEFAULT_CONFIGURATION } from "@/domain/configuration";
import { readPersistedConfiguration } from "@/lib/persistence";
import {
  normalizeProjectStorageError,
  projectImageStorageBytes,
  requireStorageCapacity,
} from "@/lib/storageHealth";

const DATABASE_NAME = "firedesign-projects";
const DATABASE_VERSION = 2;
const STORE_NAME = "room-projects";
const IMAGE_STORE_NAME = "room-project-images";
const CURRENT_PROJECT_KEY = "firedesign:current-room-project:v1";

const storedRoomProjectSchema = roomProjectSchema.extend({
  source: roomProjectSchema.shape.source.omit({ dataUrl: true }),
});

const storedImageSchema = z.object({
  projectId: z.string().min(1),
  dataUrl: z.string().startsWith("data:image/"),
});

const storedProjectEnvelopeSchema = z
  .object({
    id: z.string().min(1),
    source: z.object({
      fileName: z.string().min(1),
      width: z.number().int().positive(),
      height: z.number().int().positive(),
    }),
  })
  .passthrough();

type StoredRoomProject = z.infer<typeof storedRoomProjectSchema>;

export type RoomProjectSummary = Pick<
  RoomProject,
  "id" | "name" | "createdAt" | "updatedAt" | "scenario"
> & {
  source: Pick<RoomProject["source"], "fileName" | "width" | "height">;
  calibrated: boolean;
  ready: boolean;
};

const knownProjectImages = new Map<string, string>();
const persistedProjectImages = new Set<string>();

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
      if (!request.result.objectStoreNames.contains(IMAGE_STORE_NAME)) {
        request.result.createObjectStore(IMAGE_STORE_NAME, { keyPath: "projectId" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(normalizeProjectStorageError(request.error, "Project storage is unavailable."));
    request.onblocked = () => reject(new Error("Project storage is busy in another window."));
  });
}

function requestResult<T>(request: IDBRequest<T>, fallback: string): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error(fallback));
  });
}

function toStoredProject(project: RoomProject): StoredRoomProject {
  const source = {
    fileName: project.source.fileName,
    width: project.source.width,
    height: project.source.height,
  };
  return storedRoomProjectSchema.parse({ ...project, source });
}

function toSummary(project: RoomProject | StoredRoomProject): RoomProjectSummary {
  const calibrationProject = roomProjectSchema.parse({
    ...project,
    source: { ...project.source, dataUrl: "data:image/png;base64,metadata-only" },
  });
  return {
    id: project.id,
    name: project.name,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    scenario: project.scenario,
    source: {
      fileName: project.source.fileName,
      width: project.source.width,
      height: project.source.height,
    },
    calibrated: isRoomProjectCalibrated(calibrationProject),
    ready: isRoomProjectReady(calibrationProject),
  };
}

function safelyParseRoomProject(candidate: unknown): RoomProject | null {
  try {
    const legacyConfiguration =
      typeof localStorage === "undefined"
        ? DEFAULT_CONFIGURATION
        : readPersistedConfiguration(localStorage).configuration;
    return parseRoomProject(candidate, legacyConfiguration);
  } catch {
    return null;
  }
}

function hydrateStoredProject(
  candidate: unknown,
  images: ReadonlyMap<string, unknown>,
): RoomProject | null {
  const embedded = safelyParseRoomProject(candidate);
  if (embedded) return embedded;
  const metadata = storedProjectEnvelopeSchema.safeParse(candidate);
  if (!metadata.success) return null;
  const image = storedImageSchema.safeParse(images.get(metadata.data.id));
  if (!image.success || image.data.projectId !== metadata.data.id) return null;
  return safelyParseRoomProject({
    ...metadata.data,
    source: { ...metadata.data.source, dataUrl: image.data.dataUrl },
  });
}

export async function saveRoomProject(project: RoomProject): Promise<void> {
  const validated = roomProjectSchema.parse(project);
  const storedProject = toStoredProject(validated);
  const imageChanged =
    !persistedProjectImages.has(validated.id) ||
    knownProjectImages.get(validated.id) !== validated.source.dataUrl;
  if (imageChanged) {
    await requireStorageCapacity(projectImageStorageBytes([validated.source.dataUrl]));
  }
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME, IMAGE_STORE_NAME], "readwrite");
      transaction.objectStore(STORE_NAME).put(storedProject);
      if (imageChanged) {
        transaction.objectStore(IMAGE_STORE_NAME).put({
          projectId: validated.id,
          dataUrl: validated.source.dataUrl,
        });
      }
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(normalizeProjectStorageError(transaction.error, "Project save failed."));
      transaction.onabort = () =>
        reject(normalizeProjectStorageError(transaction.error, "Project save failed."));
    });
  } finally {
    database.close();
  }
  knownProjectImages.set(validated.id, validated.source.dataUrl);
  persistedProjectImages.add(validated.id);
  localStorage.setItem(CURRENT_PROJECT_KEY, validated.id);
}

export async function readRoomProject(id: string): Promise<RoomProject | null> {
  const database = await openDatabase();
  let candidate: unknown;
  let imageCandidate: unknown;
  try {
    const transaction = database.transaction([STORE_NAME, IMAGE_STORE_NAME]);
    [candidate, imageCandidate] = await Promise.all([
      requestResult(transaction.objectStore(STORE_NAME).get(id), "Project recovery failed."),
      requestResult(
        transaction.objectStore(IMAGE_STORE_NAME).get(id),
        "Project image recovery failed.",
      ),
    ]);
  } finally {
    database.close();
  }

  const embedded = safelyParseRoomProject(candidate);
  if (embedded) {
    knownProjectImages.set(embedded.id, embedded.source.dataUrl);
    return embedded;
  }
  const metadata = storedProjectEnvelopeSchema.safeParse(candidate);
  const image = storedImageSchema.safeParse(imageCandidate);
  if (!metadata.success || !image.success || image.data.projectId !== metadata.data.id) {
    return null;
  }
  const hydrated = safelyParseRoomProject({
    ...metadata.data,
    source: { ...metadata.data.source, dataUrl: image.data.dataUrl },
  });
  if (!hydrated) return null;
  knownProjectImages.set(hydrated.id, hydrated.source.dataUrl);
  persistedProjectImages.add(hydrated.id);
  return hydrated;
}

export async function readAllRoomProjects(): Promise<RoomProject[]> {
  const database = await openDatabase();
  let candidates: unknown[];
  let imageCandidates: unknown[];
  try {
    const transaction = database.transaction([STORE_NAME, IMAGE_STORE_NAME]);
    [candidates, imageCandidates] = await Promise.all([
      requestResult(
        transaction.objectStore(STORE_NAME).getAll(),
        "Project backup recovery failed.",
      ),
      requestResult(
        transaction.objectStore(IMAGE_STORE_NAME).getAll(),
        "Project image backup recovery failed.",
      ),
    ]);
  } finally {
    database.close();
  }
  const images = new Map<string, unknown>();
  for (const candidate of imageCandidates) {
    const parsed = storedImageSchema.safeParse(candidate);
    if (parsed.success) images.set(parsed.data.projectId, parsed.data);
  }
  const projects = candidates.map((candidate) => hydrateStoredProject(candidate, images));
  if (projects.some((project) => project === null)) {
    throw new Error(
      "One or more saved projects are damaged. No incomplete backup was created.",
    );
  }
  return (projects as RoomProject[])
    .map((project) => {
      knownProjectImages.set(project.id, project.source.dataUrl);
      if (images.has(project.id)) persistedProjectImages.add(project.id);
      else persistedProjectImages.delete(project.id);
      return project;
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export type RoomProjectRestoreResult = {
  restored: number;
  copied: number;
  projectIds: string[];
};

function restoredProjectName(name: string): string {
  const suffix = " (restored)";
  return `${name.slice(0, 80 - suffix.length).trimEnd()}${suffix}`;
}

function uniqueProjectId(reserved: Set<string>): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = crypto.randomUUID();
    if (!reserved.has(candidate)) return candidate;
  }
  throw new Error("A unique restored project could not be created.");
}

export async function restoreRoomProjectLibrary(
  candidates: readonly RoomProject[],
  now = new Date(),
): Promise<RoomProjectRestoreResult> {
  const projects = candidates.map((candidate) => roomProjectSchema.parse(candidate));
  const incomingIds = new Set(projects.map((project) => project.id));
  if (incomingIds.size !== projects.length) {
    throw new Error("The project backup contains duplicate project identifiers.");
  }
  await requireStorageCapacity(
    projectImageStorageBytes(projects.map((project) => project.source.dataUrl)),
  );
  const database = await openDatabase();
  let restoredProjects: RoomProject[] = [];
  let copied = 0;
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME, IMAGE_STORE_NAME], "readwrite");
      const projectStore = transaction.objectStore(STORE_NAME);
      const imageStore = transaction.objectStore(IMAGE_STORE_NAME);
      const keysRequest = projectStore.getAllKeys();
      let rejected = false;
      const fail = (error: Error) => {
        if (rejected) return;
        rejected = true;
        reject(error);
      };
      keysRequest.onerror = () =>
        fail(keysRequest.error ?? new Error("The project library could not be restored."));
      keysRequest.onsuccess = () => {
        try {
          const reserved = new Set(keysRequest.result.map(String));
          if (reserved.size + projects.length > MAX_ROOM_PROJECTS) {
            throw new Error(
              `A maximum of ${MAX_ROOM_PROJECTS} customer projects can be stored on this device.`,
            );
          }
          const timestamp = now.toISOString();
          restoredProjects = projects.map((project) => {
            if (!reserved.has(project.id)) {
              reserved.add(project.id);
              return project;
            }
            copied += 1;
            const id = uniqueProjectId(reserved);
            reserved.add(id);
            return roomProjectSchema.parse({
              ...project,
              id,
              name: restoredProjectName(project.name),
              createdAt: timestamp,
              updatedAt: timestamp,
            });
          });
          for (const project of restoredProjects) {
            projectStore.put(toStoredProject(project));
            imageStore.put({ projectId: project.id, dataUrl: project.source.dataUrl });
          }
        } catch (error) {
          fail(
            error instanceof Error
              ? error
              : new Error("The project library could not be restored."),
          );
          transaction.abort();
        }
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        fail(transaction.error ?? new Error("The project library could not be restored."));
      transaction.onabort = () =>
        fail(transaction.error ?? new Error("The project library could not be restored."));
    });
  } finally {
    database.close();
  }
  for (const project of restoredProjects) {
    knownProjectImages.set(project.id, project.source.dataUrl);
    persistedProjectImages.add(project.id);
  }
  return {
    restored: restoredProjects.length,
    copied,
    projectIds: restoredProjects.map((project) => project.id),
  };
}

export async function selectRoomProject(id: string): Promise<RoomProject | null> {
  const project = await readRoomProject(id);
  if (project) localStorage.setItem(CURRENT_PROJECT_KEY, project.id);
  return project;
}

export async function readCurrentRoomProject(): Promise<RoomProject | null> {
  const id = localStorage.getItem(CURRENT_PROJECT_KEY);
  if (!id) return null;
  const project = await readRoomProject(id);
  if (project) return project;
  localStorage.removeItem(CURRENT_PROJECT_KEY);
  return null;
}

export async function listRoomProjects(): Promise<RoomProjectSummary[]> {
  const database = await openDatabase();
  let candidates: unknown[];
  try {
    candidates = await requestResult(
      database.transaction(STORE_NAME).objectStore(STORE_NAME).getAll(),
      "Project library failed.",
    );
  } finally {
    database.close();
  }

  return candidates
    .flatMap((candidate) => {
      const envelope = storedProjectEnvelopeSchema.safeParse(candidate);
      if (!envelope.success) return [];
      const project = safelyParseRoomProject({
        ...envelope.data,
        source: {
          ...envelope.data.source,
          dataUrl: "data:image/png;base64,metadata-only",
        },
      });
      return project ? [toSummary(project)] : [];
    })
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export function clearCurrentRoomProject(): void {
  localStorage.removeItem(CURRENT_PROJECT_KEY);
}

export async function deleteRoomProject(id: string): Promise<void> {
  const database = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME, IMAGE_STORE_NAME], "readwrite");
      transaction.objectStore(STORE_NAME).delete(id);
      transaction.objectStore(IMAGE_STORE_NAME).delete(id);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () =>
        reject(transaction.error ?? new Error("Project deletion failed."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Project deletion failed."));
    });
  } finally {
    database.close();
  }
  knownProjectImages.delete(id);
  persistedProjectImages.delete(id);
  if (localStorage.getItem(CURRENT_PROJECT_KEY) === id) {
    localStorage.removeItem(CURRENT_PROJECT_KEY);
  }
}

export async function deleteCurrentRoomProject(): Promise<void> {
  const id = localStorage.getItem(CURRENT_PROJECT_KEY);
  if (!id) return;
  await deleteRoomProject(id);
}
