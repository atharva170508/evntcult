"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ImageUp, Layers, Loader2, RotateCcw, ScanFace, ShieldCheck } from "lucide-react";
import type { PhotoMatch } from "@/lib/data/face-search";
import { PhotoMatchCard } from "./PhotoMatchCard";

type Phase =
  | { kind: "idle" }
  | { kind: "working"; step: string }
  | { kind: "done"; matches: PhotoMatch[]; faces: number; angles: number }
  | { kind: "error"; message: string };

interface AngleSlot {
  id: "front" | "angle" | "smile";
  title: string;
  hint: string;
  file: File | null;
  previewUrl: string | null;
}

const DEFAULT_SLOTS: AngleSlot[] = [
  { id: "front", title: "1. Front View", hint: "Looking straight", file: null, previewUrl: null },
  { id: "angle", title: "2. Slight Angle", hint: "Turn head 15°", file: null, previewUrl: null },
  { id: "smile", title: "3. Expression", hint: "Big smile / laugh", file: null, previewUrl: null },
];

/**
 * Multi-angle face search with on-device feature extraction.
 * Photos stay on the device; only 128-d numerical descriptors are sent.
 */
export function AIFaceMatcher({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [mode, setMode] = useState<"ultra" | "quick">("ultra");
  const [slots, setSlots] = useState<AngleSlot[]>(DEFAULT_SLOTS);
  const [activeSlotId, setActiveSlotId] = useState<"front" | "angle" | "smile" | null>(null);
  const [consent, setConsent] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const singleCameraRef = useRef<HTMLInputElement>(null);
  const singleUploadRef = useRef<HTMLInputElement>(null);
  const slotCameraRef = useRef<HTMLInputElement>(null);
  const slotUploadRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount or reset
  useEffect(() => {
    return () => {
      slots.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl));
    };
  }, [slots]);

  function updateSlotFile(id: "front" | "angle" | "smile", file: File) {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
        return { ...s, file, previewUrl: URL.createObjectURL(file) };
      }),
    );
  }

  function handleBatchFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const list = Array.from(files).slice(0, 3);
    setSlots((prev) =>
      prev.map((slot, idx) => {
        const file = list[idx] ?? slot.file;
        if (!list[idx]) return slot;
        if (slot.previewUrl) URL.revokeObjectURL(slot.previewUrl);
        return { ...slot, file, previewUrl: URL.createObjectURL(file) };
      }),
    );
  }

  async function executeSearch(targetFiles: File[]) {
    if (targetFiles.length === 0) return;
    try {
      setPhase({ kind: "working", step: "Loading face recognition engine on device…" });
      const { embedSelfieEnsemble, SelfieError } = await import("@/lib/face/browser");

      let result: { embeddings: number[][]; faces: number };
      try {
        result = await embedSelfieEnsemble(targetFiles, (step) => {
          if (step === "loading-model") {
            setPhase({ kind: "working", step: "Loading face model (on device, ~7 MB)…" });
          } else if (step.startsWith("finding-face-")) {
            const parts = step.split("-");
            setPhase({ kind: "working", step: `Extracting features from angle ${parts[2]} of ${parts[4]}…` });
          } else {
            setPhase({ kind: "working", step: "Extracting facial features on device…" });
          }
        });
      } catch (e) {
        throw new Error(e instanceof SelfieError ? e.message : "Something went wrong reading that photo.");
      }

      setPhase({ kind: "working", step: "Searching event photos with multi-angle ensemble…" });

      const res = await fetch(`/api/events/${encodeURIComponent(eventId)}/face-match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embeddings: result.embeddings }),
      });

      const data = (await res.json().catch(() => ({}))) as { matches?: PhotoMatch[]; error?: { message: string } };
      if (!res.ok || !data.matches) throw new Error(data.error?.message ?? "Search failed. Try again.");

      setPhase({ kind: "done", matches: data.matches, faces: result.faces, angles: targetFiles.length });
    } catch (e) {
      setPhase({ kind: "error", message: e instanceof Error ? e.message : "Search failed. Try again." });
    }
  }

  function runQuick(file: File) {
    updateSlotFile("front", file);
    void executeSearch([file]);
  }

  function runUltra() {
    const readyFiles = slots.map((s) => s.file).filter((f): f is File => f !== null);
    if (readyFiles.length === 0) return;
    void executeSearch(readyFiles);
  }

  function reset() {
    setPhase({ kind: "idle" });
    setSlots((prev) => {
      prev.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl));
      return DEFAULT_SLOTS;
    });
  }

  const busy = phase.kind === "working";
  const filledCount = slots.filter((s) => s.file !== null).length;

  return (
    <section aria-labelledby="ai-search-title" className="space-y-5">
      <div className="card relative overflow-hidden p-6 md:p-8">
        <div className="relative space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[13px] font-semibold text-accent-ink">
              <ScanFace className="size-4" aria-hidden /> Face photo search
            </p>
            <div className="flex items-center gap-1.5 rounded-full border border-line-strong bg-sunken px-3 py-1 text-[12px] font-semibold text-ink-2">
              <ShieldCheck className="size-3.5 text-live" aria-hidden /> On-device matching
            </div>
          </div>

          <div>
            <h2 id="ai-search-title" className="title-xl text-[clamp(28px,3.4vw,42px)]">
              Find every photo <em>you&apos;re in</em>
            </h2>
            <p className="mt-2 max-w-2xl text-[14.5px] text-ink-muted">
              Using multi-angle facial vector matching, we identify your photos across crowd shots, stage lighting, and natural expressions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMode("ultra")}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-[13.5px] font-semibold transition-all ${
                mode === "ultra"
                  ? "border-ink bg-ink text-white shadow-sm"
                  : "border-line-strong bg-sunken text-ink-2 hover:border-ink hover:text-ink"
              }`}
            >
              <Layers className="size-4" aria-hidden /> 3-Angle Scan (Better in crowds)
            </button>
            <button
              type="button"
              onClick={() => setMode("quick")}
              className={`inline-flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2 text-[13.5px] font-semibold transition-all ${
                mode === "quick"
                  ? "border-ink bg-ink text-white shadow-sm"
                  : "border-line-strong bg-sunken text-ink-2 hover:border-ink hover:text-ink"
              }`}
            >
              <Camera className="size-4" aria-hidden /> Quick Scan (1 Photo)
            </button>
          </div>

          <label className="flex max-w-xl cursor-pointer items-start gap-3 rounded-2xl border border-line-strong bg-sunken/70 p-3.5 text-[13px] text-ink-2">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-ink"
            />
            <span>
              I agree to my photo being turned into numerical facial descriptors <b>locally on this device</b>. Photos are never uploaded or stored on any server.
            </span>
          </label>

          {mode === "ultra" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {slots.map((s) => (
                  <div
                    key={s.id}
                    className={`relative flex flex-col justify-between overflow-hidden rounded-[20px] border p-4 transition-all ${
                      s.file
                        ? "border-ink bg-sunken"
                        : "border-line-strong bg-sunken/50 hover:border-ink-subtle"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[14px] font-semibold text-ink">{s.title}</p>
                        <p className="text-[12px] text-ink-muted">{s.hint}</p>
                      </div>
                      {s.file ? (
                        <CheckCircle2 className="size-5 text-live" aria-hidden />
                      ) : (
                        <span className="size-2 rounded-full bg-line-strong" aria-hidden />
                      )}
                    </div>

                    <div className="my-3 flex justify-center">
                      {s.previewUrl ? (
                        <div className="relative size-20 overflow-hidden rounded-2xl border border-line-strong">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={s.previewUrl} alt={s.title} width={80} height={80} className="size-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex size-20 items-center justify-center rounded-2xl border border-dashed border-line-strong bg-surface text-ink-subtle">
                          <ScanFace className="size-8" aria-hidden />
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={!consent || busy}
                        onClick={() => {
                          setActiveSlotId(s.id);
                          slotCameraRef.current?.click();
                        }}
                        className="flex-1 min-h-[44px] rounded-xl border border-line-strong bg-surface py-2 text-center text-[12.5px] font-semibold text-ink transition-colors hover:border-ink disabled:opacity-40 sm:min-h-[36px]"
                      >
                        Snap
                      </button>
                      <button
                        type="button"
                        disabled={!consent || busy}
                        onClick={() => {
                          setActiveSlotId(s.id);
                          slotUploadRef.current?.click();
                        }}
                        className="flex-1 min-h-[44px] rounded-xl border border-line-strong bg-surface py-2 text-center text-[12.5px] font-semibold text-ink-2 transition-colors hover:border-ink hover:text-ink disabled:opacity-40 sm:min-h-[36px]"
                      >
                        Upload
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!consent || busy || filledCount === 0}
                  onClick={runUltra}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-lavender px-6 py-2.5 text-[14.5px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors hover:bg-lavender-hover disabled:opacity-40"
                >
                  <ScanFace className="size-4" aria-hidden />
                  {filledCount === 3
                    ? "Start 3-Angle Scan"
                    : `Scan with ${filledCount} Angle${filledCount > 1 ? "s" : ""}`}
                </button>

                <button
                  type="button"
                  disabled={!consent || busy}
                  onClick={() => singleUploadRef.current?.click()}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 py-2.5 text-[13.5px] font-semibold text-ink transition-colors hover:border-ink disabled:opacity-40"
                >
                  <ImageUp className="size-4" aria-hidden /> Batch select 3 photos
                </button>

                {(phase.kind === "done" || phase.kind === "error" || filledCount > 0) && (
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-ink-muted hover:text-ink"
                  >
                    <RotateCcw className="size-3.5" aria-hidden /> Clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Controls for Quick Scan Mode */}
          {mode === "quick" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={!consent || busy}
                  onClick={() => singleCameraRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full bg-volt px-5 py-3 text-[14.5px] font-bold text-ink-inverse transition-colors hover:bg-volt-hover disabled:opacity-40 shadow-brand"
                >
                  <Camera className="size-4" aria-hidden /> Take a selfie
                </button>
                <button
                  type="button"
                  disabled={!consent || busy}
                  onClick={() => singleUploadRef.current?.click()}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-[14.5px] font-semibold transition-colors hover:border-volt/60 disabled:opacity-40"
                >
                  <ImageUp className="size-4" aria-hidden /> Upload a photo
                </button>
                {(phase.kind === "done" || phase.kind === "error") && (
                  <button
                    type="button"
                    onClick={reset}
                    className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-[14px] font-semibold text-ink-muted hover:text-volt"
                  >
                    <RotateCcw className="size-4" aria-hidden /> Start over
                  </button>
                )}
              </div>

              {slots[0].previewUrl && (
                <div className="relative size-24 overflow-hidden rounded-[22px] border border-volt/40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slots[0].previewUrl} alt="Your selfie" className="size-full object-cover" />
                  <span className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded-full bg-black/70 py-0.5 text-[9.5px] font-semibold text-white">
                    <ShieldCheck className="size-2.5" aria-hidden /> On-device
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Hidden File Inputs */}
          <input
            ref={singleCameraRef}
            type="file"
            accept="image/*"
            capture="user"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) runQuick(file);
            }}
          />
          <input
            ref={singleUploadRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              if (mode === "ultra") {
                handleBatchFiles(e.target.files);
              } else {
                const file = e.target.files?.[0];
                if (file) runQuick(file);
              }
              e.target.value = "";
            }}
          />
          <input
            ref={slotCameraRef}
            type="file"
            accept="image/*"
            capture="user"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file && activeSlotId) updateSlotFile(activeSlotId, file);
            }}
          />
          <input
            ref={slotUploadRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            tabIndex={-1}
            aria-hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file && activeSlotId) updateSlotFile(activeSlotId, file);
            }}
          />

          {/* Feedback & Status Message */}
          <div aria-live="polite">
            {phase.kind === "working" && (
              <p className="flex items-center gap-2 text-[14px] font-semibold text-ink-2">
                <Loader2 className="size-4 animate-spin text-volt" aria-hidden /> {phase.step}
              </p>
            )}
            {phase.kind === "error" && (
              <p role="alert" className="rounded-2xl bg-danger-soft px-4 py-3 text-[14px] font-semibold text-danger">
                {phase.message}
              </p>
            )}
            {phase.kind === "done" && (
              <div className="space-y-1">
                <p className="text-[15px] font-bold text-ink">
                  {phase.matches.length === 0
                    ? "No photos of you found in this event yet."
                    : `Found you in ${phase.matches.length} photo${phase.matches.length === 1 ? "" : "s"} across ${phase.angles} angle${phase.angles > 1 ? "s" : ""}!`
                  }
                </p>
                <p className="text-[12.5px] text-ink-muted">
                  Scanned with on-device feature extraction · Zero cloud face uploads.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Grid */}
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
