"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Clock, Hourglass, Loader2, Ticket, XCircle } from "lucide-react";
import { formatINR } from "@/lib/money";

interface Reg {
  id: string;
  status: "registered" | "waitlisted";
  passCode: string;
  paid: boolean;
  checkedInAt: string | null;
  holdExpiresAt: string | null;
  waitlistPosition: number | null;
}

/** Register / waitlist / cancel. Every state is a word + a colour, never colour alone. */
export function RegisterPanel(props: {
  slug: string;
  code: string | null;
  open: boolean;
  closedReason: string | null;
  full: boolean;
  pricePaise: number;
  registration: Reg | null;
  qrSvg: string | null;
  /** Registration API is live (M2). Pass false to show passes read-only. */
  actionsLive?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullOffer, setFullOffer] = useState<number | null>(null);

  async function call(url: string, init: RequestInit) {
    setBusy(true);
    setError(null);
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
    const data = (await res.json().catch(() => ({}))) as { full?: boolean; waitlist_position?: number; error?: { message: string } };
    setBusy(false);
    if (!res.ok) {
      setError(data.error?.message ?? "Something went wrong.");
      return null;
    }
    return data;
  }

  async function register(waitlist = false) {
    const data = await call(`/api/events/${props.slug}/register`, { method: "POST", body: JSON.stringify({ waitlist, ...(props.code ? { code: props.code } : {}) }) });
    if (!data) return;
    if (data.full) setFullOffer(data.waitlist_position ?? 1);
    else router.refresh();
  }

  async function cancel() {
    if (!props.registration || !confirm("Cancel your registration? Your seat goes to the next person.")) return;
    if (await call(`/api/registrations/${props.registration.id}`, { method: "DELETE" })) router.refresh();
  }

  async function confirmHold() {
    if (!props.registration) return;
    if (await call(`/api/registrations/${props.registration.id}/confirm`, { method: "POST", body: "{}" })) router.refresh();
  }

  const r = props.registration;
  const live = props.actionsLive ?? true;
  const err = error && (
    <p role="alert" className="rounded-2xl bg-danger-soft px-3.5 py-2.5 text-[13px] font-semibold text-danger">
      {error}
    </p>
  );

  if (r?.status === "registered") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-4 rounded-2xl border border-line p-4">
          {props.qrSvg && <div className="w-[120px] shrink-0 rounded-xl bg-white p-2 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: props.qrSvg }} />}
          <div className="min-w-0 space-y-1.5">
            <p className="flex items-center gap-1.5 text-[14px] font-bold text-live">
              <CheckCircle2 className="size-4" /> {r.checkedInAt ? `Checked in at ${r.checkedInAt}` : "You're registered"}
            </p>
            <p className="font-mono text-[15px] font-bold tracking-[0.1em]">{r.passCode}</p>
            {props.pricePaise > 0 && (
              <p className={r.paid ? "text-[13px] font-semibold text-live" : "text-[13px] font-semibold text-warn"}>
                {r.paid ? "Paid" : `Unpaid · ${formatINR(props.pricePaise)} at the desk`}
              </p>
            )}
            <p className="text-[12.5px] text-ink-muted">Show the QR at the gate.</p>
          </div>
        </div>
        {err}
        <div className="flex flex-wrap gap-2">
          <Link href="/passes" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[14px] font-semibold text-white"><Ticket className="size-4" /> My passes</Link>
          {live && !r.checkedInAt && props.open && (
            <button onClick={cancel} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-[14px] font-semibold hover:border-danger hover:text-danger disabled:opacity-50">
              <XCircle className="size-4" /> Cancel registration
            </button>
          )}
        </div>
      </div>
    );
  }

  if (r?.status === "waitlisted") {
    return (
      <div className="space-y-3">
        <div className="rounded-2xl bg-warn-soft p-4">
          <p className="flex items-center gap-1.5 text-[14px] font-bold text-warn"><Hourglass className="size-4" /> On the waitlist{r.waitlistPosition ? ` · #${r.waitlistPosition}` : ""}</p>
          {r.holdExpiresAt ? (
            <p className="mt-1 text-[13px] text-ink-2">A seat opened up for you! Confirm before <b>{r.holdExpiresAt}</b> or it goes to the next person.</p>
          ) : (
            <p className="mt-1 text-[13px] text-ink-2">If someone cancels, you&apos;ll get a seat to confirm.</p>
          )}
        </div>
        {err}
        {live && <div className="flex flex-wrap gap-2">
          {r.holdExpiresAt && (
            <button onClick={confirmHold} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />} Confirm my seat
            </button>
          )}
          <button onClick={cancel} disabled={busy} className="rounded-full border border-line px-4 py-2.5 text-[14px] font-semibold hover:border-danger hover:text-danger disabled:opacity-50">
            Leave waitlist
          </button>
        </div>}
      </div>
    );
  }

  if (!live) {
    return (
      <p className="flex items-center gap-2 rounded-2xl border border-dashed border-line p-4 text-[14px] font-semibold text-ink-muted">
        <Clock className="size-4" /> {props.open ? "Online registration opens in the next build." : props.closedReason ?? "Registration is closed."}
      </p>
    );
  }

  if (!props.open) {
    return (
      <p className="flex items-center gap-2 rounded-2xl bg-canvas p-4 text-[14px] font-semibold text-ink-2">
        <Clock className="size-4" /> {props.closedReason ?? "Registration is closed."}
      </p>
    );
  }

  if (props.full || fullOffer !== null) {
    return (
      <div className="space-y-3">
        <p className="rounded-2xl bg-danger-soft p-4 text-[14px] font-semibold text-danger">
          Full · every seat is taken{fullOffer !== null ? `. You'd be #${fullOffer} on the waitlist.` : "."}
        </p>
        {err}
        <button onClick={() => register(true)} disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[15px] font-semibold text-white disabled:opacity-50">
          {busy && <Loader2 className="size-4 animate-spin" />} Join the waitlist
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {err}
      <button onClick={() => register(false)} disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 text-[15px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(0,0,0,0.6)] disabled:opacity-50">
        {busy && <Loader2 className="size-4 animate-spin" />} Register{props.pricePaise > 0 ? ` · ${formatINR(props.pricePaise)} at the desk` : " · free"}
      </button>
    </div>
  );
}
