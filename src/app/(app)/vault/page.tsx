import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, Images } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { myGalleries, myTaggedPhotos } from "@/lib/data/photos";
import { fmtDate } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Photo Vault" };
export const dynamic = "force-dynamic";

export default async function VaultPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/vault");
  const db = await getDB();
  const [tagged, galleries] = await Promise.all([myTaggedPhotos(db, viewer.id), myGalleries(db, viewer.id)]);

  // Group my photos by event, keeping the newest event first.
  const byEvent = new Map<string, { slug: string; title: string; startsAt: string; ids: string[] }>();
  for (const p of tagged) {
    const g = byEvent.get(p.event_id) ?? { slug: p.event_slug, title: p.event_title, startsAt: p.starts_at, ids: [] };
    g.ids.push(p.id);
    byEvent.set(p.event_id, g);
  }

  return (
    <div className="space-y-14 pb-8">
      <PageHero
        title="Photos"
        sub={
          <>
            {tagged.length} photo{tagged.length === 1 ? "" : "s"}
          </>
        }
      />

      {byEvent.size === 0 ? (
        <EmptyState
          icon={Images}
          title="Nothing here yet"
          action={galleries.length ? { label: "Browse your galleries", href: `/events/${galleries[0].slug}/photos` } : { label: "Find an event", href: "/events" }}
        />
      ) : (
        [...byEvent.entries()].map(([eventId, g]) => (
          <section key={eventId} aria-label={g.title} className="space-y-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="eyebrow">
                  {fmtDate(new Date(g.startsAt), { day: "numeric", month: "short", year: "numeric" })} · {g.ids.length} of you
                </p>
                <h2 className="mt-2 text-display-md font-semibold">{g.title}</h2>
              </div>
              <LinkButton href={`/events/${g.slug}/photos`} variant="secondary" size="sm">
                All photos <ArrowRight className="size-3.5" aria-hidden />
              </LinkButton>
            </div>
            <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 lg:grid-cols-6">
              {g.ids.map((id, i) => (
                <li key={id} className={i === 0 ? "col-span-2 row-span-2 overflow-hidden rounded-card bg-sunken" : "aspect-square overflow-hidden rounded-tile bg-sunken"}>
                  <a href={`/api/photos/${id}`} target="_blank" rel="noopener" aria-label="Open full size" className="group block size-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/photos/${id}?size=thumb`} alt="" loading="lazy" className="size-full object-cover transition-transform duration-slow ease-out group-hover:scale-[1.03]" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <section aria-labelledby="galleries-heading" className="space-y-5">
        <h2 id="galleries-heading" className="text-h3 font-semibold">
          Galleries from your events
        </h2>
        {galleries.length === 0 ? (
          <p className="text-small text-ink-muted">None yet.</p>
        ) : (
          <ul className="card divide-y divide-line">
            {galleries.map((g) => (
              <li key={g.id}>
                <Link href={`/events/${g.slug}/photos`} className="group flex items-center justify-between gap-3 px-5 py-4 transition-colors duration-fast hover:bg-sunken/40">
                  <span className="min-w-0 truncate text-[15px] font-medium">{g.title}</span>
                  <span className="flex shrink-0 items-center gap-3 text-[12.5px] text-ink-muted">
                    <span>
                      <span className="font-mono tabular-nums text-ink">{g.photos}</span> photos · you&apos;re in <span className="font-mono tabular-nums text-ink">{g.mine}</span>
                    </span>
                    <ArrowUpRight className="size-4 text-ink-subtle transition-transform duration-base ease-out group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
