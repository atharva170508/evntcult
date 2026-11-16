"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Notice, Select, Textarea } from "@/components/ui/Field";
import { cn } from "@/lib/utils";
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
    }).catch(() => null);
    if (!res) {
      setBusy(false);
      setError({ code: "offline", message: "You seem to be offline. Your changes are still here; try again." });
      return;
    }
    const data = (await res.json().catch(() => ({}))) as { event?: { slug: string }; error?: { code: string; message: string } };
    setBusy(false);
    if (!res.ok || !data.event) {
      setError(data.error ?? { code: "error", message: "Couldn't save. Try again." });
      return;
    }
    router.push(`/events/${data.event.slug}`);
    router.refresh();
  }

  const primaryLabel = mode === "create" || v.status !== "published" ? "Publish event" : "Save changes";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save(true);
      }}
      className="space-y-6"
    >
      <FormSection title="Basics" sub="What people see first.">
        <Field label="Event name">
          {(a) => <Input {...a} required minLength={3} maxLength={120} value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="Neon Night 2026" />}
        </Field>
        <Field label="Description" optional hint="The first line becomes the tagline on posters and cards.">
          {(a) => <Textarea {...a} rows={5} maxLength={5000} value={v.description} onChange={(e) => set("description", e.target.value)} />}
        </Field>
        <Field label="Type">
          {(a) => (
            <Select {...a} value={v.category} onChange={(e) => set("category", e.target.value)}>
              {CATS.map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </FormSection>

      <FormSection title="When & where" sub="Times are in IST. Publishing checks the venue for clashes.">
        <Field label="Venue">
          {(a) => (
            <Select {...a} value={v.venue} onChange={(e) => set("venue", e.target.value)}>
              {VENUES.map((x) => (
                <option key={x.name} value={x.name}>
                  {x.name} (fits {x.capacity})
                </option>
              ))}
            </Select>
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Date">{(a) => <Input {...a} type="date" required value={v.date} onChange={(e) => set("date", e.target.value)} className="font-mono" />}</Field>
          <Field label="Starts">{(a) => <Input {...a} type="time" required value={v.startTime} onChange={(e) => set("startTime", e.target.value)} className="font-mono" />}</Field>
          <Field label="Ends">{(a) => <Input {...a} type="time" required value={v.endTime} onChange={(e) => set("endTime", e.target.value)} className="font-mono" />}</Field>
        </div>
      </FormSection>

      <FormSection title="Tickets" sub="Capacity, entry fee and who can join.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Capacity" hint={mode === "edit" && minCapacity > 1 ? `At least ${minCapacity} (seats already taken)` : undefined}>
            {(a) => <Input {...a} type="number" required min={minCapacity} max={100000} value={v.capacity} onChange={(e) => set("capacity", Number(e.target.value))} className="font-mono" />}
          </Field>
          <Field label="Entry fee (₹)" hint="0 means free. Fees are collected at the desk.">
            {(a) => <Input {...a} type="number" min={0} step="1" value={v.priceRupees} onChange={(e) => set("priceRupees", Number(e.target.value))} className="font-mono" />}
          </Field>
        </div>
        <fieldset>
          <legend className="text-[13px] font-medium text-ink">Who can join</legend>
          <div className="mt-1.5 grid gap-2 sm:grid-cols-2">
            {(
              [
                ["public", "Everyone", "Listed on Discover and the calendar."],
                ["code", "Private", "Hidden. People join with a 7-character code."],
              ] as const
            ).map(([val, title, body]) => (
              <label
                key={val}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-tile p-3.5 transition-[box-shadow,background-color] duration-fast",
                  v.access === val ? "bg-surface shadow-[0_0_0_1.5px_theme(colors.ink.DEFAULT)]" : "bg-sunken/60 hover:bg-sunken",
                )}
              >
                <input type="radio" name="access" value={val} checked={v.access === val} onChange={() => set("access", val)} className="mt-0.5 size-4 accent-ink" />
                <span>
                  <span className="block text-[14px] font-medium">{title}</span>
                  <span className="block text-[12.5px] text-ink-muted">{body}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      </FormSection>

      {error && (
        <Notice tone={error.code === "soft_clash" ? "warn" : "danger"} icon={AlertTriangle}>
          <p>{error.message}</p>
          {error.code === "soft_clash" && (
            <label className="mt-2 flex cursor-pointer items-center gap-2 font-normal text-ink-2">
              <input type="checkbox" checked={ackSoft} onChange={(e) => setAckSoft(e.target.checked)} className="size-4 accent-ink" /> Publish anyway
            </label>
          )}
        </Notice>
      )}

      <div className="sticky bottom-16 z-10 -mx-1 flex flex-wrap items-center gap-2 rounded-full bg-canvas/85 p-1 backdrop-blur-xl md:bottom-4">
        <Button type="submit" size="lg" loading={busy}>
          {primaryLabel}
        </Button>
        {(mode === "create" || v.status === "draft") && (
          <Button type="button" variant="secondary" size="lg" disabled={busy} onClick={() => save(false)}>
            Save as draft
          </Button>
        )}
      </div>
    </form>
  );
}

function FormSection({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <section className="card grid gap-6 p-5 md:grid-cols-[200px_1fr] md:p-7">
      <div>
        <h2 className="text-h4 font-semibold">{title}</h2>
        <p className="mt-1 text-[13px] text-ink-muted">{sub}</p>
      </div>
      <div className="min-w-0 space-y-4">{children}</div>
    </section>
  );
}
