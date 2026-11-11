"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonClass } from "@/components/ui/Button";

/** Mark paid (Cash / UPI + optional reference) or undo. Every change is audited on the server. */
export function PaymentCell({ regId, paid, method, refCode, utr }: { regId: string; paid: boolean; method: string | null; refCode: string | null; utr?: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [how, setHow] = useState<"cash" | "upi">("cash");
  const [ref, setRef] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function send(body: object) {
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/registrations/${regId}/payment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as { error?: { message: string } };
    setBusy(false);
    if (!res.ok) return setErr(data.error?.message ?? "Didn't save.");
    setOpen(false);
    setRef("");
    router.refresh();
  }

  const sm = buttonClass("secondary", "sm");
  const error = err && (
    <span role="alert" className="w-full text-label text-bad">
      {err}
    </span>
  );

  if (paid) {
    return (
      <div className="flex flex-wrap items-center gap-2 text-label">
        {(method || refCode) && (
          <span className="font-mono text-ink-muted">
            {method === "upi" ? "UPI" : method ? "Cash" : ""}
            {refCode ? ` · ${refCode}` : ""}
          </span>
        )}
        <button onClick={() => confirm("Mark this pass as unpaid again?") && send({ status: "unpaid" })} disabled={busy} className="text-ink-muted underline underline-offset-4 hover:text-ink">
          Mark unpaid
        </button>
        {error}
      </div>
    );
  }

  if (utr && !open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-label" title="UPI transaction ID they sent">
          {utr}
        </span>
        <button onClick={() => send({ status: "paid", method: "upi" })} disabled={busy} className={sm}>
          Received
        </button>
        <button onClick={() => send({ status: "rejected" })} disabled={busy} className={buttonClass("ghost", "sm")}>
          Not received
        </button>
        {error}
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className={buttonClass("secondary", "sm", "w-fit")}>
        Mark paid
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send({ status: "paid", method: how, ...(how === "upi" && ref.trim() ? { ref: ref.trim() } : {}) });
      }}
      className="flex flex-wrap items-center gap-2"
    >
      <select value={how} onChange={(e) => setHow(e.target.value as "cash" | "upi")} aria-label="How they paid" className="h-8 rounded-sm border border-line-strong bg-surface px-2 text-label">
        <option value="cash">Cash</option>
        <option value="upi">UPI</option>
      </select>
      {how === "upi" && (
        <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UPI ref (optional)" aria-label="UPI reference (optional)" maxLength={35} className="h-8 w-36 rounded-sm border border-line-strong bg-surface px-2 font-mono text-label" />
      )}
      <button disabled={busy} className={buttonClass("primary", "sm")}>
        Save
      </button>
      <button type="button" onClick={() => setOpen(false)} className={buttonClass("ghost", "sm")}>
        Cancel
      </button>
      {error}
    </form>
  );
}
