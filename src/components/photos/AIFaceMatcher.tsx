"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, Loader2, RotateCcw, ScanFace, ShieldCheck } from "lucide-react";
import type { PhotoMatch } from "@/lib/data/face-search";
import { PhotoMatchCard } from "./PhotoMatchCard";

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
        <div aria-hidden className="absolute -right-20 -top-20 size-64 rounded-full bg-volt/10 blur-3xl" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.14em] text-volt">
              <ScanFace className="size-4" aria-hidden /> AI Face Search
            </p>
            <h2 id="ai-search-title" className="title-xl mt-2 text-[clamp(28px,3.4vw,40px)]">
              Find every photo <em>you&apos;re in</em>
            </h2>
            <p className="mt-2 max-w-xl text-[14.5px] text-ink-muted">
              Take a selfie and we&apos;ll find you in the photos from {eventTitle}. Your face is read on your own phone. Only a set of numbers is used to search, and nothing is saved.
            </p>

            <label className="mt-5 flex max-w-xl cursor-pointer items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-[13.5px] text-ink-2">
              <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 size-4 shrink-0 accent-volt" />
              <span>
                I agree to my selfie being turned into face numbers on this device to search this event&apos;s photos. The numbers are used once and not stored.
              </span>
            </label>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!consent || busy}
                onClick={() => cameraRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full bg-volt px-5 py-3 text-[14.5px] font-bold text-ink-inverse transition-colors hover:bg-volt-hover disabled:opacity-40"
              >
                <Camera className="size-4" aria-hidden /> Take a selfie
              </button>
              <button
                type="button"
                disabled={!consent || busy}
                onClick={() => uploadRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[14.5px] font-semibold transition-colors hover:border-volt/60 disabled:opacity-40"
              >
                <ImageUp className="size-4" aria-hidden /> Upload a photo
              </button>
              {(phase.kind === "done" || phase.kind === "error") && (
                <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-[14px] font-semibold text-ink-muted hover:text-volt">
                  <RotateCcw className="size-4" aria-hidden /> Start over
                </button>
              )}
            </div>
            <input ref={cameraRef} type="file" accept="image/*" capture="user" className="sr-only" tabIndex={-1} aria-hidden onChange={onPick} />
            <input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" tabIndex={-1} aria-hidden onChange={onPick} />
          </div>

          {preview && (
            <div className="relative mx-auto size-36 shrink-0 overflow-hidden rounded-[28px] border border-white/10 md:mx-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Your selfie (stays on this device)" className="size-full object-cover" />
              <span className="absolute inset-x-2 bottom-2 flex items-center justify-center gap-1 rounded-full bg-black/60 py-1 text-[10.5px] font-semibold text-white">
                <ShieldCheck className="size-3" aria-hidden /> Stays on device
              </span>
            </div>
          )}
        </div>

        <div aria-live="polite" className="relative">
          {phase.kind === "working" && (
            <p className="mt-5 flex items-center gap-2 text-[14px] font-semibold text-ink-2">
              <Loader2 className="size-4 animate-spin text-volt" aria-hidden /> {STEP_LABEL[phase.step]}
            </p>
          )}
          {phase.kind === "error" && (
            <p role="alert" className="mt-5 rounded-2xl bg-danger-soft px-4 py-3 text-[14px] font-semibold text-danger">
              {phase.message}
            </p>
          )}
          {phase.kind === "done" && (
            <p className="mt-5 text-[14px] font-semibold text-ink-2">
              {phase.matches.length === 0
                ? "No photos of you yet. Try a clearer selfie, or check back after the photographers add more."
                : `Found you in ${phase.matches.length} photo${phase.matches.length === 1 ? "" : "s"}.`}
              {phase.faces > 1 && <span className="font-normal text-ink-muted"> We used the biggest face in your photo.</span>}
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
