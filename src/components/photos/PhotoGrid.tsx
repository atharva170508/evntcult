"use client";

/** Event gallery: thumbnails, a full-size viewer, "That's me" for attendees, delete for the organizer. */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Loader2, Trash2, UserCheck, UserPlus, X } from "lucide-react";

export interface GridPhoto {
  id: string;
  width: number | null;
  height: number | null;
  mine: boolean;
}

export function PhotoGrid({ photos, canTag, canManage }: { photos: GridPhoto[]; canTag: boolean; canManage: boolean }) {
  const router = useRouter();
  const [mine, setMine] = useState<Record<string, boolean>>(() => Object.fromEntries(photos.map((p) => [p.id, p.mine])));
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => setMine(Object.fromEntries(photos.map((p) => [p.id, p.mine]))), [photos]);
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open !== null && !d.open) d.showModal();
    if (open === null && d.open) d.close();
  }, [open]);

  async function toggle(id: string) {
    const next = !mine[id];
    setMine((m) => ({ ...m, [id]: next })); // optimistic
    setBusy(id);
    setError(null);
    const res = await fetch(`/api/photos/${id}/tag`, { method: next ? "POST" : "DELETE", headers: { "Content-Type": "application/json" }, body: next ? "{}" : undefined });
    setBusy(null);
    if (!res.ok) {
      setMine((m) => ({ ...m, [id]: !next }));
      setError(((await res.json().catch(() => ({}))) as { error?: { message?: string } }).error?.message ?? "Couldn't save that.");
    } else router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this photo for everyone? Tags on it are removed too.")) return;
    setBusy(id);
    const res = await fetch(`/api/photos/${id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) return setError("Couldn't delete that photo.");
    setOpen(null);
    router.refresh();
  }

  const current = open !== null ? photos[open] : null;
  const tagButton = (id: string, big = false) =>
    canTag && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggle(id);
        }}
        disabled={busy === id}
        aria-pressed={!!mine[id]}
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold shadow ${big ? "px-4 py-2 text-[14px]" : "px-2.5 py-1 text-[12px]"} ${mine[id] ? "bg-live text-white" : "bg-white/95 text-ink"}`}
      >
        {busy === id ? <Loader2 className="size-3.5 animate-spin" /> : mine[id] ? <UserCheck className="size-3.5" /> : <UserPlus className="size-3.5" />}
        {mine[id] ? "That's me ✓" : "That's me"}
      </button>
    );

  return (
    <>
      {error && <p role="alert" className="mb-3 rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger">{error}</p>}
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, i) => (
          <li key={p.id} className="group relative aspect-square overflow-hidden rounded-2xl bg-canvas">
            <button onClick={() => setOpen(i)} className="block size-full" aria-label={`Open photo ${i + 1}${mine[p.id] ? " (you're tagged)" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/photos/${p.id}?size=thumb`} alt="" loading="lazy" className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            </button>
            <div className="pointer-events-none absolute inset-x-2 bottom-2 flex justify-start [&>*]:pointer-events-auto">{tagButton(p.id)}</div>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setOpen(null)}
        onClick={(e) => e.target === dialog.current && setOpen(null)}
        className="m-auto max-h-[92dvh] w-[min(96vw,1100px)] rounded-3xl bg-black p-0 text-white backdrop:bg-black/80"
      >
        {current && (
          <div className="relative flex flex-col">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/photos/${current.id}`} alt={`Photo ${open! + 1} of ${photos.length}`} className="max-h-[78dvh] w-full object-contain" />
            <div className="flex flex-wrap items-center gap-2 p-3">
              <button onClick={() => setOpen((o) => (o! > 0 ? o! - 1 : photos.length - 1))} aria-label="Previous photo" className="rounded-full bg-white/10 p-2"><ChevronLeft className="size-5" /></button>
              <button onClick={() => setOpen((o) => (o! < photos.length - 1 ? o! + 1 : 0))} aria-label="Next photo" className="rounded-full bg-white/10 p-2"><ChevronRight className="size-5" /></button>
              <span className="text-[13px] text-white/60">{open! + 1} / {photos.length}</span>
              <span className="flex-1" />
              {tagButton(current.id, true)}
              <a href={`/api/photos/${current.id}`} download className="rounded-full bg-white/10 px-4 py-2 text-[14px] font-semibold">Download</a>
              {canManage && (
                <button onClick={() => remove(current.id)} disabled={busy === current.id} className="inline-flex items-center gap-1.5 rounded-full bg-[#e5484d] px-4 py-2 text-[14px] font-semibold">
                  <Trash2 className="size-4" /> Delete
                </button>
              )}
              <button onClick={() => setOpen(null)} aria-label="Close" className="rounded-full bg-white/10 p-2"><X className="size-5" /></button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
