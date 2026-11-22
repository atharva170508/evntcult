"use client";

import { useState } from "react";
import { Flag, UserCheck, UserPlus } from "lucide-react";
import { ModalDialog } from "@/components/ui/ModalDialog";
import { toast } from "@/components/ui/Toaster";
import { cn } from "@/lib/utils";

/** Follow a host from their event page (Eventbrite/DICE). Undo is in the toast. */
export function FollowHost({ hostId, initial, signedIn, self }: { hostId: string; initial: boolean; signedIn: boolean; self: boolean }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  if (self) return null;
  const set = async (next: boolean) => {
    setBusy(true);
    setOn(next);
    const r = await fetch(`/api/hosts/${hostId}/follow`, { method: next ? "POST" : "DELETE" });
    setBusy(false);
    if (!r.ok) {
      setOn(!next);
      toast("That didn't go through. Try again.", { tone: "error" });
      return;
    }
    if (next) toast("You're following this host.", { action: { label: "Undo", run: () => void set(false) } });
  };
  if (!signedIn)
    return (
      <a href={`/signin?next=${encodeURIComponent(typeof location === "undefined" ? "/" : location.pathname)}`} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-line-strong px-3 text-[13px] font-semibold text-ink hover:bg-sunken">
        <UserPlus className="size-3.5" aria-hidden /> Follow
      </a>
    );
  return (
    <button
      type="button"
      disabled={busy}
      aria-pressed={on}
      onClick={(e) => {
        e.preventDefault();
        void set(!on);
      }}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold transition-colors",
        on ? "bg-sunken text-ink-2" : "bg-ink text-white hover:bg-black",
      )}
    >
      {on ? <UserCheck className="size-3.5" aria-hidden /> : <UserPlus className="size-3.5" aria-hidden />}
      {on ? "Following" : "Follow"}
    </button>
  );
}

const REASONS = ["Fake or scam", "Wrong details", "Offensive content", "Unsafe event", "Something else"] as const;

/** "Report event": a small dialog with reasons; goes to the EvntCult team, not the host. */
export function ReportEvent({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number] | null>(null);
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-1.5 text-[13px] text-ink-muted transition-colors hover:text-ink">
        <Flag className="size-3.5" aria-hidden /> Report event
      </button>
      {open && (
        <ModalDialog label="Report this event" onClose={() => setOpen(false)}>
          <button type="button" aria-label="Close" tabIndex={-1} onClick={() => setOpen(false)} className="absolute inset-0 cursor-default bg-ink/40" />
          <div className="relative z-10 mx-auto mt-[18vh] w-[min(440px,calc(100%-32px))] rounded-[22px] bg-white p-6 shadow-[var(--lift-2)]">
            <h2 className="text-[19px] font-semibold text-ink">Report this event</h2>
            <p className="mt-1 text-[14px] text-ink-muted">This goes to the EvntCult team. The host won&apos;t see who reported it.</p>
            <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Reason">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  role="radio"
                  aria-checked={reason === r}
                  onClick={() => setReason(r)}
                  className={cn("h-9 rounded-full px-3.5 text-[13.5px] font-medium ring-1 ring-inset transition-colors", reason === r ? "bg-ink text-white ring-ink" : "text-ink-2 ring-line-strong hover:bg-sunken")}
                >
                  {r}
                </button>
              ))}
            </div>
            <label htmlFor="rep-details" className="mt-4 block text-[13px] font-semibold text-ink">
              Anything else? <span className="font-normal text-ink-subtle">(optional)</span>
            </label>
            <textarea id="rep-details" rows={3} maxLength={500} value={details} onChange={(e) => setDetails(e.target.value)} className="mt-1.5 w-full rounded-xl bg-sunken px-3 py-2.5 text-[14px] text-ink outline-none focus-visible:shadow-[var(--focus-field)]" />
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="h-10 rounded-xl px-4 text-[14px] font-semibold text-ink-2 hover:bg-sunken">
                Cancel
              </button>
              <button
                type="button"
                disabled={!reason || busy}
                onClick={async () => {
                  setBusy(true);
                  const r = await fetch(`/api/events/${slug}/report`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason, details: details || undefined }) });
                  setBusy(false);
                  if (!r.ok) return toast("Couldn't send the report. Try again.", { tone: "error" });
                  setOpen(false);
                  toast("Report sent. Thanks for flagging it.");
                }}
                className="h-10 rounded-xl bg-ink px-4 text-[14px] font-semibold text-white disabled:opacity-40"
              >
                Send report
              </button>
            </div>
          </div>
        </ModalDialog>
      )}
    </>
  );
}
