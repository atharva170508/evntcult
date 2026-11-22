"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, ChevronDown, Clock, Hourglass, IndianRupee, Ticket, XCircle } from "lucide-react";
import { Button, LinkButton } from "@/components/ui/Button";
import { Input, Notice } from "@/components/ui/Field";
import { Select as Dropdown } from "@/components/ui/Select";
import { Segmented } from "@/components/ui/Segmented";
import { formatINR } from "@/lib/money";
import { UpiPay, type UpiPayProps } from "@/components/events/UpiPay";
import type { Question } from "@/lib/data/questions";
import { svgSrc } from "@/lib/svg-src";
import { Sheet } from "@/components/ui/Sheet";
import { PassPrinter } from "@/components/events/PassPrinter";
import { passName } from "@/lib/pass-name";

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
  /** The host approves each sign-up: requests wait instead of getting a pass. */
  approval?: boolean;
  /** Ticket types to choose from (Stag, Couple, VIP…). */
  tiers?: { id: string; name: string; pricePaise: number; capacity?: number | null }[];
  /** Seats left for ticket types with their own limit, by id. */
  tierLeft?: Record<string, number>;
  /** The event has promo codes: show a code field. */
  hasPromos?: boolean;
  /** Team sign-up is on: create a team or join one with a code. */
  teamSignup?: { noun: "team" | "squad"; min: number; max: number; teamPays: boolean };
  /** The viewer's team, once registered. */
  myTeam?: { name: string; code: string; isCaptain: boolean; members: { name: string; captain: boolean; you: boolean }[] } | null;
  /** A join code from a shared link (?team=). */
  teamCode?: string;
  /** The host's note shown after sign-up. */
  hostNote?: { from: string; text: string } | null;
  /** Luma's "Get ready for the event": what's done and what's left. */
  ready?: { whatsapp: boolean; phone: boolean } | null;
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
  const [teamPick, setTeamPick] = useState<"create" | "join">(props.teamCode ? "join" : "create");
  const [teamName, setTeamName] = useState("");
  const [teamJoin, setTeamJoin] = useState(props.teamCode ?? "");
  const [copied, setCopied] = useState(false);
  const [tier, setTier] = useState(props.tiers?.find((t) => props.tierLeft?.[t.id] !== 0)?.id ?? props.tiers?.[0]?.id ?? "");
  const [codeInput, setCodeInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; amountPaise: number; label: string } | null>(null);
  const [promoErr, setPromoErr] = useState<string | null>(null);
  const basePrice = props.tiers?.find((t) => t.id === tier)?.pricePaise ?? props.pricePaise;
  const price = promo ? promo.amountPaise : basePrice;

  async function applyCode() {
    setPromoErr(null);
    if (!codeInput.trim()) return;
    const q = new URLSearchParams({ code: codeInput.trim(), ...(tier ? { tier } : {}) });
    const res = await fetch(`/api/events/${props.slug}/promo?${q}`).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { amountPaise?: number; promo?: string; promoLabel?: string; error?: { message: string } } | undefined;
    if (!res?.ok || !data?.promo) return setPromoErr(data?.error?.message ?? "Couldn't check that code.");
    setPromo({ code: data.promo, amountPaise: data.amountPaise ?? 0, label: data.promoLabel ?? "" });
  }

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
    const data = await call(`/api/events/${props.slug}/register`, { method: "POST", body: JSON.stringify({ waitlist, answers, ...(props.code ? { code: props.code } : {}), ...(tier ? { tier } : {}), ...(promo ? { promo: promo.code } : {}), ...(props.teamSignup ? { team: teamPick === "create" ? { create: teamName } : { join: teamJoin } } : {}) }) });
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
        <div key={q.id} className="block">
          <span className="text-[13px] font-medium text-ink">
            {q.label}
            {q.required ? <span className="text-accent-ink"> *</span> : ""}
          </span>
          {q.kind === "choice" && q.options.length <= 6 ? (
            <span role="radiogroup" aria-label={q.label} className="mt-1.5 flex flex-wrap gap-1.5">
              {q.options.map((o) => {
                const on = answers[q.id] === o;
                return (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setAnswers((a) => ({ ...a, [q.id]: on && !q.required ? "" : o }))}
                    className={`ui-press h-10 rounded-[11px] px-3.5 text-[14px] font-semibold ring-1 ring-inset ${on ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-line-strong hover:ring-ink/40"}`}
                  >
                    {o}
                  </button>
                );
              })}
            </span>
          ) : q.kind === "choice" ? (
            <Dropdown
              label={q.label}
              size="sm"
              className="mt-1.5 w-full"
              value={answers[q.id] ?? ""}
              onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
              options={[{ value: "", label: "Choose" }, ...q.options.map((o) => ({ value: o, label: o }))]}
            />
          ) : (
            <Input aria-label={q.label} maxLength={500} value={answers[q.id] ?? ""} onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))} className="mt-1.5" />
          )}
        </div>
      ))}
    </div>
  );
  const teamFields = props.teamSignup && (
    <div className="space-y-2.5">
      <Segmented
        label={`Your ${props.teamSignup.noun}`}
        value={teamPick}
        onChange={setTeamPick}
        options={[
          { value: "create", label: `Create a ${props.teamSignup.noun}` },
          { value: "join", label: "Join with a code" },
        ]}
      />
      {teamPick === "create" ? (
        <Input aria-label={`${props.teamSignup.noun === "squad" ? "Squad" : "Team"} name`} placeholder={props.teamSignup.noun === "squad" ? "Squad name, like Strikers XI" : "Team name, like Byte Me"} value={teamName} onChange={(e) => setTeamName(e.target.value)} maxLength={40} />
      ) : (
        <Input aria-label="Join code" placeholder="Code from your captain" value={teamJoin} onChange={(e) => setTeamJoin(e.target.value.toUpperCase())} maxLength={12} className="font-mono uppercase tracking-[0.12em]" />
      )}
      <p className="text-[12.5px] text-ink-muted">
        {teamPick === "create"
          ? `You'll get a code to share. ${props.teamSignup.noun === "squad" ? "Squads" : "Teams"} of ${props.teamSignup.min === props.teamSignup.max ? props.teamSignup.max : `${props.teamSignup.min} to ${props.teamSignup.max}`}.${props.teamSignup.teamPays && props.pricePaise > 0 ? " You pay once for everyone." : ""}`
          : props.teamSignup.teamPays && props.pricePaise > 0
            ? "Your captain has paid for the team, so you join free."
            : `Ask your captain for the ${props.teamSignup.noun} code.`}
      </p>
    </div>
  );
  const teamCard = props.myTeam && (
    <div className="rounded-2xl border border-line-strong bg-white p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="min-w-0 truncate text-[16px] font-semibold text-ink">{props.myTeam.name}</p>
        {props.teamSignup && (
          <p className={`shrink-0 text-[13px] tabular-nums ${props.myTeam.members.length < props.teamSignup.min ? "text-warn" : "text-ink-muted"}`}>
            {props.myTeam.members.length} of {props.teamSignup.max}
          </p>
        )}
      </div>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {props.myTeam.members.map((m, i) => (
          <li key={i} className="rounded-lg bg-sunken px-2.5 py-1 text-[13px] text-ink-2">
            {m.you ? "You" : m.name.split(" ")[0]}
            {m.captain && <span className="text-ink-muted"> (captain)</span>}
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-lavender/50 px-3 py-2.5">
        <div>
          <p className="text-[12px] text-ink-muted">Join code</p>
          <p className="font-mono text-[18px] font-medium tracking-[0.16em] text-ink">{props.myTeam.code}</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={async () => {
            const url = `${window.location.origin}/events/${props.slug}?team=${props.myTeam!.code}`;
            const text = `Join ${props.myTeam!.name} on EvntCult. Code ${props.myTeam!.code}: ${url}`;
            try {
              if (navigator.share) await navigator.share({ text });
              else {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }
            } catch {
              // cancelled
            }
          }}
        >
          {copied ? "Copied" : "Invite"}
        </Button>
      </div>
    </div>
  );
  const ticketFields = (!!props.tiers?.length || props.hasPromos) && (
    <div className="space-y-3">
      {!!props.tiers?.length && (
        <div role="radiogroup" aria-label="Ticket type" className="grid gap-2">
          {props.tiers.map((t) => {
            const on = tier === t.id;
            const left = props.tierLeft?.[t.id];
            const soldOut = left === 0;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={on}
                disabled={soldOut}
                onClick={() => (setTier(t.id), setPromo(null))}
                className={`ui-press flex min-h-12 items-center justify-between rounded-[14px] px-4 text-left ring-inset transition-shadow disabled:cursor-not-allowed disabled:opacity-50 ${on ? "whitespace-nowrap bg-lavender/60 ring-2 ring-ink" : "bg-white ring-1 ring-line-strong hover:ring-ink/40"}`}
              >
                <span className="flex items-center gap-2.5 text-[15px] font-semibold text-ink">
                  <span className={`grid size-4 place-items-center rounded-full ring-2 ${on ? "ring-ink" : "ring-line-strong"}`} aria-hidden>
                    {on && <span className="size-2 rounded-full bg-ink" />}
                  </span>
                  {t.name}
                  {left !== undefined && left > 0 && left <= 20 && <span className="text-[12.5px] font-medium text-accent-ink">{left} left</span>}
                </span>
                <span className="text-[15px] font-semibold tabular-nums text-ink">{soldOut ? "Sold out" : t.pricePaise ? formatINR(t.pricePaise) : "Free"}</span>
              </button>
            );
          })}
        </div>
      )}
      {props.hasPromos &&
        (promo ? (
          <p className="flex items-center justify-between rounded-[12px] bg-sunken px-3.5 py-2.5 text-[14px]">
            <span>
              <span className="font-mono font-semibold tracking-[0.06em] text-ink">{promo.code}</span> <span className="text-ink-2">{promo.label}</span>
            </span>
            <button type="button" className="text-[13px] font-semibold text-ink-muted underline underline-offset-2 hover:text-ink" onClick={() => setPromo(null)}>
              Remove
            </button>
          </p>
        ) : (
          <div>
            <div className="flex gap-2">
              <Input aria-label="Promo code" placeholder="Promo code" value={codeInput} onChange={(e) => setCodeInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyCode())} className="flex-1 font-mono uppercase" maxLength={24} />
              <Button variant="secondary" onClick={applyCode} className="h-11 shrink-0">
                Apply
              </Button>
            </div>
            {promoErr && <p className="mt-1.5 text-[13px] text-danger">{promoErr}</p>}
          </div>
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
        {teamCard}
        <div className="flex items-center gap-4">
          {props.qrSvg && (
            <div className="w-[112px] shrink-0 rounded-xl bg-white p-2 ring-1 ring-line">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={svgSrc(props.qrSvg)} alt="Entry QR code" className="block aspect-square w-full" />
            </div>
          )}
          <div className="min-w-0 space-y-1">
            <p className="eyebrow">Pass</p>
            <p className="font-display text-[22px] leading-tight text-ink">{passName(r.passCode).name}</p>
            <p className="text-[13px] tabular-nums text-ink-muted">No. {passName(r.passCode).no}</p>
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
        {props.hostNote && (
          <div className="border-l-2 border-lavender pl-3">
            <p className="text-[12.5px] text-ink-muted">A note from {props.hostNote.from}</p>
            <p className="mt-0.5 whitespace-pre-line font-display text-[18px] leading-snug text-ink">{props.hostNote.text}</p>
          </div>
        )}
        {props.ready && (
          <details className="group rounded-xl border border-line bg-canvas/50 open:bg-white">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3.5 py-3 text-[14px]">
              <span>
                <span className="font-semibold text-ink">Get ready for the event</span>
                <span className="block text-[12.5px] text-ink-muted">
                  {1 + (props.ready.whatsapp ? 1 : 0)} of 4 done
                </span>
              </span>
              <ChevronDown className="size-4 text-ink-muted transition-transform group-open:rotate-180" aria-hidden />
            </summary>
            <ul className="space-y-1 border-t border-line px-2 py-2 text-[14px]">
              {[
                { done: true, label: "Pass saved to your account", href: "/passes", cta: "Open" },
                { done: props.ready.whatsapp, label: props.ready.whatsapp ? "WhatsApp reminders are on" : props.ready.phone ? "Turn on WhatsApp reminders" : "Add your number for WhatsApp reminders", href: "/profile", cta: "Set up" },
                { done: false, label: "Add it to your calendar", href: `/api/events/${props.slug}/ics`, cta: "Add" },
                { done: false, label: "Put EvntCult on your home screen", href: "/get-app", cta: "How" },
              ].map((i) => (
                <li key={i.label} className="flex min-h-10 items-center gap-2.5 rounded-lg px-1.5">
                  <span className={`grid size-5 shrink-0 place-items-center rounded-md ${i.done ? "bg-ink text-white" : "ring-1 ring-inset ring-line-strong"}`} aria-hidden>
                    {i.done && <Check className="size-3" />}
                  </span>
                  <span className={`min-w-0 flex-1 ${i.done ? "text-ink-muted" : "text-ink"}`}>{i.label}</span>
                  {!i.done && (
                    <a href={i.href} className="shrink-0 rounded-lg px-2.5 py-1 text-[13px] font-semibold text-ink hover:bg-sunken">
                      {i.cta}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
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

  if (r?.status === "waitlisted" && props.approval) {
    return (
      <div className="space-y-4">
        <Notice tone="warn" icon={Hourglass}>
          <p>Request sent</p>
          <p className="mt-1 font-normal text-ink-2">The host approves each guest. Your pass appears here once they say yes.</p>
        </Notice>
        {err}
        {live && (
          <Button onClick={cancel} disabled={busy} variant="ghost" className="w-full text-ink-muted hover:bg-danger-soft hover:text-danger">
            Withdraw request
          </Button>
        )}
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

  if (props.approval) {
    return (
      <div className="space-y-3">
        {teamFields}
        {ticketFields}
        {questionFields}
        {err}
        <Button onClick={() => register(false)} loading={busy} variant="accent" size="lg" className="w-full">
          Request to join{price > 0 ? ` · ${formatINR(price)}` : ""}
        </Button>
        <p className="text-center text-[12.5px] text-ink-muted">The host approves each guest. You pay only once you&apos;re in.</p>
      </div>
    );
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
        {teamFields}
        {ticketFields}
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
      {teamFields}
      {ticketFields}
      {questionFields}
      {err}
      <Button onClick={() => register(false)} loading={busy} variant="accent" size="lg" className="w-full">
        Register{price > 0 ? ` · ${formatINR(price)}${props.hasUpi ? "" : " at the desk"}` : " · free"}
      </Button>
      <p className="text-center text-[12.5px] text-ink-muted">Your pass is ready the moment you register.</p>
    </div>
  );
}
