import type { Metadata } from "next";
import Link from "next/link";
import { passCallSignCode } from "@/lib/pass-name";
import { redirect } from "next/navigation";
import { ownedRow, siteHost } from "@/lib/organizer/page-data";
import { istTime, ticketDate, ORGANIZER_CATEGORIES } from "@/lib/organizer/shared";
import { Ticket } from "@/components/organizer-ui/Ticket";
import { ArrowRight, CircleCheck, ExternalLink, Link2, ScanLine, Users } from "lucide-react";
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
  const steps = [
    { icon: ExternalLink, title: "Open the event page", body: "See exactly what attendees see.", href: `/events/${e.slug}`, cta: "Open page" },
    { icon: Users, title: "Watch registrations", body: "Attendees, payments, updates and certificates.", href: `/organizer/events/${e.id}/manage`, cta: "Manage" },
    { icon: ScanLine, title: "Run the gate", body: "Scan passes on the night, even offline.", href: `/organizer/scan/${e.id}`, cta: "Scanner" },
  ];
  return (
    <>
      <header className="o-top">
        <div className="o-crumb">
          <Link href="/organizer">Events</Link> <span aria-hidden>/</span> <b>{e.title}</b>
        </div>
        <span className="o-status">
          <span className="size-1.5 rounded-full bg-live-dot" aria-hidden /> Published
        </span>
        <span className="o-spacer" />
        <UnpublishButton id={e.id} version={e.version} />
        <DuplicateButton id={e.id} />
        <Link className="o-btn" href={`/organizer/events/${e.id}`}>
          Edit
        </Link>
      </header>
      <div className="mx-auto grid max-w-[1180px] items-start gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:py-14">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-2 rounded-xl bg-live-soft px-3 py-1 text-[13px] font-medium text-live">
            <CircleCheck className="size-4" aria-hidden /> Your event is live
          </span>
          <h1 className="mt-5 text-display-lg font-semibold">
            It&apos;s live.
          </h1>
          <p className="mt-3 max-w-lg text-lead text-ink-muted">Share the link and people can register straight away. Passes, reminders and the gate scanner are ready.</p>

          <section aria-labelledby="share-h" className="card mt-8 p-5 md:p-6">
            <h2 id="share-h" className="flex items-center gap-2 text-h4 font-semibold">
              <Link2 className="size-4 text-ink-subtle" aria-hidden /> Share link
            </h2>
            <div className="mt-4">
              <CopyLink url={link} />
            </div>
            {e.access === "code" && e.access_code && (
              <p className="mt-3 text-[13px] text-ink-muted">
                Private event, join code <span className="font-mono font-medium tracking-[0.12em] text-ink">{e.access_code.toLowerCase()}</span>
              </p>
            )}
          </section>

          <h2 className="eyebrow mt-10">What&apos;s next</h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-3">
            {steps.map((st, i) => (
              <li key={st.title}>
                <Link href={st.href} className="card card-hover group flex h-full flex-col p-5">
                  <div className="flex items-center justify-between">
                    <span className="grid size-9 place-items-center text-ink-2">
                      <st.icon className="size-[17px]" aria-hidden />
                    </span>
                    <span className="font-mono text-[12px] text-ink-subtle">0{i + 1}</span>
                  </div>
                  <p className="mt-8 text-[15px] font-semibold">{st.title}</p>
                  <p className="mt-1 text-[13px] text-ink-muted">{st.body}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-ink">
                    {st.cta} <ArrowRight className="size-3.5 transition-transform duration-base ease-out group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <div className="lg:sticky lg:top-[calc(var(--header-h)+var(--toolbar-h)+24px)]">
          <p className="eyebrow mb-3">Attendee pass preview</p>
          <Ticket
            category={cat}
            title={e.title}
            dateLabel={ticketDate(e.starts_at)}
            time={istTime(new Date(e.starts_at))}
            venue={e.venue_status === "tba" ? "Venue TBA" : e.venue}
            tagline={e.tagline}
            qrValue={link}
            passCode={passCallSignCode(e.taken + 1)}
            priceLabel={e.price_paise ? `₹${Math.round(e.price_paise / 100)}` : "Free"}
            seatsLabel={e.capacity === null ? "Unlimited" : `${Math.max(0, e.capacity - e.taken)} / ${e.capacity}`}
          />
        </div>
      </div>
    </>
  );
}
