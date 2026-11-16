"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonClass } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";

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
    const res = await fetch(`/api/registrations/${regId}/payment`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    const data = (await res?.json().catch(() => ({}))) as { error?: { message: string } } | undefined;
    setBusy(false);
    if (!res?.ok) return setErr(data?.error?.message ?? (res ? "Didn't save." : "Offline. Try again."));
    setOpen(false);
    setRef("");
    router.refresh();
  }

  if (paid) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <Chip tone="live">Paid{method ? ` · ${method === "upi" ? "UPI" : "Cash"}` : ""}</Chip>
        {refCode && <span className="font-mono text-[11.5px] text-ink-muted">{refCode}</span>}
        <button
          onClick={() => confirm("Mark this pass as unpaid again?") && send({ status: "unpaid" })}
          disabled={busy}
          className="text-[12px] font-medium text-ink-muted underline decoration-line-strong underline-offset-2 transition-colors hover:text-danger disabled:opacity-50"
        >
          Undo
        </button>
        {err && (
          <span role="alert" className="text-[12px] text-danger">
            {err}
          </span>
        )}
      </div>
    );
  }

  if (!open) {
    return (
      <div className="flex items-center gap-2">
        <Chip tone="warn">Unpaid</Chip>
        <button onClick={() => setOpen(true)} className={buttonClass("secondary", "sm", "h-7 px-2.5 text-[12px]")}>
          Mark paid
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        send({ status: "paid", method: how, ...(how === "upi" && ref.trim() ? { ref: ref.trim() } : {}) });
      }}
      className="flex flex-wrap items-center gap-1.5"
    >
      <div className="inline-flex rounded-full bg-sunken p-0.5" role="radiogroup" aria-label="How they paid">
        {(["cash", "upi"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            aria-checked={how === m}
            onClick={() => setHow(m)}
            className={cn("h-6 rounded-full px-2.5 text-[12px] font-medium transition-colors", how === m ? "bg-surface text-ink shadow-card" : "text-ink-muted")}
          >
            {m === "upi" ? "UPI" : "Cash"}
          </button>
        ))}
      </div>
      {how === "upi" && (
        <input
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          placeholder="UPI ref (optional)"
          aria-label="UPI reference (optional)"
          maxLength={35}
          className="h-7 w-36 rounded-full border border-line bg-surface px-3 font-mono text-[12px] focus:border-ink focus:outline-none"
        />
      )}
      <Button type="submit" size="sm" loading={busy} className="h-7 px-3 text-[12px]">
        Save
      </Button>
      <button type="button" onClick={() => setOpen(false)} className="px-1 text-[12px] font-medium text-ink-muted hover:text-ink">
        Cancel
      </button>
      {err && (
        <span role="alert" className="w-full text-[12px] text-danger">
          {err}
        </span>
      )}
    </form>
  );
}
