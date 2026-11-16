"use client";

/**
 * Organizer photo upload. Each photo is redrawn in the browser before upload:
 *  • resized to at most 2560 px (and a 480 px thumbnail for grids)
 *  • re-saved as JPEG (PNG stays PNG unless it's too big), which also drops EXIF data,
 *    including the GPS location phones hide inside photos
 * Then uploaded one at a time with progress. The server re-checks type and size.
 */
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ImagePlus, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_SIDE = 2560;
const THUMB_SIDE = 480;
const MAX_BYTES = 10 * 1024 * 1024;

type Item = { name: string; state: "waiting" | "working" | "done" | "error"; error?: string };

async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode(); // modern browsers apply the photo's EXIF rotation when drawing
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

function draw(img: HTMLImageElement, maxSide: number, type: string, quality: number): Promise<{ blob: Blob; w: number; h: number }> {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d")!;
  if (type === "image/jpeg") {
    g.fillStyle = "#fff"; // transparent PNG areas become white, not black
    g.fillRect(0, 0, w, h);
  }
  g.drawImage(img, 0, 0, w, h);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve({ blob: b, w, h }) : reject(new Error("Couldn't process this photo."))), type, quality));
}

async function prepare(file: File) {
  const img = await loadImage(file);
  let full = await draw(img, MAX_SIDE, file.type === "image/png" ? "image/png" : "image/jpeg", 0.88);
  if (full.blob.size > MAX_BYTES) full = await draw(img, MAX_SIDE, "image/jpeg", 0.82);
  if (full.blob.size > MAX_BYTES) throw new Error("Still over 10 MB after resizing.");
  const thumb = await draw(img, THUMB_SIDE, "image/jpeg", 0.8);
  return { full: full.blob, thumb: thumb.blob, width: full.w, height: full.h };
}

export function PhotoUploader({ eventId }: { eventId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    const list = [...files];
    setItems(list.map((f) => ({ name: f.name, state: "waiting" })));
    setBusy(true);
    const set = (i: number, patch: Partial<Item>) => setItems((cur) => cur.map((x, j) => (j === i ? { ...x, ...patch } : x)));

    for (const [i, file] of list.entries()) {
      set(i, { state: "working" });
      try {
        if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Only JPEG, PNG or WebP.");
        const p = await prepare(file);
        const form = new FormData();
        form.append("photo", p.full, file.name.replace(/\.\w+$/, p.full.type === "image/png" ? ".png" : ".jpg"));
        form.append("thumb", p.thumb, "thumb.jpg");
        form.append("width", String(p.width));
        form.append("height", String(p.height));
        const res = await fetch(`/api/events/${eventId}/photos`, { method: "POST", body: form });
        if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { error?: { message?: string } }).error?.message ?? "Upload failed.");
        set(i, { state: "done" });
      } catch (err) {
        set(i, { state: "error", error: err instanceof Error ? err.message : "Upload failed." });
      }
    }
    setBusy(false);
    if (input.current) input.current.value = "";
    router.refresh();
  }

  const done = items.filter((i) => i.state === "done").length;
  const failed = items.filter((i) => i.state === "error").length;
  return (
    <div className="space-y-4">
      <label
        className={cn(
          "group flex cursor-pointer flex-col items-center gap-2 rounded-card border border-dashed border-line-strong bg-sunken/40 px-6 py-10 text-center transition-colors duration-fast hover:border-ink hover:bg-sunken/70 focus-within:border-ink",
          busy && "pointer-events-none opacity-60",
        )}
      >
        <span className="grid size-11 place-items-center rounded-tile bg-surface text-ink shadow-card transition-transform duration-base ease-out group-hover:-translate-y-0.5">
          <ImagePlus className="size-5" aria-hidden />
        </span>
        <span className="mt-2 text-[15px] font-medium">Add photos</span>
        <span className="text-[12.5px] text-ink-muted">JPEG, PNG or WebP · up to 10 MB each · location data is removed</span>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => upload(e.target.files)} disabled={busy} />
      </label>
      {items.length > 0 && (
        <div role="status" className="space-y-2">
          <div className="flex items-center justify-between text-[13px]">
            <p className="font-medium">
              {busy ? "Uploading…" : "Uploaded"} <span className="font-mono tabular-nums">{done}</span> of <span className="font-mono tabular-nums">{items.length}</span>
            </p>
            {failed > 0 && <p className="font-medium text-danger">{failed} failed</p>}
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-sunken">
            <div className="h-full rounded-full bg-ink transition-[width] duration-slow ease-out" style={{ width: `${((done + failed) / items.length) * 100}%` }} />
          </div>
          <ul className="max-h-48 divide-y divide-line overflow-y-auto rounded-tile bg-surface text-[12.5px] shadow-card">
            {items.map((it, i) => (
              <li key={i} className="flex items-center gap-2.5 px-3 py-2">
                {it.state === "done" ? (
                  <CheckCircle2 className="size-4 shrink-0 text-live" aria-label="Done" />
                ) : it.state === "error" ? (
                  <XCircle className="size-4 shrink-0 text-danger" aria-label="Failed" />
                ) : it.state === "working" ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-ink-muted" aria-label="Uploading" />
                ) : (
                  <span className="size-4 shrink-0 rounded-full border border-line-strong" aria-label="Waiting" />
                )}
                <span className="min-w-0 flex-1 truncate">{it.name}</span>
                {it.error && <span className="shrink-0 text-danger">{it.error}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
