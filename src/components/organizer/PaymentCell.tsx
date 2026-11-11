"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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

  if (paid) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface-2 px-3 py-1 text-label font-semibold text-live">Paid{method ? ` · ${method === "upi" ? "UPI" : "Cash"}` : ""}</span>
        {refCode && <span className="font-mono text-caption text-ink-muted">{refCode}</span>}
        <button onClick={() => confirm("Mark this pass as unpaid again?") && send({ status: "unpaid" })} disabled={busy} className="text-label font-semibold text-ink-muted underline hover:text-danger">
          Undo
        </button>
        {err && <span role="alert" className="text-label text-danger">{err}</span>}
      </div>
    );
  }

  if (utr && !open) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-surface-2 px-3 py-1 text-label font-semibold text-warn">To verify</span>
        <span className="font-mono text-label">{utr}</span>
        <button onClick={() => send({ status: "paid", method: "upi" })} disabled={busy} className="rounded-full bg-volt px-3 py-1 text-label font-semibold text-ink-inverse disabled:opacity-50">
          Received
        </button>
        <button onClick={() => send({ status: "rejected" })} disabled={busy} className="rounded-full border border-line px-3 py-1 text-label font-semibold hover:border-danger hover:text-danger disabled:opacity-50">
          Not received
        </button>
        {err && <span role="alert" className="w-full text-label text-danger">{err}</span>}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-surface-2 px-3 py-1 text-label font-semibold text-warn">Unpaid</span>
        <button onClick={() => setOpen(true)} className="rounded-full border border-line px-3 py-1 text-label font-semibold hover:border-line-strong">Mark paid</button>
      </div>
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
      <select value={how} onChange={(e) => setHow(e.target.value as "cash" | "upi")} aria-label="How they paid" className="rounded-full border border-line bg-surface px-3 py-1 text-label font-semibold">
        <option value="cash">Cash</option>
        <option value="upi">UPI</option>
      </select>
      {how === "upi" && (
        <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UPI ref (optional)" aria-label="UPI reference (optional)" maxLength={35} className="w-36 rounded-full border border-line bg-surface px-3 py-1 font-mono text-label" />
      )}
      <button disabled={busy} className="inline-flex items-center gap-1 rounded-full bg-volt px-3 py-1 text-label font-semibold text-ink-inverse disabled:opacity-50">
        Save
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-label font-semibold text-ink-muted">Cancel</button>
      {err && <span role="alert" className="w-full text-label text-danger">{err}</span>}
    </form>
  );
}
