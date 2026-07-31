import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRoomProject } from "@/domain/roomProject";
import {
  clearCurrentRoomProject,
  deleteRoomProject,
  listRoomProjects,
  readAllRoomProjects,
  readCurrentRoomProject,
  readRoomProject,
  saveRoomProject,
  selectRoomProject,
  restoreRoomProjectLibrary,
} from "@/lib/roomProjectPersistence";

const source = (fileName: string) => ({
  dataUrl: "data:image/png;base64,AAAA",
  fileName,
  width: 1600,
  height: 1000,
});

async function rawStoreRequest<T>(
  storeName: "room-projects" | "room-project-images",
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("firedesign-projects", 2);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = operation(database.transaction(storeName, mode).objectStore(storeName));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    database.close();
  }
}

describe("local customer project library", () => {
  beforeEach(async () => {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase("firedesign-projects");
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => reject(new Error("Test database cleanup was blocked."));
    });
    const values = new Map<string, string>();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      removeItem: (key: string) => values.delete(key),
      clear: () => values.clear(),
    });
  });

  afterEach(async () => {
    const projects = await listRoomProjects();
    await Promise.all(projects.map((project) => deleteRoomProject(project.id)));
    vi.unstubAllGlobals();
  });

  it("lists named projects newest-first without returning stored image data", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "project-a" });
    const first = createRoomProject(source("first.png"), new Date("2026-07-30T12:00:00Z"));
    vi.stubGlobal("crypto", { randomUUID: () => "project-b" });
    const second = createRoomProject(source("second.png"), new Date("2026-07-31T12:00:00Z"));
    second.name = "Miller living room";
    second.wallQuad = [
      { x: 0.1, y: 0.1 },
      { x: 0.9, y: 0.1 },
      { x: 0.9, y: 0.9 },
      { x: 0.1, y: 0.9 },
    ];
    second.referenceSegment = [
      { x: 0.1, y: 0.8 },
      { x: 0.9, y: 0.8 },
    ];
    await saveRoomProject(first);
    await saveRoomProject(second);

    const projects = await listRoomProjects();
    expect(projects.map((project) => project.id)).toEqual(["project-b", "project-a"]);
    expect(projects[0]).toMatchObject({
      name: "Miller living room",
      calibrated: true,
      ready: true,
      source: { fileName: "second.png", width: 1600, height: 1000 },
    });
    expect(projects[0]).not.toHaveProperty("source.dataUrl");
  });

  it("opens, deselects, and reopens a project without deleting it", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "project-safe" });
    const project = createRoomProject(source("room.png"));
    await saveRoomProject(project);
    expect((await readCurrentRoomProject())?.id).toBe("project-safe");

    clearCurrentRoomProject();
    expect(await readCurrentRoomProject()).toBeNull();
    expect((await readRoomProject("project-safe"))?.source.fileName).toBe("room.png");

    expect((await selectRoomProject("project-safe"))?.id).toBe("project-safe");
    expect((await readCurrentRoomProject())?.id).toBe("project-safe");
  });

  it("deletes only the selected project", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "project-delete" });
    await saveRoomProject(createRoomProject(source("delete.png")));
    vi.stubGlobal("crypto", { randomUUID: () => "project-keep" });
    await saveRoomProject(createRoomProject(source("keep.png")));

    await deleteRoomProject("project-delete");
    expect(await readRoomProject("project-delete")).toBeNull();
    expect((await readRoomProject("project-keep"))?.id).toBe("project-keep");
  });

  it("stores image data separately and does not rewrite it for metadata-only edits", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "project-split" });
    const project = createRoomProject(source("split.png"));
    await saveRoomProject(project);

    const stored = (await rawStoreRequest("room-projects", "readonly", (store) =>
      store.get(project.id),
    )) as { source: Record<string, unknown> };
    expect(stored.source).not.toHaveProperty("dataUrl");

    const marker = "data:image/png;base64,SEPARATE-IMAGE-RECORD";
    await rawStoreRequest("room-project-images", "readwrite", (store) =>
      store.put({ projectId: project.id, dataUrl: marker }),
    );
    project.comparison = 0.5;
    await saveRoomProject(project);

    const image = (await rawStoreRequest("room-project-images", "readonly", (store) =>
      store.get(project.id),
    )) as { dataUrl: string };
    expect(image.dataUrl).toBe(marker);
  });

  it("migrates a legacy embedded image before metadata overwrites the record", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "project-legacy" });
    const current = createRoomProject(source("legacy.png"));
    const {
      openingQuad,
      openingWidthInches,
      openingHeightInches,
      openingDepthInches,
      openingRearWidthInches,
      ...legacyFields
    } = current;
    void openingQuad;
    void openingWidthInches;
    void openingHeightInches;
    void openingDepthInches;
    void openingRearWidthInches;
    const legacy = { ...legacyFields, schemaVersion: 1 as const };
    const legacyDatabase = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open("firedesign-projects", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("room-projects", { keyPath: "id" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = legacyDatabase.transaction("room-projects", "readwrite");
      transaction.objectStore("room-projects").put(legacy);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    legacyDatabase.close();
    localStorage.setItem("firedesign:current-room-project:v1", legacy.id);

    expect((await readAllRoomProjects())[0]?.source.dataUrl).toBe(legacy.source.dataUrl);
    const recovered = await readCurrentRoomProject();
    expect(recovered).toMatchObject({
      schemaVersion: 5,
      source: { dataUrl: legacy.source.dataUrl },
      openingQuad: [],
      openingWidthInches: 36,
      openingHeightInches: 30,
      openingDepthInches: null,
      openingRearWidthInches: null,
      foregroundPolygons: [],
    });
    if (!recovered) throw new Error("Legacy project was not recovered.");
    recovered.comparison = 0.4;
    await saveRoomProject(recovered);

    const metadata = (await rawStoreRequest("room-projects", "readonly", (store) =>
      store.get(legacy.id),
    )) as { source: Record<string, unknown> };
    const image = (await rawStoreRequest("room-project-images", "readonly", (store) =>
      store.get(legacy.id),
    )) as { dataUrl: string };
    expect(metadata.source).not.toHaveProperty("dataUrl");
    expect(image.dataUrl).toBe(legacy.source.dataUrl);
    expect((await readRoomProject(legacy.id))?.comparison).toBe(0.4);
  });

  it("exports complete projects with their separate photographs and configurations", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "project-complete" });
    const project = createRoomProject(source("complete.png"));
    project.configuration = {
      ...project.configuration,
      fireplaceId: "4237-ember-glo-clean-face",
      faceOptionId: "4237-clean-face",
      stoneId: "brown-ledge",
    };
    await saveRoomProject(project);

    expect(await readAllRoomProjects()).toMatchObject([
      {
        id: "project-complete",
        source: { dataUrl: source("complete.png").dataUrl },
        configuration: {
          fireplaceId: "4237-ember-glo-clean-face",
          faceOptionId: "4237-clean-face",
          stoneId: "brown-ledge",
        },
      },
    ]);
  });

  it("restores atomically and saves ID collisions as clearly named copies", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "project-collision" });
    const existing = createRoomProject(source("existing.png"));
    existing.name = "Anderson room";
    await saveRoomProject(existing);
    const imported = { ...existing, source: source("restored.png") };
    vi.stubGlobal("crypto", { randomUUID: () => "project-restored-copy" });

    const result = await restoreRoomProjectLibrary(
      [imported],
      new Date("2026-08-01T12:00:00.000Z"),
    );
    expect(result).toEqual({
      restored: 1,
      copied: 1,
      projectIds: ["project-restored-copy"],
    });
    expect(await readRoomProject("project-collision")).toMatchObject({
      name: "Anderson room",
      source: { fileName: "existing.png" },
    });
    expect(await readRoomProject("project-restored-copy")).toMatchObject({
      name: "Anderson room (restored)",
      source: { fileName: "restored.png" },
      createdAt: "2026-08-01T12:00:00.000Z",
    });
  });

  it("rejects an oversized restore before writing any project", async () => {
    vi.stubGlobal("crypto", { randomUUID: () => "existing-project" });
    const existing = createRoomProject(source("existing.png"));
    await saveRoomProject(existing);
    const incoming = Array.from({ length: 100 }, (_, index) => ({
      ...existing,
      id: `incoming-${index}`,
      name: `Incoming ${index}`,
    }));

    await expect(restoreRoomProjectLibrary(incoming)).rejects.toThrow(
      "A maximum of 100 customer projects",
    );
    expect((await listRoomProjects()).map((project) => project.id)).toEqual([
      "existing-project",
    ]);
  });

  it("rejects a new photograph before IndexedDB writes when browser capacity is unsafe", async () => {
    vi.stubGlobal("navigator", {
      storage: {
        estimate: async () => ({
          usage: 1010 * 1024 * 1024,
          quota: 1024 * 1024 * 1024,
        }),
      },
    });
    vi.stubGlobal("crypto", { randomUUID: () => "project-no-capacity" });
    await expect(saveRoomProject(createRoomProject(source("large.png")))).rejects.toThrow(
      "Not enough browser storage remains",
    );
    expect(await listRoomProjects()).toEqual([]);
  });
});
