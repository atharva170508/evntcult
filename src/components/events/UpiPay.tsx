"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Hourglass } from "lucide-react";
import { Button, buttonClass } from "@/components/ui/Button";
import { Input, Notice } from "@/components/ui/Field";
import { formatINR } from "@/lib/money";
import { svgSrc } from "@/lib/svg-src";

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
export function UpiPay({ regId, pricePaise, vpa, uri, qrSvg, utr, rejected }: UpiPayProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/registrations/${regId}/upi`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ utr: value }) }).catch(() => null);
    const data = ((await res?.json().catch(() => ({}))) ?? {}) as { error?: { message: string } };
    setBusy(false);
    if (!res?.ok) return setError(data.error?.message ?? (res ? "Didn't save. Try again." : "You seem to be offline. Try again."));
    setEditing(false);
    setValue("");
    router.refresh();
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

  return (
    <section aria-label={`Pay ${formatINR(pricePaise)} by UPI`} className="overflow-hidden rounded-card ring-1 ring-line">
      <div className="flex items-center justify-between bg-sunken/60 px-4 py-3">
        <p className="text-[14px] font-semibold">Pay by UPI</p>
        <p className="font-mono text-[15px] font-medium tabular-nums">{formatINR(pricePaise)}</p>
      </div>
      <div className="space-y-4 p-4">
        {rejected && <Notice tone="danger">The organizer couldn&apos;t find that payment. Check the transaction ID.</Notice>}
        <div className="flex items-center gap-4">
          <div className="w-[128px] shrink-0 rounded-xl bg-white p-2 ring-1 ring-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={svgSrc(qrSvg)} alt="UPI payment QR code" className="block aspect-square w-full" />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-[12.5px] text-ink-muted">Scan with any UPI app, or pay to</p>
            <div className="flex items-center gap-1.5">
              <span className="min-w-0 truncate font-mono text-[13px]">{vpa}</span>
              <button type="button" onClick={copy} className={buttonClass("secondary", "sm", "h-7 shrink-0 px-2.5 text-[12px]")}>
                {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>
        <a href={uri} className={buttonClass("primary", "md", "w-full md:hidden")}>
          Open UPI app
        </a>
        <form onSubmit={submit} className="space-y-2 border-t border-line pt-4">
          <label htmlFor="upi-utr" className="block text-[13px] font-medium">
            UPI transaction ID
          </label>
          <Input
            id="upi-utr"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            inputMode="numeric"
            autoComplete="off"
            placeholder="12 digits"
            maxLength={20}
            aria-invalid={!!error || undefined}
            className="font-mono"
          />
          {error && (
            <p role="alert" className="text-[12.5px] font-medium text-danger">
              {error}
            </p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <Button type="submit" loading={busy} disabled={!value.trim()}>
              I&apos;ve paid
            </Button>
            {editing && (
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
