"use client";

import { APP_VERSION, ASSET_VERSION } from "@/domain/catalog";
import type { GraphicsSupport } from "@/lib/readiness";
import { UiIcon } from "@/components/UiIcon";

export type DiagnosticsData = {
  cacheReady: boolean;
  fps: number;
  graphics: GraphicsSupport;
  online: boolean;
  rendererStatus: "ready" | "recovering" | "error";
  verifiedAssets: number;
};

type DiagnosticsPanelProps = {
  data: DiagnosticsData;
  onClose: () => void;
  onReload: () => void;
};

function DiagnosticRow({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "good" | "neutral" | "warn";
}) {
  return (
    <div className="diagnostic-row">
      <span>{label}</span>
      <strong data-tone={tone}>{value}</strong>
    </div>
  );
}

export function DiagnosticsPanel({ data, onClose, onReload }: DiagnosticsPanelProps) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="diagnostics-title"
        aria-modal="true"
        className="diagnostics-panel"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header>
          <div>
            <p className="eyebrow">Operator tools</p>
            <h2 id="diagnostics-title">System diagnostics</h2>
          </div>
          <button className="close-button" onClick={onClose} type="button">
            Close
          </button>
        </header>

        <div className="diagnostics-status">
          <span className="status-orb" data-status={data.rendererStatus} aria-hidden="true" />
          <div>
            <strong>
              {data.rendererStatus === "ready"
                ? "Showroom ready"
                : data.rendererStatus === "recovering"
                  ? "Renderer recovering"
                  : "Attention required"}
            </strong>
            <span>All customer-facing controls run locally.</span>
          </div>
        </div>

        <div className="diagnostics-grid">
          <DiagnosticRow label="Application" value={`v${APP_VERSION}`} />
          <DiagnosticRow label="Asset release" value={ASSET_VERSION} />
          <DiagnosticRow
            label="Approved assets"
            tone={data.verifiedAssets === 5 ? "good" : "warn"}
            value={`${data.verifiedAssets} / 5 verified`}
          />
          <DiagnosticRow
            label="Offline cache"
            tone={data.cacheReady ? "good" : "warn"}
            value={data.cacheReady ? "Ready" : "Preparing"}
          />
          <DiagnosticRow
            label="Network"
            tone={data.online ? "neutral" : "good"}
            value={data.online ? "Online" : "Offline-capable"}
          />
          <DiagnosticRow
            label="Frame rate"
            tone={data.fps >= 55 ? "good" : data.fps > 0 ? "warn" : "neutral"}
            value={data.fps > 0 ? `${Math.round(data.fps)} FPS` : "Measuring"}
          />
          <DiagnosticRow
            label="Graphics API"
            tone={data.graphics.supported ? "good" : "warn"}
            value={data.graphics.webgl2 ? "WebGL 2" : "WebGL 1"}
          />
          <DiagnosticRow label="GPU" value={data.graphics.renderer} />
        </div>

        <div className="diagnostics-note">
          <UiIcon name="diagnostics" />
          <p>
            Press <kbd>Shift</kbd> + <kbd>D</kbd> at any time to open this panel. Reloading
            restores the last validated design.
          </p>
        </div>

        <footer>
          <button className="secondary-button" onClick={onReload} type="button">
            Reload application
          </button>
          <button className="primary-button" onClick={onClose} type="button">
            Return to design
          </button>
        </footer>
      </section>
    </div>
  );
}
