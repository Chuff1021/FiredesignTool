"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  calibrationLabel,
  createRoomProject,
  isInsertOpeningCalibrated,
  isRoomProjectCalibrated,
  isRoomProjectReady,
  pixelsPerInch,
  roomProjectSchema,
  type NormalizedPoint,
  type RoomProject,
} from "@/domain/roomProject";
import { normalizeConfiguration, WALL_WIDTH_RANGE } from "@/domain/configuration";
import { UiIcon } from "@/components/UiIcon";
import { prepareRoomImage } from "@/lib/roomImage";
import {
  clearCurrentRoomProject,
  deleteRoomProject,
  listRoomProjects,
  readCurrentRoomProject,
  saveRoomProject,
  selectRoomProject,
  type RoomProjectSummary,
} from "@/lib/roomProjectPersistence";
import { renderRoomProject } from "@/lib/roomRenderer";
import { createProjectPdf } from "@/lib/projectExport";
import { useConfigurationStore } from "@/store/configurationStore";

type CalibrationTool = "wall" | "measurement" | "opening" | "view";

export function CustomerRoomViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<RoomProject | null>(null);
  const [projects, setProjects] = useState<RoomProjectSummary[]>([]);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [tool, setTool] = useState<CalibrationTool>("wall");
  const [loading, setLoading] = useState(true);
  const [rendering, setRendering] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
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
  const configuration = useMemo(
    () => normalizeConfiguration(configurationValues),
    [configurationValues],
  );

  const refreshProjects = useCallback(async () => {
    setProjects(await listRoomProjects());
  }, []);

  const activateProject = useCallback(
    (saved: RoomProject) => {
      setProject(saved);
      setWallWidth(saved.referenceInches);
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
    [setWallWidth],
  );

  useEffect(() => {
    let active = true;
    void Promise.all([readCurrentRoomProject(), listRoomProjects()])
      .then(([saved, library]) => {
        if (!active) return;
        setProjects(library);
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
      markers: tool !== "view",
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
  }, [configuration, project, tool]);

  const updateProject = useCallback(
    (next: RoomProject) => {
      const validated = roomProjectSchema.parse({
        ...next,
        updatedAt: new Date().toISOString(),
      });
      setProject(validated);
      void saveRoomProject(validated)
        .then(refreshProjects)
        .catch(() => setMessage("This project could not be saved locally."));
    },
    [refreshProjects],
  );

  const handleFile = async (file: File | undefined, replaceCurrent = false) => {
    if (!file) return;
    setLoading(true);
    setMessage(null);
    try {
      const source = await prepareRoomImage(file);
      const created = createRoomProject(source);
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
    clearCurrentRoomProject();
    setProject(null);
    setDeleteCandidate(null);
    await refreshProjects().catch(() =>
      setMessage("The project library could not be refreshed."),
    );
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
    if (tool === "wall") {
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

  const resetOpening = () => {
    if (!project) return;
    updateProject({ ...project, openingQuad: [] });
    setTool("opening");
  };

  const undoPoint = () => {
    if (!project) return;
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
              onClick={() => fileInputRef.current?.click()}
              type="button"
            >
              <UiIcon name="upload" /> New customer project
            </button>
            <small>JPEG, PNG, or HEIC · at least 1200 px · processed locally</small>
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
            onChange={(event) => {
              void handleFile(event.target.files?.[0]);
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
          <button onClick={() => void returnToLibrary()} type="button">
            Back to projects
          </button>
        </div>
        <p className="room-disclaimer">
          {project.scenario === "insert" && openingCalibrated
            ? `${project.openingWidthInches} × ${project.openingHeightInches} in opening · `
            : ""}
          Conceptual sales visualization. Verify fit, venting, framing, clearances, and
          installation onsite.
        </p>
      </div>
    </section>
  );
}
