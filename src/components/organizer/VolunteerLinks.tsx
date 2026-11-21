"use client";

import { Select } from "@/components/ui/Select";

import { useState } from "react";
import { Check, Copy, Link2, MessageCircle, ScanLine, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { svgSrc } from "@/lib/svg-src";
import { relative } from "@/lib/utils";
import type { VolunteerLink } from "@/lib/volunteers";

/**
 * Hand the gate to volunteers: a link per helper, scoped to this event's scanner, that expires
 * on its own and can be turned off any time. The link is shown once, with a QR to scan.
 */
export function VolunteerLinks({ eventId, eventTitle, initial }: { eventId: string; eventTitle: string; initial: VolunteerLink[] }) {
  const [links, setLinks] = useState(initial);
  const [label, setLabel] = useState("");
  const [role, setRole] = useState<"gate" | "gate_merch">("gate");
  const [expires, setExpires] = useState<"event_end" | "12h" | "24h">("event_end");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [made, setMade] = useState<{ label: string; url: string; qrSvg: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function refresh() {
    const r = await fetch(`/api/events/${eventId}/volunteers`, { cache: "no-store" });
    if (r.ok) setLinks(((await r.json()) as { links: VolunteerLink[] }).links);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await fetch(`/api/events/${eventId}/volunteers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label.trim(), role, expires }),
    });
    const data = (await r.json().catch(() => ({}))) as { url?: string; qrSvg?: string; error?: { message?: string } };
    setBusy(false);
    if (!r.ok) return setError(data?.error?.message ?? "Couldn't create the link. Try again.");
    setMade({ label: label.trim(), url: data.url ?? "", qrSvg: data.qrSvg ?? "" });
    setLabel("");
    void refresh();
  }

  async function turnOff(id: string) {
    const r = await fetch(`/api/events/${eventId}/volunteers?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (r.ok) void refresh();
  }

  async function copy(url: string) {
    await navigator.clipboard.writeText(url).catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const now = Date.now();
  const status = (l: VolunteerLink) => (l.revoked_at ? "Turned off" : Date.parse(l.expires_at) <= now ? "Expired" : "Active");
  const seg = (on: boolean) =>
    `inline-flex h-10 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-medium transition-colors duration-fast ${on ? "bg-ink text-white" : "text-ink-2 hover:bg-sunken"}`;

  return (
    <section aria-labelledby="vol-h" className="rounded-2xl border border-line-strong bg-white">
      <div className="border-b border-line px-5 py-4">
        <h2 id="vol-h" className="text-[16px] font-semibold text-ink">
          Volunteers at the gate
        </h2>
        <p className="mt-0.5 text-[13.5px] text-ink-muted">Give each helper their own scanner link. No account needed, no revenue or settings, and it ends on its own.</p>
      </div>

      {made ? (
        <div className="grid gap-4 p-5">
          <div className="mx-auto rounded-xl bg-white p-2 ring-1 ring-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={svgSrc(made.qrSvg)} alt={`QR code that opens the scanner link for ${made.label}`} className="size-[148px]" />
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-ink">Link for {made.label} is ready</p>
            <p className="mt-1 text-[13.5px] text-ink-muted">They can scan this QR or open the link on their phone. It&apos;s shown only now, so send it before closing.</p>
            <p className="mt-3 truncate rounded-lg bg-sunken px-3 py-2 font-mono text-[12.5px] text-ink">{made.url}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="secondary" onClick={() => copy(made.url)}>
                {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
                {copied ? "Copied" : "Copy link"}
              </Button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Your gate scanner for ${eventTitle}: ${made.url}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-line-strong px-3 text-[13.5px] font-semibold text-ink transition-colors duration-fast hover:border-ink"
              >
                <MessageCircle className="size-4" aria-hidden /> Send on WhatsApp
              </a>
              <Button type="button" size="sm" variant="ghost" onClick={() => setMade(null)}>
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={create} className="space-y-3 p-5" noValidate>
          <label htmlFor="vol-name" className="block text-[13px] font-medium text-ink">
            Who&apos;s it for
          </label>
          <input
            id="vol-name"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={60}
            placeholder="Gate 2, Rohan"
            className="h-11 w-full rounded-lg border border-line-strong bg-white px-3 text-[15px] focus:border-ink focus:outline-none"
          />
          <div className="flex flex-wrap gap-3">
            <div role="radiogroup" aria-label="What they can do" className="inline-flex rounded-lg border border-line-strong bg-white p-0.5">
              <button type="button" role="radio" aria-checked={role === "gate"} onClick={() => setRole("gate")} className={seg(role === "gate")}>
                <ScanLine className="size-4" aria-hidden /> Entry only
              </button>
              <button type="button" role="radio" aria-checked={role === "gate_merch"} onClick={() => setRole("gate_merch")} className={seg(role === "gate_merch")}>
                <ShoppingBag className="size-4" aria-hidden /> Entry, merch and meals
              </button>
            </div>
            <Select
              label="Link ends"
              size="sm"
              triggerClassName="!h-11"
              value={expires}
              onChange={(v) => setExpires(v)}
              options={[
                { value: "event_end", label: "Ends after the event" },
                { value: "12h", label: "Ends in 12 hours" },
                { value: "24h", label: "Ends in 24 hours" },
              ]}
            />
          </div>
          {error && (
            <p role="alert" className="text-[13px] font-medium text-danger">
              {error}
            </p>
          )}
          <Button type="submit" loading={busy} disabled={!label.trim()}>
            <Link2 className="size-4" aria-hidden /> Create link
          </Button>
        </form>
      )}

      {links.length > 0 && (
        <ul className="border-t border-line">
          {links.map((l) => {
            const st = status(l);
            return (
              <li key={l.id} className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0">
                <span className={`size-2 shrink-0 rounded-full ${st === "Active" ? "bg-live" : "bg-line-strong"}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[14.5px] font-semibold text-ink">{l.label}</p>
                  <p className="truncate text-[12.5px] tabular-nums text-ink-muted">
                    {l.role === "gate_merch" ? "Entry, merch and meals" : "Entry only"}, {l.scans} {l.scans === 1 ? "scan" : "scans"}
                    {l.last_used_at ? `, used ${relative(new Date(l.last_used_at))}` : ", not opened yet"}
                  </p>
                </div>
                {st === "Active" ? (
                  <Button type="button" size="sm" variant="ghost" onClick={() => turnOff(l.id)}>
                    Turn off
                  </Button>
                ) : (
                  <span className="text-[12.5px] text-ink-subtle">{st}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
