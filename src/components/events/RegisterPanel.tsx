"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Hourglass, Ticket, XCircle } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Notice } from "@/components/ui/Field";
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
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } }).catch(() => null);
    if (!res) {
      setBusy(false);
      setError("You seem to be offline. Check your connection and try again.");
      return null;
    }
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
  const err = error && <Notice tone="danger">{error}</Notice>;

  if (r?.status === "registered") {
    return (
      <div className="space-y-4">
        <Notice tone="live" icon={CheckCircle2}>
          {r.checkedInAt ? `Checked in at ${r.checkedInAt}` : "You're registered. See you there."}
        </Notice>
        <div className="flex items-center gap-4">
          {props.qrSvg && (
            <div className="w-[112px] shrink-0 rounded-xl bg-white p-2 ring-1 ring-line [&>svg]:size-full" role="img" aria-label="Entry QR code" dangerouslySetInnerHTML={{ __html: props.qrSvg }} />
          )}
          <div className="min-w-0 space-y-1">
            <p className="eyebrow">Pass</p>
            <p className="font-mono text-[16px] font-medium tracking-[0.12em]">{r.passCode}</p>
            {props.pricePaise > 0 && (
              <p className={r.paid ? "text-[13px] font-medium text-live" : "text-[13px] font-medium text-warn"}>
                {r.paid ? "Paid" : `Unpaid · ${formatINR(props.pricePaise)} at the desk`}
              </p>
            )}
            <p className="text-[12.5px] text-ink-muted">Show the QR at the gate.</p>
          </div>
        </div>
        {err}
        <div className="grid gap-2">
          <LinkButton href="/passes" size="lg" className="w-full">
            <Ticket className="size-4" aria-hidden /> My passes
          </LinkButton>
          {live && !r.checkedInAt && props.open && (
            <Button onClick={cancel} loading={busy} variant="ghost" className="w-full text-ink-muted hover:bg-danger-soft hover:text-danger">
              <XCircle className="size-4" aria-hidden /> Cancel registration
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (r?.status === "waitlisted") {
    return (
      <div className="space-y-4">
        <Notice tone="warn" icon={Hourglass}>
          <p className="font-medium">
            On the waitlist{r.waitlistPosition ? <> · <span className="font-mono">#{r.waitlistPosition}</span></> : ""}
          </p>
          <p className="mt-1 font-normal text-ink-2">
            {r.holdExpiresAt ? (
              <>
                A seat opened up for you. Confirm before <b className="font-medium">{r.holdExpiresAt}</b> or it goes to the next person.
              </>
            ) : (
              "If someone cancels, you'll get a seat to confirm."
            )}
          </p>
        </Notice>
        {err}
        {live && (
          <div className="grid gap-2">
            {r.holdExpiresAt && (
              <Button onClick={confirmHold} loading={busy} variant="accent" size="lg" className="w-full">
                <CheckCircle2 className="size-4" aria-hidden /> Confirm my seat
              </Button>
            )}
            <Button onClick={cancel} disabled={busy} variant="ghost" className="w-full text-ink-muted hover:bg-danger-soft hover:text-danger">
              Leave waitlist
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (!live) {
    return (
      <Notice icon={Clock}>{props.open ? "Online registration opens in the next build." : props.closedReason ?? "Registration is closed."}</Notice>
    );
  }

  if (!props.open) {
    return <Notice icon={Clock}>{props.closedReason ?? "Registration is closed."}</Notice>;
  }

  if (props.full || fullOffer !== null) {
    return (
      <div className="space-y-3">
        <Notice tone="danger">
          Full · every seat is taken{fullOffer !== null ? <>. You&apos;d be <span className="font-mono">#{fullOffer}</span> on the waitlist.</> : "."}
        </Notice>
        {err}
        <Button onClick={() => register(true)} loading={busy} size="lg" className="w-full">
          Join the waitlist
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {err}
      <Button onClick={() => register(false)} loading={busy} variant="accent" size="lg" className="w-full">
        Register{props.pricePaise > 0 ? ` · ${formatINR(props.pricePaise)} at the desk` : " · free"}
      </Button>
      <p className="text-center text-[12.5px] text-ink-muted">Your pass is ready the moment you register.</p>
    </div>
  );
}
