"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "Delete draft", with an "Are you sure?" step. Drafts only: the server refuses anything published.
 *  - variant "bar": in the event editor's top bar, red and labelled (icon only on very small phones).
 *  - variant "row": on a draft in the events list, a small red button.
 * After deleting it goes to /organizer (from the editor) or refreshes the list.
 */
export function DeleteDraftButton({
  id,
  title,
  variant = "row",
  onDeleted,
}: {
  id: string;
  title: string;
  variant?: "bar" | "row";
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/events/${encodeURIComponent(id)}`, { method: "DELETE" }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { error?: { message?: string } } | undefined;
    setBusy(false);
    if (!res?.ok) return setError(data?.error?.message ?? "Couldn't delete. Check your connection and try again.");
    setOpen(false);
    if (onDeleted) onDeleted();
    else if (variant === "bar") router.push("/organizer?deleted=1");
    else router.refresh();
  }

  const name = title.trim() || "Untitled draft";

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setError(null);
          setOpen(true);
        }}
        aria-label={`Delete draft: ${name}`}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-1.5 font-semibold text-danger ring-1 ring-inset ring-danger/35 transition-colors hover:bg-danger-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger",
          variant === "bar" ? "h-10 rounded-xl px-3 text-[14px] max-[380px]:w-10 max-[380px]:px-0" : "h-9 rounded-lg px-2.5 text-[13px] max-sm:w-9 max-sm:px-0",
        )}
      >
        <Trash2 className="size-4" aria-hidden />
        <span className={variant === "bar" ? "max-[380px]:sr-only" : "max-sm:sr-only"}>Delete{variant === "bar" ? " draft" : ""}</span>
      </button>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        onClick={(e) => e.target === dialog.current && !busy && setOpen(false)}
        aria-labelledby={`del-${id}-h`}
        className="m-auto w-[min(92vw,420px)] rounded-[24px] border border-line-strong bg-surface p-0 text-ink shadow-[0_30px_80px_-30px_rgba(20,10,0,0.55)] backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
      >
        <div className="p-6">
          <span className="grid size-11 place-items-center rounded-full bg-danger-soft text-danger" aria-hidden>
            <Trash2 className="size-5" />
          </span>
          <h2 id={`del-${id}-h`} className="mt-4 text-[19px] font-semibold tracking-[-0.01em]">
            Delete this draft?
          </h2>
          <p className="mt-1.5 text-[15px] leading-snug text-ink-2">
            <b className="font-semibold text-ink">{name}</b> and everything saved with it will be deleted for good. This can&apos;t be undone.
          </p>
          {error && (
            <p role="alert" className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-[14px] font-medium text-danger">
              {error}
            </p>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              autoFocus
              disabled={busy}
              onClick={() => setOpen(false)}
              className="h-11 rounded-xl px-4 text-[15px] font-semibold text-ink ring-1 ring-inset ring-line-strong transition-colors hover:bg-sunken"
            >
              Keep draft
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={remove}
              className="h-11 rounded-xl bg-danger px-4 text-[15px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Deleting…" : "Delete draft"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}
