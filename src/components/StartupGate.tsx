import type { CSSProperties } from "react";
import { UiIcon } from "@/components/UiIcon";

type StartupGateProps = {
  error: string | null;
  progress: number;
  total: number;
  onRetry: () => void;
};

export function StartupGate({ error, progress, total, onRetry }: StartupGateProps) {
  const percent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <main className="startup-gate">
      <div className="startup-gate__brand">
        <span className="startup-mark" aria-hidden="true" />
        <span>FireDesign</span>
      </div>
      {error ? (
        <section className="startup-error" role="alert">
          <div className="startup-error__icon">
            <UiIcon name="warning" size={28} />
          </div>
          <p className="eyebrow">Showroom check</p>
          <h1>The presentation could not start safely.</h1>
          <p>{error}</p>
          <button className="primary-button" onClick={onRetry} type="button">
            Run checks again
          </button>
        </section>
      ) : (
        <section className="startup-progress" aria-live="polite">
          <div
            className="startup-progress__ring"
            style={{ "--progress": `${percent * 3.6}deg` } as CSSProperties}
          >
            <span>{percent}%</span>
          </div>
          <div>
            <p className="eyebrow">Preparing showroom</p>
            <h1>Verifying approved materials</h1>
            <p>
              {progress === 0
                ? "Checking graphics hardware"
                : `Verified ${progress} of ${total} visual assets`}
            </p>
          </div>
        </section>
      )}
    </main>
  );
}
