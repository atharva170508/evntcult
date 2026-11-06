import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { ArrowLeft, CalendarDays, Clock, MapPin, Pencil, ScanLine, Ticket, Users } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getEventDetail, toSummary } from "@/lib/data/events";
import { passQrPayload } from "@/lib/tokens";
import { formatINR } from "@/lib/money";
import { fmtDate, fmtRange, fmtTime } from "@/lib/utils";
import { EventArt } from "@/components/ui/EventArt";
import { Chip } from "@/components/ui/Chip";
import { Meter } from "@/components/ui/Meter";
import { RegisterPanel } from "@/components/events/RegisterPanel";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Event" };

const LABEL: Record<string, string> = { GAMING: "Gaming", SPORTS: "Sports", TECH: "Tech", CULTURAL: "Cultural", WORKSHOP: "Workshop", TALK: "Talk", PARTY: "Party" };

export default async function EventPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ code?: string }> }) {
  const [{ slug }, { code }] = await Promise.all([params, searchParams]);
  const viewer = await getViewer();
  const d = await getEventDetail(slug, viewer, code);
  if (!d) notFound();

  const e = d.event;
  const s = toSummary(e);
  const reg = d.myRegistration;
  const ended = new Date(e.ends_at) <= new Date();
  const qrSvg =
    reg?.status === "registered"
      ? await QRCode.toString(passQrPayload(reg.pass_token), { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: "#0b0b0f", light: "#ffffff" } })
      : null;

  const waitlistPosition = reg?.status === "waitlisted" ? await waitlistPos(e.id, reg.id) : null;

  return (
    <div className="space-y-5 pt-4 md:pt-6">
      <Link href="/events" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted hover:text-ink">
        <ArrowLeft className="size-4" /> All events
      </Link>

      <section className="card grid overflow-hidden md:grid-cols-[1.1fr_1fr]">
        <div className="relative isolate flex min-h-[260px] flex-col justify-between p-6 text-white md:min-h-[440px] md:p-8">
          <EventArt accent={s.accent} />
          <div className="relative flex flex-wrap gap-2">
            <Chip tone="white">{LABEL[e.category] ?? e.category}</Chip>
            {e.access === "code" && <Chip tone="dark">Private · code only</Chip>}
            {e.status === "draft" && <Chip tone="warn">Draft · only you can see this</Chip>}
            {e.status === "cancelled" && <Chip tone="danger">Cancelled</Chip>}
          </div>
          <div className="relative">
            <p className="font-mono text-[11.5px] font-medium uppercase tracking-[0.14em] text-white/80">{fmtDate(s.startsAt, { weekday: "long", day: "numeric", month: "long" })}</p>
            <h1 className="mt-1 font-display text-[clamp(32px,4.6vw,54px)] font-bold leading-[0.98] tracking-tightest">{e.title}</h1>
            {s.tagline && <p className="mt-2 max-w-md text-[16px] text-white/85">{s.tagline}</p>}
          </div>
        </div>

        <div className="flex flex-col gap-5 p-6 md:p-8">
          <ul className="space-y-3 text-[15px]">
            <li className="flex items-center gap-3"><CalendarDays className="size-5 text-ink-subtle" /> {fmtDate(s.startsAt, { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</li>
            <li className="flex items-center gap-3"><Clock className="size-5 text-ink-subtle" /> {fmtRange(s.startsAt, s.endsAt)} <span className="text-[12px] text-ink-subtle">IST</span></li>
            <li className="flex items-center gap-3"><MapPin className="size-5 text-ink-subtle" /> {e.venue}</li>
            <li className="flex items-center gap-3"><Ticket className="size-5 text-ink-subtle" /> {e.price_paise ? `${formatINR(e.price_paise)} · pay at the desk` : "Free entry"}</li>
          </ul>

          <div className="rounded-2xl bg-canvas p-4">
            <div className="flex items-center justify-between text-[13px] font-semibold">
              <span className="flex items-center gap-1.5"><Users className="size-4 text-ink-subtle" /> <span className="font-mono tabular-nums">{e.taken}</span> going</span>
              <span className={d.seatsLeft === 0 ? "text-danger" : "text-ink-2"}>
                <span className="font-mono tabular-nums">{d.seatsLeft}</span> of <span className="font-mono tabular-nums">{e.capacity}</span> seats left
              </span>
            </div>
            <Meter value={e.taken} max={e.capacity} className="mt-2 bg-surface" />
          </div>

          {!viewer ? (
            <div className="space-y-2">
              <Link href={`/signin?next=${encodeURIComponent(`/events/${e.slug}`)}`} className="inline-flex w-full items-center justify-center rounded-full bg-ink py-3.5 text-[15px] font-semibold text-ink-contrast">Log in to register</Link>
              <p className="text-center text-[13px] text-ink-muted">New here? <Link href={`/signin?mode=signup&next=${encodeURIComponent(`/events/${e.slug}`)}`} className="font-semibold text-ink underline">Sign up</Link> with your college email.</p>
            </div>
          ) : d.isOwner ? (
            <div className="space-y-2">
              <p className="text-[13px] font-semibold text-ink-muted">You organize this event{e.access === "code" && e.access_code ? <> · join code <span className="font-mono font-bold text-ink">{e.access_code}</span></> : null}.</p>
              <div className="flex flex-wrap gap-2">
                <Link href={`/organizer/events/${e.id}/edit`} className="inline-flex items-center gap-1.5 rounded-full border border-line px-4 py-2.5 text-[14px] font-semibold hover:border-ink"><Pencil className="size-4" /> Edit</Link>
                {e.status === "published" && (
                  <Link href={`/organizer/scan/${e.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-[14px] font-semibold text-ink-contrast"><ScanLine className="size-4" /> Open gate scanner</Link>
                )}
              </div>
            </div>
          ) : (
            <RegisterPanel
              slug={e.slug}
              code={code ?? null}
              open={e.status === "published" && !ended}
              closedReason={ended ? "This event has ended." : e.status === "cancelled" ? "This event was cancelled." : e.status !== "published" ? "Registration isn't open." : null}
              full={d.seatsLeft === 0}
              pricePaise={e.price_paise}
              registration={
                reg && reg.status !== "cancelled"
                  ? {
                      id: reg.id,
                      status: reg.status,
                      passCode: reg.pass_code,
                      paid: reg.payment_status === "paid",
                      checkedInAt: reg.checked_in_at ? fmtTime(new Date(reg.checked_in_at)) : null,
                      holdExpiresAt: reg.hold_expires_at ? fmtTime(new Date(reg.hold_expires_at)) : null,
                      waitlistPosition,
                    }
                  : null
              }
              qrSvg={qrSvg}
            />
          )}
        </div>
      </section>

      {e.description && (
        <section className="card p-6 md:p-8">
          <h2 className="headline text-[18px]">About</h2>
          <div className="mt-3 space-y-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-2">{e.description}</div>
        </section>
      )}
    </div>
  );
}

async function waitlistPos(eventId: string, regId: string) {
  const { count } = await import("@/lib/db");
  return count(
    `SELECT COUNT(*) AS n FROM registrations w, registrations me
      WHERE me.id = ? AND w.event_id = ? AND w.status = 'waitlisted' AND w.created_at <= me.created_at`,
    regId,
    eventId,
  );
}
