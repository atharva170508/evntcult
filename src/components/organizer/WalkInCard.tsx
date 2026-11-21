"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";

/** Add someone who turned up without registering: they're registered and checked in at once. */
export function WalkInCard({ eventId, count }: { eventId: string; count: number }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return setMsg({ ok: false, text: "Add their name." });
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/events/${eventId}/walk-ins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim() || null }),
    }).catch(() => null);
    setBusy(false);
    const data = (await res?.json().catch(() => ({}))) as { alreadyIn?: boolean; error?: { message: string } } | undefined;
    if (!res?.ok) return setMsg({ ok: false, text: data?.error?.message ?? "Couldn't reach the server. Try again." });
    setMsg({ ok: true, text: data?.alreadyIn ? `${name.trim()} was already checked in.` : `${name.trim()} is in.` });
    setName("");
    setEmail("");
    router.refresh();
  }

  return (
    <section aria-labelledby="walkin-h" className="rounded-2xl border border-line-strong bg-white">
      <div className="border-b border-line px-5 py-4">
        <h2 id="walkin-h" className="text-[16px] font-semibold text-ink">
          Walk-ins
        </h2>
        <p className="mt-0.5 text-[13.5px] text-ink-muted">
          {count ? `${count} added at the door so far. ` : ""}Turned up without registering? Add them and they&apos;re checked in.
        </p>
      </div>
      <form onSubmit={add} className="space-y-2.5 px-5 py-4">
        <label className="block">
          <span className="sr-only">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder="Name" className="field h-11 w-full" autoComplete="off" />
        </label>
        <label className="block">
          <span className="sr-only">Email (optional)</span>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" maxLength={200} placeholder="Email, optional, links their account" className="field h-11 w-full" autoComplete="off" />
        </label>
        <button type="submit" disabled={busy} className="ui-press ui-sheen relative inline-flex h-11 w-full items-center justify-center gap-2 rounded-[12px] bg-ink text-[14.5px] font-semibold text-white hover:bg-black disabled:opacity-60">
          <UserPlus className="size-4" aria-hidden /> {busy ? "Adding…" : "Add and check in"}
        </button>
        {msg && (
          <p role="status" className={`text-[13.5px] ${msg.ok ? "text-ink-2" : "text-danger"}`}>
            {msg.text}
          </p>
        )}
      </form>
    </section>
  );
}
