"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CheckCircle2, ClipboardPaste, Copy, Hourglass } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/Button";
import { Input, Notice } from "@/components/ui/Field";
import { formatINR } from "@/lib/money";
import { svgSrc } from "@/lib/svg-src";
import { Viewfinder } from "@/components/ui/Viewfinder";
import { AnimatePresence, m, useReducedMotion } from "motion/react";

export interface UpiPayProps {
  regId: string;
  pricePaise: number;
  vpa: string;
  uri: string;
  qrSvg: string;
  utr: string | null;
  rejected: boolean;
}

/** Pay the organizer by UPI, then hand in the transaction ID for them to check. */
export function UpiPay({ regId, pricePaise, vpa, uri, qrSvg, utr, rejected, onDone }: UpiPayProps & { onDone?: () => void }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [back, setBack] = useState(false); // returned from a payment app
  const [sent, setSent] = useState(false); // success tick before the printer
  const reduce = useReducedMotion();
  const left = useRef(false);

  // Came back from GPay / PhonePe / Paytm: bring the transaction ID box forward, ready to paste.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "hidden") {
        left.current = true;
        return;
      }
      if (!left.current) return;
      left.current = false;
      setBack(true);
      const el = document.getElementById("upi-utr") as HTMLInputElement | null;
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus({ preventScroll: true });
      setTimeout(() => setBack(false), 1600);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  async function paste() {
    const text = await navigator.clipboard?.readText().catch(() => "");
    const found = text?.replace(/[\s-]/g, "").match(/\d{12}/)?.[0];
    if (found) {
      setValue(found);
      setError(null);
    } else setError("No 12-digit transaction ID on your clipboard. Copy it from your payment app's receipt.");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/registrations/${regId}/upi`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ utr: value }) }).catch(() => null);
    const data = ((await res?.json().catch(() => ({}))) ?? {}) as { error?: { message: string } };
    setBusy(false);
    if (!res?.ok) return setError(data.error?.message ?? (res ? "Didn't save. Try again." : "You seem to be offline. Try again."));
    // A beat for the tick to draw, then hand off to the pass printer.
    setSent(true);
    setTimeout(
      () => {
        setSent(false);
        setEditing(false);
        setValue("");
        onDone?.();
        router.refresh();
      },
      reduce ? 0 : 650,
    );
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(vpa);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* the ID is on screen to copy by hand */
    }
  }

  if (utr && !editing) {
    return (
      <Notice tone="warn" icon={Hourglass}>
        <p>Payment being checked</p>
        <p className="mt-1 font-mono font-normal text-ink-2">{utr}</p>
        <button onClick={() => setEditing(true)} className="mt-2 text-[12.5px] font-medium text-ink-muted underline decoration-line-strong underline-offset-2 hover:text-ink">
          Change transaction ID
        </button>
      </Notice>
    );
  }

  const digits = value.replace(/\s/g, "");
  const valid = /^\d{12}$/.test(digits);
  const badChars = /[^\d\s]/.test(value);

  return (
    <section aria-label={`Pay ${formatINR(pricePaise)} by UPI`} className="space-y-6">
      {rejected && <Notice tone="danger">The organizer couldn&apos;t find that payment. Check the transaction ID and send it again.</Notice>}

      <div className="text-center">
        <p className="text-[13.5px] text-ink-muted">Amount to pay</p>
        <p className="mt-1 font-display text-[44px] leading-none tabular-nums text-ink">{formatINR(pricePaise)}</p>
      </div>

      <ol className="space-y-6">
        <li>
          <p className="flex items-center gap-2 text-[14px] font-semibold text-ink">
            <span className="grid size-6 place-items-center rounded-full bg-ink text-[12px] text-white" aria-hidden>
              1
            </span>
            Pay with any UPI app
          </p>
          <div className="mt-3 flex flex-col items-center gap-3 rounded-2xl border border-line-strong bg-white p-4">
            <div className="relative w-[188px] rounded-xl bg-white p-1">
              <Viewfinder />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={svgSrc(qrSvg)} alt={`UPI QR code to pay ${formatINR(pricePaise)} to ${vpa}`} className="block aspect-square w-full" />
            </div>
            <div className="flex max-w-full items-center gap-2 rounded-lg bg-sunken px-3 py-1.5">
              <span className="min-w-0 truncate font-mono text-[13px] text-ink">{vpa}</span>
              <button type="button" onClick={copy} className={buttonClass("secondary", "sm", "h-8 shrink-0 px-2.5 text-[12.5px]")}>
                {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <a href={uri} className={buttonClass("primary", "lg", "w-full md:hidden")}>
              Open UPI app
            </a>
          </div>
        </li>
        <li>
          <form onSubmit={submit} noValidate>
            <label htmlFor="upi-utr" className="flex items-center gap-2 text-[14px] font-semibold text-ink">
              <span className="grid size-6 place-items-center rounded-full bg-ink text-[12px] text-white" aria-hidden>
                2
              </span>
              Enter the transaction ID
            </label>
            <p id="upi-utr-help" className="mt-1.5 pl-8 text-[13px] text-ink-muted">
              The 12-digit UTR or UPI reference from your payment app&apos;s receipt.
            </p>
            <div className="relative mt-3">
              <Input
                id="upi-utr"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                inputMode="numeric"
                autoComplete="off"
                maxLength={20}
                aria-describedby="upi-utr-help upi-utr-state"
                aria-invalid={!!error || badChars || undefined}
                className={`h-12 pr-20 font-mono text-[16px] tracking-[0.08em] transition-shadow duration-slow ${back ? "shadow-[0_0_0_4px_rgba(240,215,255,0.9)] motion-safe:animate-pulse" : ""}`}
              />
              <span id="upi-utr-state" className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-1 text-[12.5px] tabular-nums" aria-live="polite">
                {valid ? (
                  <span className="flex items-center gap-1 font-semibold text-live">
                    <CheckCircle2 className="size-4" aria-hidden /> Looks right
                  </span>
                ) : (
                  <span className={badChars || digits.length > 12 ? "font-semibold text-danger" : "text-ink-muted"}>{digits.length}/12</span>
                )}
              </span>
            </div>
            {!valid && (
              <button
                type="button"
                onClick={paste}
                className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-[13.5px] font-semibold text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink"
              >
                <ClipboardPaste className="size-4" aria-hidden /> Paste from clipboard
              </button>
            )}
            {(error || badChars) && (
              <p role="alert" className="mt-2 text-[13px] font-medium text-danger">
                {error ?? "Only numbers. The transaction ID is 12 digits."}
              </p>
            )}
            <div className="mt-4 flex items-center gap-2">
              <SubmitMorph busy={busy} sent={sent} disabled={!valid} />
              {editing && (
                <Button type="button" size="lg" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
            </div>
            <p className="mt-3 text-center text-[12.5px] text-ink-muted">The host checks the ID against their UPI app, then your pass shows Paid.</p>
          </form>
        </li>
      </ol>
    </section>
  );
}

/**
 * The submit button morphs: label to a compact pill with a spinner while sending, then a tick
 * draws itself. clip-path does the shrinking, so nothing reflows.
 */
function SubmitMorph({ busy, sent, disabled }: { busy: boolean; sent: boolean; disabled: boolean }) {
  const state = sent ? "sent" : busy ? "busy" : "idle";
  return (
    <m.button
      type="submit"
      disabled={disabled || state !== "idle"}
      aria-busy={state === "busy"}
      className="relative h-12 flex-1 bg-ink text-[16px] font-semibold text-white disabled:cursor-default"
      initial={false}
      animate={{
        clipPath: state === "idle" ? "inset(0px 0px round 12px)" : "inset(0px calc(50% - 24px) round 999px)",
        backgroundColor: state === "sent" ? "#0F8A5F" : disabled && state === "idle" ? "#9C988C" : "#1A1A1A",
      }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <AnimatePresence mode="wait" initial={false}>
        {state === "idle" && (
          <m.span key="l" className="block" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
            I&apos;ve paid, send for checking
          </m.span>
        )}
        {state === "busy" && (
          <m.span key="b" className="absolute inset-0 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.1 } }}>
            <span className="size-5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden />
            <span className="sr-only">Sending</span>
          </m.span>
        )}
        {state === "sent" && (
          <m.span key="s" className="absolute inset-0 grid place-items-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
              <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="draw-check" />
            </svg>
            <span className="sr-only">Sent</span>
          </m.span>
        )}
      </AnimatePresence>
    </m.button>
  );
}
