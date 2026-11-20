"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Clock, Hourglass, IndianRupee, Ticket, XCircle } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Notice, Select } from "@/components/ui/Field";
import { formatINR } from "@/lib/money";
import { UpiPay, type UpiPayProps } from "@/components/events/UpiPay";
import type { Question } from "@/lib/data/questions";
import { svgSrc } from "@/lib/svg-src";
import { Sheet } from "@/components/ui/Sheet";
import { PassPrinter } from "@/components/events/PassPrinter";

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
  /** What the printed pass shows after registering or paying. */
  ticket?: { title: string; dateLabel: string; timeLabel: string; venue: string; holder: string; accent: string; seed: string };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullOffer, setFullOffer] = useState<number | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [afterPay, setAfterPay] = useState(false);

  // After a fresh registration lands: paid-by-UPI events go straight to the payment sheet,
  // everything else prints the pass.
  const regStatus = props.registration?.status;
  const needsUpi = !!props.upi && !props.upi.utr;
  useEffect(() => {
    if (!justRegistered || regStatus !== "registered") return;
    setJustRegistered(false);
    if (needsUpi) setPaying(true);
    else setPrinting(true);
  }, [justRegistered, regStatus, needsUpi]);

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
    const data = await call(`/api/events/${props.slug}/register`, { method: "POST", body: JSON.stringify({ waitlist, answers, ...(props.code ? { code: props.code } : {}) }) });
    if (!data) return;
    if (data.full) setFullOffer(data.waitlist_position ?? 1);
    else {
      if (!waitlist) setJustRegistered(true);
      router.refresh();
    }
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
  const questionFields = !!props.questions?.length && (
    <div className="space-y-3">
      {props.questions.map((q) => (
        <label key={q.id} className="block">
          <span className="text-[13px] font-medium text-ink">
            {q.label}
            {q.required ? <span className="text-accent-ink"> *</span> : ""}
          </span>
          {q.kind === "choice" ? (
            <Select required={q.required} value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} className="mt-1.5">
              <option value="">Choose</option>
              {q.options.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </Select>
          ) : (
            <Input maxLength={500} value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} className="mt-1.5" />
          )}
        </label>
      ))}
    </div>
  );
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
            <div className="w-[112px] shrink-0 rounded-xl bg-white p-2 ring-1 ring-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={svgSrc(props.qrSvg)} alt="Entry QR code" className="block aspect-square w-full" />
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <p className="eyebrow">Pass</p>
            <p className="font-mono text-[16px] font-medium tracking-[0.12em]">{r.passCode}</p>
            {props.pricePaise > 0 && (
              <p className={r.paid ? "text-[13px] font-medium text-live" : "text-[13px] font-medium text-warn"}>
                {r.paid ? "Paid" : props.upi ? (props.upi.utr ? "Payment being checked" : `Unpaid · ${formatINR(props.pricePaise)}`) : `Unpaid · ${formatINR(props.pricePaise)} at the desk`}
              </p>
            )}
            <p className="text-[12.5px] text-ink-muted">Show the QR at the gate.</p>
          </div>
        </div>
        {props.upi &&
          props.open &&
          !r.checkedInAt &&
          (props.upi.utr ? (
            <UpiPay {...props.upi} />
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-warn/30 bg-warn-soft px-4 py-3">
              <div>
                <p className="text-[14px] font-semibold text-ink">{props.upi.rejected ? "Payment not found" : "Payment due"}</p>
                <p className="text-[13px] tabular-nums text-ink-2">{formatINR(props.pricePaise)} by UPI</p>
              </div>
              <Button onClick={() => setPaying(true)} variant="primary">
                <IndianRupee className="size-4" aria-hidden /> Pay now
              </Button>
            </div>
          ))}
        {paying && props.upi && (
          <Sheet title="Pay by UPI" onClose={() => setPaying(false)}>
            <UpiPay
              {...props.upi}
              onDone={() => {
                setPaying(false);
                setAfterPay(true);
                setPrinting(true);
              }}
            />
          </Sheet>
        )}
        {printing && props.ticket && (
          <PassPrinter
            onClose={() => setPrinting(false)}
            pass={{
              ...props.ticket,
              passCode: r.passCode,
              qrSvg: props.qrSvg,
              amountLabel: props.pricePaise > 0 ? formatINR(props.pricePaise) : "Free",
              payNote:
                props.pricePaise === 0 || r.paid
                  ? null
                  : afterPay || props.upi?.utr
                    ? "UPI payment being checked"
                    : props.upi
                      ? "Payment due by UPI"
                      : "Pay at the desk",
            }}
          />
        )}
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
          <p>
            On the waitlist
            {r.waitlistPosition ? (
              <>
                {" "}
                · <span className="font-mono">#{r.waitlistPosition}</span>
              </>
            ) : (
              ""
            )}
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
    return <Notice icon={Clock}>{props.open ? "Online registration opens soon." : props.closedReason ?? "Registration is closed."}</Notice>;
  }

  if (!props.open) {
    return <Notice icon={Clock}>{props.closedReason ?? "Registration is closed."}</Notice>;
  }

  if (props.full || fullOffer !== null) {
    return (
      <div className="space-y-3">
        <Notice tone="danger">
          Full · every seat is taken
          {fullOffer !== null ? (
            <>
              . You&apos;d be <span className="font-mono">#{fullOffer}</span> on the waitlist.
            </>
          ) : (
            "."
          )}
        </Notice>
        {questionFields}
        {err}
        <Button onClick={() => register(true)} loading={busy} size="lg" className="w-full">
          Join the waitlist
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {questionFields}
      {err}
      <Button onClick={() => register(false)} loading={busy} variant="accent" size="lg" className="w-full">
        Register{props.pricePaise > 0 ? ` · ${formatINR(props.pricePaise)}${props.hasUpi ? "" : " at the desk"}` : " · free"}
      </Button>
      <p className="text-center text-[12.5px] text-ink-muted">Your pass is ready the moment you register.</p>
    </div>
  );
}
