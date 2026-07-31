"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  calibrationLabel,
  createRoomProject,
  isInsertOpeningCalibrated,
  isInsertOpeningFitMeasured,
  isRoomProjectCalibrated,
  isRoomProjectReady,
  isValidForegroundPolygon,
  pixelsPerInch,
  roomProjectSchema,
  type NormalizedPoint,
  type RoomProject,
} from "@/domain/roomProject";
import {
  MAX_ROOM_BACKUP_BYTES,
  ROOM_PROJECT_BACKUP_EXTENSION,
  createRoomProjectBackup,
  parseRoomProjectBackup,
  serializeRoomProjectBackup,
} from "@/domain/roomProjectBackup";
import { normalizeConfiguration, WALL_WIDTH_RANGE } from "@/domain/configuration";
import { catalogRepository } from "@/domain/catalogRepository";
import {
  screenInsertProduct,
  summarizeInsertFitResults,
  type InsertFitDimension,
  type InsertFitResult,
} from "@/domain/insertFit";
import { findApprovedIntakeProduct } from "@/catalog/intakeRegistry";
import { UiIcon } from "@/components/UiIcon";
import { prepareRoomImage } from "@/lib/roomImage";
import {
  clearCurrentRoomProject,
  deleteRoomProject,
  listRoomProjects,
  readAllRoomProjects,
  readCurrentRoomProject,
  restoreRoomProjectLibrary,
  saveRoomProject,
  selectRoomProject,
  type RoomProjectSummary,
} from "@/lib/roomProjectPersistence";
import { renderRoomProject } from "@/lib/roomRenderer";
import { createProjectPdf } from "@/lib/projectExport";
import {
  backupFreshness,
  formatStorageBytes,
  readRoomProjectBackupRecord,
  readStorageHealth,
  UNAVAILABLE_STORAGE_HEALTH,
  writeRoomProjectBackupRecord,
  type RoomProjectBackupRecord,
} from "@/lib/storageHealth";
import { useConfigurationStore } from "@/store/configurationStore";

type CalibrationTool = "wall" | "measurement" | "opening" | "foreground" | "view";

const fitDimensionLabels: Record<InsertFitDimension, string> = {
  frontWidth: "front width",
  height: "height",
  rearWidth: "rear width",
  depth: "depth",
};

function fitResultLabel(result: InsertFitResult): string {
  if (result.status === "fits-measured-opening") return "passes measured minimums";
  if (result.status === "needs-measurements") {
    return `needs ${result.missingMeasurements.map((dimension) => fitDimensionLabels[dimension]).join(" and ")}`;
  }
  return result.deficits
    .map(
      (deficit) =>
        `${fitDimensionLabels[deficit.dimension]} short ${Math.abs(deficit.margin).toFixed(3).replace(/0+$/, "").replace(/\.$/, "")} in`,
    )
    .join(" · ");
}

function variantLabel(value: string): string {
  return value
    .split("-")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function CustomerRoomViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);
  const projectRef = useRef<RoomProject | null>(null);
  const [project, setProject] = useState<RoomProject | null>(null);
  const [projects, setProjects] = useState<RoomProjectSummary[]>([]);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [tool, setTool] = useState<CalibrationTool>("wall");
  const [foregroundDraft, setForegroundDraft] = useState<NormalizedPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [libraryBusy, setLibraryBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [storageHealth, setStorageHealth] = useState(UNAVAILABLE_STORAGE_HEALTH);
  const [backupRecord, setBackupRecord] = useState<RoomProjectBackupRecord | null>(null);
  const configurationValues = useConfigurationStore(
    useShallow((state) => ({
      wallWidth: state.wallWidth,
      wallHeight: state.wallHeight,
      stoneWidth: state.stoneWidth,
      fireplaceElevation: state.fireplaceElevation,
      mantelHeightAboveBase: state.mantelHeightAboveBase,
      fireplaceId: state.fireplaceId,
      faceOptionId: state.faceOptionId,
      stoneId: state.stoneId,
      mantelProductId: state.mantelProductId,
      mantelWidth: state.mantelWidth,
      mantelFinishId: state.mantelFinishId,
      hearthEnabled: state.hearthEnabled,
      cameraMode: "front" as const,
      showDimensions: false,
    })),
  );
  const setWallWidth = useConfigurationStore((state) => state.setWallWidth);
  const setConfiguration = useConfigurationStore((state) => state.setConfiguration);
  const configuration = useMemo(
    () => normalizeConfiguration(configurationValues),
    [configurationValues],
  );
  const selectedFireplace = useMemo(
    () => catalogRepository.getFireplace(configuration.fireplaceId),
    [configuration.fireplaceId],
  );
  const selectedIntakeProduct = useMemo(
    () => findApprovedIntakeProduct(configuration.fireplaceId),
    [configuration.fireplaceId],
  );
  const insertFitResults = useMemo(() => {
    if (project?.scenario !== "insert" || selectedIntakeProduct?.applianceType !== "insert") {
      return [];
    }
    return screenInsertProduct(
      {
        frontWidth: project.openingWidthInches,
        height: project.openingHeightInches,
        rearWidth: project.openingRearWidthInches,
        depth: project.openingDepthInches,
      },
      selectedIntakeProduct,
    );
  }, [project, selectedIntakeProduct]);
  const insertFitSummary = useMemo(
    () => summarizeInsertFitResults(insertFitResults),
    [insertFitResults],
  );

  const refreshProjects = useCallback(async () => {
    const [library, health] = await Promise.all([listRoomProjects(), readStorageHealth()]);
    setProjects(library);
    setStorageHealth(health);
    setBackupRecord(readRoomProjectBackupRecord(localStorage));
    return library;
  }, []);

  const activateProject = useCallback(
    (saved: RoomProject) => {
      projectRef.current = saved;
      setProject(saved);
      setForegroundDraft([]);
      setConfiguration({
        ...saved.configuration,
        wallWidth: saved.referenceInches,
        cameraMode: "front",
        showDimensions: false,
      });
      void saveRoomProject(saved).catch(() =>
        setMessage("This project could not be upgraded to the current local format."),
      );
      setTool(
        saved.wallQuad.length < 4
          ? "wall"
          : saved.referenceSegment.length < 2
            ? "measurement"
            : saved.scenario === "insert" && saved.openingQuad.length < 4
              ? "opening"
              : "view",
      );
    },
    [setConfiguration],
  );

  useEffect(() => {
    let active = true;
    void Promise.all([readCurrentRoomProject(), listRoomProjects(), readStorageHealth()])
      .then(([saved, library, health]) => {
        if (!active) return;
        setProjects(library);
        setStorageHealth(health);
        setBackupRecord(readRoomProjectBackupRecord(localStorage));
        if (saved) activateProject(saved);
      })
      .catch(() => setMessage("The local project library could not be recovered."))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [activateProject]);

  useEffect(() => {
    if (!project || !canvasRef.current) return;
    let active = true;
    setRendering(true);
    void renderRoomProject(canvasRef.current, project, configuration, {
      comparison: project.comparison,
      markers: tool !== "view" && tool !== "foreground",
      foregroundDraft: tool === "foreground" ? foregroundDraft : undefined,
    })
      .catch((error) => {
        if (active)
          setMessage(
            error instanceof Error ? error.message : "The room design could not be rendered.",
          );
      })
      .finally(() => active && setRendering(false));
    return () => {
      active = false;
    };
  }, [configuration, foregroundDraft, project, tool]);

  const updateProject = useCallback(
    (next: RoomProject) => {
      const validated = roomProjectSchema.parse({
        ...next,
        updatedAt: new Date().toISOString(),
      });
      projectRef.current = validated;
      setProject(validated);
      void saveRoomProject(validated)
        .then(refreshProjects)
        .catch(() => setMessage("This project could not be saved locally."));
    },
    [refreshProjects],
  );

  useEffect(() => {
    const current = projectRef.current;
    if (!current) return;
    const serializedCurrent = JSON.stringify(current.configuration);
    const serializedNext = JSON.stringify(configuration);
    if (serializedCurrent === serializedNext) return;
    updateProject({ ...current, configuration });
  }, [configuration, updateProject]);

  const handleFile = async (file: File | undefined, replaceCurrent = false) => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    try {
      const source = await prepareRoomImage(file);
      const created = createRoomProject(source, new Date(), configuration);
      const fileName = source.fileName.replace(/\.[^.]+$/, "").trim();
      const next = roomProjectSchema.parse(
        replaceCurrent && project
          ? {
              ...created,
              id: project.id,
              name: project.name,
              createdAt: project.createdAt,
            }
          : {
              ...created,
              name: fileName.slice(0, 80) || created.name,
            },
      );
      await saveRoomProject(next);
      await refreshProjects();
      activateProject(next);
      setDeleteCandidate(null);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "The room photograph could not be prepared.",
      );
    } finally {
      setLoading(false);
    }
  };

  const openProject = async (id: string) => {
    setLoading(true);
    setMessage(null);
    try {
      const saved = await selectRoomProject(id);
      if (!saved) throw new Error("That project is no longer available.");
      activateProject(saved);
      setDeleteCandidate(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The project could not be opened.");
      await refreshProjects();
    } finally {
      setLoading(false);
    }
  };

  const returnToLibrary = async () => {
    const current = projectRef.current;
    if (current) {
      const configurationChanged =
        JSON.stringify(current.configuration) !== JSON.stringify(configuration);
      const snapshot = roomProjectSchema.parse({
        ...current,
        configuration,
        updatedAt: configurationChanged ? new Date().toISOString() : current.updatedAt,
      });
      await saveRoomProject(snapshot).catch(() =>
        setMessage("The latest project changes could not be saved locally."),
      );
    }
    clearCurrentRoomProject();
    projectRef.current = null;
    setProject(null);
    setDeleteCandidate(null);
    await refreshProjects().catch(() =>
      setMessage("The project library could not be refreshed."),
    );
  };

  const backupProjects = async () => {
    setLibraryBusy(true);
    setMessage(null);
    try {
      const savedProjects = await readAllRoomProjects();
      if (savedProjects.length === 0)
        throw new Error("There are no customer projects to back up.");
      const now = new Date();
      const backup = await createRoomProjectBackup(savedProjects, now);
      const blob = new Blob([serializeRoomProjectBackup(backup)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `firedesign-projects-${new Date().toISOString().slice(0, 10)}${ROOM_PROJECT_BACKUP_EXTENSION}`;
      link.href = url;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      try {
        setBackupRecord(writeRoomProjectBackupRecord(localStorage, savedProjects, now));
      } catch {
        setMessage(
          "The project backup downloaded, but this browser could not remember its backup status.",
        );
        return;
      }
      setMessage(
        `Backed up ${savedProjects.length} project${savedProjects.length === 1 ? "" : "s"}, including room photographs.`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "The project backup could not be created.",
      );
    } finally {
      setLibraryBusy(false);
    }
  };

  const restoreProjects = async (file: File | undefined) => {
    if (!file) return;
    setLibraryBusy(true);
    setMessage(null);
    try {
      if (file.size > MAX_ROOM_BACKUP_BYTES) {
        throw new Error("The selected project backup is too large.");
      }
      const backup = await parseRoomProjectBackup(await file.text());
      const result = await restoreRoomProjectLibrary(backup.projects);
      await refreshProjects();
      setMessage(
        `Restored ${result.restored} project${result.restored === 1 ? "" : "s"}${
          result.copied > 0
            ? `. ${result.copied} existing project${result.copied === 1 ? " was" : "s were"} preserved and the restored version was saved as a copy.`
            : "."
        }`,
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "The project backup could not be restored.",
      );
    } finally {
      setLibraryBusy(false);
    }
  };

  const removeProject = async (id: string) => {
    try {
      await deleteRoomProject(id);
      if (project?.id === id) setProject(null);
      setDeleteCandidate(null);
      await refreshProjects();
    } catch {
      setMessage("The project could not be deleted.");
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!project || tool === "view") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point: NormalizedPoint = {
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
    };
    if (tool === "foreground") {
      if (foregroundDraft.length >= 24) {
        setMessage("A foreground outline can contain up to 24 points.");
        return;
      }
      setForegroundDraft([...foregroundDraft, point]);
    } else if (tool === "wall") {
      const wallQuad = [...project.wallQuad, point].slice(0, 4);
      updateProject({ ...project, wallQuad });
      if (wallQuad.length === 4) setTool("measurement");
    } else if (tool === "measurement") {
      const referenceSegment = [...project.referenceSegment, point].slice(0, 2);
      const nextProject = { ...project, referenceSegment };
      updateProject(nextProject);
      if (referenceSegment.length === 2 && isRoomProjectCalibrated(nextProject)) {
        setTool(project.scenario === "insert" ? "opening" : "view");
      }
    } else if (tool === "opening") {
      const openingQuad = [...project.openingQuad, point].slice(0, 4);
      updateProject({ ...project, openingQuad });
      if (openingQuad.length === 4) setTool("view");
    }
  };

  const resetCalibration = () => {
    if (!project) return;
    updateProject({ ...project, wallQuad: [], referenceSegment: [], openingQuad: [] });
    setTool("wall");
  };

  const beginForeground = () => {
    if (!project) return;
    if (project.foregroundPolygons.length >= 8) {
      setMessage("This project already has the maximum of eight foreground areas.");
      return;
    }
    setForegroundDraft([]);
    setTool("foreground");
  };

  const finishForeground = () => {
    if (!project || !isValidForegroundPolygon(foregroundDraft)) {
      setMessage("Use at least three ordered points without crossing the outline.");
      return;
    }
    updateProject({
      ...project,
      foregroundPolygons: [...project.foregroundPolygons, foregroundDraft],
    });
    setForegroundDraft([]);
    setTool("view");
  };

  const clearForeground = () => {
    if (!project) return;
    updateProject({ ...project, foregroundPolygons: [] });
    setForegroundDraft([]);
    setTool("view");
  };

  const resetOpening = () => {
    if (!project) return;
    updateProject({ ...project, openingQuad: [] });
    setTool("opening");
  };

  const undoPoint = () => {
    if (!project) return;
    if (tool === "foreground") {
      setForegroundDraft(foregroundDraft.slice(0, -1));
      return;
    }
    if (tool === "opening" || (tool === "view" && project.openingQuad.length > 0)) {
      updateProject({ ...project, openingQuad: project.openingQuad.slice(0, -1) });
      setTool("opening");
      return;
    }
    if (tool === "measurement" || (tool === "view" && project.referenceSegment.length > 0)) {
      updateProject({ ...project, referenceSegment: project.referenceSegment.slice(0, -1) });
      setTool("measurement");
      return;
    }
    updateProject({ ...project, wallQuad: project.wallQuad.slice(0, -1) });
    setTool("wall");
  };

  const prepareExport = async () => {
    if (!project || !canvasRef.current || !isRoomProjectReady(project)) return;
    const exportCanvas = document.createElement("canvas");
    await renderRoomProject(exportCanvas, project, configuration, {
      comparison: 1,
      markers: false,
    });
    return exportCanvas;
  };

  const exportDesign = async (format: "image" | "pdf") => {
    if (!project) return;
    setRendering(true);
    try {
      const exportCanvas = await prepareExport();
      if (!exportCanvas) return;
      const fileBase = project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const link = document.createElement("a");
      if (format === "image") {
        link.download = `${fileBase}-firedesign.jpg`;
        link.href = exportCanvas.toDataURL("image/jpeg", 0.94);
      } else {
        const pdf = await createProjectPdf(
          project,
          configuration,
          exportCanvas.toDataURL("image/jpeg", 0.92),
        );
        link.download = `${fileBase}-firedesign.pdf`;
        const pdfBuffer = new Uint8Array(pdf).buffer as ArrayBuffer;
        link.href = URL.createObjectURL(new Blob([pdfBuffer], { type: "application/pdf" }));
        window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }
      link.click();
    } finally {
      setRendering(false);
    }
  };

  if (loading && !project) {
    return (
      <section className="room-workspace room-workspace--empty">
        <div className="room-empty">
          <span className="scene-loading__mark" />
          <h2>Preparing customer projects</h2>
        </div>
      </section>
    );
  }

  if (!project) {
    const protection = backupFreshness(projects, backupRecord);
    return (
      <section
        className="room-workspace room-workspace--empty"
        aria-label="Customer room designer"
      >
        <div className={`room-library${projects.length === 0 ? " room-library--empty" : ""}`}>
          <div className="room-empty">
            <div className="room-empty__icon">
              <UiIcon name="image" size={30} />
            </div>
            <p className="eyebrow">Customer room designer</p>
            <h2>{projects.length > 0 ? "Customer projects" : "Design in their space."}</h2>
            <p>
              Upload a clear photograph that includes the fireplace wall and finished floor.
              Every project stays on this device.
            </p>
            <button
              className="primary-action"
              disabled={libraryBusy}
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <UiIcon name="upload" /> New customer project
            </button>
            <div className="room-library-actions" aria-label="Project library backup">
              <button
                className="secondary-action"
                disabled={libraryBusy || projects.length === 0}
                onClick={() => void backupProjects()}
                type="button"
              >
                <UiIcon name="download" /> Back up projects
              </button>
              <button
                className="secondary-action"
                disabled={libraryBusy}
                onClick={() => backupInputRef.current?.click()}
                type="button"
              >
                <UiIcon name="upload" /> Restore backup
              </button>
            </div>
            {projects.length > 0 ? (
              <div
                className="room-library-protection"
                data-tone={
                  storageHealth.status === "critical" || protection !== "current"
                    ? "warn"
                    : "good"
                }
              >
                <UiIcon
                  name={
                    storageHealth.status === "critical" || protection !== "current"
                      ? "warning"
                      : "check"
                  }
                  size={15}
                />
                <span>
                  <strong>
                    {protection === "current"
                      ? "Project backup is current"
                      : protection === "never"
                        ? "Project backup recommended"
                        : "Projects changed since the last backup"}
                  </strong>
                  <small>
                    {storageHealth.availableBytes === null
                      ? "Browser capacity unavailable · keep a dated backup"
                      : `${formatStorageBytes(storageHealth.availableBytes)} browser storage available${
                          storageHealth.persistent ? " · persistent" : " · browser-managed"
                        }`}
                  </small>
                </span>
              </div>
            ) : null}
            <small>
              JPEG, PNG, or HEIC · at least 1200 px · preserves up to 4K · processed locally
              <br />
              Backups include photographs, measurements, foregrounds, and selected products.
            </small>
            {message ? (
              <div className="room-message" role="alert">
                {message}
              </div>
            ) : null}
          </div>
          {projects.length > 0 ? (
            <div className="room-project-list" aria-label="Saved customer projects">
              <div className="room-project-list__heading">
                <span>Saved on this computer</span>
                <small>
                  {projects.length} project{projects.length === 1 ? "" : "s"}
                </small>
              </div>
              {projects.map((saved) => (
                <article className="room-project-card" key={saved.id}>
                  <button
                    aria-label={`Open ${saved.name}`}
                    className="room-project-card__open"
                    onClick={() => void openProject(saved.id)}
                    type="button"
                  >
                    <span className="room-project-card__mark">
                      <UiIcon name="image" size={18} />
                    </span>
                    <span>
                      <strong>{saved.name}</strong>
                      <small>
                        {new Date(saved.updatedAt).toLocaleDateString()} · {saved.source.width}{" "}
                        × {saved.source.height} ·{" "}
                        {saved.ready
                          ? "Ready"
                          : saved.calibrated && saved.scenario === "insert"
                            ? "Opening needed"
                            : "Needs calibration"}
                      </small>
                    </span>
                    <UiIcon name="arrow" size={16} />
                  </button>
                  <button
                    aria-label={
                      deleteCandidate === saved.id
                        ? `Confirm delete ${saved.name}`
                        : `Delete ${saved.name}`
                    }
                    className="room-project-card__delete"
                    onClick={() =>
                      deleteCandidate === saved.id
                        ? void removeProject(saved.id)
                        : setDeleteCandidate(saved.id)
                    }
                    type="button"
                  >
                    {deleteCandidate === saved.id ? "Confirm delete" : "Delete"}
                  </button>
                </article>
              ))}
            </div>
          ) : null}
          <input
            ref={fileInputRef}
            accept="image/jpeg,image/png,image/heic,image/heif"
            className="sr-only"
            data-testid="room-photo-input"
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
              event.target.value = "";
            }}
            type="file"
          />
          <input
            ref={backupInputRef}
            accept={`${ROOM_PROJECT_BACKUP_EXTENSION},application/json`}
            className="sr-only"
            data-testid="room-backup-input"
            onChange={(event) => {
              void restoreProjects(event.target.files?.[0]);
              event.target.value = "";
            }}
            type="file"
          />
        </div>
      </section>
    );
  }

  const scale = pixelsPerInch(project);
  const calibrated = isRoomProjectCalibrated(project);
  const openingCalibrated = isInsertOpeningCalibrated(project);
  const openingFitMeasured = isInsertOpeningFitMeasured(project);
  const ready = isRoomProjectReady(project);

  const setScenario = (scenario: RoomProject["scenario"]) => {
    const next = { ...project, scenario };
    updateProject(next);
    if (!isRoomProjectCalibrated(next)) return;
    setTool(scenario === "insert" && !isInsertOpeningCalibrated(next) ? "opening" : "view");
  };
  return (
    <section className="room-workspace" aria-label="Customer room designer">
      <div className="room-toolbar">
        <div className="room-toolbar__identity">
          <p className="eyebrow">Customer project</p>
          <input
            aria-label="Project name"
            onBlur={(event) =>
              updateProject({
                ...project,
                name: event.target.value || "Customer fireplace concept",
              })
            }
            defaultValue={project.name}
          />
        </div>
        <div className="room-status" data-ready={ready}>
          <span /> {calibrationLabel(project)}
          {scale ? <small>{scale.toFixed(1)} pixels per inch</small> : null}
        </div>
        <div className="room-toolbar__actions">
          <button
            className="secondary-action"
            onClick={() => void returnToLibrary()}
            type="button"
          >
            Projects
          </button>
          <button
            className="secondary-action"
            onClick={() => fileInputRef.current?.click()}
            type="button"
          >
            <UiIcon name="image" /> Replace photo
          </button>
          <button
            className="primary-action"
            disabled={!ready || rendering}
            onClick={() => void exportDesign("image")}
            type="button"
          >
            <UiIcon name="download" /> Export
          </button>
          <button
            className="secondary-action"
            disabled={!ready || rendering}
            onClick={() => void exportDesign("pdf")}
            type="button"
          >
            PDF
          </button>
        </div>
        <input
          ref={fileInputRef}
          accept="image/jpeg,image/png,image/heic,image/heif"
          className="sr-only"
          data-testid="room-photo-input"
          onChange={(event) => {
            void handleFile(event.target.files?.[0], true);
            event.target.value = "";
          }}
          type="file"
        />
      </div>

      <div className="room-stage">
        <canvas
          aria-label="Calibrated customer room visualization"
          className="room-canvas"
          data-testid="room-canvas"
          onClick={handleCanvasClick}
          ref={canvasRef}
        />
        {rendering ? <div className="room-rendering">Updating design…</div> : null}
        {message ? (
          <div className="room-message room-message--floating" role="alert">
            {message}
            <button onClick={() => setMessage(null)} type="button">
              Dismiss
            </button>
          </div>
        ) : null}
      </div>

      <div className="room-calibration-panel">
        <div
          className="room-stepper"
          data-insert={project.scenario === "insert"}
          role="group"
          aria-label="Photo calibration steps"
        >
          <button aria-pressed={tool === "wall"} onClick={() => setTool("wall")} type="button">
            <span>1</span> Wall corners <small>{project.wallQuad.length}/4</small>
          </button>
          <button
            aria-pressed={tool === "measurement"}
            disabled={project.wallQuad.length < 4}
            onClick={() => setTool("measurement")}
            type="button"
          >
            <span>2</span> Wall width <small>{project.referenceSegment.length}/2</small>
          </button>
          <button
            aria-pressed={tool === "opening"}
            disabled={!calibrated}
            hidden={project.scenario !== "insert"}
            onClick={() => setTool("opening")}
            type="button"
          >
            <span>3</span> Opening <small>{project.openingQuad.length}/4</small>
          </button>
          <button
            aria-pressed={tool === "view"}
            disabled={!ready}
            onClick={() => setTool("view")}
            type="button"
          >
            <span>{project.scenario === "insert" ? 4 : 3}</span> Present
          </button>
        </div>
        <div className="room-instruction">
          {tool === "wall" ? (
            <>
              <strong>Mark the intended feature wall.</strong>
              <span>Click top-left, top-right, bottom-right, then bottom-left.</span>
            </>
          ) : null}
          {tool === "measurement" ? (
            <>
              <strong>Mark the measured wall width.</strong>
              <span>
                {project.referenceSegment.length === 2 && !calibrated
                  ? "That line does not span the marked wall. Undo it and mark both edges."
                  : "Click its left and right ends, then enter the full width."}
              </span>
            </>
          ) : null}
          {tool === "opening" ? (
            <>
              <strong>Mark the existing fireplace opening.</strong>
              <span>Click top-left, top-right, bottom-right, then bottom-left.</span>
            </>
          ) : null}
          {tool === "foreground" ? (
            <>
              <strong>Trace an object that stays in front.</strong>
              <span>
                Click around its outside edge in order, then finish the outline. Use this for
                furniture, fireplace tools, or décor that should cover the design.
              </span>
            </>
          ) : null}
          {tool === "view" ? (
            <>
              <strong>Scaled concept ready.</strong>
              <span>
                {project.scenario === "insert"
                  ? "The appliance face is scaled from the measured existing opening."
                  : "Use the main controls to change the fireplace and finishes."}
              </span>
            </>
          ) : null}
        </div>
        <div className="room-dimensions">
          <label className="room-measurement">
            <span>Measured wall width</span>
            <div>
              <input
                aria-label="Known measurement in inches"
                min={WALL_WIDTH_RANGE.min}
                max={WALL_WIDTH_RANGE.max}
                onChange={(event) => {
                  const inches = Number(event.target.value) || 1;
                  updateProject({ ...project, referenceInches: inches });
                  setWallWidth(inches);
                }}
                type="number"
                value={project.referenceInches}
              />
              <span>in</span>
            </div>
          </label>
          {project.scenario === "insert" ? (
            <div className="room-opening-measurements" aria-label="Existing opening size">
              <label>
                <span>Opening width</span>
                <div>
                  <input
                    aria-label="Existing opening width in inches"
                    max="240"
                    min="1"
                    onChange={(event) =>
                      updateProject({
                        ...project,
                        openingWidthInches: Number(event.target.value) || 1,
                      })
                    }
                    type="number"
                    value={project.openingWidthInches}
                  />
                  <span>in</span>
                </div>
              </label>
              <label>
                <span>Opening height</span>
                <div>
                  <input
                    aria-label="Existing opening height in inches"
                    max="120"
                    min="1"
                    onChange={(event) =>
                      updateProject({
                        ...project,
                        openingHeightInches: Number(event.target.value) || 1,
                      })
                    }
                    type="number"
                    value={project.openingHeightInches}
                  />
                  <span>in</span>
                </div>
              </label>
              <label>
                <span>Opening depth</span>
                <div>
                  <input
                    aria-label="Existing opening depth in inches"
                    max="120"
                    min="1"
                    onChange={(event) =>
                      updateProject({
                        ...project,
                        openingDepthInches:
                          event.target.value === "" ? null : Number(event.target.value),
                      })
                    }
                    placeholder="Measure"
                    step="0.125"
                    type="number"
                    value={project.openingDepthInches ?? ""}
                  />
                  <span>in</span>
                </div>
              </label>
              <label>
                <span>Rear width</span>
                <div>
                  <input
                    aria-label="Existing opening rear width in inches"
                    max="240"
                    min="1"
                    onChange={(event) =>
                      updateProject({
                        ...project,
                        openingRearWidthInches:
                          event.target.value === "" ? null : Number(event.target.value),
                      })
                    }
                    placeholder="Measure"
                    step="0.125"
                    type="number"
                    value={project.openingRearWidthInches ?? ""}
                  />
                  <span>in</span>
                </div>
              </label>
            </div>
          ) : null}
        </div>
        <div
          className="room-scenario segmented-control"
          role="group"
          aria-label="Remodel scenario"
        >
          <button
            aria-pressed={project.scenario === "full-remodel"}
            onClick={() => setScenario("full-remodel")}
            type="button"
          >
            Full remodel
          </button>
          <button
            aria-pressed={project.scenario === "insert"}
            onClick={() => setScenario("insert")}
            type="button"
          >
            Insert only
          </button>
        </div>
        <label className="room-comparison">
          <span>Before</span>
          <input
            aria-label="Before and after comparison"
            max="1"
            min="0"
            onChange={(event) =>
              updateProject({ ...project, comparison: Number(event.target.value) })
            }
            step="0.01"
            type="range"
            value={project.comparison}
          />
          <span>After</span>
        </label>
        <div className="room-calibration-actions">
          <button onClick={undoPoint} type="button">
            Undo point
          </button>
          <button onClick={resetCalibration} type="button">
            Recalibrate
          </button>
          {project.scenario === "insert" && project.openingQuad.length > 0 ? (
            <button onClick={resetOpening} type="button">
              Reset opening
            </button>
          ) : null}
          {tool === "foreground" ? (
            <>
              <button
                disabled={foregroundDraft.length < 3}
                onClick={finishForeground}
                type="button"
              >
                Finish foreground
              </button>
              <button
                onClick={() => {
                  setForegroundDraft([]);
                  setTool("view");
                }}
                type="button"
              >
                Cancel outline
              </button>
            </>
          ) : (
            <button disabled={!ready} onClick={beginForeground} type="button">
              Trace foreground
            </button>
          )}
          {project.foregroundPolygons.length > 0 ? (
            <button onClick={clearForeground} type="button">
              Clear foreground ({project.foregroundPolygons.length})
            </button>
          ) : null}
          <button onClick={() => void returnToLibrary()} type="button">
            Back to projects
          </button>
        </div>
        <p className="room-disclaimer">
          {project.scenario === "insert" && openingCalibrated
            ? openingFitMeasured
              ? `${project.openingWidthInches} × ${project.openingHeightInches} in face · ${project.openingRearWidthInches} in rear · ${project.openingDepthInches} in deep · `
              : `${project.openingWidthInches} × ${project.openingHeightInches} in face · Record depth and rear width for fit screening · `
            : ""}
          Conceptual sales visualization. Verify fit, venting, framing, clearances, and
          installation onsite.
        </p>
        {project.scenario === "insert" ? (
          <div
            aria-live="polite"
            className="room-fit-screen"
            data-status={insertFitSummary.status}
          >
            {selectedIntakeProduct?.applianceType === "insert" ? (
              <>
                <div className="room-fit-screen__heading">
                  <span>Measured opening screen</span>
                  <strong>
                    {insertFitSummary.status === "fits-measured-opening"
                      ? `${insertFitSummary.passingProfiles} manufacturer profile${insertFitSummary.passingProfiles === 1 ? "" : "s"} pass`
                      : insertFitSummary.status === "needs-measurements"
                        ? "More field measurements required"
                        : "No recorded profile passes"}
                  </strong>
                  <small>{selectedIntakeProduct.model}</small>
                </div>
                <div className="room-fit-screen__profiles">
                  {insertFitResults.map((result) => (
                    <span data-result={result.status} key={result.profile.variantId}>
                      <strong>{variantLabel(result.profile.variantId)}</strong>
                      <small>{fitResultLabel(result)}</small>
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <div className="room-fit-screen__heading">
                <span>Measured opening screen</span>
                <strong>Fit screening is unavailable for {selectedFireplace.model}</strong>
                <small>
                  The selected visual is a built-in fireplace, not an insert. Use this room
                  image as a remodeling concept only; it is not an insert fit recommendation.
                </small>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
