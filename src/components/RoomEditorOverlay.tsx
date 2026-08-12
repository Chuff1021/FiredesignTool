import type { CSSProperties } from "react";
import type { NormalizedPoint, RoomProject } from "@/domain/roomProject";

export type RoomEditorTool =
  | "wall"
  | "measurement"
  | "opening"
  | "hearth-depth"
  | "cleanup"
  | "cleanup-sample"
  | "foreground"
  | "view";

type RoomEditorOverlayProps = {
  project: RoomProject;
  tool: RoomEditorTool;
  draft: NormalizedPoint[];
};

function pixelPointList(points: NormalizedPoint[], width: number, height: number): string {
  return points.map((point) => `${point.x * width},${point.y * height}`).join(" ");
}

function PointHandles({
  points,
  tone,
  labels,
  testIdPrefix,
}: {
  points: NormalizedPoint[];
  tone: string;
  labels?: (index: number) => string;
  testIdPrefix?: string;
}) {
  return points.map((point, index) => (
    <span
      className="room-editor-marker"
      data-testid={testIdPrefix ? `${testIdPrefix}-${index + 1}` : undefined}
      key={`${point.x}-${point.y}-${index}`}
      style={
        {
          "--marker-tone": tone,
          left: `${point.x * 100}%`,
          top: `${point.y * 100}%`,
        } as CSSProperties
      }
    >
      {labels ? labels(index) : null}
    </span>
  ));
}

function Outline({
  points,
  tone,
  fill = "none",
  closed = false,
  width,
  height,
}: {
  points: NormalizedPoint[];
  tone: string;
  fill?: string;
  closed?: boolean;
  width: number;
  height: number;
}) {
  if (points.length < 2) return null;
  const Shape = closed ? "polygon" : "polyline";
  const strokeWidth = Math.max(2, Math.min(width, height) * 0.0025);
  return (
    <Shape
      fill={fill}
      points={pixelPointList(points, width, height)}
      stroke={tone}
      strokeDasharray={`${strokeWidth * 3.5} ${strokeWidth * 2.5}`}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
    />
  );
}

const WALL_CORNER_NAMES = ["TOP LEFT", "TOP RIGHT", "BOTTOM RIGHT", "BOTTOM LEFT"];

function NextCornerPrompt({ index }: { index: number }) {
  return (
    <span className="room-editor-next" data-testid="wall-corner-prompt">
      <b>{index + 1}</b>
      <span>Next · {WALL_CORNER_NAMES[index]}</span>
    </span>
  );
}

function DrawingLayer({
  project,
  tool,
  draft,
  activeTone,
}: RoomEditorOverlayProps & { activeTone: string }) {
  const width = project.source.width;
  const height = project.source.height;
  const markerSize = Math.min(width, height);
  return (
    <svg
      className="room-editor-overlay__drawing"
      preserveAspectRatio="xMidYMid meet"
      viewBox={`0 0 ${width} ${height}`}
    >
      <Outline
        closed={project.wallQuad.length === 4}
        height={height}
        points={project.wallQuad}
        tone="rgba(227, 198, 158, .96)"
        width={width}
      />
      <Outline
        height={height}
        points={project.referenceSegment}
        tone="rgba(140, 183, 142, .98)"
        width={width}
      />
      {project.scenario === "insert" ? (
        <Outline
          closed={project.openingQuad.length === 4}
          height={height}
          points={project.openingQuad}
          tone="rgba(121, 182, 201, .98)"
          width={width}
        />
      ) : null}
      {project.removalPolygons.map((polygon, index) => (
        <Outline
          closed
          fill="rgba(243, 202, 118, .16)"
          height={height}
          key={`cleanup-${index}`}
          points={polygon}
          tone="#f3ca76"
          width={width}
        />
      ))}
      {project.foregroundPolygons.map((polygon, index) => (
        <Outline
          closed
          fill="rgba(240, 174, 105, .13)"
          height={height}
          key={`foreground-${index}`}
          points={polygon}
          tone="#f0ae69"
          width={width}
        />
      ))}
      <Outline
        closed={draft.length >= 3}
        fill={draft.length >= 3 ? "rgba(255, 255, 255, .12)" : "none"}
        height={height}
        points={draft}
        tone={activeTone}
        width={width}
      />
      {project.hearthFrontCenter && tool === "hearth-depth" ? (
        <>
          <circle
            cx={project.hearthFrontCenter.x * width}
            cy={project.hearthFrontCenter.y * height}
            fill="rgba(255, 255, 255, .2)"
            r={markerSize * 0.022}
            stroke="#f3ca76"
            strokeWidth={Math.max(2, markerSize * 0.0025)}
          />
          <circle
            cx={project.hearthFrontCenter.x * width}
            cy={project.hearthFrontCenter.y * height}
            fill="#f3ca76"
            r={markerSize * 0.006}
          />
        </>
      ) : null}
      {project.cleanupSamplePoint && tool === "cleanup-sample" ? (
        <>
          <circle
            cx={project.cleanupSamplePoint.x * width}
            cy={project.cleanupSamplePoint.y * height}
            fill="rgba(255, 255, 255, .18)"
            r={markerSize * 0.022}
            stroke="#8fd3bd"
            strokeWidth={Math.max(2, markerSize * 0.0025)}
          />
          <path
            d={`M ${project.cleanupSamplePoint.x * width - markerSize * 0.014} ${project.cleanupSamplePoint.y * height} H ${project.cleanupSamplePoint.x * width + markerSize * 0.014} M ${project.cleanupSamplePoint.x * width} ${project.cleanupSamplePoint.y * height - markerSize * 0.014} V ${project.cleanupSamplePoint.y * height + markerSize * 0.014}`}
            stroke="#8fd3bd"
            strokeWidth={Math.max(2, markerSize * 0.0025)}
          />
        </>
      ) : null}
    </svg>
  );
}

export function RoomEditorOverlay({ project, tool, draft }: RoomEditorOverlayProps) {
  if (tool === "view") return null;
  const activeTone = tool === "cleanup" ? "#f3ca76" : "#f0ae69";
  return (
    <div aria-hidden="true" className="room-editor-overlay" data-testid="room-editor-overlay">
      <DrawingLayer activeTone={activeTone} draft={draft} project={project} tool={tool} />
      <PointHandles
        labels={(index) => `${index + 1}`}
        points={project.wallQuad}
        testIdPrefix="wall-corner-marker"
        tone="#e3c69e"
      />
      {tool === "wall" && project.wallQuad.length < 4 ? (
        <NextCornerPrompt index={project.wallQuad.length} />
      ) : null}
      <PointHandles
        labels={(index) => (index === 0 ? "A" : "B")}
        points={project.referenceSegment}
        tone="#8cb78e"
      />
      {project.scenario === "insert" ? (
        <PointHandles
          labels={(index) => `${index + 1}`}
          points={project.openingQuad}
          tone="#79b6c9"
        />
      ) : null}
      <PointHandles labels={(index) => `${index + 1}`} points={draft} tone={activeTone} />
    </div>
  );
}
