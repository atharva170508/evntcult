import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ownedRow, siteHost } from "@/lib/organizer/page-data";
import { istTime, ticketDate, ORGANIZER_CATEGORIES } from "@/lib/organizer/shared";
import { Ticket } from "@/components/organizer-ui/Ticket";
import { CopyLink, DuplicateButton, UnpublishButton } from "@/components/organizer-ui/EventActions";

export const metadata: Metadata = { title: "Published" };
export const dynamic = "force-dynamic";

export default async function PublishedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ row: e }, host] = await Promise.all([ownedRow(id), siteHost()]);
  if (e.status !== "published") redirect(`/organizer/events/${id}`);
  const base = `${host.startsWith("localhost") ? "http" : "https"}://${host}`;
  const link = e.access === "code" && e.access_code ? `${base}/c/${e.access_code.toLowerCase()}` : `${base}/e/${e.slug}`;
  const cat = ORGANIZER_CATEGORIES.find(([v]) => v === e.category)?.[1] ?? null;
  return (
    <>
      <header className="o-top">
        <div className="o-crumb">
          <Link href="/organizer">Events</Link> / <b>{e.title}</b>
        </div>
        <span className="o-status">published</span>
        <span className="o-spacer" />
        <UnpublishButton id={e.id} version={e.version} />
        <DuplicateButton id={e.id} />
        <Link className="o-btn" href={`/organizer/events/${e.id}`}>
          Edit
        </Link>
      </header>
      <div className="o-page">
        <div className="o-form-grid">
          <div>
            <h1 className="o-title mb-6">It&apos;s live.</h1>
            <section className="o-section">
              <div className="o-section-head">
                <span className="o-section-n">01</span>
                <span className="o-section-label">Share</span>
              </div>
              <CopyLink url={link} />
              {e.access === "code" && e.access_code && <p className="o-hint">code {e.access_code.toLowerCase()}</p>}
            </section>
            <section className="o-section">
              <div className="o-section-head">
                <span className="o-section-n">02</span>
                <span className="o-section-label">Next</span>
              </div>
              <div className="o-inline">
                <Link className="o-btn" href={`/events/${e.slug}`}>
                  Open event page
                </Link>
                <Link className="o-btn" href={`/organizer/events/${e.id}/manage`}>
                  Attendees
                </Link>
                <Link className="o-btn" href={`/organizer/scan/${e.id}`}>
                  Gate scanner
                </Link>
              </div>
            </section>
          </div>
          <div className="o-sticky">
            <Ticket
              category={cat}
              title={e.title}
              dateLabel={ticketDate(e.starts_at)}
              time={istTime(new Date(e.starts_at))}
              venue={e.venue_status === "tba" ? "Venue TBA" : e.venue}
              tagline={e.tagline}
              qrValue={link}
              passCode={`EC-${e.slug.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase()}-${String(e.taken + 1).padStart(4, "0")}`}
              priceLabel={e.price_paise ? `₹${Math.round(e.price_paise / 100)}` : "FREE"}
              seatsLabel={e.capacity === null ? "Unlimited" : `${Math.max(0, e.capacity - e.taken)} / ${e.capacity}`}
            />
          </div>
        </div>
      </div>
    </>
  );
}
