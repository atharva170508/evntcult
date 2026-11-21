"use client";

import { useEffect, useRef, useState } from "react";
import { Check, RotateCcw, WifiOff, Wifi, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Why organizers switch: three things only EvntCult does, each a small working demo you can poke.
 * All example data, labelled as such below the grid.
 */
export function OrganizerBento() {
  return (
    <div className="mt-12 grid gap-px overflow-hidden rounded-[28px] bg-white/10 ring-1 ring-white/10 md:grid-cols-6">
      <Tile
        className="md:col-span-3 md:row-span-2"
        title="A door that can't be fooled"
        body="Any phone is a scanner. A pass works once, even with no signal: scans queue offline and sync later."
      >
        <ScannerDemo />
      </Tile>
      <Tile
        className="md:col-span-3"
        title="UPI straight to you"
        body="No payment gateway, no fee. Guests pay your UPI ID and paste the UTR; you confirm from one list."
      >
        <UpiDemo />
      </Tile>
      <Tile
        className="md:col-span-3"
        title="Photos that find their people"
        body="Upload the night's photos. Guests take one selfie and see only the ones they're in."
      >
        <VaultDemo />
      </Tile>
      <Tile
        className="md:col-span-6"
        title="Set up for your kind of event"
        body="Pick hackathon, tournament, party or workshop and the form, the pass and your dashboard change with it."
      >
        <KindsDemo />
      </Tile>
    </div>
  );
}

function Tile({
  title,
  body,
  className,
  center,
  children,
}: {
  title: string;
  body: string;
  className?: string;
  center?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("flex flex-col bg-night p-6 md:p-8", className)}>
      <h3 className="text-[20px] font-semibold tracking-[-0.01em] text-cream">
        {title}
      </h3>
      <p className="mt-1.5 max-w-[44ch] text-[14.5px] leading-relaxed text-cream/60">
        {body}
      </p>
      <div
        className={cn(
          "mt-7 flex flex-1 flex-col",
          center ? "justify-center" : "justify-end",
        )}
      >
        {children}
      </div>
    </section>
  );
}

const btn =
  "ui-press relative inline-flex h-10 items-center justify-center gap-2 rounded-[12px] px-4 text-[14px] font-semibold";

/* ── Scanner: admits once, refuses the second scan, queues offline ── */

function ScannerDemo() {
  const [online, setOnline] = useState(true);
  const [admitted, setAdmitted] = useState<Set<string>>(new Set());
  const [queued, setQueued] = useState(0);
  const [result, setResult] = useState<{
    kind: "ok" | "dup";
    name: string;
    key: number;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);
  const guests = [
    { id: "EC-NEON-0042", name: "Riya Kulkarni" },
    { id: "EC-NEON-0117", name: "Kabir Shah" },
  ];
  const [pick, setPick] = useState(0);

  const [log, setLog] = useState<{ name: string; ok: boolean; at: string; offline: boolean; key: number }[]>([]);
  const scan = () => {
    const g = guests[pick];
    const at = new Date().toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    setLog((l) => [{ name: g.name, ok: !admitted.has(g.id), at, offline: !online, key: Date.now() }, ...l].slice(0, 3));
    if (admitted.has(g.id))
      setResult({ kind: "dup", name: g.name, key: Date.now() });
    else {
      setAdmitted(new Set([...admitted, g.id]));
      setResult({ kind: "ok", name: g.name, key: Date.now() });
      if (!online) setQueued((q) => q + 1);
      try {
        navigator.vibrate?.(30);
      } catch {}
    }
  };
  const toggle = () => {
    if (!online) {
      setOnline(true);
      if (queued) {
        setSyncing(true);
        setTimeout(() => (setQueued(0), setSyncing(false)), 900);
      }
    } else setOnline(false);
  };
  const reset = () => (setAdmitted(new Set()), setQueued(0), setResult(null), setLog([]));

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
      <div className="relative mx-auto w-[220px] shrink-0 rounded-[30px] border border-white/10 bg-[#0d0d0d] p-2.5 shadow-[0_30px_60px_-24px_rgba(0,0,0,0.9)]">
        <div className="overflow-hidden rounded-[22px] bg-[#1b1b1b] p-4">
          <div className="flex items-center justify-between text-[11.5px] font-semibold">
            <span className="text-cream/60">Gate 1</span>
            <span
              className={cn(
                "inline-flex items-center gap-1",
                online ? "text-[#5EE0A8]" : "text-[#FFC266]",
              )}
            >
              {online ? (
                <Wifi className="size-3.5" aria-hidden />
              ) : (
                <WifiOff className="size-3.5" aria-hidden />
              )}
              {online
                ? syncing
                  ? "Syncing"
                  : "Online"
                : `Offline, ${queued} queued`}
            </span>
          </div>
          <div className="relative mt-4 grid aspect-square place-items-center overflow-hidden rounded-[16px] bg-black/40">
            <span
              className="absolute inset-4 rounded-xl border border-dashed border-white/15"
              aria-hidden
            />
            <span className="font-mono text-[12px] tracking-[0.08em] text-cream/70">
              {guests[pick].id}
            </span>
            {result && (
              <div
                key={result.key}
                role="status"
                className={cn(
                  "absolute inset-0 grid place-items-center p-4 text-center",
                  result.kind === "ok"
                    ? "bg-[#0F6B45]/95 motion-safe:animate-[ui-menu-in_200ms_var(--ease-enter)]"
                    : "shake bg-[#9E1C2F]/95",
                )}
              >
                <div>
                  <span className="mx-auto grid size-10 place-items-center rounded-full bg-white/15">
                    {result.kind === "ok" ? (
                      <Check
                        className="size-6 text-white"
                        strokeWidth={3}
                        aria-hidden
                      />
                    ) : (
                      <X
                        className="size-6 text-white"
                        strokeWidth={3}
                        aria-hidden
                      />
                    )}
                  </span>
                  <p className="mt-2 text-[15px] font-semibold text-white">
                    {result.kind === "ok" ? "Admitted" : "Already inside"}
                  </p>
                  <p className="text-[12.5px] text-white/75">{result.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2.5">
        <div
          className="flex gap-1.5"
          role="radiogroup"
          aria-label="Pass to scan"
        >
          {guests.map((g, i) => (
            <button
              key={g.id}
              type="button"
              role="radio"
              aria-checked={pick === i}
              onClick={() => (setPick(i), setResult(null))}
              className={cn(
                "flex-1 rounded-[10px] px-3 py-2 text-left text-[12.5px] ring-1 ring-inset transition-colors",
                pick === i
                  ? "bg-white/10 text-cream ring-white/25"
                  : "text-cream/55 ring-white/10 hover:text-cream",
              )}
            >
              <span className="block font-semibold">
                {g.name.split(" ")[0]}
              </span>
              <span className="font-mono text-[11px] opacity-70">
                {admitted.has(g.id) ? "Inside" : "Not in"}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={scan}
          className={cn(btn, "bg-lavender text-ink hover:bg-lavender-hover")}
        >
          Scan {guests[pick].name.split(" ")[0]}&apos;s pass
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={toggle}
            className={cn(
              btn,
              "flex-1 bg-white/[0.07] text-cream ring-1 ring-inset ring-white/10 hover:bg-white/10",
            )}
          >
            {online ? "Go offline" : "Back online"}
          </button>
          <button
            type="button"
            onClick={reset}
            aria-label="Reset demo"
            className={cn(
              btn,
              "w-10 bg-white/[0.07] px-0 text-cream ring-1 ring-inset ring-white/10 hover:bg-white/10",
            )}
          >
            <RotateCcw className="size-4" aria-hidden />
          </button>
        </div>
        {log.length === 0 ? (
          <p className="text-[12.5px] text-cream/45">Scan the same pass twice.</p>
        ) : (
          <ul className="mt-1 space-y-1" aria-label="Door log">
            {log.map((l) => (
              <li key={l.key} className="flex items-center justify-between gap-2 rounded-[10px] bg-white/[0.04] px-3 py-1.5 text-[12px] motion-safe:animate-[ui-menu-in_200ms_var(--ease-enter)]">
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`size-1.5 shrink-0 rounded-full ${l.ok ? "bg-[#5EE0A8]" : "bg-[#FF7A8A]"}`} aria-hidden />
                  <span className="truncate text-cream/80">
                    {l.name.split(" ")[0]} {l.ok ? "admitted" : "refused, already in"}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-cream/45">{l.offline ? "queued" : l.at}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── UPI: pay, paste UTR, organizer confirms ── */

function UpiDemo() {
  const [step, setStep] = useState(0); // 0 pay, 1 typing utr, 2 waiting, 3 confirmed
  const [utr, setUtr] = useState("");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const FULL = "431877209615";

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const run = () => {
    timers.current.forEach(clearTimeout);
    setStep(1);
    setUtr("");
    FULL.split("").forEach((_, i) =>
      timers.current.push(
        setTimeout(() => setUtr(FULL.slice(0, i + 1)), 60 + i * 55),
      ),
    );
    timers.current.push(
      setTimeout(() => setStep(2), 60 + FULL.length * 55 + 250),
    );
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-[18px] bg-white/[0.05] p-4 ring-1 ring-inset ring-white/10">
        <p className="text-[12px] text-cream/50">Guest</p>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-[22px] font-semibold tabular-nums text-cream">
            ₹199
          </span>
          <span className="rounded-md bg-white/10 px-2 py-0.5 font-mono text-[11px] text-cream/70">
            club@upi
          </span>
        </div>
        <div
          className={cn(
            "mt-3 flex h-10 items-center rounded-[10px] bg-black/30 px-3 font-mono text-[13px] tabular-nums ring-1 ring-inset transition-shadow",
            step === 1 ? "ring-lavender/70" : "ring-white/10",
          )}
        >
          <span className={utr ? "text-cream" : "text-cream/35"}>
            {utr || "UTR, 12 digits"}
          </span>
          {step === 1 && (
            <span
              className="ml-0.5 h-4 w-px bg-cream motion-safe:animate-pulse"
              aria-hidden
            />
          )}
          {utr.length === 12 && (
            <Check
              className="ml-auto size-4 text-[#5EE0A8]"
              strokeWidth={3}
              aria-hidden
            />
          )}
        </div>
        <button
          type="button"
          onClick={run}
          disabled={step === 1}
          className={cn(
            btn,
            "mt-3 w-full bg-lavender text-ink hover:bg-lavender-hover disabled:opacity-60",
          )}
        >
          {step === 0
            ? "Pay and paste UTR"
            : step === 1
              ? "Pasting…"
              : "Pay again"}
        </button>
      </div>
      <div className="rounded-[18px] bg-white/[0.05] p-4 ring-1 ring-inset ring-white/10">
        <p className="text-[12px] text-cream/50">You, the organizer</p>
        <div
          className={cn(
            "mt-2 rounded-[12px] p-3 transition-colors duration-300",
            step >= 2 ? "bg-white/[0.07]" : "bg-transparent",
          )}
        >
          {step < 2 ? (
            <p className="py-3 text-center text-[13px] text-cream/40">
              Payments to check show up here.
            </p>
          ) : (
            <div className="motion-safe:animate-[ui-menu-in_220ms_var(--ease-enter)]">
              <div className="flex items-baseline justify-between">
                <span className="text-[14px] font-semibold text-cream">
                  Riya Kulkarni
                </span>
                <span className="text-[13px] tabular-nums text-cream/70">
                  ₹199
                </span>
              </div>
              <p className="mt-0.5 font-mono text-[11.5px] tabular-nums text-cream/50">
                UTR {FULL}
              </p>
              {step === 2 ? (
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className={cn(
                    btn,
                    "mt-3 h-9 w-full bg-cream text-ink hover:bg-white",
                  )}
                >
                  Confirm payment
                </button>
              ) : (
                <p className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-[12px] bg-[#5EE0A8]/15 text-[13.5px] font-semibold text-[#5EE0A8]">
                  <Check className="size-4" strokeWidth={3} aria-hidden />{" "}
                  Confirmed, pass issued
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Photo vault: one selfie, only your photos ── */

const TILES = [
  "#E8743A",
  "#4B2E86",
  "#11796D",
  "#C7457A",
  "#2346A8",
  "#3F7A3A",
  "#C2392B",
  "#4B2E86",
  "#11796D",
  "#E8743A",
  "#C7457A",
  "#2346A8",
];
const MINE = new Set([1, 4, 7, 10]);

function VaultDemo() {
  const [state, setState] = useState<"idle" | "scan" | "done">("idle");
  const go = () => {
    if (state === "done") return setState("idle");
    setState("scan");
    setTimeout(() => setState("done"), 1100);
  };
  return (
    <div>
      <div className="relative grid grid-cols-6 gap-1.5 overflow-hidden rounded-[14px]">
        {TILES.map((c, i) => (
          <span
            key={i}
            className={cn(
              "relative aspect-square rounded-[8px] transition-[opacity,transform] duration-500 ease-[var(--ease-enter)]",
              state === "done" && !MINE.has(i) && "scale-95 opacity-20",
              state === "done" &&
                MINE.has(i) &&
                "ring-2 ring-lavender ring-offset-2 ring-offset-night",
            )}
            style={{
              background: c,
              transitionDelay: state === "done" ? `${(i % 6) * 30}ms` : "0ms",
            }}
            aria-hidden
          >
            <span className="absolute left-1/2 top-[30%] size-[34%] -translate-x-1/2 rounded-full bg-white/30" />
            <span className="absolute bottom-0 left-1/2 h-[28%] w-[62%] -translate-x-1/2 rounded-t-full bg-white/25" />
          </span>
        ))}
        {state === "scan" && (
          <span
            className="scanline pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-lavender/0 via-lavender/50 to-lavender/0"
            aria-hidden
          />
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-[13.5px] text-cream/70" role="status">
          {state === "idle"
            ? "248 photos from the night"
            : state === "scan"
              ? "Looking for you…"
              : "4 photos of you"}
        </p>
        <button
          type="button"
          onClick={go}
          disabled={state === "scan"}
          className={cn(
            btn,
            "h-9 bg-lavender text-ink hover:bg-lavender-hover disabled:opacity-60",
          )}
        >
          {state === "done" ? "Show all" : "Find me"}
        </button>
      </div>
    </div>
  );
}

/* ── Category-adaptive setup ── */

const KINDS = [
  {
    k: "Hackathon",
    fields: [
      ["Team size", "2 to 4"],
      ["Tracks", "AI / ML, FinTech"],
      ["Overnight", "Yes"],
    ],
    pass: ["Team Byte Me", "AI / ML"],
  },
  {
    k: "Tournament",
    fields: [
      ["Format", "8 overs box cricket"],
      ["Squad", "8 players"],
      ["Entry", "Per team"],
    ],
    pass: ["Strikers XI", "Captain"],
  },
  {
    k: "Party",
    fields: [
      ["Age limit", "21+"],
      ["Dress code", "All black"],
      ["Lineup", "DJ Arjun, 9 pm"],
    ],
    pass: ["Couple", "21+"],
  },
  {
    k: "Workshop",
    fields: [
      ["Speakers", "Priya Rao"],
      ["Bring", "Laptop"],
      ["Level", "Beginner"],
    ],
    pass: ["Beginner", "Certificate"],
  },
] as const;

function KindsDemo() {
  const [i, setI] = useState(0);
  const k = KINDS[i];
  return (
    <div className="grid items-center gap-5 md:grid-cols-[auto_1fr_auto]">
      <div
        className="flex flex-wrap gap-1.5"
        role="radiogroup"
        aria-label="Kind of event"
      >
        {KINDS.map((x, j) => (
          <button
            key={x.k}
            type="button"
            role="radio"
            aria-checked={i === j}
            onClick={() => setI(j)}
            className={cn(
              "rounded-full px-4 py-2 text-[13.5px] font-semibold ring-1 ring-inset transition-colors duration-200",
              i === j
                ? "bg-cream text-ink ring-cream"
                : "text-cream/70 ring-white/15 hover:text-cream",
            )}
          >
            {x.k}
          </button>
        ))}
      </div>
      <dl
        key={k.k}
        className="grid grid-cols-3 gap-px overflow-hidden rounded-[14px] bg-white/10 motion-safe:animate-[ui-menu-in_220ms_var(--ease-enter)]"
      >
        {k.fields.map(([l, v]) => (
          <div key={l} className="bg-night px-4 py-3">
            <dt className="text-[11.5px] text-cream/45">{l}</dt>
            <dd className="mt-0.5 truncate text-[14px] font-semibold text-cream">
              {v}
            </dd>
          </div>
        ))}
      </dl>
      <div
        key={`p${k.k}`}
        className="flex gap-1.5 motion-safe:animate-[ui-menu-in_220ms_var(--ease-enter)]"
        aria-label="On the pass"
      >
        {k.pass.map((p) => (
          <span
            key={p}
            className="rounded-lg bg-lavender px-2.5 py-1 text-[12.5px] font-semibold text-ink"
          >
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
