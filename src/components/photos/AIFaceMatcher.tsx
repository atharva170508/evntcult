"use client";

import { useEffect, useRef, useState } from "react";
import type { PhotoMatch } from "@/lib/data/face-search";
import { PhotoMatchCard } from "./PhotoMatchCard";
import { buttonClass } from "@/components/ui/Button";

type Phase =
  | { kind: "idle" }
  | { kind: "working"; step: "loading-model" | "finding-face" | "searching" }
  | { kind: "done"; matches: PhotoMatch[]; faces: number }
  | { kind: "error"; message: string };

const STEP_LABEL = {
  "loading-model": "Loading the face model (first time only, about 7 MB)…",
  "finding-face": "Finding your face… (on your phone)",
  searching: "Searching the event's photos…",
} as const;

/**
 * AI Face Search: take or pick a selfie, turn it into 128 numbers on the device, and find the
 * event photos you're in. The selfie never leaves the phone and nothing about it is stored.
 */
export function AIFaceMatcher({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [preview, setPreview] = useState<string | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  async function run(file: File) {
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return URL.createObjectURL(file);
    });
    try {
      // Loaded only now, so the gallery page stays light for everyone else.
      const { embedSelfie, SelfieError } = await import("@/lib/face/browser");
      let result: { embedding: number[]; faces: number };
      try {
        result = await embedSelfie(file, (step) => setPhase({ kind: "working", step }));
      } catch (e) {
        throw new Error(e instanceof SelfieError ? e.message : "Something went wrong reading that photo.");
      }
      setPhase({ kind: "working", step: "searching" });
      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/face-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedding: result.embedding }),
      });
      const data = (await res.json().catch(() => ({}))) as { matches?: PhotoMatch[]; error?: { message: string } };
      if (!res.ok || !data.matches) throw new Error(data.error?.message ?? "Search failed. Try again.");
      setPhase({ kind: "done", matches: data.matches, faces: result.faces });
    } catch (e) {
      setPhase({ kind: "error", message: e instanceof Error ? e.message : "Search failed. Try again." });
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (file) void run(file);
  }

  function reset() {
    setPhase({ kind: "idle" });
    setPreview((old) => {
      if (old) URL.revokeObjectURL(old);
      return null;
    });
  }

  const busy = phase.kind === "working";

  return (
    <section aria-labelledby="ai-search-title" className="space-y-6">
      <div className="card p-4 sm:p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="min-w-0 flex-1">
            <p className="eyebrow">AI face search</p>
            <h2 id="ai-search-title" className="mt-1 text-heading">
              Find every photo you&apos;re in
            </h2>
            <p className="mt-2 max-w-xl text-body text-ink-muted">
              Take a selfie and we&apos;ll find you in the photos from {eventTitle}.
            </p>

            <label className="mt-6 flex max-w-xl cursor-pointer items-start gap-3 border-l-2 border-line-strong py-1 pl-3 text-body-sm text-ink-muted">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-[var(--accent)]" />
              <span>
                I agree to my selfie being turned into face numbers on this device to search this event&apos;s photos. The numbers are used once and not stored.
              </span>
            </label>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!consent || busy}
                onClick={() => cameraRef.current?.click()}
                className={buttonClass("primary")}
              >
                Take a selfie
              </button>
              <button
                type="button"
                disabled={!consent || busy}
                onClick={() => uploadRef.current?.click()}
                className={buttonClass("secondary")}
              >
                Upload a photo
              </button>
              {(phase.kind === "done" || phase.kind === "error") && (
                <button type="button" onClick={reset} className={buttonClass("ghost")}>
                  Start over
                </button>
              )}
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="user" className="sr-only" tabIndex={-1} aria-hidden onChange={onPick} />
            <input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={onPick} />
          </div>

          {preview && (
            <figure className="mx-auto w-36 shrink-0 md:mx-0">
              <div className="size-36 overflow-hidden rounded-md border border-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Your selfie (stays on this device)" className="size-full object-cover" />
              </div>
              <figcaption className="mt-2 font-mono text-caption text-ink-muted">Stays on this device</figcaption>
            </figure>
          )}
        </div>

        <div aria-live="polite">
          {phase.kind === "working" && (
            <p className="mt-6 flex items-center gap-2 text-body font-semibold text-ink-2">
               {STEP_LABEL[phase.step]}
            </p>
          )}
          {phase.kind === "error" && (
            <p role="alert" className="mt-6 border-l-2 border-bad bg-surface px-4 py-3 text-body font-semibold text-danger">
              {phase.message}
            </p>
          )}
          {phase.kind === "done" && (
            <p className="mt-6 text-body font-semibold text-ink-2">
              {phase.matches.length === 0
                ? "No photos of you yet. Try a clearer selfie, or check back after the photographers add more."
                : `Found you in ${phase.matches.length} photo${phase.matches.length === 1 ? "" : "s"}.`}
            </p>
          )}
        </div>
      </div>

      {phase.kind === "done" && phase.matches.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {phase.matches.map((m, i) => (
            <li key={m.photoId}>
              <PhotoMatchCard match={m} index={i} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
