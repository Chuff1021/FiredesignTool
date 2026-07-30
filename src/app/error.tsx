"use client";

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="fatal-error">
      <div>
        <p className="eyebrow">Showroom recovery</p>
        <h1>The presentation needs to restart.</h1>
        <p>Your last validated design is saved on this computer.</p>
        <button className="primary-button" onClick={reset} type="button">
          Restart safely
        </button>
      </div>
    </main>
  );
}
