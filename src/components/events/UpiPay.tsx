"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { formatINR } from "@/lib/money";

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
    const res = await fetch(`/api/registrations/${regId}/upi`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ utr: value }) });
    const data = (await res.json().catch(() => ({}))) as { error?: { message: string } };
    setBusy(false);
    if (!res.ok) return setError(data.error?.message ?? "Didn't save. Try again.");
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
      <div className="rounded-md bg-warn-soft p-4">
        <p className="text-body font-semibold text-warn">Payment being checked</p>
        <p className="mt-1 font-mono text-body-sm text-ink-2">{utr}</p>
        <button onClick={() => setEditing(true)} className="mt-2 text-label font-semibold text-ink-muted underline">
          Change ID
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-line p-4">
      <p className="text-body font-semibold">Pay {formatINR(pricePaise)}</p>
      {rejected && (
        <p role="alert" className="rounded-md bg-danger-soft px-4 py-3 text-body-sm font-semibold text-danger">
          The organizer couldn&apos;t find that payment. Check the ID.
        </p>
      )}
      <div className="w-[150px] rounded-md bg-white p-2 [&>svg]:size-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
      <a href={uri} className="inline-flex w-full items-center justify-center rounded-full bg-volt py-3 text-body font-semibold text-ink-inverse md:hidden">
        Open UPI app
      </a>
      <div className="flex items-center gap-2">
        <span className="min-w-0 flex-1 truncate font-mono text-body-sm">{vpa}</span>
        <button type="button" onClick={copy} className="rounded-full border border-line px-3 py-1 text-label font-semibold hover:border-volt/60">
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <form onSubmit={submit} className="space-y-2 border-t border-line pt-3">
        <label htmlFor="upi-utr" className="block text-body-sm font-semibold">
          UPI transaction ID
        </label>
        <input
          id="upi-utr"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          placeholder="12 digits"
          maxLength={20}
          className="w-full rounded-full border border-line bg-surface px-4 py-3 font-mono text-body"
        />
        {error && (
          <p role="alert" className="text-label font-semibold text-danger">
            {error}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button disabled={busy || !value.trim()} className="inline-flex items-center gap-2 rounded-full bg-volt px-6 py-3 text-body font-semibold text-ink-inverse disabled:opacity-50">
            {busy && <Loader2 className="size-4 animate-spin" />} I&apos;ve paid
          </button>
          {editing && (
            <button type="button" onClick={() => setEditing(false)} className="text-body-sm font-semibold text-ink-muted">
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
