import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, CheckCircle2, Download, ScanFace } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { myGalleries, myTaggedPhotos } from "@/lib/data/photos";
import { myAutoMatchedPhotos, syncUserAutoVault, type AutoVaultPhoto } from "@/lib/data/auto-vault";
import { fmtDate } from "@/lib/utils";
import { FaceIdEnrollCard } from "@/components/photos/FaceIdEnrollCard";
import { PageHero } from "@/components/brand/PageHero";

export const metadata: Metadata = { title: "Photo Vault" };
export const dynamic = "force-dynamic";

interface EventGroup {
  slug: string;
  title: string;
  startsAt: string;
  manualIds: string[];
  autoPhotos: AutoVaultPhoto[];
}

export default async function VaultPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin?next=/vault");
  const db = await getDB();

  if (viewer.hasFaceId) {
    await syncUserAutoVault(db, viewer.id).catch(() => ({ syncedEvents: 0, matchedPhotos: 0 }));
  }

  const [tagged, galleries, autoPhotos] = await Promise.all([
    myTaggedPhotos(db, viewer.id),
    myGalleries(db, viewer.id),
    myAutoMatchedPhotos(db, viewer.id).catch(() => [] as AutoVaultPhoto[]),
  ]);

  const byEvent = new Map<string, EventGroup>();

  for (const p of tagged) {
    const g = byEvent.get(p.event_id) ?? {
      slug: p.event_slug,
      title: p.event_title,
      startsAt: p.starts_at,
      manualIds: [],
      autoPhotos: [],
    };
    g.manualIds.push(p.id);
    byEvent.set(p.event_id, g);
  }

  for (const a of autoPhotos) {
    const g = byEvent.get(a.eventId) ?? {
      slug: a.eventSlug,
      title: a.eventTitle,
      startsAt: a.startsAt,
      manualIds: [],
      autoPhotos: [],
    };
    if (!g.manualIds.includes(a.photoId)) g.autoPhotos.push(a);
    byEvent.set(a.eventId, g);
  }

  const totalPhotos = tagged.length + autoPhotos.length;

  return (
    <div className="space-y-12 pb-16">
      <PageHero
        title={
          <>
            Photo <span className="text-[#D4B87A]">Vault.</span>
          </>
        }
        actions={
          <div className="flex items-center gap-4">
            <span className="tr-meta text-ink-muted">
              {totalPhotos} {totalPhotos === 1 ? "photo" : "photos"}
            </span>
            {viewer.hasFaceId ? (
              <span className="tr-meta inline-flex items-center gap-1.5 text-[#D4B87A]">
                <CheckCircle2 className="size-3.5" aria-hidden /> Active
              </span>
            ) : (
              <Link
                href="/profile"
                className="tr-meta inline-flex min-h-[40px] items-center gap-1.5 rounded-[4px] border border-line-strong px-3.5 text-ink hover:border-[#D4B87A] hover:text-[#D4B87A]"
              >
                <ScanFace className="size-3.5" aria-hidden /> Enroll Face ID
              </Link>
            )}
          </div>
        }
      />

      {!viewer.hasFaceId && (
        <FaceIdEnrollCard
          title="Activate Photo Vault"
          subtitle="One selfie automatically gathers your photos from events you attend."
        />
      )}

      {byEvent.size === 0 ? (
        <section className="relative overflow-hidden rounded-[6px] border border-line bg-surface p-8 md:p-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/stage-spotlight.jpg"
            alt=""
            className="absolute inset-0 size-full object-cover opacity-25"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(22,24,32,0.96) 0%, rgba(22,24,32,0.78) 65%, rgba(22,24,32,0.55) 100%)",
            }}
          />
          <div className="relative z-10 max-w-[520px]">
            <h2 className="font-display text-[clamp(34px,4.2vw,54px)] font-bold italic leading-[0.94] text-[#EFEAE0]">
              No photos matched yet.
            </h2>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href={galleries.length ? `/events/${galleries[0].slug}/photos` : "/events"}
                className="group inline-flex h-12 items-center gap-2 rounded-[4px] bg-[#D4B87A] px-7 text-[11px] font-medium uppercase tracking-[0.14em] text-[#161820] transition-colors hover:bg-[#E0C78E]"
              >
                <span>{galleries.length ? "Open galleries" : "Explore events"}</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
              <Link
                href="/passes"
                className="inline-flex h-12 items-center rounded-[4px] border border-[#EFEAE0]/25 px-6 text-[11px] font-medium uppercase tracking-[0.14em] text-[#EFEAE0] transition-colors hover:border-[#D4B87A] hover:text-[#D4B87A]"
              >
                My passes
              </Link>
            </div>
          </div>
        </section>
      ) : (
        [...byEvent.entries()].map(([eventId, g]) => {
          const count = g.manualIds.length + g.autoPhotos.length;
          return (
            <section key={eventId} aria-label={g.title} className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h2 className="font-display text-[32px] font-bold italic leading-none text-ink">{g.title}</h2>
                  <p className="tr-meta mt-2 text-ink-muted">
                    {fmtDate(new Date(g.startsAt), { day: "numeric", month: "short", year: "numeric" })} · {count}
                  </p>
                </div>
                <Link href={`/events/${g.slug}/photos`} className="tr-meta tr-link inline-flex items-center gap-1 text-[#D4B87A]">
                  All photos <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </div>

              <ul className="grid grid-cols-2 gap-[3px] sm:grid-cols-4 lg:grid-cols-6">
                {g.manualIds.map((id) => (
                  <li key={id} className="group relative aspect-square overflow-hidden bg-surface">
                    <a href={`/api/photos/${id}`} target="_blank" rel="noopener" aria-label="Open full size" className="block size-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/photos/${id}?size=thumb`} alt="" loading="lazy" className="size-full object-cover transition-transform duration-slow ease-out group-hover:scale-105" />
                    </a>
                  </li>
                ))}

                {g.autoPhotos.map((m) => (
                  <li key={m.photoId} className="group relative aspect-square overflow-hidden bg-surface">
                    <a href={m.downloadUrl} target="_blank" rel="noopener noreferrer" aria-label="Download" className="block size-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.thumbnailUrl} alt="" loading="lazy" className="size-full object-cover transition-transform duration-slow ease-out group-hover:scale-105" />
                      <span className="absolute bottom-2 right-2 flex size-7 items-center justify-center rounded-full bg-[#161820]/85 text-[#D4B87A] opacity-0 transition-opacity group-hover:opacity-100">
                        <Download className="size-3.5" aria-hidden />
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      {galleries.length > 0 && (
        <section aria-labelledby="galleries-heading" className="space-y-4">
          <h2 id="galleries-heading" className="border-b border-line pb-3 font-display text-[32px] font-bold italic text-ink">
            Event Galleries
          </h2>
          <ul className="divide-y divide-line border-b border-line">
            {galleries.map((g) => (
              <li key={g.id}>
                <Link
                  href={`/events/${g.slug}/photos`}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors hover:bg-surface sm:px-3"
                >
                  <span className="min-w-0 truncate font-display text-[24px] font-semibold italic text-ink group-hover:text-[#D4B87A]">
                    {g.title}
                  </span>
                  <span className="tr-meta flex shrink-0 items-center gap-3 text-ink-muted">
                    <span>{g.photos} photos</span>
                    <ArrowUpRight className="size-4 text-[#D4B87A]" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
