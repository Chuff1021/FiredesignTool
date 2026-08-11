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

function pointList(points: NormalizedPoint[]): string {
  return points.map((point) => `${point.x},${point.y}`).join(" ");
}

function PointHandles({ points, tone }: { points: NormalizedPoint[]; tone: string }) {
  return points.map((point, index) => (
    <circle
      cx={point.x}
      cy={point.y}
      fill={tone}
      key={`${point.x}-${point.y}-${index}`}
      r="0.007"
      stroke="rgba(18, 15, 12, .92)"
      strokeWidth="2"
      vectorEffect="non-scaling-stroke"
    />
  ));
}

function Outline({
  points,
  tone,
  fill = "none",
  closed = false,
}: {
  points: NormalizedPoint[];
  tone: string;
  fill?: string;
  closed?: boolean;
}) {
  if (points.length < 2) return null;
  const Shape = closed ? "polygon" : "polyline";
  return (
    <Shape
      fill={fill}
      points={pointList(points)}
      stroke={tone}
      strokeDasharray="9 7"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2.5"
      vectorEffect="non-scaling-stroke"
    />
  );
}

export function RoomEditorOverlay({ project, tool, draft }: RoomEditorOverlayProps) {
  if (tool === "view") return null;
  const activeTone = tool === "cleanup" ? "#f3ca76" : "#f0ae69";
  return (
    <svg
      aria-hidden="true"
      className="room-editor-overlay"
      data-testid="room-editor-overlay"
      preserveAspectRatio="none"
      viewBox="0 0 1 1"
    >
      <Outline closed points={project.wallQuad} tone="rgba(227, 198, 158, .96)" />
      <PointHandles points={project.wallQuad} tone="#e3c69e" />
      <Outline points={project.referenceSegment} tone="rgba(140, 183, 142, .98)" />
      <PointHandles points={project.referenceSegment} tone="#8cb78e" />
      {project.scenario === "insert" ? (
        <>
          <Outline closed points={project.openingQuad} tone="rgba(121, 182, 201, .98)" />
          <PointHandles points={project.openingQuad} tone="#79b6c9" />
        </>
      ) : null}
      {project.removalPolygons.map((polygon, index) => (
        <Outline
          closed
          fill="rgba(243, 202, 118, .16)"
          key={`cleanup-${index}`}
          points={polygon}
          tone="#f3ca76"
        />
      ))}
      {project.foregroundPolygons.map((polygon, index) => (
        <Outline
          closed
          fill="rgba(240, 174, 105, .13)"
          key={`foreground-${index}`}
          points={polygon}
          tone="#f0ae69"
        />
      ))}
      <Outline
        closed={draft.length >= 3}
        fill={draft.length >= 3 ? "rgba(255, 255, 255, .12)" : "none"}
        points={draft}
        tone={activeTone}
      />
      <PointHandles points={draft} tone={activeTone} />
      {project.hearthFrontCenter && tool === "hearth-depth" ? (
        <>
          <circle
            cx={project.hearthFrontCenter.x}
            cy={project.hearthFrontCenter.y}
            fill="rgba(255, 255, 255, .2)"
            r="0.014"
            stroke="#f3ca76"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <circle
            cx={project.hearthFrontCenter.x}
            cy={project.hearthFrontCenter.y}
            fill="#f3ca76"
            r="0.004"
          />
        </>
      ) : null}
      {project.cleanupSamplePoint && tool === "cleanup-sample" ? (
        <>
          <circle
            cx={project.cleanupSamplePoint.x}
            cy={project.cleanupSamplePoint.y}
            fill="rgba(255, 255, 255, .18)"
            r="0.016"
            stroke="#8fd3bd"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={`M ${project.cleanupSamplePoint.x - 0.011} ${project.cleanupSamplePoint.y} H ${project.cleanupSamplePoint.x + 0.011} M ${project.cleanupSamplePoint.x} ${project.cleanupSamplePoint.y - 0.011} V ${project.cleanupSamplePoint.y + 0.011}`}
            stroke="#8fd3bd"
            strokeWidth="2"
            vectorEffect="non-scaling-stroke"
          />
        </>
      ) : null}
    </svg>
  );
}
