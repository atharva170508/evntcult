"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { AnimatePresence, m } from "motion/react";

interface Req {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

/** Host approval: people asking to join, with Approve (issues their pass) and Decline. */
export function RequestsCard({ eventId, initial }: { eventId: string; initial: Req[] }) {
  const router = useRouter();
  const [list, setList] = useState(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function decide(id: string, action: "approve" | "decline") {
    setBusy(id);
    setMsg(null);
    const res = await fetch(`/api/events/${eventId}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ registrationId: id, action }),
    }).catch(() => null);
    setBusy(null);
    const data = (await res?.json().catch(() => ({}))) as { error?: { message: string } } | undefined;
    if (!res?.ok) return setMsg(data?.error?.message ?? "Couldn't reach the server. Try again.");
    const who = list.find((r) => r.id === id)?.name ?? "Guest";
    setList((l) => l.filter((r) => r.id !== id));
    setMsg(action === "approve" ? `${who} is in. Their pass is ready.` : `Declined ${who}.`);
    router.refresh();
  }

  return (
    <section aria-labelledby="requests-h" className="rounded-2xl border border-line-strong bg-white">
      <div className="border-b border-line px-5 py-4">
        <h2 id="requests-h" className="text-[16px] font-semibold text-ink">
          Requests to join
        </h2>
        <p className="mt-0.5 text-[13.5px] text-ink-muted">
          {list.length ? `${list.length} waiting. Approving issues their pass.` : "No requests waiting. New ones appear here."}
        </p>
      </div>
      {list.length > 0 && (
        <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
          <AnimatePresence initial={false}>
          {list.map((r) => (
            <m.li
              key={r.id}
              layout
              exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } }}
              className="flex items-center gap-3 overflow-hidden px-5 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14.5px] font-semibold text-ink">{r.name}</p>
                <p className="truncate text-[12.5px] text-ink-muted">{r.email}</p>
              </div>
              <button
                type="button"
                aria-label={`Decline ${r.name}`}
                disabled={busy === r.id}
                onClick={() => decide(r.id, "decline")}
                className="ui-press grid size-9 place-items-center rounded-[10px] text-ink-muted ring-1 ring-inset ring-line-strong hover:bg-danger-soft hover:text-danger disabled:opacity-50"
              >
                <X className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                disabled={busy === r.id}
                onClick={() => decide(r.id, "approve")}
                className="ui-press inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-ink px-3 text-[13.5px] font-semibold text-white hover:bg-black disabled:opacity-50"
              >
                <Check className="size-4" strokeWidth={2.6} aria-hidden /> Approve
              </button>
            </m.li>
          ))}
          </AnimatePresence>
        </ul>
      )}
      {msg && (
        <p role="status" className="border-t border-line px-5 py-3 text-[13.5px] text-ink-2">
          {msg}
        </p>
      )}
    </section>
  );
}
