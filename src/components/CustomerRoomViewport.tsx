"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  calibrationLabel,
  createRoomProject,
  isRoomProjectCalibrated,
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

type CalibrationTool = "wall" | "measurement" | "view";

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
    } else {
      const referenceSegment = [...project.referenceSegment, point].slice(0, 2);
      const nextProject = { ...project, referenceSegment };
      updateProject(nextProject);
      if (referenceSegment.length === 2 && isRoomProjectCalibrated(nextProject)) {
        setTool("view");
      }
    }
  };

  const resetCalibration = () => {
    if (!project) return;
    updateProject({ ...project, wallQuad: [], referenceSegment: [] });
    setTool("wall");
  };

  const undoPoint = () => {
    if (!project) return;
    if (tool === "measurement" || (tool === "view" && project.referenceSegment.length > 0)) {
      updateProject({ ...project, referenceSegment: project.referenceSegment.slice(0, -1) });
      setTool("measurement");
      return;
    }
    updateProject({ ...project, wallQuad: project.wallQuad.slice(0, -1) });
    setTool("wall");
  };

  const prepareExport = async () => {
    if (!project || !canvasRef.current || !isRoomProjectCalibrated(project)) return;
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
                        {saved.calibrated ? "Scaled" : "Needs calibration"}
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
        <div className="room-status" data-ready={calibrated}>
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
            disabled={!calibrated || rendering}
            onClick={() => void exportDesign("image")}
            type="button"
          >
            <UiIcon name="download" /> Export
          </button>
          <button
            className="secondary-action"
            disabled={!calibrated || rendering}
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
        <div className="room-stepper" role="group" aria-label="Photo calibration steps">
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
            aria-pressed={tool === "view"}
            disabled={!calibrated}
            onClick={() => setTool("view")}
            type="button"
          >
            <span>3</span> Present
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
          {tool === "view" ? (
            <>
              <strong>Scaled concept ready.</strong>
              <span>Use the main controls to change the fireplace and finishes.</span>
            </>
          ) : null}
        </div>
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
        <div
          className="room-scenario segmented-control"
          role="group"
          aria-label="Remodel scenario"
        >
          <button
            aria-pressed={project.scenario === "full-remodel"}
            onClick={() => updateProject({ ...project, scenario: "full-remodel" })}
            type="button"
          >
            Full remodel
          </button>
          <button
            aria-pressed={project.scenario === "insert"}
            onClick={() => updateProject({ ...project, scenario: "insert" })}
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
          <button onClick={() => void returnToLibrary()} type="button">
            Back to projects
          </button>
        </div>
        <p className="room-disclaimer">
          Conceptual sales visualization. Verify fit, venting, framing, clearances, and
          installation onsite.
        </p>
      </div>
    </section>
  );
}
