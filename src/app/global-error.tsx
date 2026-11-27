"use client";

/** Last resort, when even the root layout fails: plain HTML, no app styles needed. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN">
      <body style={{ margin: 0, minHeight: "100dvh", display: "grid", placeItems: "center", background: "#161820", color: "#EFEAE0", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ textAlign: "center", padding: 24 }}>
          <h1 style={{ fontSize: 32, margin: 0, fontWeight: 600 }}>EvntCult didn&apos;t load.</h1>
          <p style={{ color: "#9C968B", marginTop: 12 }}>Check your connection and try again.</p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 20, height: 44, padding: "0 24px", borderRadius: 4, border: "1px solid #D4B87A", background: "#D4B87A", color: "#161820", fontWeight: 600, fontSize: 13, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer" }}
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
