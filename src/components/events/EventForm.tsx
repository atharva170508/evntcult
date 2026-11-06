"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { VENUES } from "@/lib/venues";

const CATS = [
  ["GAMING", "Gaming"],
  ["SPORTS", "Sports"],
  ["TECH", "Tech"],
  ["CULTURAL", "Cultural"],
  ["WORKSHOP", "Workshop"],
  ["TALK", "Talk"],
  ["PARTY", "Party"],
] as const;

export interface EventFormValues {
  title: string;
  description: string;
  category: string;
  venue: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  priceRupees: number;
  access: "public" | "code";
  status: string;
}

const field = "mt-1.5 w-full rounded-2xl border border-line bg-surface px-4 py-3 text-[15px] focus:border-brand focus:outline-none";
const label = "text-[13px] font-semibold text-ink-2";

/** Create or edit an event. Times are typed in IST. */
export function EventForm({ mode, eventId, initial, minCapacity = 1 }: { mode: "create" | "edit"; eventId?: string; initial?: EventFormValues; minCapacity?: number }) {
  const router = useRouter();
  const [v, setV] = useState<EventFormValues>(
    initial ?? { title: "", description: "", category: "GAMING", venue: VENUES[0].name, date: "", startTime: "18:00", endTime: "20:00", capacity: 100, priceRupees: 0, access: "public", status: "draft" },
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [ackSoft, setAckSoft] = useState(false);
  const set = <K extends keyof EventFormValues>(k: K, val: EventFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  async function save(publish: boolean) {
    setBusy(true);
    setError(null);
    const body = {
      title: v.title,
      description: v.description || undefined,
      category: v.category,
      venue: v.venue,
      date: v.date,
      startTime: v.startTime,
      endTime: v.endTime,
      capacity: Number(v.capacity),
      pricePaise: Math.round(Number(v.priceRupees) * 100),
      access: v.access,
      acknowledgeSoftClashes: ackSoft,
      ...(mode === "create" ? { publish } : { status: publish ? "published" : v.status === "published" ? "published" : "draft" }),
    };
    const res = await fetch(mode === "create" ? "/api/events" : `/api/events/${eventId}`, {
      method: mode === "create" ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as { event?: { slug: string }; error?: { code: string; message: string } };
    setBusy(false);
    if (!res.ok || !data.event) {
      setError(data.error ?? { code: "error", message: "Couldn't save. Try again." });
      return;
    }
    router.push(`/events/${data.event.slug}`);
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(true);
      }}
      className="card space-y-4 p-6 md:p-8"
    >
      <label className="block">
        <span className={label}>Event name</span>
        <input required minLength={3} maxLength={120} value={v.title} onChange={(e) => set("title", e.target.value)} className={field} />
      </label>
      <label className="block">
        <span className={label}>Description <span className="font-normal text-ink-subtle">(first line is the tagline)</span></span>
        <textarea rows={4} maxLength={5000} value={v.description} onChange={(e) => set("description", e.target.value)} className={field} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>Type</span>
          <select value={v.category} onChange={(e) => set("category", e.target.value)} className={field}>
            {CATS.map(([k, l]) => (
              <option key={k} value={k}>{l}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={label}>Venue</span>
          <select value={v.venue} onChange={(e) => set("venue", e.target.value)} className={field}>
            {VENUES.map((x) => (
              <option key={x.name} value={x.name}>{x.name} (fits {x.capacity})</option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={label}>Date</span>
          <input type="date" required value={v.date} onChange={(e) => set("date", e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className={label}>Starts (IST)</span>
          <input type="time" required value={v.startTime} onChange={(e) => set("startTime", e.target.value)} className={field} />
        </label>
        <label className="block">
          <span className={label}>Ends (IST)</span>
          <input type="time" required value={v.endTime} onChange={(e) => set("endTime", e.target.value)} className={field} />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className={label}>Capacity</span>
          <input type="number" required min={minCapacity} max={100000} value={v.capacity} onChange={(e) => set("capacity", Number(e.target.value))} className={`${field} font-mono`} />
          {mode === "edit" && minCapacity > 1 && <span className="mt-1 block text-[12px] text-ink-subtle">At least {minCapacity} (seats already taken)</span>}
        </label>
        <label className="block">
          <span className={label}>Entry fee (₹, 0 = free)</span>
          <input type="number" min={0} step="1" value={v.priceRupees} onChange={(e) => set("priceRupees", Number(e.target.value))} className={`${field} font-mono`} />
        </label>
        <label className="block">
          <span className={label}>Who can join</span>
          <select value={v.access} onChange={(e) => set("access", e.target.value as "public" | "code")} className={field}>
            <option value="public">Everyone (public)</option>
            <option value="code">Private · 7-character code</option>
          </select>
        </label>
      </div>

      {error && (
        <div role="alert" className={`rounded-2xl p-3.5 text-[13.5px] font-semibold ${error.code === "soft_clash" ? "bg-warn-soft text-warn" : "bg-danger-soft text-danger"}`}>
          <p className="flex items-start gap-2"><AlertTriangle className="mt-0.5 size-4 shrink-0" /> {error.message}</p>
          {error.code === "soft_clash" && (
            <label className="mt-2 flex items-center gap-2 text-ink-2">
              <input type="checkbox" checked={ackSoft} onChange={(e) => setAckSoft(e.target.checked)} /> Publish anyway
            </label>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <button disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-[14px] font-semibold text-white disabled:opacity-50">
          {busy && <Loader2 className="size-4 animate-spin" />} {mode === "create" || v.status !== "published" ? "Publish" : "Save changes"}
        </button>
        {(mode === "create" || v.status === "draft") && (
          <button type="button" disabled={busy} onClick={() => save(false)} className="rounded-full border border-line px-5 py-3 text-[14px] font-semibold hover:border-ink disabled:opacity-50">
            Save as draft
          </button>
        )}
      </div>
    </form>
  );
}
