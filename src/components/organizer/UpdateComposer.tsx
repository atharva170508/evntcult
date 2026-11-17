"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Notice, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/utils";

const KINDS = [
  { value: "schedule", label: "Schedule", whatsapp: true },
  { value: "venue", label: "Venue", whatsapp: true },
  { value: "update", label: "General", whatsapp: false },
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
    const res = await fetch(`/api/events/${eventId}/updates`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, body, whatsapp }) }).catch(() => null);
    const data = ((await res?.json().catch(() => ({}))) ?? {}) as { whatsapp?: { queued: number; connected: boolean }; error?: { message: string } };
    setBusy(false);
    if (!res?.ok) return setMsg({ ok: false, text: data.error?.message ?? (res ? "Couldn't post the update." : "You seem to be offline. Try again.") });
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
    <form onSubmit={submit} className="space-y-4">
      <fieldset className="grid w-full grid-cols-3 rounded-full bg-sunken p-1">
        <legend className="sr-only">Type of update</legend>
        {KINDS.map((k) => (
          <label
            key={k.value}
            className={cn(
              "cursor-pointer rounded-[10px] px-3 py-1.5 text-center text-[13px] font-medium transition-[background-color,color,box-shadow] duration-fast focus-within:ring-2 focus-within:ring-ink",
              kind === k.value ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink",
            )}
          >
            <input type="radio" name="kind" value={k.value} checked={kind === k.value} onChange={() => pickKind(k.value)} className="sr-only" />
            {k.label}
          </label>
        ))}
      </fieldset>
      <div>
        <label htmlFor={`msg-${eventId}`} className="sr-only">
          Message
        </label>
        <Textarea
          id={`msg-${eventId}`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          minLength={3}
          maxLength={500}
          rows={3}
          className="min-h-[96px]"
          placeholder={kind === "venue" ? "e.g. Moved to Hall B. Enter through Gate 3." : kind === "schedule" ? "e.g. Doors now open at 6:30 pm." : "e.g. Bring a photo ID."}
        />
        <p className="mt-1 text-right font-mono text-[11px] tabular-nums text-ink-subtle">{body.length}/500</p>
      </div>
      <label className="flex cursor-pointer items-start gap-2.5 text-[13.5px] text-ink-2">
        <input type="checkbox" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} className="mt-0.5 size-4 accent-ink" />
        <span>
          Also send on WhatsApp to the <span className="font-mono font-medium tabular-nums text-ink">{optedIn}</span> registered {optedIn === 1 ? "person" : "people"} who opted in
          {!connected && <span className="text-ink-muted"> (queued until WhatsApp is connected)</span>}
        </span>
      </label>
      {msg && <Notice tone={msg.ok ? "live" : "danger"}>{msg.text}</Notice>}
      <Button type="submit" loading={busy} disabled={body.trim().length < 3}>
        <Megaphone className="size-4" aria-hidden /> Post update
      </Button>
    </form>
  );
}
