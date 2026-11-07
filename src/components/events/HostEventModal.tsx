"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Clock,
  FolderOpen,
  ImagePlus,
  IndianRupee,
  Loader2,
  MapPin,
  Sparkles,
  Ticket,
  Users,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VENUES } from "@/lib/venues";

/**
 * "Host an Event": one screen, no wizard (Luma / Partiful style).
 * Saves through POST /api/events/create into the same events table as everything else,
 * so passes, registration, the gate scanner and Face Search all work with it.
 */

const CATS = [
  ["PARTY", "Party"],
  ["CULTURAL", "Cultural"],
  ["TECH", "Tech"],
  ["GAMING", "Gaming"],
  ["SPORTS", "Sports"],
  ["WORKSHOP", "Workshop"],
  ["TALK", "Talk"],
] as const;

const DURATIONS = [
  [60, "1 h"],
  [120, "2 h"],
  [180, "3 h"],
  [240, "4 h"],
  [360, "6 h"],
  [720, "All night"],
] as const;

type Form = {
  title: string;
  tagline: string;
  category: string;
  date: string;
  time: string;
  durationMinutes: number;
  eventType: "in_person" | "virtual";
  venue: string;
  meetingUrl: string;
  isFree: boolean;
  ticketPrice: string;
  upiId: string;
  capacity: string;
  driveFolderUrl: string;
  bannerUrl: string;
};

const todayIst = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

const EMPTY: Form = {
  title: "",
  tagline: "",
  category: "PARTY",
  date: "",
  time: "18:00",
  durationMinutes: 120,
  eventType: "in_person",
  venue: "",
  meetingUrl: "",
  isFree: true,
  ticketPrice: "",
  upiId: "",
  capacity: "",
  driveFolderUrl: "",
  bannerUrl: "",
};

const input =
  "w-full rounded-2xl border border-line bg-canvas/60 px-4 py-3 text-[15px] text-ink placeholder:text-ink-subtle transition-colors focus:border-volt focus:outline-none";
const cardCls = "rounded-3xl border border-line bg-surface/70 p-4";

export type HostEventResult = { eventId: string; slug: string };

export function HostEventModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (r: HostEventResult) => void }) {
  const [f, setF] = useState<Form>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [softClash, setSoftClash] = useState<string | null>(null);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [bannerBroken, setBannerBroken] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const headingId = useId();
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((p) => ({ ...p, [k]: v }));

  // Open: reset, focus the title, lock page scroll, Esc closes.
  useEffect(() => {
    if (!open) return;
    setF({ ...EMPTY, date: todayIst() });
    setError(null);
    setSoftClash(null);
    setBannerOpen(false);
    const t = setTimeout(() => titleRef.current?.focus(), 50);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  async function publish(acknowledgeSoftClashes = false) {
    setBusy(true);
    setError(null);
    const body = {
      title: f.title,
      tagline: f.tagline || undefined,
      category: f.category,
      date: f.date,
      time: f.time,
      durationMinutes: f.durationMinutes,
      eventType: f.eventType,
      location: f.eventType === "virtual" ? f.meetingUrl : f.venue,
      isFree: f.isFree,
      ticketPrice: f.isFree ? undefined : Number(f.ticketPrice) || undefined,
      upiId: f.isFree ? undefined : f.upiId || undefined,
      capacity: f.capacity ? Number(f.capacity) : null,
      driveFolderUrl: f.driveFolderUrl || undefined,
      bannerUrl: f.bannerUrl && !bannerBroken ? f.bannerUrl : undefined,
      acknowledgeSoftClashes,
    };
    try {
      const res = await fetch("/api/events/create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as { success?: boolean; eventId?: string; slug?: string; error?: { code: string; message: string } };
      if (res.ok && data.slug && data.eventId) {
        onCreated({ eventId: data.eventId, slug: data.slug });
        return;
      }
      const code = data.error?.code;
      if (code === "soft_clash") {
        setSoftClash(data.error!.message.replace(/ Tick "publish anyway" to continue\.$/, ""));
      } else if (code === "unauthenticated") {
        setError("Log in first to host an event.");
      } else if (code === "forbidden") {
        setError("Only verified organizers can host events right now. Ask your club lead or an admin to verify your account.");
      } else {
        // zod messages arrive as "field: message"; show just the message.
        setError((data.error?.message ?? "Couldn't publish. Try again.").replace(/^[a-zA-Z]+: /, ""));
      }
    } catch {
      setError("You're offline. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = f.title.trim().length >= 3 && f.date && f.time && (f.eventType === "virtual" ? f.meetingUrl.trim() : f.venue.trim());

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6" role="presentation">
      <button aria-label="Close" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !busy && onClose()} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative flex max-h-[94dvh] w-full max-w-[600px] animate-fade-up flex-col overflow-hidden rounded-t-[32px] border border-white/10 bg-surface shadow-pop sm:rounded-[32px]"
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4 sm:px-6">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-volt/30 bg-volt/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-volt">
              <Sparkles className="size-3" aria-hidden /> EvntCult Studio
            </span>
            <h2 id={headingId} className="mt-2 text-[22px] font-bold leading-none tracking-tight text-ink">
              Create an event
            </h2>
          </div>
          <button onClick={onClose} disabled={busy} aria-label="Close" className="grid size-10 place-items-center rounded-full border border-line text-ink-2 transition-colors hover:border-ink hover:text-ink">
            <X className="size-[18px]" />
          </button>
        </div>

        <form
          className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6"
          onSubmit={(e) => {
            e.preventDefault();
            if (canSubmit && !busy) publish(false);
          }}
        >
          {/* Banner */}
          <div className={cn("relative overflow-hidden rounded-3xl border border-dashed border-line-strong bg-canvas/60", f.bannerUrl && !bannerBroken ? "h-40" : "")}>
            {f.bannerUrl && !bannerBroken ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.bannerUrl} alt="" className="absolute inset-0 size-full object-cover" onError={() => setBannerBroken(true)} />
                <button type="button" onClick={() => set("bannerUrl", "")} className="absolute right-3 top-3 rounded-full bg-black/60 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur">
                  Remove
                </button>
              </>
            ) : bannerOpen ? (
              <div className="space-y-2 p-4">
                <label className="text-[13px] font-semibold text-ink-2" htmlFor="banner">Banner image link</label>
                <input
                  id="banner"
                  autoFocus
                  className={input}
                  placeholder="https://…/poster.jpg"
                  value={f.bannerUrl}
                  onChange={(e) => {
                    setBannerBroken(false);
                    set("bannerUrl", e.target.value.trim());
                  }}
                />
                {bannerBroken && <p className="text-[12.5px] text-danger">That link isn&apos;t an image we can show. Try a direct image link.</p>}
                <p className="text-[12px] text-ink-subtle">Paste a link to a poster or photo. File upload comes later.</p>
              </div>
            ) : (
              <button type="button" onClick={() => setBannerOpen(true)} className="flex w-full flex-col items-center justify-center gap-1.5 py-7 text-ink-muted transition-colors hover:text-ink">
                <ImagePlus className="size-6" aria-hidden />
                <span className="text-[14px] font-semibold">Add a banner</span>
                <span className="text-[12px] text-ink-subtle">Optional</span>
              </button>
            )}
          </div>

          {/* Title + tagline */}
          <div>
            <input
              ref={titleRef}
              aria-label="Event title"
              className="w-full bg-transparent text-[28px] font-bold leading-tight tracking-tight text-ink placeholder:text-ink-subtle focus:outline-none"
              placeholder="Event name"
              maxLength={120}
              value={f.title}
              onChange={(e) => set("title", e.target.value)}
            />
            <input
              aria-label="Tagline"
              className="mt-1 w-full bg-transparent text-[15px] text-ink-2 placeholder:text-ink-subtle focus:outline-none"
              placeholder="One line that makes people want to come (optional)"
              maxLength={140}
              value={f.tagline}
              onChange={(e) => set("tagline", e.target.value)}
            />
          </div>

          {/* Category */}
          <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1" role="radiogroup" aria-label="Event type">
            {CATS.map(([v, l]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={f.category === v}
                onClick={() => set("category", v)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
                  f.category === v ? "border-volt bg-volt text-ink-inverse" : "border-line text-ink-2 hover:border-ink",
                )}
              >
                {l}
              </button>
            ))}
          </div>

          {/* Date / time / length */}
          <div className="grid grid-cols-2 gap-2.5">
            <label className="relative block">
              <span className="sr-only">Date</span>
              <CalendarDays className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-subtle" aria-hidden />
              <input type="date" required min={todayIst()} className={cn(input, "pl-11 [color-scheme:dark]")} value={f.date} onChange={(e) => set("date", e.target.value)} />
            </label>
            <label className="relative block">
              <span className="sr-only">Start time</span>
              <Clock className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-subtle" aria-hidden />
              <input type="time" required className={cn(input, "pl-11 [color-scheme:dark]")} value={f.time} onChange={(e) => set("time", e.target.value)} />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[12.5px] font-semibold text-ink-muted">Runs for</span>
            {DURATIONS.map(([m, l]) => (
              <button
                key={m}
                type="button"
                onClick={() => set("durationMinutes", m)}
                aria-pressed={f.durationMinutes === m}
                className={cn("rounded-full border px-3 py-1 text-[12.5px] font-semibold transition-colors", f.durationMinutes === m ? "border-ink bg-ink text-ink-inverse" : "border-line text-ink-2 hover:border-ink")}
              >
                {l}
              </button>
            ))}
            <span className="ml-auto text-[11.5px] text-ink-subtle">IST</span>
          </div>

          {/* Location */}
          <div className={cardCls}>
            <div className="inline-flex rounded-full border border-line bg-canvas/60 p-1" role="radiogroup" aria-label="Where">
              {(
                [
                  ["in_person", "In person", MapPin],
                  ["virtual", "Virtual", Video],
                ] as const
              ).map(([v, l, Icon]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={f.eventType === v}
                  onClick={() => set("eventType", v)}
                  className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13.5px] font-semibold transition-colors", f.eventType === v ? "bg-ink text-ink-inverse" : "text-ink-2 hover:text-ink")}
                >
                  <Icon className="size-4" aria-hidden /> {l}
                </button>
              ))}
            </div>
            <div className="relative mt-3">
              {f.eventType === "in_person" ? (
                <>
                  <MapPin className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-subtle" aria-hidden />
                  <input aria-label="Venue" list="host-venues" className={cn(input, "pl-11")} placeholder="Venue, e.g. Seminar Hall 2" maxLength={120} value={f.venue} onChange={(e) => set("venue", e.target.value)} />
                  <datalist id="host-venues">
                    {VENUES.map((v) => (
                      <option key={v.name} value={v.name} />
                    ))}
                  </datalist>
                </>
              ) : (
                <>
                  <Video className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-subtle" aria-hidden />
                  <input aria-label="Meeting link" inputMode="url" className={cn(input, "pl-11")} placeholder="https://meet.google.com/…" value={f.meetingUrl} onChange={(e) => set("meetingUrl", e.target.value.trim())} />
                </>
              )}
            </div>
            {f.eventType === "virtual" && <p className="mt-2 text-[12px] text-ink-subtle">Only people with a pass see the link.</p>}
          </div>

          {/* Tickets */}
          <div className={cardCls}>
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-[14px] font-bold text-ink">
                <Ticket className="size-[18px] text-volt" aria-hidden /> Tickets &amp; access
              </p>
              <div className="inline-flex rounded-full border border-line bg-canvas/60 p-1" role="radiogroup" aria-label="Ticket type">
                {(
                  [
                    [true, "Free RSVP"],
                    [false, "Paid pass"],
                  ] as const
                ).map(([free, l]) => (
                  <button
                    key={l}
                    type="button"
                    role="radio"
                    aria-checked={f.isFree === free}
                    onClick={() => set("isFree", free)}
                    className={cn("rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors", f.isFree === free ? "bg-volt text-ink-inverse" : "text-ink-2 hover:text-ink")}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Paid fields slide open */}
            <div className={cn("grid transition-[grid-template-rows,opacity] duration-300 ease-apple", f.isFree ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100")} aria-hidden={f.isFree}>
              <div className="overflow-hidden">
                <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2.5 pt-3">
                  <label className="relative block">
                    <span className="sr-only">Ticket price in rupees</span>
                    <IndianRupee className="pointer-events-none absolute left-3.5 top-1/2 size-[16px] -translate-y-1/2 text-ink-subtle" aria-hidden />
                    <input tabIndex={f.isFree ? -1 : 0} inputMode="decimal" className={cn(input, "pl-10")} placeholder="Price" value={f.ticketPrice} onChange={(e) => set("ticketPrice", e.target.value.replace(/[^\d.]/g, ""))} />
                  </label>
                  <label className="block">
                    <span className="sr-only">Your UPI ID</span>
                    <input tabIndex={f.isFree ? -1 : 0} className={input} placeholder="name@bank" autoCapitalize="none" value={f.upiId} onChange={(e) => set("upiId", e.target.value.trim())} />
                  </label>
                </div>
                <span className="mt-2 inline-flex rounded-full bg-live-soft px-2.5 py-1 text-[11.5px] font-semibold text-live">100% direct payouts to your bank account.</span>
              </div>
            </div>

            <label className="relative mt-3 block">
              <span className="sr-only">Max capacity</span>
              <Users className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-subtle" aria-hidden />
              <input inputMode="numeric" className={cn(input, "pl-11")} placeholder="Capacity: unlimited" value={f.capacity} onChange={(e) => set("capacity", e.target.value.replace(/\D/g, "").slice(0, 6))} />
            </label>
          </div>

          {/* AI Photo Vault */}
          <div className="rounded-3xl border border-volt/25 bg-volt/[0.06] p-4">
            <p className="flex items-center gap-2 text-[14px] font-bold text-ink">
              <FolderOpen className="size-[18px] text-volt" aria-hidden /> AI Photo Vault
              <span className="rounded-full bg-volt/15 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wider text-volt">Optional</span>
            </p>
            <input
              aria-label="Public Google Drive folder link"
              inputMode="url"
              className={cn(input, "mt-3")}
              placeholder="https://drive.google.com/drive/folders/…"
              value={f.driveFolderUrl}
              onChange={(e) => set("driveFolderUrl", e.target.value.trim())}
            />
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-muted">
              Attendees will instantly find their event photos via AI facial recognition. Share the folder as &ldquo;Anyone with the link can view&rdquo;. You can add it after the event too.
            </p>
          </div>

          {softClash && (
            <div role="alert" className="flex gap-3 rounded-2xl bg-warn-soft p-3.5 text-[13.5px] text-ink-2">
              <AlertTriangle className="mt-0.5 size-[18px] shrink-0 text-warn" aria-hidden />
              <div>
                <p className="font-semibold text-ink">{softClash}</p>
                <button type="button" disabled={busy} onClick={() => publish(true)} className="mt-2 rounded-full border border-warn/50 px-3.5 py-1.5 text-[12.5px] font-bold text-warn hover:bg-warn/10">
                  Publish anyway
                </button>
              </div>
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-2xl bg-danger-soft px-3.5 py-3 text-[13.5px] font-semibold text-danger">
              {error}
            </p>
          )}
          {/* Lets Enter submit from any field. */}
          <button type="submit" hidden aria-hidden tabIndex={-1} />
        </form>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-line bg-surface px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} disabled={busy} className="rounded-full border border-line px-5 py-3 text-[14px] font-semibold text-ink-2 transition-colors hover:border-ink hover:text-ink">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => publish(false)}
            disabled={!canSubmit || busy}
            className="inline-flex items-center gap-2 rounded-full bg-volt px-6 py-3 text-[14px] font-bold text-ink-inverse transition-colors hover:bg-volt-hover disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy && <Loader2 className="size-4 animate-spin" aria-hidden />}
            {busy ? "Publishing…" : "Publish event"}
          </button>
        </div>
      </div>
    </div>
  );
}
