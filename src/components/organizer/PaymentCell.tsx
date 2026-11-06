"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/** Mark paid (Cash / UPI + optional reference) or undo. Every change is audited on the server. */
export function PaymentCell({ regId, paid, method, refCode }: { regId: string; paid: boolean; method: string | null; refCode: string | null }) {
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
        <span className="rounded-full bg-live-soft px-2.5 py-1 text-[12px] font-bold text-live">Paid{method ? ` · ${method === "upi" ? "UPI" : "Cash"}` : ""}</span>
        {refCode && <span className="font-mono text-[11.5px] text-ink-muted">{refCode}</span>}
        <button onClick={() => confirm("Mark this pass as unpaid again?") && send({ status: "unpaid" })} disabled={busy} className="text-[12px] font-semibold text-ink-muted underline hover:text-danger">
          Undo
        </button>
        {err && <span role="alert" className="text-[12px] text-danger">{err}</span>}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-warn-soft px-2.5 py-1 text-[12px] font-bold text-warn">Unpaid</span>
        <button onClick={() => setOpen(true)} className="rounded-full border border-line px-3 py-1 text-[12px] font-semibold hover:border-ink">Mark paid</button>
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
      <select value={how} onChange={(e) => setHow(e.target.value as "cash" | "upi")} aria-label="How they paid" className="rounded-full border border-line bg-surface px-2.5 py-1 text-[12.5px] font-semibold">
        <option value="cash">Cash</option>
        <option value="upi">UPI</option>
      </select>
      {how === "upi" && (
        <input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="UPI ref (optional)" aria-label="UPI reference (optional)" maxLength={35} className="w-36 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[12px]" />
      )}
      <button disabled={busy} className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-[12px] font-semibold text-white disabled:opacity-50">
        {busy && <Loader2 className="size-3 animate-spin" />} Save
      </button>
      <button type="button" onClick={() => setOpen(false)} className="text-[12px] font-semibold text-ink-muted">Cancel</button>
      {err && <span role="alert" className="w-full text-[12px] text-danger">{err}</span>}
    </form>
  );
}
