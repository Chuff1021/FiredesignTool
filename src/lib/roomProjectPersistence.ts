import { roomProjectSchema, type RoomProject } from "@/domain/roomProject";

const DATABASE_NAME = "firedesign-projects";
const STORE_NAME = "room-projects";
const CURRENT_PROJECT_KEY = "firedesign:current-room-project:v1";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Project storage is unavailable."));
  });
}

export async function saveRoomProject(project: RoomProject): Promise<void> {
  const validated = roomProjectSchema.parse(project);
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(validated);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Project save failed."));
  });
  database.close();
  localStorage.setItem(CURRENT_PROJECT_KEY, validated.id);
}

export async function readCurrentRoomProject(): Promise<RoomProject | null> {
  const id = localStorage.getItem(CURRENT_PROJECT_KEY);
  if (!id) return null;
  const database = await openDatabase();
  const candidate = await new Promise<unknown>((resolve, reject) => {
    const request = database.transaction(STORE_NAME).objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Project recovery failed."));
  });
  database.close();
  const result = roomProjectSchema.safeParse(candidate);
  if (result.success) return result.data;
  localStorage.removeItem(CURRENT_PROJECT_KEY);
  return null;
}

export async function deleteCurrentRoomProject(): Promise<void> {
  const id = localStorage.getItem(CURRENT_PROJECT_KEY);
  localStorage.removeItem(CURRENT_PROJECT_KEY);
  if (!id) return;
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Project deletion failed."));
  });
  database.close();
}
