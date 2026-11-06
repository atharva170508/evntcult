import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Images, ScanFace } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { myGalleries, myTaggedPhotos } from "@/lib/data/photos";
import { fmtDate } from "@/lib/utils";
import { PlannedCard } from "@/components/dashboard/sections";
import { PageHero } from "@/components/brand/PageHero";

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
    <div className="space-y-6 pt-4 md:pt-6">
      <PageHero
        eyebrow="Photo Vault"
        title={<>Photos <em>of you</em></>}
        sub={
          <>
            <span className="font-mono tabular-nums">{tagged.length}</span> photo{tagged.length === 1 ? "" : "s"} you&apos;ve tagged yourself in. Only you see your tags.
          </>
        }
        marquee={["Relive it", "Photo Vault"]}
      />

      {byEvent.size === 0 ? (
        <section className="card flex flex-col items-start gap-3 p-8">
          <Images className="size-8 text-ink-subtle" />
          <h2 className="title-serif text-[32px]">Nothing here yet</h2>
          <p className="max-w-md text-[14.5px] text-ink-muted">
            Open the photos from an event you went to and tap <b>That&apos;s me</b> on the ones you&apos;re in. They&apos;ll collect here.
          </p>
        </section>
      ) : (
        [...byEvent.entries()].map(([eventId, g]) => (
          <section key={eventId} className="space-y-3">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="title-serif text-[32px]">{g.title}</h2>
                <p className="text-[12.5px] text-ink-muted">{fmtDate(new Date(g.startsAt), { day: "numeric", month: "short", year: "numeric" })} · {g.ids.length} of you</p>
              </div>
              <Link href={`/events/${g.slug}/photos`} className="text-[13px] font-semibold text-ink underline">All photos</Link>
            </div>
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
              {g.ids.map((id) => (
                <li key={id} className="aspect-square overflow-hidden rounded-2xl bg-canvas">
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

      <div className="grid gap-4 md:grid-cols-2">
        <section className="card p-5">
          <h2 className="title-serif text-[32px]">Galleries from your events</h2>
          {galleries.length === 0 ? (
            <p className="mt-2 text-[14px] text-ink-muted">When organizers upload photos from events you registered for, they&apos;ll be listed here.</p>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {galleries.map((g) => (
                <li key={g.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/events/${g.slug}/photos`} className="min-w-0 truncate text-[14.5px] font-semibold hover:underline">{g.title}</Link>
                  <span className="shrink-0 text-[12.5px] text-ink-muted"><span className="font-mono tabular-nums">{g.photos}</span> photos · you&apos;re in <span className="font-mono tabular-nums">{g.mine}</span></span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <PlannedCard eyebrow="Find me automatically" title="Face matching" icon={ScanFace} body="Upload one selfie and EvntCult would suggest photos you appear in. Not built: for now, tag yourself with “That's me”." />
      </div>
    </div>
  );
}
