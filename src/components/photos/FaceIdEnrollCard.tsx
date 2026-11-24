"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CheckCircle2, ImageUp, Loader2, RotateCcw, ScanFace, ShieldCheck, Sparkles } from "lucide-react";

interface FaceIdEnrollCardProps {
  onSuccess?: (matchedCount: number) => void;
  onSkip?: () => void;
  title?: string;
  subtitle?: string;
  compact?: boolean;
}

export function FaceIdEnrollCard({
  onSuccess,
  onSkip,
  title = "Activate Automatic Photo Vault",
  subtitle = "Take a 1-time selfie on your phone. Your event photos will automatically arrive in your Photo Vault!",
  compact = false,
}: FaceIdEnrollCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [stepMsg, setStepMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState<number | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function handleFile(f: File) {
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  }

  async function handleSave() {
    if (!file) return;
    setBusy(true);
    setError(null);

    try {
      setStepMsg("Loading face recognition model on device…");
      const { embedSelfie, SelfieError } = await import("@/lib/face/browser");

      let result: { embedding: number[]; faces: number };
      try {
        result = await embedSelfie(file, (step) => {
          if (step === "loading-model") {
            setStepMsg("Loading face model (on device, ~7 MB)…");
          } else {
            setStepMsg("Extracting face numbers on your phone…");
          }
        });
      } catch (e) {
        throw new Error(e instanceof SelfieError ? e.message : "Could not detect a clear face. Try a well-lit front angle.");
      }

      setStepMsg("Connecting to your Photo Vault & syncing events…");

      const res = await fetch("/api/me/face-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ embedding: result.embedding }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        matchedPhotos?: number;
        error?: { message: string };
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error?.message ?? "Failed to save Face ID. Try again.");
      }

      const count = data.matchedPhotos ?? 0;
      setSavedCount(count);
      setStepMsg(null);
      onSuccess?.(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try another photo.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setError(null);
    setSavedCount(null);
    setStepMsg(null);
  }

  return (
    <div className={`overflow-hidden rounded-2xl border border-line-strong bg-white p-6 shadow-card ${compact ? "max-w-md" : "w-full"}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-volt">
            <ScanFace className="size-3.5" aria-hidden /> Photo Vault Face ID
          </p>
          <h3 className="text-[20px] font-bold leading-snug tracking-[-0.02em] text-ink">{title}</h3>
          <p className="text-[13.5px] leading-relaxed text-ink-muted">{subtitle}</p>
        </div>
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-volt/15 text-volt">
          <Sparkles className="size-4" aria-hidden />
        </span>
      </div>

      {/* Success State */}
      {savedCount !== null ? (
        <div className="mt-5 rounded-xl border border-volt/40 bg-volt/[0.08] p-4 text-center">
          <CheckCircle2 className="mx-auto size-8 text-volt" aria-hidden />
          <p className="mt-2 text-[15px] font-bold text-ink">Photo Vault Face ID Active!</p>
          <p className="mt-1 text-[13px] text-ink-muted">
            {savedCount > 0
              ? `Auto-tagged ${savedCount} photo${savedCount === 1 ? "" : "s"} from your registered events directly into your Vault!`
              : "Saved! Whenever photos from your registered events are uploaded, they will automatically land in your Vault."
            }
          </p>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {/* Selfie Preview with Scanner Effect */}
          {preview ? (
            <div className="flex flex-col items-center gap-3">
              <div className="relative size-32 overflow-hidden rounded-[24px] border-2 border-volt shadow-raised">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Selfie preview" className="size-full object-cover" />
                {busy && (
                  <span aria-hidden className="pointer-events-none absolute inset-0">
                    <span className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] bg-[size:10px_10px]" />
                    <span className="scanline absolute inset-x-0 top-0 h-[15%]">
                      <span className="absolute inset-x-0 bottom-0 h-[2px] bg-volt shadow-[0_0_12px_3px_rgba(220,254,98,0.9)]" />
                    </span>
                  </span>
                )}
                <span className="absolute inset-x-1 bottom-1 flex items-center justify-center gap-1 rounded-full bg-black/75 py-0.5 text-[9px] font-semibold text-white">
                  <ShieldCheck className="size-2.5" aria-hidden /> Stays on device
                </span>
              </div>

              <button
                type="button"
                disabled={busy}
                onClick={reset}
                className="inline-flex items-center gap-1 text-[12px] font-semibold text-ink-muted hover:text-ink disabled:opacity-40"
              >
                <RotateCcw className="size-3" aria-hidden /> Retake photo
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-4 text-center transition-all hover:border-volt/60 hover:bg-white active:scale-[0.98]"
              >
                <Camera className="size-5 text-ink" aria-hidden />
                <div>
                  <p className="text-[13.5px] font-bold text-ink">Take selfie</p>
                  <p className="text-[11px] text-ink-muted">Use front camera</p>
                </div>
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => uploadInputRef.current?.click()}
                className="flex flex-col items-center gap-2 rounded-xl border border-line bg-surface p-4 text-center transition-all hover:border-volt/60 hover:bg-white active:scale-[0.98]"
              >
                <ImageUp className="size-5 text-ink" aria-hidden />
                <div>
                  <p className="text-[13.5px] font-bold text-ink">Upload photo</p>
                  <p className="text-[11px] text-ink-muted">Pick from gallery</p>
                </div>
              </button>
            </div>
          )}

          {/* Privacy Guarantee Note */}
          <div className="flex items-start gap-2 rounded-xl bg-sunken/60 p-3 text-[12px] text-ink-2">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-live" aria-hidden />
            <span>
              <b>100% Private:</b> Your selfie is turned into numbers locally on your device. Your actual photo is never uploaded or saved to any server.
            </span>
          </div>

          {/* Status / Error message */}
          {busy && stepMsg && (
            <p className="flex items-center gap-2 text-[13px] font-semibold text-ink-2">
              <Loader2 className="size-4 animate-spin text-volt" aria-hidden /> {stepMsg}
            </p>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-danger-soft px-3 py-2 text-[12.5px] font-semibold text-danger">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2">
            {onSkip && (
              <button
                type="button"
                disabled={busy}
                onClick={onSkip}
                className="text-[13px] font-semibold text-ink-muted hover:text-ink disabled:opacity-40"
              >
                Skip for now
              </button>
            )}

            {preview && (
              <button
                type="button"
                disabled={busy || !file}
                onClick={handleSave}
                className="ml-auto flex items-center justify-center gap-1.5 rounded-full bg-volt px-5 py-2.5 text-[13.5px] font-bold text-ink-inverse shadow-brand transition-all hover:bg-volt-hover active:scale-[0.98] disabled:opacity-40"
              >
                {busy && <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                Enable Auto-Vault
              </button>
            )}
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) handleFile(f);
        }}
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
