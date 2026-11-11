import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { myGalleries, myTaggedPhotos } from "@/lib/data/photos";
import { fmtDate } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";

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
    <div className="flex flex-col gap-12">
      <PageHero
        eyebrow="Photo Vault"
        title="Photos of you"
        sub={
          <>
            <span className="font-mono tabular-nums">{tagged.length}</span> photo{tagged.length === 1 ? "" : "s"}
          </>
        }
      />

      {byEvent.size === 0 ? (
        <EmptyState title="No photos of you yet." body={"Open an event's photos and tap \u201cThat's me\u201d on the ones you're in. They collect here."} />
      ) : (
        [...byEvent.entries()].map(([eventId, g]) => (
          <section key={eventId} className="flex flex-col gap-3">
            <div className="flex items-end justify-between gap-3 border-b border-line pb-3">
              <div>
                <h2 className="text-heading">{g.title}</h2>
                <p className="font-mono text-label text-ink-muted">{fmtDate(new Date(g.startsAt), { day: "numeric", month: "short", year: "numeric" })} · {g.ids.length} of you</p>
              </div>
              <Link href={`/events/${g.slug}/photos`} className="inline-flex min-h-6 items-center text-label text-ink-muted underline underline-offset-4 hover:text-ink">All photos ›</Link>
            </div>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {g.ids.map((id) => (
                <li key={id} className="aspect-square overflow-hidden rounded-sm bg-surface">
                  <a href={`/api/photos/${id}`} target="_blank" rel="noopener" aria-label="Open full size">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/api/photos/${id}?size=thumb`} alt="" loading="lazy" className="size-full object-cover" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <div>
        <section aria-labelledby="gal-h">
          <h2 id="gal-h" className="border-b border-line pb-3 text-heading">Galleries from your events</h2>
          {galleries.length === 0 ? (
            <p className="mt-3 text-body text-ink-muted">When an event you went to posts photos, its gallery shows up here.</p>
          ) : (
            <ul>
              {galleries.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 border-b border-line py-3">
                  <Link href={`/events/${g.slug}/photos`} className="min-w-0 min-h-6 truncate py-0.5 text-body font-semibold hover:underline">{g.title}</Link>
                  <span className="shrink-0 font-mono text-label text-ink-muted"><span className="font-mono tabular-nums">{g.photos}</span> photos · you&apos;re in <span className="font-mono tabular-nums">{g.mine}</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
