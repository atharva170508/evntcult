"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  Clock,
  ExternalLink,
  KeyRound,
  MapPin,
  SlidersHorizontal,
  Ticket as TicketIcon,
  Users,
} from "lucide-react";
import { Ticket } from "./Ticket";
import {
  Odometer,
  Segmented,
  Toast,
  apiJson,
  type ToastState,
} from "./primitives";
import { MoreSheet } from "./MoreSheet";
import { DatePicker, TimePicker } from "@/components/ui/DatePicker";
import { PosterSetup } from "./PosterSetup";
import { TicketsSetup } from "./TicketsSetup";
import { SignupRules } from "./SignupRules";
import { CategorySetup } from "./CategorySetup";
import { QuestionsSetup } from "./QuestionsSetup";
import { MerchSetup } from "./MerchSetup";
import { VenueInput } from "./VenueInput";
import {
  MISSING_LABEL,
  ORGANIZER_CATEGORIES,
  endsLabel,
  isValidCustomCode,
  isValidUpi,
  isValidLink,
  LINK_ERROR,
  istToIso,
  missingForPublish,
  normalizeCode,
  slugify,
  ticketDate,
  type PublishField,
} from "@/lib/organizer/shared";
import { passCallSignCode } from "@/lib/pass-name";
import { cn } from "@/lib/utils";

export interface EditorInitial {
  id: string;
  slug: string;
  version: number;
  status: string;
  title: string;
  tagline: string;
  description: string;
  linkUrl: string;
  venuePlaceId: string | null;
  venueLat: number | null;
  venueLng: number | null;
  venueAddress: string | null;
  category: string | null;
  venue: string;
  venueStatus: "confirmed" | "tba" | "online";
  date: string;
  time: string;
  durationMinutes: number;
  capacity: string;
  priceRupees: string;
  payoutUpi: string;
  access: "public" | "code";
  accessCode: string;
  taken: number;
  poster: string | null;
}

interface Props {
  initial: EditorInitial | null;
  host: string;
  today: string;
  lastVenue: string | null;
  defaultUpi: string | null;
  placesKey: string | null;
}

const PRESETS = [60, 120, 180, 240] as const;
const NO_PLACE = { venuePlaceId: null, venueLat: null, venueLng: null, venueAddress: null };

const CAT_GLOW: Record<string, string> = {
  PARTY: "rgba(109, 61, 245, 0.08)",
  TECH: "rgba(35, 70, 168, 0.08)",
  SPORTS: "rgba(214, 101, 42, 0.09)",
  CULTURAL: "rgba(199, 69, 122, 0.08)",
  WORKSHOP: "rgba(17, 121, 109, 0.08)",
  GAMING: "rgba(227, 38, 79, 0.08)",
  TALK: "rgba(180, 118, 22, 0.08)",
};

const QUICK_STARTERS = [
  { label: "Hackathon", title: "Hack Night '26", category: "TECH", durationMinutes: 360, tagline: "Build, ship, and demo before sunrise.", capacity: "120" },
  { label: "Fest Night", title: "Sunset Sessions", category: "PARTY", durationMinutes: 240, tagline: "Live DJ set, lights, and campus night energy.", capacity: "300" },
  { label: "Box Cricket", title: "Box Cricket League", category: "SPORTS", durationMinutes: 240, tagline: "6-a-side floodlit turf tournament.", capacity: "96" },
  { label: "Workshop", title: "Design in 90 Mins", category: "WORKSHOP", durationMinutes: 120, tagline: "Hands-on studio session with certificate.", capacity: "60" },
  { label: "Open Mic", title: "Courtyard Open Mic", category: "CULTURAL", durationMinutes: 180, tagline: "Poetry, stand-up, and acoustic sets.", capacity: "150" },
] as const;

type ExtraTab = "poster" | "rules" | "tiers" | "questions" | "merch";

function useAgo(at: number | null) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!at) return;
    const t = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(t);
  }, [at]);
  if (!at) return null;
  const s = Math.max(0, Math.round((Date.now() - at) / 1000));
  if (s < 10) return "Saved just now";
  if (s < 60) return `Saved ${s}s ago`;
  return `Saved ${Math.round(s / 60)}m ago`;
}

/**
 * Luma-inspired 30-second event creation & publication studio.
 * Essentials fit cleanly on one calm screen with a live physical ticket preview and a single
 * unmistakable Publish CTA. All advanced tools (poster/themes, agenda, tiers, questions, merch)
 * live inside a clean tabbed "Customize & extras" drawer so organizers are never overwhelmed.
 */
export function EventEditor({ initial, host, today, lastVenue, defaultUpi, placesKey }: Props) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(initial?.id ?? null);
  const [status, setStatus] = useState(initial?.status ?? "draft");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [customSlug, setCustomSlug] = useState<string | null>(null);
  const [slugEditing, setSlugEditing] = useState(false);

  const [f, setF] = useState({
    title: initial?.title ?? "",
    tagline: initial?.tagline ?? "",
    description: initial?.description ?? "",
    linkUrl: initial?.linkUrl ?? "",
    category: initial?.category ?? null,
    venue: initial?.venue ?? lastVenue ?? "",
    venueStatus: initial?.venueStatus ?? ("confirmed" as "confirmed" | "tba" | "online"),
    venuePlaceId: initial?.venuePlaceId ?? null,
    venueLat: initial?.venueLat ?? null,
    venueLng: initial?.venueLng ?? null,
    venueAddress: initial?.venueAddress ?? null,
    date: initial?.date ?? today,
    time: initial?.time ?? "18:00",
    durationMinutes: initial?.durationMinutes ?? 120,
    capacity: initial?.capacity ?? "100",
    paid: initial ? Number(initial.priceRupees) > 0 : false,
    priceRupees: initial && Number(initial.priceRupees) > 0 ? initial.priceRupees : "",
    payoutUpi: initial?.payoutUpi || defaultUpi || "",
    access: initial?.access ?? ("public" as "public" | "code"),
    accessCode: initial?.accessCode ?? "",
  });

  const [customDuration, setCustomDuration] = useState(
    initial ? !PRESETS.includes(initial.durationMinutes as (typeof PRESETS)[number]) : false,
  );
  const [extrasOpen, setExtrasOpen] = useState(Boolean(initial));
  const [extraTab, setExtraTab] = useState<ExtraTab>("poster");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [fieldError, setFieldError] = useState<Record<string, string>>({});
  const [codeFree, setCodeFree] = useState<boolean | null>(null);
  const [save, setSave] = useState<"idle" | "saving" | "saved" | "failed" | "conflict">(initial ? "saved" : "idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [softClash, setSoftClash] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const idRef = useRef(id);
  const versionRef = useRef(initial?.version ?? 0);
  const dirtyRef = useRef(false);
  const conflictRef = useRef(false);
  const inFlight = useRef<Promise<void> | null>(null);
  const latest = useRef(f);
  latest.current = f;
  const slugRef = useRef(customSlug);
  slugRef.current = customSlug;

  const ago = useAgo(savedAt);

  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => {
    dirtyRef.current = true;
    setF((p) => ({ ...p, [key]: value }));
    if (key === "accessCode") setFieldError((e) => ({ ...e, code: "" }));
    setPublishError(null);
    setSoftClash(null);
  };

  const setVenue = (
    venue: string,
    place: { venuePlaceId: string | null; venueLat: number | null; venueLng: number | null; venueAddress: string | null },
  ) => {
    dirtyRef.current = true;
    setF((p) => ({ ...p, venue, ...place }));
    setPublishError(null);
    setSoftClash(null);
  };

  const blur = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const previewSlug = customSlug ?? (slug || (f.title.trim() ? slugify(f.title) : ""));
  const pricePaise = f.paid ? Math.round((Number(f.priceRupees) || 0) * 100) : 0;
  const upi = f.payoutUpi.trim().toLowerCase();
  const code = normalizeCode(f.accessCode);

  const errors = {
    title: touched.title && !f.title.trim() ? "Give your event a name." : null,
    price: touched.price && f.paid && !(pricePaise > 0) ? "Enter a ticket price above ₹0." : null,
    upi: touched.upi && f.paid && (!upi || !isValidUpi(upi)) ? "Enter a valid UPI ID, like club@okaxis." : null,
    capacity:
      touched.capacity && f.capacity !== "" && !(Number(f.capacity) > 0)
        ? "Capacity must be 1 or more, or blank for unlimited."
        : null,
    link: touched.link && f.linkUrl.trim() && !isValidLink(f.linkUrl.trim()) ? LINK_ERROR : null,
    code: fieldError.code || (touched.code && code && !isValidCustomCode(code) ? "Use 4 to 20 letters or numbers." : null),
  };

  const payload = useCallback(() => {
    const v = latest.current;
    const u = v.payoutUpi.trim().toLowerCase();
    const c = normalizeCode(v.accessCode);
    return {
      title: v.title.trim(),
      ...(slugRef.current ? { slug: slugRef.current } : {}),
      tagline: v.tagline.trim() || null,
      description: v.description.trim() || null,
      ...(!v.linkUrl.trim() ? { linkUrl: null } : isValidLink(v.linkUrl.trim()) ? { linkUrl: v.linkUrl.trim() } : {}),
      category: v.category,
      venue: v.venueStatus === "tba" ? null : v.venue.trim() || null,
      ...(v.venueStatus === "confirmed" && v.venuePlaceId
        ? { venuePlaceId: v.venuePlaceId, venueLat: v.venueLat, venueLng: v.venueLng, venueAddress: v.venueAddress }
        : NO_PLACE),
      venueStatus: v.venueStatus,
      date: v.date,
      time: v.time,
      durationMinutes: v.durationMinutes,
      capacity: v.capacity === "" ? null : Number(v.capacity) > 0 ? Math.floor(Number(v.capacity)) : undefined,
      pricePaise: v.paid ? Math.round((Number(v.priceRupees) || 0) * 100) : 0,
      ...(v.paid && u && isValidUpi(u) ? { payoutUpi: u } : {}),
      ...(v.paid && !u ? { payoutUpi: null } : {}),
      access: v.access,
      ...(c && isValidCustomCode(c) ? { accessCode: c } : v.access === "public" && !c ? { accessCode: null } : {}),
    };
  }, []);

  const flush = useCallback(async (): Promise<boolean> => {
    if (conflictRef.current) return false;
    if (inFlight.current) await inFlight.current;
    if (!dirtyRef.current && idRef.current) return true;
    const body = payload();
    if (!body.title || !latest.current.date || !latest.current.time) return false;
    dirtyRef.current = false;
    setSave("saving");
    let ok = false;
    const run = (async () => {
      const r = idRef.current
        ? await apiJson<{ version: number; slug: string; access_code: string | null }>(
            `/api/events/${idRef.current}`,
            "PATCH",
            { ...body, version: versionRef.current },
          )
        : await apiJson<{ id: string; version: number; slug: string; access_code: string | null }>(
            "/api/events",
            "POST",
            body,
          );
      if (r.ok) {
        ok = true;
        const d = r.data as { id?: string; version: number; slug: string; access_code: string | null };
        versionRef.current = d.version;
        setSlug(d.slug);
        setCustomSlug(null);
        setFieldError({});
        if (d.id) {
          idRef.current = d.id;
          setId(d.id);
          setStatus("draft");
          window.history.replaceState(null, "", `/organizer/events/${d.id}`);
        }
        setSave("saved");
        setSavedAt(Date.now());
        setSaveError(null);
        return;
      }
      const err = r.data.error;
      if (err?.code === "version_conflict") {
        conflictRef.current = true;
        setSave("conflict");
      } else if (err?.code === "code_taken") {
        setFieldError({ code: err.message });
        setSave("failed");
      } else if (err?.code === "slug_taken") {
        setFieldError({ slug: err.message });
        setSave("failed");
      } else {
        setSaveError((err?.message ?? "Couldn't save.").replace(/^[a-zA-Z]+: /, ""));
        setSave("failed");
      }
    })().catch(() => {
      dirtyRef.current = true;
      setSaveError("You're offline. Changes will save when you're back.");
      setSave("failed");
    });
    inFlight.current = run.finally(() => {
      inFlight.current = null;
    });
    await inFlight.current;
    return ok;
  }, [payload]);

  useEffect(() => {
    if (initial) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!dirtyRef.current) return;
    const t = setTimeout(() => void flush(), 1100);
    return () => clearTimeout(t);
  }, [f, customSlug, flush]);

  useEffect(() => {
    if (!code || !isValidCustomCode(code)) {
      setCodeFree(null);
      return;
    }
    const t = setTimeout(async () => {
      const r = await apiJson<{ available: boolean }>(
        `/api/codes/available?code=${encodeURIComponent(code)}${idRef.current ? `&eventId=${idRef.current}` : ""}`,
        "GET",
      );
      if (r.ok) setCodeFree(r.data.available);
    }, 350);
    return () => clearTimeout(t);
  }, [code]);

  const missing: PublishField[] = useMemo(
    () =>
      missingForPublish({
        title: f.title,
        category: f.category,
        venue: f.venue,
        venue_status: f.venueStatus,
        description: f.description,
        price_paise: pricePaise,
        organizer_upi_id: f.paid && isValidUpi(upi) ? upi : null,
        access: f.access,
        access_code: f.access === "code" ? (isValidCustomCode(code) ? code : null) : null,
      }),
    [f, pricePaise, upi, code],
  );

  const priceMissing = f.paid && !(pricePaise > 0);
  const codeBlocked = (f.access === "code" && !isValidCustomCode(code)) || codeFree === false || (!!code && !isValidCustomCode(code));
  const over =
    /^\d{4}-\d{2}-\d{2}$/.test(f.date) &&
    /^\d{2}:\d{2}$/.test(f.time) &&
    Date.parse(istToIso(f.date, f.time)) + f.durationMinutes * 60_000 <= Date.now();

  const blockers = [
    ...missing.map((m) => MISSING_LABEL[m]),
    ...(priceMissing ? ["price"] : []),
    ...(codeBlocked && !missing.includes("code") ? ["event code"] : []),
    ...(over ? ["a future date"] : []),
  ];

  const canPublish = blockers.length === 0 && !publishing && save !== "conflict";

  async function publish(ack = false) {
    setPublishing(true);
    setPublishError(null);
    const savedOk = await flush();
    if (inFlight.current) await inFlight.current;
    if (!savedOk || !idRef.current || conflictRef.current) {
      setPublishing(false);
      return;
    }
    const r = await apiJson<{ version: number; slug: string }>(`/api/events/${idRef.current}/publish`, "POST", {
      version: versionRef.current,
      ...(ack ? { acknowledgeSoftClashes: true } : {}),
    });
    setPublishing(false);
    if (r.ok) {
      router.push(`/organizer/events/${idRef.current}/published`);
      return;
    }
    const err = r.data.error;
    if (err?.code === "soft_clash") setSoftClash(err.message);
    else if (err?.code === "version_conflict") {
      conflictRef.current = true;
      setSave("conflict");
    } else if (err?.code === "incomplete") {
      setPublishError(
        `Still needed: ${(r.data.missing ?? []).map((m) => MISSING_LABEL[m as PublishField] ?? m).join(", ")}`,
      );
    } else setPublishError(err?.message ?? "Couldn't publish.");
  }

  async function unpublish() {
    await flush();
    const r = await apiJson<{ version: number }>(`/api/events/${idRef.current}/unpublish`, "POST", {
      version: versionRef.current,
    });
    if (r.ok) {
      versionRef.current = r.data.version;
      setStatus("draft");
      setToast({ message: "Switched back to draft." });
    } else setToast({ message: r.data.error?.message ?? "Couldn't unpublish." });
  }

  async function duplicate() {
    await flush();
    const r = await apiJson<{ id: string }>(`/api/events/${idRef.current}/duplicate`, "POST");
    if (r.ok) router.push(`/organizer/events/${r.data.id}`);
    else setToast({ message: r.data.error?.message ?? "Couldn't duplicate." });
  }

  async function openExtras() {
    if (!extrasOpen && !idRef.current) {
      if (!f.title.trim()) {
        setTouched((t) => ({ ...t, title: true }));
        setToast({ message: "Add an event name first to unlock poster, themes & extras." });
        return;
      }
      dirtyRef.current = true;
      await flush();
    }
    setExtrasOpen((o) => !o);
  }

  const taken = initial?.taken ?? 0;
  const cap = f.capacity === "" ? null : Number(f.capacity) || null;
  const venueOnTicket = f.venueStatus === "tba" ? "Venue TBA" : f.venue.trim() || null;
  const catLabel = ORGANIZER_CATEGORIES.find(([v]) => v === f.category)?.[1] ?? null;
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(f.date) && /^\d{2}:\d{2}$/.test(f.time);
  const pill = status === "published" ? "Live" : status === "closed" || status === "cancelled" ? "Closed" : "Draft";

  return (
    <>
      {/* Clean top bar — Publish is ALWAYS 1 tap away */}
      <header className="o-top">
        <Link href="/organizer" aria-label="Back to events" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-2 hover:text-ink">
          <ChevronLeft size={18} aria-hidden />
          <span className="o-hide-phone">Events</span>
        </Link>

        <span className="ml-2 rounded-full bg-sunken px-2.5 py-0.5 text-[12px] font-semibold text-ink-2">
          {pill}
        </span>

        {save === "saving" ? (
          <span className="ml-2 text-[12.5px] text-ink-muted">Saving…</span>
        ) : ago ? (
          <span className="o-hide-phone ml-2 text-[12.5px] text-ink-subtle">{ago}</span>
        ) : null}

        <span className="o-spacer" />

        {id && (
          <Link className="o-btn o-hide-phone" href={`/organizer/events/${id}/manage`}>
            Manage
          </Link>
        )}
        {id && status === "published" && (
          <button type="button" className="o-text-btn o-hide-phone" onClick={unpublish}>
            Unpublish
          </button>
        )}
        {id && (
          <MoreSheet
            title={f.title.trim() || "Event"}
            items={[
              { label: "Manage attendees", icon: "users", href: `/organizer/events/${id}/manage` },
              { label: "Duplicate", icon: "copy", onSelect: () => void duplicate() },
              ...(status === "published"
                ? [{ label: "Unpublish", icon: "eye" as const, onSelect: () => void unpublish() }]
                : []),
            ]}
          />
        )}

        {status === "published" ? (
          <Link className="o-btn o-btn-primary" href={`/organizer/events/${id}/published`}>
            Share event
          </Link>
        ) : (
          <button
            type="button"
            disabled={!canPublish}
            onClick={() => publish(false)}
            className="ui-press inline-flex h-10 items-center gap-2 rounded-xl bg-lavender px-4 text-[14px] font-semibold text-ink ring-2 ring-inset ring-ink transition-colors hover:bg-lavender-hover disabled:cursor-not-allowed disabled:opacity-45"
          >
            {publishing ? "Publishing…" : "Publish event"}
          </button>
        )}
      </header>

      {/* Alert banners */}
      {save === "conflict" && (
        <div className="o-banner" role="alert">
          This event was updated in another tab. Reload to keep your edits in sync.
          <button className="o-link" onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
      )}
      {softClash && status !== "published" && (
        <div className="o-banner" role="alert">
          {softClash}
          <button className="o-link" disabled={publishing} onClick={() => publish(true)}>
            Publish anyway
          </button>
        </div>
      )}
      {publishError && (
        <div className="o-banner" role="alert">
          {publishError}
        </div>
      )}
      {save === "failed" && saveError && (
        <div className="o-banner" role="alert">
          Not saved. {saveError}
        </div>
      )}

      {/* Main Luma-style 2-column studio with subtle category-tinted ambient wash */}
      <div
        className="transition-[background-image] duration-500"
        style={{
          backgroundImage: f.category && CAT_GLOW[f.category]
            ? `radial-gradient(900px circle at 78% 8%, ${CAT_GLOW[f.category]}, transparent 60%)`
            : undefined,
        }}
      >
      <div className="mx-auto max-w-[1160px] px-gutter pb-20 pt-6 md:pt-10">
        {/* 1-tap campus starters for brand-new events */}
        {!initial && !f.title.trim() && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[13px] font-semibold text-ink-muted">Start fast:</span>
            {QUICK_STARTERS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => {
                  dirtyRef.current = true;
                  setF((p) => ({
                    ...p,
                    title: s.title,
                    category: s.category,
                    durationMinutes: s.durationMinutes,
                    tagline: s.tagline,
                    capacity: s.capacity,
                  }));
                  setCustomDuration(!PRESETS.includes(s.durationMinutes as (typeof PRESETS)[number]));
                }}
                className="inline-flex h-8 items-center rounded-full border border-line-strong bg-surface px-3.5 text-[13px] font-semibold text-ink transition-colors hover:border-ink hover:bg-ink hover:text-[#FFFEF6]"
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.25fr)_340px] lg:gap-12">
          {/* LEFT: Calm, 30-second Essentials Flow */}
          <div className="space-y-5">
            {/* 1. Big Hero Event Name + Category */}
            <div className="rounded-[24px] border border-line-strong bg-surface p-5 shadow-card sm:p-6">
              <label htmlFor="ev-title" className="sr-only">
                Event name
              </label>
              <input
                id="ev-title"
                autoFocus={!initial}
                maxLength={60}
                placeholder="Event name (e.g. Hack Night '26)"
                value={f.title}
                onChange={(e) => set("title", e.target.value)}
                onBlur={() => blur("title")}
                className="w-full border-0 bg-transparent font-display text-[clamp(30px,4vw,44px)] leading-[1.05] tracking-[-0.03em] text-ink placeholder:text-ink-subtle/60 focus:outline-none"
              />
              {errors.title && (
                <p className="mt-1 text-[13px] font-medium text-danger" role="alert">
                  {errors.title}
                </p>
              )}

              <input
                aria-label="Short tagline (optional)"
                maxLength={140}
                placeholder="Add a one-line hook (optional)"
                value={f.tagline}
                onChange={(e) => set("tagline", e.target.value)}
                className="mt-2 w-full border-0 bg-transparent text-[15px] text-ink-2 placeholder:text-ink-subtle/70 focus:outline-none"
              />

              {/* 1-tap Category Pills */}
              <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4" role="radiogroup" aria-label="Category">
                {ORGANIZER_CATEGORIES.map(([v, l]) => {
                  const active = f.category === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set("category", v)}
                      className={cn(
                        "h-8 rounded-full px-3.5 text-[13px] font-semibold transition-colors",
                        active
                          ? "bg-ink text-[#FFFEF6]"
                          : "bg-sunken text-ink-2 hover:bg-mist hover:text-ink",
                      )}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. When & Where — compact Luma-style card */}
            <div className="divide-y divide-line rounded-[24px] border border-line-strong bg-surface shadow-card">
              {/* Date & Time row */}
              <div className="p-5 sm:p-6">
                <div className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
                  <Calendar className="size-4 text-ink-muted" aria-hidden />
                  <span>Date &amp; time</span>
                  {validDate && (
                    <span className="ml-auto font-mono text-[12px] font-medium text-ink-muted">
                      <Odometer value={endsLabel(f.date, f.time, f.durationMinutes)} />
                    </span>
                  )}
                </div>

                <div className="mt-3.5 flex flex-wrap items-center gap-2.5">
                  <DatePicker label="Start date" className="min-w-[160px] flex-[1.3]" value={f.date} onChange={(v) => set("date", v)} />
                  <TimePicker label="Start time" className="min-w-[120px] flex-1" value={f.time} onChange={(v) => set("time", v)} />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-1.5" role="group" aria-label="Duration">
                  <Clock className="mr-1 size-3.5 text-ink-muted" aria-hidden />
                  {PRESETS.map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={!customDuration && f.durationMinutes === m}
                      onClick={() => {
                        setCustomDuration(false);
                        set("durationMinutes", m);
                      }}
                      className={cn(
                        "h-7 rounded-full px-3 text-[12.5px] font-semibold transition-colors",
                        !customDuration && f.durationMinutes === m
                          ? "bg-ink text-[#FFFEF6]"
                          : "bg-sunken text-ink-2 hover:text-ink",
                      )}
                    >
                      {m / 60}h
                    </button>
                  ))}
                  <button
                    type="button"
                    aria-pressed={customDuration}
                    onClick={() => setCustomDuration(true)}
                    className={cn(
                      "h-7 rounded-full px-3 text-[12.5px] font-semibold transition-colors",
                      customDuration ? "bg-ink text-[#FFFEF6]" : "bg-sunken text-ink-2 hover:text-ink",
                    )}
                  >
                    Custom
                  </button>
                  {customDuration && (
                    <input
                      aria-label="Duration in hours"
                      inputMode="decimal"
                      placeholder="hrs"
                      defaultValue={f.durationMinutes / 60}
                      onChange={(e) => {
                        const h = Number(e.target.value);
                        if (h > 0 && h <= 336) set("durationMinutes", Math.round(h * 60));
                      }}
                      className="ml-1 h-7 w-16 rounded-lg border border-line-strong bg-canvas px-2 font-mono text-[12.5px] text-ink focus:border-ink focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Venue row */}
              <div className="p-5 sm:p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-[13.5px] font-semibold text-ink">
                    <MapPin className="size-4 text-ink-muted" aria-hidden />
                    <span>Location</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => set("venueStatus", f.venueStatus === "tba" ? "confirmed" : "tba")}
                    className="text-[12.5px] font-semibold text-ink-muted underline decoration-line-strong underline-offset-4 hover:text-ink"
                  >
                    {f.venueStatus === "tba" ? "Set venue" : "Mark as TBA"}
                  </button>
                </div>
                <div className="mt-3">
                  <VenueInput
                    apiKey={f.venueStatus === "tba" ? null : placesKey}
                    value={f.venueStatus === "tba" ? "" : f.venue}
                    onText={(v) => setVenue(v, NO_PLACE)}
                    onPick={(p) =>
                      setVenue(p.venue, {
                        venuePlaceId: p.placeId,
                        venueLat: p.lat,
                        venueLng: p.lng,
                        venueAddress: p.address,
                      })
                    }
                    inputProps={{
                      className:
                        "h-11 w-full rounded-xl border border-line-strong bg-canvas px-3.5 text-[14.5px] text-ink placeholder:text-ink-subtle focus:border-ink focus:outline-none disabled:opacity-50",
                      disabled: f.venueStatus === "tba",
                      maxLength: 160,
                      placeholder: f.venueStatus === "tba" ? "To be announced" : "Main Auditorium, North Turf, or hall name",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Event Options: Tickets, Capacity, Visibility & Custom Code (Luma-style clean rows) */}
            <div className="divide-y divide-line rounded-[24px] border border-line-strong bg-surface shadow-card">
              {/* Tickets */}
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                    <TicketIcon className="size-4 text-ink-muted" aria-hidden />
                    Tickets
                  </span>
                  <Segmented
                    label="Ticket type"
                    value={f.paid ? "paid" : "free"}
                    options={[
                      ["free", "Free"],
                      ["paid", "Paid (0% UPI)"],
                    ]}
                    onChange={(v) => set("paid", v === "paid")}
                  />
                </div>

                {f.paid && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <label htmlFor="ev-price" className="text-[12.5px] font-semibold text-ink-muted">
                        Price (₹)
                      </label>
                      <input
                        id="ev-price"
                        inputMode="decimal"
                        placeholder="250"
                        value={f.priceRupees}
                        onChange={(e) => set("priceRupees", e.target.value.replace(/[^\d.]/g, ""))}
                        onBlur={() => blur("price")}
                        className="mt-1 h-10 w-full rounded-xl border border-line-strong bg-canvas px-3 font-mono text-[14px] text-ink focus:border-ink focus:outline-none"
                      />
                      {errors.price && <p className="mt-1 text-[12px] text-danger">{errors.price}</p>}
                    </div>
                    <div>
                      <label htmlFor="ev-upi" className="text-[12.5px] font-semibold text-ink-muted">
                        Club UPI ID
                      </label>
                      <input
                        id="ev-upi"
                        placeholder="clubname@okaxis"
                        autoCapitalize="none"
                        value={f.payoutUpi}
                        onChange={(e) => set("payoutUpi", e.target.value)}
                        onBlur={() => blur("upi")}
                        className="mt-1 h-10 w-full rounded-xl border border-line-strong bg-canvas px-3 font-mono text-[14px] text-ink focus:border-ink focus:outline-none"
                      />
                      {errors.upi && <p className="mt-1 text-[12px] text-danger">{errors.upi}</p>}
                    </div>
                  </div>
                )}
              </div>

              {/* Capacity */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
                <label htmlFor="ev-cap" className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                  <Users className="size-4 text-ink-muted" aria-hidden />
                  Capacity
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="ev-cap"
                    inputMode="numeric"
                    placeholder="Unlimited"
                    value={f.capacity}
                    onChange={(e) => set("capacity", e.target.value.replace(/\D/g, "").slice(0, 7))}
                    onBlur={() => blur("capacity")}
                    className="h-9 w-28 rounded-xl border border-line-strong bg-canvas px-3 text-right font-mono text-[14px] text-ink placeholder:text-ink-subtle focus:border-ink focus:outline-none"
                  />
                  {f.capacity !== "" && (
                    <button
                      type="button"
                      onClick={() => set("capacity", "")}
                      className="text-[12.5px] font-semibold text-ink-muted hover:text-ink"
                    >
                      Unlimited
                    </button>
                  )}
                </div>
              </div>

              {/* Visibility & Custom Event Code */}
              <div className="p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-[14px] font-semibold text-ink">
                    <KeyRound className="size-4 text-ink-muted" aria-hidden />
                    Access &amp; custom code
                  </span>
                  <Segmented
                    label="Visibility"
                    value={f.access}
                    options={[
                      ["public", "Public"],
                      ["code", "Private (code only)"],
                    ]}
                    onChange={(v) => set("access", v)}
                  />
                </div>

                <div className="mt-3.5">
                  <input
                    aria-label="Custom event code"
                    maxLength={20}
                    placeholder={
                      f.access === "code"
                        ? "Set your private event code (required, e.g. hacknight26)"
                        : "Optional custom short code (e.g. hacknight26)"
                    }
                    value={f.accessCode}
                    onChange={(e) => set("accessCode", e.target.value)}
                    onBlur={() => blur("code")}
                    className="h-10 w-full rounded-xl border border-line-strong bg-canvas px-3.5 font-mono text-[14px] text-ink placeholder:font-sans placeholder:text-ink-subtle focus:border-ink focus:outline-none"
                  />
                  {errors.code || codeFree === false ? (
                    <p className="mt-1.5 text-[12.5px] font-medium text-danger">
                      {errors.code ?? "That code is taken. Try another."}
                    </p>
                  ) : code && isValidCustomCode(code) ? (
                    <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[12.5px]">
                      {codeFree === true && (
                        <span className="inline-flex items-center gap-1 font-semibold text-live">
                          <Check className="size-3.5" aria-hidden /> Available
                        </span>
                      )}
                      <span className="font-mono text-ink-muted">
                        {host}/c/{code.toLowerCase()}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>

              {/* Description & optional link */}
              <div className="p-5 sm:p-6">
                <label htmlFor="ev-about" className="block text-[14px] font-semibold text-ink">
                  Description <span className="font-normal text-ink-muted">(optional)</span>
                </label>
                <textarea
                  id="ev-about"
                  rows={3}
                  placeholder="What's happening, who it's for, and what to bring…"
                  value={f.description}
                  onChange={(e) => set("description", e.target.value)}
                  className="mt-2.5 w-full rounded-xl border border-line-strong bg-canvas p-3.5 text-[14.5px] leading-relaxed text-ink placeholder:text-ink-subtle focus:border-ink focus:outline-none"
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <input
                    aria-label="External link (optional)"
                    placeholder="Optional link (Instagram, Notion, brochure URL)"
                    autoCapitalize="none"
                    inputMode="url"
                    maxLength={300}
                    value={f.linkUrl}
                    onChange={(e) => set("linkUrl", e.target.value)}
                    onBlur={() => blur("link")}
                    className="h-9 flex-1 rounded-xl border border-line bg-canvas px-3 font-mono text-[13px] text-ink placeholder:font-sans placeholder:text-ink-subtle focus:border-ink focus:outline-none"
                  />
                  {slugEditing ? (
                    <input
                      aria-label="Custom URL slug"
                      autoFocus
                      defaultValue={previewSlug}
                      onBlur={(e) => {
                        const s = slugify(e.target.value);
                        setSlugEditing(false);
                        if (s && s !== slug) {
                          dirtyRef.current = true;
                          setCustomSlug(s);
                        }
                      }}
                      className="h-9 w-44 rounded-xl border border-ink bg-canvas px-3 font-mono text-[12.5px] text-ink focus:outline-none"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSlugEditing(true)}
                      className="text-[12.5px] font-semibold text-ink-muted underline decoration-line-strong underline-offset-4 hover:text-ink"
                    >
                      Edit URL
                    </button>
                  )}
                </div>
                {errors.link && <p className="mt-1 text-[12px] text-danger">{errors.link}</p>}
                {fieldError.slug && <p className="mt-1 text-[12px] text-danger">{fieldError.slug}</p>}
              </div>
            </div>

            {/* 4. Progressive Disclosure: Customize & Extras (Tabbed — zero form wall!) */}
            <div className="overflow-hidden rounded-[24px] border border-line-strong bg-surface shadow-card">
              <button
                type="button"
                onClick={() => void openExtras()}
                aria-expanded={extrasOpen}
                className="flex w-full items-center justify-between gap-4 p-5 text-left transition-colors hover:bg-sunken/50 sm:px-6"
              >
                <div className="flex items-center gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-sunken text-ink">
                    <SlidersHorizontal className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-[15px] font-semibold text-ink">Customize &amp; add extras</p>
                    <p className="text-[13px] text-ink-muted">
                      Poster &amp; 21 event themes, approval rules, agenda, ticket tiers, questions &amp; merch
                    </p>
                  </div>
                </div>
                <ChevronDown
                  className={cn("size-5 shrink-0 text-ink-muted transition-transform duration-200", extrasOpen && "rotate-180")}
                  aria-hidden
                />
              </button>

              {extrasOpen && id && (
                <div className="border-t border-line p-5 sm:p-6">
                  <div className="mb-6 flex flex-wrap gap-1.5" role="tablist" aria-label="Event customization">
                    {(
                      [
                        ["poster", "Poster & Theme"],
                        ["rules", "Rules & Agenda"],
                        ["tiers", "Ticket Tiers"],
                        ["questions", "Questions"],
                        ["merch", "Merch & Format"],
                      ] as [ExtraTab, string][]
                    ).map(([tabKey, tabLabel]) => (
                      <button
                        key={tabKey}
                        type="button"
                        role="tab"
                        aria-selected={extraTab === tabKey}
                        onClick={() => setExtraTab(tabKey)}
                        className={cn(
                          "h-9 rounded-full px-4 text-[13px] font-semibold transition-colors",
                          extraTab === tabKey
                            ? "bg-ink text-[#FFFEF6]"
                            : "bg-sunken text-ink-2 hover:text-ink",
                        )}
                      >
                        {tabLabel}
                      </button>
                    ))}
                  </div>

                  <div>
                    {extraTab === "poster" && (
                      <div className="space-y-6">
                        <PosterSetup eventId={id} title={f.title} initial={initial?.poster ?? null} />
                        <SignupRules eventId={id} category={f.category} />
                      </div>
                    )}
                    {extraTab === "rules" && <SignupRules eventId={id} category={f.category} />}
                    {extraTab === "tiers" && <TicketsSetup eventId={id} />}
                    {extraTab === "questions" && <QuestionsSetup eventId={id} />}
                    {extraTab === "merch" && (
                      <div className="space-y-6">
                        <CategorySetup eventId={id} category={f.category} />
                        <MerchSetup eventId={id} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Sticky Live Ticket Preview + Readiness + 1-Tap Publish */}
          <aside className="space-y-4 lg:sticky lg:top-24">
            <div className="flex items-center justify-between px-1 text-[12.5px] font-semibold">
              <span className="text-ink-muted">Live pass preview</span>
              <span className={cn("inline-flex items-center gap-1.5", blockers.length === 0 ? "text-live" : "text-ink-subtle")}>
                <span className={cn("size-1.5 rounded-full", blockers.length === 0 ? "bg-live" : "bg-ink-subtle/60")} aria-hidden />
                {blockers.length === 0 ? "Ready to publish" : `${blockers.length} left`}
              </span>
            </div>
            <Ticket
              category={catLabel}
              title={f.title || "Your event name"}
              dateLabel={validDate ? ticketDate(istToIso(f.date, f.time)) : null}
              time={validDate ? f.time : null}
              venue={venueOnTicket}
              tagline={f.tagline}
              qrValue={id ? `${host.startsWith("localhost") ? "http" : "https"}://${host}/e/${slug}` : null}
              passCode={previewSlug ? passCallSignCode(taken + 1) : null}
              priceLabel={f.paid && pricePaise > 0 ? `₹${Math.round(pricePaise / 100)}` : f.paid ? "Paid" : "Free"}
              seatsLabel={cap === null ? "Unlimited" : `${Math.max(0, cap - taken)} / ${cap}`}
            />

            {status !== "published" ? (
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={!canPublish}
                  onClick={() => publish(false)}
                  className="ui-press ui-sheen flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lavender px-6 text-[15.5px] font-semibold text-ink shadow-button ring-2 ring-inset ring-ink transition-colors hover:bg-lavender-hover disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {publishing ? "Publishing…" : "Publish event"}
                </button>
                <p className="text-center text-[12.5px] text-ink-muted">
                  {blockers.length > 0 ? `Add ${blockers.join(", ")} to publish.` : "Ready to go live in 1 tap."}
                </p>
              </div>
            ) : (
              <Link
                href={`/organizer/events/${id}/published`}
                className="ui-press flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-ink px-6 text-[15px] font-semibold text-[#FFFEF6] transition-opacity hover:opacity-90"
              >
                Share live link
              </Link>
            )}

            {id && (
              <a
                href={`/events/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-line-strong bg-surface text-[13.5px] font-semibold text-ink transition-colors hover:bg-sunken"
              >
                Preview attendee page
                <ExternalLink className="size-3.5 text-ink-muted" aria-hidden />
              </a>
            )}
          </aside>
        </div>
      </div>
      </div>

      <Toast toast={toast} onDone={() => setToast(null)} />
    </>
  );
}
