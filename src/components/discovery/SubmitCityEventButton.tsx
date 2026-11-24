"use client";

import { useState } from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";

export function SubmitCityEventButton({ citySlug, cityName }: { citySlug: string; cityName: string }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [eventUrl, setEventUrl] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const reset = () => {
    setTitle("");
    setEventUrl("");
    setNote("");
    setError(null);
    setDone(false);
  };

  const close = () => {
    setOpen(false);
    setTimeout(reset, 200);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/city/${citySlug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, eventUrl, note }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: { message: string } };
      if (!res.ok || !data.ok) {
        setError(data.error?.message ?? "Could not submit. Try again.");
      } else {
        setDone(true);
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ui-press inline-flex h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-[14.5px] font-semibold text-ink transition-colors hover:bg-sunken"
      >
        <Plus className="size-4" strokeWidth={2.4} aria-hidden />
        Submit event
      </button>

      {open && (
        <ModalDialog label={`Submit an event to ${cityName}`} onClose={close}>
          <div className="grid h-full place-items-center bg-ink/40 px-4">
            <div className="w-full max-w-md rounded-panel border border-line-strong bg-surface p-6 shadow-pop">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[12px] font-semibold text-accent">{cityName}</p>
                  <h2 className="mt-0.5 font-display text-[28px] leading-tight text-ink">
                    Submit an event
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="grid size-8 place-items-center rounded-full text-ink-muted hover:bg-sunken hover:text-ink"
                >
                  <X className="size-4" aria-hidden />
                </button>
              </div>

              {done ? (
                <div className="mt-6 rounded-2xl bg-live-soft p-5 text-center">
                  <CheckCircle2 className="mx-auto size-8 text-live" aria-hidden />
                  <p className="mt-2 text-[16px] font-semibold text-ink">Submitted for review</p>
                  <p className="mt-1 text-[13.5px] text-ink-2">
                    We&apos;ll review your event and add it to the {cityName} board.
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-4 inline-flex h-10 items-center rounded-xl bg-ink px-5 text-[14px] font-semibold text-white hover:bg-black"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="mt-5 space-y-4">
                  <div>
                    <label htmlFor="sub-title" className="block text-[13.5px] font-semibold text-ink">
                      Event name
                    </label>
                    <input
                      id="sub-title"
                      required
                      minLength={3}
                      maxLength={120}
                      placeholder="Design Systems Jam"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="field mt-1.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="sub-url" className="block text-[13.5px] font-semibold text-ink">
                      Event link <span className="font-normal text-ink-muted">(optional)</span>
                    </label>
                    <input
                      id="sub-url"
                      type="url"
                      placeholder="https://evntcult.caliper.workers.dev/e/..."
                      value={eventUrl}
                      onChange={(e) => setEventUrl(e.target.value)}
                      className="field mt-1.5"
                    />
                  </div>
                  <div>
                    <label htmlFor="sub-note" className="block text-[13.5px] font-semibold text-ink">
                      Short note <span className="font-normal text-ink-muted">(date, venue, club)</span>
                    </label>
                    <textarea
                      id="sub-note"
                      rows={2}
                      maxLength={400}
                      placeholder="Sat 14 Dec at Main Auditorium"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="field mt-1.5"
                    />
                  </div>
                  {error && (
                    <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-medium text-danger">
                      {error}
                    </p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={close}
                      className="h-11 rounded-xl px-4 text-[14px] font-semibold text-ink-muted hover:bg-sunken hover:text-ink"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={busy}
                      className="ui-press h-11 rounded-xl bg-lavender px-5 text-[14.5px] font-semibold text-ink ring-2 ring-inset ring-ink hover:bg-lavender-hover disabled:opacity-60"
                    >
                      {busy ? "Sending…" : "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </ModalDialog>
      )}
    </>
  );
}
