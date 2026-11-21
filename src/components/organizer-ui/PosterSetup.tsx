"use client";

import { useRef, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Button, Section } from "./primitives";

/** Resize in the browser: longest side 1200px, WebP (JPEG where WebP encoding isn't supported). */
async function shrink(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 1200 / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * scale);
  c.height = Math.round(bmp.height * scale);
  c.getContext("2d")!.drawImage(bmp, 0, 0, c.width, c.height);
  const as = (type: string, q: number) => new Promise<Blob | null>((r) => c.toBlob(r, type, q));
  let out = await as("image/webp", 0.82);
  if (!out || out.type !== "image/webp") out = await as("image/jpeg", 0.85);
  for (let q = 0.72; out && out.size > 850 * 1024 && q > 0.4; q -= 0.12) out = await as(out.type, q);
  if (!out) throw new Error("encode");
  return out;
}

/**
 * The event poster: drop or pick an image, see it on the event card straight away, and it
 * replaces the drawn cover on the event page. Saved on its own.
 */
export function PosterSetup({ eventId, title }: { eventId: string; title: string }) {
  const [url, setUrl] = useState<string | null>(`/api/events/${eventId}/poster?v=current`);
  const [has, setHas] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [over, setOver] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    if (!/^image\//.test(file.type)) return setMsg({ ok: false, text: "That isn't an image. Use a JPG, PNG or WebP." });
    setBusy(true);
    setMsg(null);
    try {
      const blob = await shrink(file);
      setUrl(URL.createObjectURL(blob));
      setHas(true);
      const res = await fetch(`/api/events/${eventId}/poster`, { method: "PUT", headers: { "Content-Type": blob.type }, body: blob });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: { message: string } };
      if (!res.ok) throw new Error(data.error?.message ?? "Didn't save.");
      setMsg({ ok: true, text: "Saved. It's on your event page now." });
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error && e.message !== "encode" ? e.message : "Couldn't read that image. Try another." });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    const res = await fetch(`/api/events/${eventId}/poster`, { method: "DELETE" }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setHas(false);
      setUrl(null);
      setMsg({ ok: true, text: "Removed. The drawn cover is back." });
    }
  }

  return (
    <Section n="11" label="Poster">
      <div className="o-row">
        <span className="o-label">Poster</span>
        <div className="grid gap-4 sm:grid-cols-[180px_1fr] sm:items-start">
          {/* Live preview: how it looks on a card */}
          <div className="w-[180px]">
            <div className="relative aspect-[4/5] overflow-hidden rounded-[16px] bg-sunken shadow-[0_0_0_1px_rgba(26,26,26,0.08)]">
              {url && has ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="" className="absolute inset-0 size-full object-cover" onError={() => setHas(false)} />
              ) : (
                <span className="absolute inset-0 grid place-items-center px-4 text-center text-[12.5px] text-ink-muted">No poster yet. The drawn cover is used.</span>
              )}
            </div>
            <p className="mt-2 truncate text-[13px] font-semibold text-ink">{title || "Your event"}</p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => (e.preventDefault(), setOver(true))}
              onDragLeave={() => setOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                void upload(e.dataTransfer.files[0]);
              }}
              disabled={busy}
              className={`flex w-full flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed px-4 py-8 text-center transition-colors ${over ? "border-ink bg-lavender/40" : "border-line-strong hover:border-ink/40"}`}
            >
              <ImagePlus className="size-6 text-ink-muted" aria-hidden />
              <span className="text-[14px] font-semibold text-ink">{busy ? "Uploading…" : "Drop a poster, or choose one"}</span>
              <span className="text-[12.5px] text-ink-muted">Portrait works best (4:5). We resize it for you.</span>
            </button>
            <input ref={input} type="file" accept="image/*" className="sr-only" onChange={(e) => void upload(e.target.files?.[0] ?? undefined)} />
            <div className="o-inline" style={{ marginTop: 10, gap: 12 }}>
              {has && url && (
                <Button onClick={remove} disabled={busy}>
                  Remove poster
                </Button>
              )}
              {msg && (
                <span role="status" className="o-meta" style={{ color: msg.ok ? undefined : "var(--accent-ink)" }}>
                  {msg.text}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}
