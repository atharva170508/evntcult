"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
          <label key={k.value} className={`flex h-8 cursor-pointer items-center rounded-sm border px-3 text-label ${kind === k.value ? "border-line-strong bg-surface-2 font-semibold text-ink" : "border-line text-ink-muted hover:border-line-strong"}`}>
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
          placeholder={kind === "venue" ? "e.g. Moved to Hall B. Enter through Gate 3." : kind === "schedule" ? "e.g. Doors now open at 6:30 pm." : "e.g. Bring a photo ID."}
          className="min-h-24 w-full rounded-sm border border-line-strong bg-surface px-3 py-2 text-body text-ink placeholder:text-ink-subtle"
        />
      </label>
      <label className="flex items-start gap-3 text-body-sm">
        <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} className="mt-0.5 size-4 accent-[var(--accent)]" />
        <span>
          Also send on WhatsApp to the <b className="font-mono tabular-nums">{optedIn}</b> registered {optedIn === 1 ? "person" : "people"} who opted in
          {!connected && <span className="text-ink-muted"> (queued until WhatsApp is connected)</span>}
        </span>
      </label>
      {msg && <p role="status" className={`border-l-2 pl-3 text-body-sm ${msg.ok ? "border-ok" : "border-bad"}`}>{msg.text}</p>}
      <button disabled={busy || body.trim().length < 3} className="press inline-flex items-center gap-2 rounded-md bg-accent px-6 h-10 text-body font-semibold text-ink-inverse disabled:opacity-50 hover:bg-[color-mix(in_srgb,var(--accent)_90%,var(--text))]">
        Post update
      </button>
    </form>
  );
}
