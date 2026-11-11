"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatINR } from "@/lib/money";
import { UpiPay, type UpiPayProps } from "@/components/events/UpiPay";
import type { Question } from "@/lib/data/questions";

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
  hasUpi?: boolean;
  questions?: Question[];
  /** Set while this student still has to pay by UPI. */
  upi?: UpiPayProps | null;
  /** Registration API is live (M2). Pass false to show passes read-only. */
  actionsLive?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullOffer, setFullOffer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});

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
    const data = await call(`/api/events/${props.slug}/register`, { method: "POST", body: JSON.stringify({ waitlist, answers, ...(props.code ? { code: props.code } : {}) }) });
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
  const fieldCls = "mt-2 w-full rounded-md border border-line bg-surface px-4 py-3 text-body";
  const questionFields = !!props.questions?.length && (
    <div className="space-y-3">
      {props.questions.map((q) => (
        <label key={q.id} className="block">
          <span className="text-label text-ink-muted">
            {q.label}
            {q.required ? " *" : ""}
          </span>
          {q.kind === "choice" ? (
            <select required={q.required} value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} className={fieldCls}>
              <option value="">Choose</option>
              {q.options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          ) : (
            <input maxLength={500} value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} className={fieldCls} />
          )}
        </label>
      ))}
    </div>
  );
  const live = props.actionsLive ?? true;
  const err = error && (
    <p role="alert" className="border-l-2 border-bad bg-surface px-4 py-3 text-body-sm font-semibold text-danger">
      {error}
    </p>
  );

  if (r?.status === "registered") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-4 rounded-md border border-line p-4">
          {props.qrSvg && <div className="w-[120px] shrink-0 rounded-sm bg-qr p-2 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: props.qrSvg }} />}
          <div className="min-w-0 space-y-2">
            <p className="flex items-center gap-2 text-body font-semibold text-live">
               {r.checkedInAt ? `Checked in at ${r.checkedInAt}` : "You're registered"}
            </p>
            <p className="font-mono text-body font-semibold tracking-[0.1em]">{r.passCode}</p>
            {props.pricePaise > 0 && (
              <p className={r.paid ? "text-body-sm font-semibold text-live" : "text-body-sm font-semibold text-warn"}>
                {r.paid ? "Paid" : props.upi ? (props.upi.utr ? "Payment being checked" : `Unpaid · ${formatINR(props.pricePaise)}`) : `Unpaid · ${formatINR(props.pricePaise)} at the desk`}
              </p>
            )}
          </div>
        </div>
        {props.upi && props.open && !r.checkedInAt && <UpiPay {...props.upi} />}
        {err}
        <div className="flex flex-wrap gap-2">
          <Link href="/passes" className="press inline-flex items-center gap-2 rounded-md bg-accent px-4 h-10 text-body font-semibold text-ink-inverse hover:bg-[color-mix(in_srgb,var(--accent)_90%,var(--text))]"> My passes</Link>
          {live && !r.checkedInAt && props.open && (
            <button onClick={cancel} disabled={busy} className="press inline-flex items-center gap-2 rounded-none border border-bad px-4 h-10 text-body font-semibold hover:bg-bad/10 disabled:opacity-50">
               Cancel registration
            </button>
          )}
        </div>
      </div>
    );
  }

  if (r?.status === "waitlisted") {
    return (
      <div className="space-y-3">
        <div className="border-l-2 border-warn bg-surface p-4">
          <p className="flex items-center gap-2 text-body font-semibold text-warn"> On the waitlist{r.waitlistPosition ? ` · #${r.waitlistPosition}` : ""}</p>
          {r.holdExpiresAt ? (
            <p className="mt-1 text-body-sm text-ink-2">A seat opened up for you. Confirm before <b>{r.holdExpiresAt}</b> or it goes to the next person.</p>
          ) : null}
        </div>
        {err}
        {live && <div className="flex flex-wrap gap-2">
          {r.holdExpiresAt && (
            <button onClick={confirmHold} disabled={busy} className="press inline-flex items-center gap-2 rounded-md bg-accent px-6 h-10 text-body font-semibold text-ink-inverse disabled:opacity-50 hover:bg-[color-mix(in_srgb,var(--accent)_90%,var(--text))]">
              Confirm my seat
            </button>
          )}
          <button onClick={cancel} disabled={busy} className="press inline-flex items-center justify-center rounded-none border border-bad px-4 h-10 text-body font-semibold hover:bg-bad/10 disabled:opacity-50">
            Leave waitlist
          </button>
        </div>}
      </div>
    );
  }

  if (!live) {
    return (
      <p className="flex items-center gap-2 rounded-md border border-dashed border-line p-4 text-body font-semibold text-ink-muted">
         {props.open ? "Online registration opens in the next build." : props.closedReason ?? "Registration is closed."}
      </p>
    );
  }

  if (!props.open) {
    return (
      <p className="flex items-center gap-2 rounded-md bg-canvas p-4 text-body font-semibold text-ink-2">
         {props.closedReason ?? "Registration is closed."}
      </p>
    );
  }

  if (props.full || fullOffer !== null) {
    return (
      <div className="space-y-3">
        <p className="border-l-2 border-bad bg-surface p-4 text-body font-semibold text-danger">
          Full · every seat is taken{fullOffer !== null ? `. You'd be #${fullOffer} on the waitlist.` : "."}
        </p>
        {questionFields}
        {err}
        <button onClick={() => register(true)} disabled={busy} className="press inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent h-12 text-body font-semibold text-ink-inverse disabled:opacity-50 hover:bg-[color-mix(in_srgb,var(--accent)_90%,var(--text))]">
          Join the waitlist
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questionFields}
      {err}
      <button onClick={() => register(false)} disabled={busy} className="press inline-flex w-full items-center justify-center gap-2 rounded-md bg-accent h-12 text-body font-semibold text-ink-inverse disabled:opacity-50 hover:bg-[color-mix(in_srgb,var(--accent)_90%,var(--text))]">
        Register{props.pricePaise > 0 ? ` · ${formatINR(props.pricePaise)}${props.hasUpi ? "" : " at the desk"}` : " · free"}
      </button>
    </div>
  );
}
