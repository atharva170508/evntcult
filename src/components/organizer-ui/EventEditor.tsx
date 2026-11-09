"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field, Odometer, Section, Segmented, Toast, apiJson, useAgo, type ToastState } from "./primitives";
import { Ticket } from "./Ticket";
import { MISSING_LABEL, ORGANIZER_CATEGORIES, endsLabel, isValidCustomCode, isValidUpi, isValidLink, LINK_ERROR, istToIso, missingForPublish, normalizeCode, slugify, ticketDate, type PublishField } from "@/lib/organizer/shared";

export interface EditorInitial {
  id: string;
  slug: string;
  version: number;
  status: string;
  title: string;
  tagline: string;
  description: string;
  linkUrl: string;
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
}

interface Props {
  initial: EditorInitial | null;
  /** Host of this site, for the links the organizer sees. */
  host: string;
  today: string;
  lastVenue: string | null;
  defaultUpi: string | null;
}

const PRESETS = [60, 120, 180, 240, 360] as const;
type Save = "idle" | "saving" | "saved" | "failed" | "conflict";

export function EventEditor({ initial, host, today, lastVenue, defaultUpi }: Props) {
  const router = useRouter();
  const [f, setF] = useState(() => ({
    title: initial?.title ?? "",
    tagline: initial?.tagline ?? "",
    description: initial?.description ?? "",
    linkUrl: initial?.linkUrl ?? "",
    category: initial?.category ?? (null as string | null),
    venue: initial?.venue ?? lastVenue ?? "",
    venueStatus: initial?.venueStatus ?? ("confirmed" as "confirmed" | "tba" | "online"),
    date: initial?.date ?? today,
    time: initial?.time ?? "18:00",
    durationMinutes: initial?.durationMinutes ?? 120,
    capacity: initial?.capacity ?? "100",
    paid: initial ? Number(initial.priceRupees) > 0 : false,
    priceRupees: initial && Number(initial.priceRupees) > 0 ? initial.priceRupees : "",
    payoutUpi: initial?.payoutUpi || defaultUpi || "",
    access: initial?.access ?? ("public" as "public" | "code"),
    accessCode: initial?.accessCode ?? "",
  }));
  const dirtyRef = useRef(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => {
    dirtyRef.current = true;
    setF((p) => ({ ...p, [k]: v }));
  };

  const [id, setId] = useState(initial?.id ?? null);
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugEditing, setSlugEditing] = useState(false);
  const [customSlug, setCustomSlug] = useState<string | null>(null);
  const [status, setStatus] = useState(initial?.status ?? "new");
  const [custom, setCustom] = useState(() => (initial ? !PRESETS.includes(initial.durationMinutes as (typeof PRESETS)[number]) : false));
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [save, setSave] = useState<Save>("idle");
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ code?: string; slug?: string }>({});
  const [publishing, setPublishing] = useState(false);
  const [softClash, setSoftClash] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [codeFree, setCodeFree] = useState<boolean | null>(null);
  const [toast, setToast] = useState<ToastState>(null);
  const ago = useAgo(savedAt);

  const versionRef = useRef(initial?.version ?? 0);
  const idRef = useRef(initial?.id ?? null);
  const inFlight = useRef<Promise<void> | null>(null);
  const latest = useRef(f);
  latest.current = f;
  const slugRef = useRef<string | null>(null);
  slugRef.current = customSlug;
  const conflictRef = useRef(false);

  const previewSlug = customSlug ?? (id ? slug : slugify(f.title || ""));
  const blur = (k: string) => setTouched((t) => ({ ...t, [k]: true }));

  const pricePaise = f.paid ? Math.round((Number(f.priceRupees) || 0) * 100) : 0;
  const upi = f.payoutUpi.trim().toLowerCase();
  const code = f.access === "code" ? normalizeCode(f.accessCode) : "";

  const errors = {
    title: touched.title && !f.title.trim() ? "Give your event a name." : null,
    upi: touched.upi && f.paid && upi && !isValidUpi(upi) ? "That isn't a UPI ID. It looks like name@bank." : null,
    price: touched.price && f.paid && !(pricePaise > 0) ? "Enter a price above zero." : null,
    capacity: touched.capacity && f.capacity !== "" && !(Number(f.capacity) > 0) ? "Capacity must be 1 or more, or blank for no limit." : null,
    link: touched.link && f.linkUrl.trim() && !isValidLink(f.linkUrl.trim()) ? LINK_ERROR : null,
    code: fieldError.code ?? (touched.code && code && !isValidCustomCode(code) ? "Use 4 to 20 letters or numbers." : null),
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
      venueStatus: v.venueStatus,
      date: v.date,
      time: v.time,
      durationMinutes: v.durationMinutes,
      capacity: v.capacity === "" ? null : Number(v.capacity) > 0 ? Math.floor(Number(v.capacity)) : undefined,
      pricePaise: v.paid ? Math.round((Number(v.priceRupees) || 0) * 100) : 0,
      ...(v.paid && u && isValidUpi(u) ? { payoutUpi: u } : {}),
      ...(v.paid && !u ? { payoutUpi: null } : {}),
      access: v.access,
      ...(v.access === "code" && c && isValidCustomCode(c) ? { accessCode: c } : {}),
    };
  }, []);

  /** Saves the latest form. Never two requests at once; a change during a save triggers another. */
  const flush = useCallback(async (): Promise<boolean> => {
    if (conflictRef.current) return false;
    if (inFlight.current) await inFlight.current;
    if (!dirtyRef.current) return true;
    const body = payload();
    if (!body.title || !latest.current.date || !latest.current.time) return false;
    dirtyRef.current = false;
    setSave("saving");
    let ok = false;
    const run = (async () => {
      const r = idRef.current
        ? await apiJson<{ version: number; slug: string; access_code: string | null }>(`/api/events/${idRef.current}`, "PATCH", { ...body, version: versionRef.current })
        : await apiJson<{ id: string; version: number; slug: string; access_code: string | null }>("/api/events", "POST", body);
      if (r.ok) {
        ok = true;
        const d = r.data as { id?: string; version: number; slug: string; access_code: string | null };
        versionRef.current = d.version;
        setSlug(d.slug);
        setCustomSlug(null);
        setFieldError({});
        if (d.access_code && !normalizeCode(latest.current.accessCode)) setF((p) => ({ ...p, accessCode: d.access_code!.toLowerCase() }));
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

  // Back/forward can show a cached copy of this page. Ask the server once; a newer version remounts us.
  useEffect(() => {
    if (initial) router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave, 1200ms after the last change.
  useEffect(() => {
    if (!dirtyRef.current) return;
    const t = setTimeout(() => void flush(), 1200);
    return () => clearTimeout(t);
  }, [f, customSlug, flush]);

  // Is the typed join code free?
  useEffect(() => {
    if (f.access !== "code" || !isValidCustomCode(code)) {
      setCodeFree(null);
      return;
    }
    const t = setTimeout(async () => {
      const r = await apiJson<{ available: boolean }>(`/api/codes/available?code=${encodeURIComponent(code)}${idRef.current ? `&eventId=${idRef.current}` : ""}`, "GET");
      if (r.ok) setCodeFree(r.data.available);
    }, 350);
    return () => clearTimeout(t);
  }, [code, f.access]);

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
        access_code: f.access === "code" ? code || "generated" : null,
      }),
    [f, pricePaise, upi, code],
  );
  const priceMissing = f.paid && !(pricePaise > 0);
  const codeBlocked = f.access === "code" && (codeFree === false || (!!code && !isValidCustomCode(code)));
  const over = /^\d{4}-\d{2}-\d{2}$/.test(f.date) && /^\d{2}:\d{2}$/.test(f.time) && Date.parse(istToIso(f.date, f.time)) + f.durationMinutes * 60_000 <= Date.now();
  const blockers = [...missing.map((m) => MISSING_LABEL[m]), ...(priceMissing ? ["price"] : []), ...(codeBlocked ? ["join code"] : []), ...(over ? ["a later date"] : [])];

  async function publish(ack = false) {
    setPublishing(true);
    setPublishError(null);
    await flush();
    if (inFlight.current) await inFlight.current;
    if (!idRef.current || conflictRef.current) {
      setPublishing(false);
      return;
    }
    const r = await apiJson<{ version: number; slug: string }>(`/api/events/${idRef.current}/publish`, "POST", { version: versionRef.current, ...(ack ? { acknowledgeSoftClashes: true } : {}) });
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
    } else if (err?.code === "incomplete") setPublishError(`Still needed: ${(r.data.missing ?? []).map((m) => MISSING_LABEL[m as PublishField] ?? m).join(", ")}`);
    else setPublishError(err?.message ?? "Couldn't publish.");
  }

  async function unpublish() {
    await flush();
    const r = await apiJson<{ version: number }>(`/api/events/${idRef.current}/unpublish`, "POST", { version: versionRef.current });
    if (r.ok) {
      versionRef.current = r.data.version;
      setStatus("draft");
      setToast({ message: "Draft. Not visible to anyone yet." });
    } else setToast({ message: r.data.error?.message ?? "Couldn't unpublish." });
  }

  async function duplicate() {
    await flush();
    const r = await apiJson<{ id: string }>(`/api/events/${idRef.current}/duplicate`, "POST");
    if (r.ok) router.push(`/organizer/events/${r.data.id}`);
    else setToast({ message: r.data.error?.message ?? "Couldn't duplicate." });
  }

  const pill = status === "published" ? "PUBLISHED" : status === "closed" || status === "cancelled" ? "CLOSED" : "DRAFT";
  const goTo = (section: string) => {
    const el = document.getElementById(section);
    el?.scrollIntoView({ block: "start" });
    el?.querySelector<HTMLElement>("input:not(:disabled), textarea, button")?.focus({ preventScroll: true });
  };
  const checklist: [string, boolean, string][] = [
    ["Name", !!f.title.trim(), "sec-event"],
    ["Date and time", /^\d{4}-\d{2}-\d{2}$/.test(f.date) && /^\d{2}:\d{2}$/.test(f.time), "sec-schedule"],
    ["Category", !!f.category, "sec-event"],
    ["Venue", f.venueStatus !== "confirmed" || !!f.venue.trim(), "sec-schedule"],
    ["About", !!f.description.trim(), "sec-details"],
    ["Tickets", !f.paid || (pricePaise > 0 && isValidUpi(upi)), "sec-tickets"],
  ];
  const canPublish = blockers.length === 0 && !publishing && save !== "conflict";

  const taken = initial?.taken ?? 0;
  const cap = f.capacity === "" ? null : Number(f.capacity) || null;
  const venueOnTicket = f.venueStatus === "tba" ? "Venue TBA" : f.venue.trim() || null;
  const catLabel = ORGANIZER_CATEGORIES.find(([v]) => v === f.category)?.[1] ?? null;
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(f.date) && /^\d{2}:\d{2}$/.test(f.time);

  return (
    <>
      <header className="o-top">
        <div className="o-crumb">
          <Link href="/organizer">Events</Link> / <b>{f.title.trim() || "New event"}</b>
        </div>
        <span className="o-spacer" />
        {status !== "published" && blockers.length > 0 && <span className="o-reason o-narrow-only">needs {blockers.join(", ")}</span>}
        {id && status === "published" && (
          <button type="button" className="o-text-btn" onClick={unpublish}>
            Unpublish
          </button>
        )}
        {id && <Button onClick={duplicate}>Duplicate</Button>}
        {id && (
          <Link className="o-btn" href={`/organizer/events/${id}/manage`}>
            Attendees
          </Link>
        )}
        {status === "published" ? (
          <Link className="o-btn o-btn-primary" href={`/organizer/events/${id}/published`}>
            Share
          </Link>
        ) : (
          <Button variant="primary" className="o-narrow-only" disabled={!canPublish} onClick={() => publish(false)}>
            {publishing ? "Publishing" : "Publish"}
          </Button>
        )}
      </header>

      {save === "conflict" && (
        <div className="o-banner" role="alert">
          This event changed in another tab or device. Your last edits here were not saved.
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

      <div className="o-page">
        <div className="o-edit-head">
          <h1>{f.title.trim() || "New event"}</h1>
          <span className="o-status-pill">{pill}</span>
        </div>
        <div className="o-form-grid">
          <div className="o-form-col">
            <div id="sec-event">
            <Section n="01" label="Event">
              <Field
                label="Name"
                error={errors.title}
                hint={
                  slugEditing ? (
                    <input
                      aria-label="Event link"
                      className="o-input o-mono"
                      style={{ height: 24, fontSize: 11 }}
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
                    />
                  ) : (
                    <>
                      {host}/e/{previewSlug || "your-event"}{" "}
                      <button type="button" className="o-link" style={{ fontSize: 10 }} onClick={() => setSlugEditing(true)}>
                        edit
                      </button>
                      {fieldError.slug && <span style={{ color: "var(--bad)" }}> {fieldError.slug}</span>}
                    </>
                  )
                }
              >
                {(a) => <input {...a} className="o-input" autoFocus={!initial} maxLength={60} value={f.title} onChange={(e) => set("title", e.target.value)} onBlur={() => blur("title")} />}
              </Field>
              <Field label="Tagline">{(a) => <input {...a} className="o-input" maxLength={140} value={f.tagline} onChange={(e) => set("tagline", e.target.value)} />}</Field>
              <div className="o-row">
                <span className="o-label">Category</span>
                <div className="o-chips o-cat" role="radiogroup" aria-label="Category">
                  {ORGANIZER_CATEGORIES.map(([v, l]) => (
                    <button key={v} type="button" role="radio" aria-checked={f.category === v} className="o-chip" onClick={() => set("category", v)}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </Section>
            </div>

            <div id="sec-schedule">
            <Section n="02" label="Schedule">
              <Field label="Starts">
                {(a) => (
                  <div className="o-inline">
                    <input {...a} aria-label="Start date" type="date" className="o-input o-mono" style={{ flex: 1.4 }} value={f.date} onChange={(e) => set("date", e.target.value)} />
                    <input aria-label="Start time" type="time" className="o-input o-mono" style={{ flex: 1 }} value={f.time} onChange={(e) => set("time", e.target.value)} />
                    <span className="o-meta">IST</span>
                  </div>
                )}
              </Field>
              <div className="o-row">
                <span className="o-label">Runs for</span>
                <div>
                  <div className="o-chips" role="group" aria-label="Runs for">
                    {PRESETS.map((m) => (
                      <button
                        key={m}
                        type="button"
                        className="o-chip"
                        aria-pressed={!custom && f.durationMinutes === m}
                        onClick={() => {
                          setCustom(false);
                          set("durationMinutes", m);
                        }}
                      >
                        {m / 60}h
                      </button>
                    ))}
                    <button type="button" className="o-chip" aria-pressed={custom} onClick={() => setCustom(true)}>
                      Custom
                    </button>
                  </div>
                  <div className="o-inline" style={{ marginTop: 6 }}>
                    {custom && (
                      <input
                        aria-label="Hours"
                        className="o-input o-mono"
                        style={{ width: 90, height: 26 }}
                        inputMode="decimal"
                        placeholder="hours"
                        defaultValue={f.durationMinutes / 60}
                        onChange={(e) => {
                          const h = Number(e.target.value);
                          if (h > 0 && h <= 336) set("durationMinutes", Math.round(h * 60));
                        }}
                      />
                    )}
                    <span className="o-spacer" />
                    {validDate && <span className="o-meta"><Odometer value={endsLabel(f.date, f.time, f.durationMinutes)} /></span>}
                  </div>
                </div>
              </div>
              <Field
                label="Venue"
                hint={
                  f.venueStatus === "tba" ? (
                    <button type="button" className="o-link" style={{ fontSize: 10 }} onClick={() => set("venueStatus", "confirmed")}>
                      Add a venue
                    </button>
                  ) : f.venueStatus === "confirmed" ? (
                    <button type="button" className="o-link" style={{ fontSize: 10 }} onClick={() => set("venueStatus", "tba")}>
                      Mark as TBA
                    </button>
                  ) : null
                }
              >
                {(a) => <input {...a} className="o-input" disabled={f.venueStatus === "tba"} maxLength={160} placeholder={f.venueStatus === "tba" ? "TBA" : undefined} value={f.venueStatus === "tba" ? "" : f.venue} onChange={(e) => set("venue", e.target.value)} />}
              </Field>
            </Section>
            </div>

            <div id="sec-details">
            <Section n="03" label="Details">
              <div className="o-row">
                <label className="o-label" htmlFor="about">
                  About
                </label>
                <div>
                  <textarea id="about" className="o-area" value={f.description} onChange={(e) => set("description", e.target.value)} />
                  <div className="o-hint">{save === "saving" ? "saving" : save === "failed" || save === "conflict" ? "not saved" : ago ? `autosaved ${ago}` : null}</div>
                </div>
              </div>
              <div className="o-row">
                <label className="o-label" htmlFor="event-link">
                  Link
                </label>
                <div>
                <input
                  id="event-link"
                  className="o-input o-mono"
                  placeholder="https://instagram.com/yourclub"
                  autoCapitalize="none"
                  inputMode="url"
                  maxLength={300}
                  aria-invalid={!!errors.link}
                  aria-describedby={errors.link ? "event-link-err" : undefined}
                  value={f.linkUrl}
                  onChange={(e) => set("linkUrl", e.target.value)}
                  onBlur={() => blur("link")}
                />
                {errors.link ? (
                  <p className="o-err" id="event-link-err" role="alert">
                    {errors.link}
                  </p>
                ) : (
                  <div className="o-hint">Shown on the event page.</div>
                )}
                </div>
              </div>
            </Section>
            </div>

            <div id="sec-tickets">
            <Section n="04" label="Tickets">
              <div className="o-row">
                <span className="o-label">Type</span>
                <div>
                  <Segmented
                    label="Ticket type"
                    value={f.paid ? "paid" : "free"}
                    options={[
                      ["free", "Free"],
                      ["paid", "Paid"],
                    ]}
                    onChange={(v) => set("paid", v === "paid")}
                  />
                </div>
              </div>
              {f.paid && (
                <>
                  <Field label="Price" error={errors.price}>
                    {(a) => (
                      <div className="o-inline">
                        <span className="o-meta">₹</span>
                        <input {...a} className="o-input o-mono" style={{ width: 120 }} inputMode="decimal" value={f.priceRupees} onChange={(e) => set("priceRupees", e.target.value.replace(/[^\d.]/g, ""))} onBlur={() => blur("price")} />
                      </div>
                    )}
                  </Field>
                  <Field label="Payout UPI" error={errors.upi} hint={<span style={{ color: "var(--accent)" }}>required</span>}>
                    {(a) => <input {...a} className="o-input o-mono" placeholder="name@bank" autoCapitalize="none" value={f.payoutUpi} onChange={(e) => set("payoutUpi", e.target.value)} onBlur={() => blur("upi")} />}
                  </Field>
                </>
              )}
              <Field label="Capacity" error={errors.capacity}>
                {(a) => <input {...a} className="o-input o-mono" style={{ width: 120 }} inputMode="numeric" placeholder="no limit" value={f.capacity} onChange={(e) => set("capacity", e.target.value.replace(/\D/g, "").slice(0, 7))} onBlur={() => blur("capacity")} />}
              </Field>
            </Section>
            </div>

            <Section n="05" label="Access">
              <div className="o-row">
                <span className="o-label">Visibility</span>
                <div>
                  <Segmented
                    label="Visibility"
                    value={f.access}
                    options={[
                      ["public", "Public"],
                      ["code", "Code"],
                    ]}
                    onChange={(v) => set("access", v)}
                  />
                </div>
              </div>
              {f.access === "code" && (
                <Field label="Join code" error={errors.code ?? (codeFree === false ? "That code is taken. Try another." : null)} hint={code ? `${host}/c/${code.toLowerCase()}` : undefined}>
                  {(a) => (
                    <div className="o-inline">
                      <input {...a} className="o-input o-mono" maxLength={20} value={f.accessCode} onChange={(e) => set("accessCode", e.target.value)} onBlur={() => blur("code")} />
                      <Button
                        onClick={() => {
                          const alphabet = "ACDEFGHJKMNPQRTUVWXY34679";
                          const bytes = crypto.getRandomValues(new Uint8Array(7));
                          set("accessCode", [...bytes].map((b) => alphabet[b % alphabet.length]).join("").toLowerCase());
                        }}
                      >
                        Generate
                      </Button>
                    </div>
                  )}
                </Field>
              )}
            </Section>

          </div>

          <div className="o-sticky">
            <Ticket
              category={catLabel}
              title={f.title}
              dateLabel={validDate ? ticketDate(istToIso(f.date, f.time)) : null}
              time={validDate ? f.time : null}
              venue={venueOnTicket}
              tagline={f.tagline}
              qrValue={id ? `${host.startsWith("localhost") ? "http" : "https"}://${host}/e/${slug}` : null}
              passCode={previewSlug ? `EC-${previewSlug.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase()}-${String(taken + 1).padStart(4, "0")}` : null}
              priceLabel={f.paid && pricePaise > 0 ? `₹${Math.round(pricePaise / 100)}` : f.paid ? "PAID" : "FREE"}
              seatsLabel={cap === null ? "Unlimited" : `${Math.max(0, cap - taken)} / ${cap}`}
            />
            <section className="o-check" aria-label="Ready to publish">
              <div className="o-check-head">
                <span className="o-section-label">Ready to publish</span>
                <span className="o-meta">{checklist.filter(([, ok]) => ok).length} / {checklist.length}</span>
              </div>
              {checklist.map(([label, ok, section]) => (
                <div className="o-check-row" key={label}>
                  <span className={ok ? "" : "todo"}>{label}</span>
                  {!ok && (
                    <button type="button" className="o-check-add" onClick={() => goTo(section)}>
                      Add →
                    </button>
                  )}
                </div>
              ))}
            </section>
            {status !== "published" && blockers.length > 0 && <p className="o-reason o-col-reason">needs {blockers.join(", ")}</p>}
            {id ? (
              <a className="o-btn o-wide" href={`/events/${slug}`} target="_blank" rel="noopener noreferrer">
                Preview as attendee
              </a>
            ) : (
              <Button className="o-wide" disabled>
                Preview as attendee
              </Button>
            )}
            {status !== "published" && (
              <Button variant="primary" className="o-wide" disabled={!canPublish} onClick={() => publish(false)}>
                {publishing ? "Publishing" : "Publish"}
              </Button>
            )}
          </div>
        </div>
      </div>
      <Toast toast={toast} onDone={() => setToast(null)} />
    </>
  );
}
