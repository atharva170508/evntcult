"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Megaphone } from "lucide-react";

const KINDS = [
  { value: "schedule", label: "Schedule change", whatsapp: true },
  { value: "venue", label: "Venue change", whatsapp: true },
  { value: "update", label: "General info", whatsapp: false },
] as const;

/** Post an update to everyone registered. WhatsApp is ticked by default for schedule/venue changes. */
export function UpdateComposer({ eventId, optedIn, connected }: { eventId: string; optedIn: number; connected: boolean }) {
  const router = useRouter();
  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("schedule");
  const [body, setBody] = useState("");
  const [whatsapp, setWhatsapp] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function pickKind(k: (typeof KINDS)[number]["value"]) {
    setKind(k);
    setWhatsapp(KINDS.find((x) => x.value === k)!.whatsapp);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const res = await fetch(`/api/events/${eventId}/updates`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, body, whatsapp }) });
    const data = (await res.json().catch(() => ({}))) as { whatsapp?: { queued: number; connected: boolean }; error?: { message: string } };
    setBusy(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error?.message ?? "Couldn't post the update." });
    const q = data.whatsapp?.queued ?? 0;
    setMsg({
      ok: true,
      text: whatsapp
        ? `Posted. ${q} WhatsApp message${q === 1 ? "" : "s"} ${data.whatsapp?.connected ? "queued to send" : "queued (sending isn't connected yet)"}.`
        : "Posted to the event's dashboards.",
    });
    setBody("");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <fieldset className="flex flex-wrap gap-2">
        <legend className="sr-only">Type of update</legend>
        {KINDS.map((k) => (
          <label key={k.value} className={`cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${kind === k.value ? "border-ink bg-ink text-white" : "border-line hover:border-ink"}`}>
            <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => pickKind(k.value)} className="sr-only" />
            {k.label}
          </label>
        ))}
      </fieldset>
      <label className="block">
        <span className="sr-only">Message</span>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={3}
          maxLength={500}
          rows={3}
          placeholder={kind === "venue" ? "e.g. Moved to the Open Air Theatre. Enter through Gate 3." : kind === "schedule" ? "e.g. Doors now open at 6:30 pm." : "e.g. Bring your college ID."}
          className="w-full rounded-2xl border border-line bg-surface px-4 py-3 text-[14.5px] focus:border-ink focus:outline-none"
        />
      </label>
      <label className="flex items-start gap-2.5 text-[13.5px]">
        <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} className="mt-0.5 size-4 accent-[#0b0b0f]" />
        <span>
          Also send on WhatsApp to the <b className="font-mono tabular-nums">{optedIn}</b> registered student{optedIn === 1 ? "" : "s"} who opted in
          {!connected && <span className="text-ink-muted"> (queued until WhatsApp is connected)</span>}
        </span>
      </label>
      {msg && <p role="status" className={`rounded-2xl px-3.5 py-2.5 text-[13px] font-semibold ${msg.ok ? "bg-live-soft text-live" : "bg-danger-soft text-danger"}`}>{msg.text}</p>}
      <button disabled={busy || body.trim().length < 3} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50">
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Megaphone className="size-4" />} Post update
      </button>
    </form>
  );
}
