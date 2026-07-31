import { z } from "zod";
import {
  isRoomProjectCalibrated,
  roomProjectSchema,
  type RoomProject,
} from "@/domain/roomProject";

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

type StoredRoomProject = z.infer<typeof storedRoomProjectSchema>;

export type RoomProjectSummary = Pick<
  RoomProject,
  "id" | "name" | "createdAt" | "updatedAt" | "scenario"
> & {
  source: Pick<RoomProject["source"], "fileName" | "width" | "height">;
  calibrated: boolean;
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
      reject(request.error ?? new Error("Project storage is unavailable."));
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
  };
}

export async function saveRoomProject(project: RoomProject): Promise<void> {
  const validated = roomProjectSchema.parse(project);
  const storedProject = toStoredProject(validated);
  const imageChanged =
    !persistedProjectImages.has(validated.id) ||
    knownProjectImages.get(validated.id) !== validated.source.dataUrl;
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
        reject(transaction.error ?? new Error("Project save failed."));
      transaction.onabort = () =>
        reject(transaction.error ?? new Error("Project save failed."));
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

  const legacy = roomProjectSchema.safeParse(candidate);
  if (legacy.success) {
    knownProjectImages.set(legacy.data.id, legacy.data.source.dataUrl);
    return legacy.data;
  }
  const metadata = storedRoomProjectSchema.safeParse(candidate);
  const image = storedImageSchema.safeParse(imageCandidate);
  if (!metadata.success || !image.success || image.data.projectId !== metadata.data.id) {
    return null;
  }
  const hydrated = roomProjectSchema.safeParse({
    ...metadata.data,
    source: { ...metadata.data.source, dataUrl: image.data.dataUrl },
  });
  if (!hydrated.success) return null;
  knownProjectImages.set(hydrated.data.id, hydrated.data.source.dataUrl);
  persistedProjectImages.add(hydrated.data.id);
  return hydrated.data;
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
      const current = storedRoomProjectSchema.safeParse(candidate);
      if (current.success) return [toSummary(current.data)];
      const legacy = roomProjectSchema.safeParse(candidate);
      return legacy.success ? [toSummary(legacy.data)] : [];
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
