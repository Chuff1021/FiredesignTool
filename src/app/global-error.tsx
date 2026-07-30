"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="fatal-error">
          <div>
            <h1>FireDesign needs to restart.</h1>
            <p>Your saved showroom configuration will be restored.</p>
            <button onClick={reset} type="button">
              Restart application
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
