import type { Metadata } from "next";
import Link from "next/link";
import { passCallSignCode } from "@/lib/pass-name";
import { redirect } from "next/navigation";
import { ownedRow, siteHost } from "@/lib/organizer/page-data";
import { istTime, ticketDate, ORGANIZER_CATEGORIES } from "@/lib/organizer/shared";
import { Ticket } from "@/components/organizer-ui/Ticket";
import { ArrowUpRight, ExternalLink, KeyRound, Link2, MessageCircle, ScanLine, Users } from "lucide-react";
import { CopyLink, DuplicateButton, UnpublishButton } from "@/components/organizer-ui/EventActions";

export const metadata: Metadata = { title: "Published" };
export const dynamic = "force-dynamic";

export default async function PublishedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ row: e }, host] = await Promise.all([ownedRow(id), siteHost()]);
  if (e.status !== "published") redirect(`/organizer/events/${id}`);
  const base = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  const link = e.access_code ? `${base}/c/${e.access_code.toLowerCase()}` : `${base}/e/${e.slug}`;
  const cat = ORGANIZER_CATEGORIES.find(([v]) => v === e.category)?.[1] ?? null;
  const venueLabel = e.venue_status === "tba" ? "Venue TBA" : e.venue;
  const waText = encodeURIComponent(
    `${e.title} is live on EvntCult!\n${ticketDate(e.starts_at)} · ${istTime(new Date(e.starts_at))} IST${venueLabel ? ` · ${venueLabel}` : ""}\nGrab your pass: ${link}`,
  );
  const waHref = `https://wa.me/?text=${waText}`;

  const actions = [
    { icon: ExternalLink, title: "Open attendee page", body: "See the live page exactly as students see it.", href: `/events/${e.slug}` },
    { icon: Users, title: "Manage attendees & Drive vault", body: "Track sign-ups, UPI payments, announcements, and event photos.", href: `/organizer/events/${e.id}/manage` },
    { icon: ScanLine, title: "Open gate scanner", body: "Scan QR passes at the door — works even offline.", href: `/organizer/scan/${e.id}` },
  ];

  return (
    <>
      <header className="o-top">
        <div className="o-crumb">
          <Link href="/organizer">Events</Link> <span aria-hidden>/</span> <b>{e.title}</b>
        </div>
        <span className="o-status">
          <span className="size-1.5 rounded-full bg-live-dot" aria-hidden /> Live
        </span>
        <span className="o-spacer" />
        <UnpublishButton id={e.id} version={e.version} />
        <DuplicateButton id={e.id} />
        <Link className="o-btn" href={`/organizer/events/${e.id}`}>
          Edit
        </Link>
      </header>

      <div className="mx-auto grid max-w-[1160px] items-start gap-10 px-gutter py-10 lg:grid-cols-[minmax(0,1.15fr)_380px] lg:gap-14 lg:py-14">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-live-soft px-3.5 py-1 text-[13px] font-semibold text-live">
            <span className="size-2 animate-pulse rounded-full bg-live" aria-hidden />
            Live on campus
          </span>

          <h1 className="mt-4 font-display text-[clamp(44px,5.6vw,68px)] leading-[0.94] tracking-[-0.03em] text-ink">
            {e.title} is <em>live.</em>
          </h1>
          <p className="mt-3 max-w-[48ch] text-[16px] leading-relaxed text-ink-2">
            Share the link below and students can claim their offline QR pass immediately. Gate scanning, reminders, and Photo Vault are ready.
          </p>

          {/* 1-Tap Share Hub */}
          <section aria-labelledby="share-h" className="mt-8 rounded-[24px] border border-line-strong bg-surface p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="share-h" className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                <Link2 className="size-4 text-ink-muted" aria-hidden />
                Share your event
              </h2>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-semibold text-[#FFFEF6] transition-opacity hover:opacity-90"
              >
                <MessageCircle className="size-3.5" aria-hidden />
                Share on WhatsApp
              </a>
            </div>
            <div className="mt-4">
              <CopyLink url={link} />
            </div>
            {e.access_code && (
              <p className="mt-3.5 flex items-center gap-2 text-[13px] text-ink-muted">
                <KeyRound className="size-3.5 shrink-0" aria-hidden />
                <span>
                  {e.access === "code" ? "Private join code:" : "Custom quick-join code:"}{" "}
                  <span className="font-mono font-semibold tracking-[0.06em] text-ink">{e.access_code.toLowerCase()}</span>
                </span>
              </p>
            )}
          </section>

          {/* Clean hairline-divided next steps */}
          <section aria-labelledby="next-h" className="mt-10">
            <h2 id="next-h" className="border-b border-ink pb-3 text-[16px] font-semibold text-ink">
              Ready when you are
            </h2>
            <ul className="divide-y divide-line">
              {actions.map((a) => (
                <li key={a.title}>
                  <Link
                    href={a.href}
                    className="group flex items-center justify-between gap-4 py-4 transition-colors hover:text-ink"
                  >
                    <span className="flex items-start gap-3.5">
                      <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl bg-sunken text-ink">
                        <a.icon className="size-4" aria-hidden />
                      </span>
                      <span>
                        <span className="block text-[15px] font-semibold text-ink group-hover:underline group-hover:underline-offset-4">
                          {a.title}
                        </span>
                        <span className="mt-0.5 block text-[13.5px] text-ink-muted">{a.body}</span>
                      </span>
                    </span>
                    <ArrowUpRight className="size-4 shrink-0 text-ink-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sticky Live Pass Preview */}
        <aside className="lg:sticky lg:top-24">
          <p className="mb-3 px-1 text-[12.5px] font-semibold text-ink-muted">Attendee pass preview</p>
          <Ticket
            category={cat}
            title={e.title}
            dateLabel={ticketDate(e.starts_at)}
            time={istTime(new Date(e.starts_at))}
            venue={venueLabel}
            tagline={e.tagline}
            qrValue={link}
            passCode={passCallSignCode(e.taken + 1)}
            priceLabel={e.price_paise ? `₹${Math.round(e.price_paise / 100)}` : "Free"}
            seatsLabel={e.capacity === null ? "Unlimited" : `${Math.max(0, e.capacity - e.taken)} / ${e.capacity}`}
          />
        </aside>
      </div>
    </>
  );
}
