"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Loader2, RotateCcw, ScanFace, ShieldCheck } from "lucide-react";
import type { PhotoMatch } from "@/lib/data/face-search";
import { PhotoMatchCard } from "./PhotoMatchCard";
import { CheckMark, SwitchMark } from "@/components/ui/Switch";

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
    <section aria-labelledby="ai-search-title" className="space-y-5">
      <div className="card relative overflow-hidden p-6 md:p-8">
        <div aria-hidden className="dot-grid absolute inset-0 [mask-image:radial-gradient(ellipse_60%_80%_at_100%_0%,black,transparent_70%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <p className="eyebrow flex items-center gap-2">
              <ScanFace className="size-4" aria-hidden /> AI Face Search
            </p>
            <h2 id="ai-search-title" className="mt-3 text-display-md font-semibold">
              Find every photo <em>you&apos;re in</em>
            </h2>
            <p className="mt-2 max-w-xl text-[14.5px] text-ink-muted">
              Take a selfie and we&apos;ll find you in the photos from {eventTitle}.
            </p>

            <label className="mt-5 flex max-w-xl cursor-pointer items-start gap-3 rounded-tile bg-sunken/70 p-3.5 text-[13.5px] text-ink-2">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="peer sr-only" />
              <CheckMark />
              <span>
                I agree to my selfie being turned into face numbers on this device to search this event&apos;s photos. The numbers are used once and not stored.
              </span>
            </label>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!consent || busy}
                onClick={() => cameraRef.current?.click()}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-night px-5 text-[14.5px] font-medium text-white shadow-button transition-colors hover:bg-night-3 active:scale-[0.98] disabled:opacity-40"
              >
                <Camera className="size-4" aria-hidden /> Take a selfie
              </button>
              <button
                type="button"
                disabled={!consent || busy}
                onClick={() => uploadRef.current?.click()}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-surface px-5 text-[14.5px] font-medium shadow-card transition-shadow hover:shadow-raised active:scale-[0.98] disabled:opacity-40"
              >
                <ImageUp className="size-4" aria-hidden /> Upload a photo
              </button>
              {(phase.kind === "done" || phase.kind === "error") && (
                <button type="button" onClick={reset} className="inline-flex h-11 items-center gap-2 rounded-xl px-4 text-[14px] font-medium text-ink-muted transition-colors hover:bg-ink/[0.05] hover:text-ink">
                  <RotateCcw className="size-4" aria-hidden /> Start over
                </button>
              )}
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="user" className="sr-only" tabIndex={-1} aria-hidden onChange={onPick} />
            <input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={onPick} />
          </div>

          {preview && (
            <div className="relative mx-auto size-36 shrink-0 overflow-hidden rounded-card shadow-raised md:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Your selfie (stays on this device)" className="size-full object-cover" />
              {phase.kind === "working" && (
                <span aria-hidden className="pointer-events-none absolute inset-0">
                  {/* Face scan: a laser line sweeping over a faint grid */}
                  <span className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:12px_12px]" />
                  <span className="scanline absolute inset-x-0 top-0 h-[10%]">
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#F0D7FF] shadow-[0_0_12px_3px_rgba(240,215,255,0.9)]" />
                    <span className="absolute inset-0 bg-gradient-to-b from-transparent to-[#F0D7FF]/35" />
                  </span>
                </span>
              )}
              <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-full bg-black/60 py-1 text-[10.5px] font-semibold text-white">
                <ShieldCheck className="size-3" aria-hidden /> Stays on device
              </span>
            </div>
          )}
        </div>

        <div aria-live="polite" className="relative">
          {phase.kind === "working" && (
            <p className="mt-5 flex items-center gap-2 text-[14px] font-medium text-ink-2">
              <Loader2 className="size-4 animate-spin text-ink" aria-hidden /> {STEP_LABEL[phase.step]}
            </p>
          )}
          {phase.kind === "error" && (
            <p role="alert" className="mt-5 rounded-tile bg-danger-soft px-4 py-3 text-[14px] font-medium text-danger">
              {phase.message}
            </p>
          )}
          {phase.kind === "done" && (
            <p className="mt-5 text-[14px] font-medium text-ink-2">
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
            <li key={m.photoId} className="rise-in" style={{ ["--i" as string]: Math.min(i, 12) }}>
              <PhotoMatchCard match={m} index={i} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
