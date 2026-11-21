"use client";

/** Last resort, when even the root layout fails: plain HTML, no app styles needed. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#FFFEF6", color: "#1A1A1A", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 32, margin: 0 }}>EvntCult didn&apos;t load.</h1>
          <p style={{ color: "#4A4740", marginTop: 12 }}>Check your connection and try again.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 20, height: 44, padding: "0 20px", borderRadius: 12, border: "2px solid #1A1A1A", background: "#F0D7FF", fontWeight: 600, fontSize: 15, cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
