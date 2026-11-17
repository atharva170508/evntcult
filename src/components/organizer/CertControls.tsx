"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

async function send(url: string, body: object = {}) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as { error?: { message: string }; issued?: number };
  return { ok: res.ok, data, error: res.ok ? null : (data.error?.message ?? "That didn't work.") };
}

/** The one bulk button, and the switch for issuing automatically at the gate. */
export function CertPanel({ eventId, issued, checkedIn, enabled }: { eventId: string; issued: number; checkedIn: number; enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function run(url: string, body?: object) {
    setBusy(true);
    const r = await send(url, body);
    setBusy(false);
    setNote(r.error ?? (r.data.issued !== undefined ? `${r.data.issued} issued` : null));
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-[14px]"><b className="font-mono font-medium tabular-nums">{issued}</b> issued · <span className="font-mono tabular-nums">{checkedIn}</span> checked in</span>
      <button disabled={busy} onClick={() => run(`/api/events/${eventId}/certificates/issue`)} className="inline-flex h-8 items-center rounded-full bg-ink px-3.5 text-[13px] font-medium text-white shadow-button transition-colors hover:bg-[#2a2a28] disabled:opacity-50">
        Issue certificates
      </button>
      <label className="flex items-center gap-2 text-[13px]">
        <input type="checkbox" checked={enabled} disabled={busy} onChange={(e) => run(`/api/events/${eventId}/certificates`, { enabled: e.target.checked })} className="size-4 accent-ink" />
        Issue at check-in
      </label>
      {note && <span role="status" className="text-[13px] text-ink-muted">{note}</span>}
    </div>
  );
}

const SPECIAL = [["winner", "Winner"], ["volunteer", "Volunteer"], ["speaker", "Speaker"]] as const;

/** One attendee: their certificates, add a special one, withdraw one, or undo a mistaken check-in. */
export function AttendeeCert({ regId, certs }: { regId: string; certs: { id: string; kind: string }[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(url: string, body?: object) {
    setBusy(true);
    const r = await send(url, body);
    setBusy(false);
    setErr(r.error);
    if (r.ok) router.refresh();
  }
  const missing = SPECIAL.filter(([k]) => !certs.some((c) => c.kind === k));

  return (
    <div className="flex flex-wrap items-center gap-2 text-[12px]">
      {certs.map((c) => (
        <span key={c.id} className="inline-flex h-6 items-center gap-1.5 rounded-full bg-sunken px-2.5 capitalize text-ink-2">
          {c.kind}
          <button disabled={busy} aria-label={`Revoke ${c.kind} certificate`} onClick={() => confirm(`Revoke this ${c.kind} certificate?`) && run(`/api/certificates/${c.id}/revoke`)} className="font-medium text-ink-muted hover:text-danger">×</button>
        </span>
      ))}
      {missing.length > 0 && (
        <select
          aria-label="Add a certificate"
          value=""
          disabled={busy}
          onChange={(e) => e.target.value && run(`/api/registrations/${regId}/certificate`, { kind: e.target.value })}
          className="h-6 rounded-full bg-surface px-2 text-[12px] shadow-card"
        >
          <option value="">Add</option>
          {missing.map(([k, l]) => (
            <option key={k} value={k}>{l}</option>
          ))}
        </select>
      )}
      <button disabled={busy} onClick={() => confirm("Undo this check-in? Their attendance certificate is withdrawn.") && run(`/api/registrations/${regId}/undo-checkin`)} className="font-medium text-ink-muted underline decoration-line-strong underline-offset-2 hover:text-danger">
        Undo check-in
      </button>
      {err && <span role="alert" className="w-full text-danger">{err}</span>}
    </div>
  );
}
