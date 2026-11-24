import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, CheckCircle2, Download, Images, ScanFace, Sparkles } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { myGalleries, myTaggedPhotos } from "@/lib/data/photos";
import { myAutoMatchedPhotos, syncUserAutoVault, type AutoVaultPhoto } from "@/lib/data/auto-vault";
import { fmtDate } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton } from "@/components/ui/Button";
import { FaceIdEnrollCard } from "@/components/photos/FaceIdEnrollCard";

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

  // If user has Face ID active, auto-sync any new event photos before rendering
  if (viewer.hasFaceId) {
    await syncUserAutoVault(db, viewer.id).catch(() => ({ syncedEvents: 0, matchedPhotos: 0 }));
  }

  const [tagged, galleries, autoPhotos] = await Promise.all([
    myTaggedPhotos(db, viewer.id),
    myGalleries(db, viewer.id),
    myAutoMatchedPhotos(db, viewer.id).catch(() => [] as AutoVaultPhoto[]),
  ]);

  // Group photos by event
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
    // Avoid duplicate if already in manualIds
    if (!g.manualIds.includes(a.photoId)) {
      g.autoPhotos.push(a);
    }
    byEvent.set(a.eventId, g);
  }

  const totalPhotos = tagged.length + autoPhotos.length;

  return (
    <div className="space-y-12 pb-8">
      <PageHero
        title="Photo Vault"
        sub={
          <div className="flex flex-wrap items-center gap-3">
            <span>
              {totalPhotos} photo{totalPhotos === 1 ? "" : "s"} of you
            </span>
            {viewer.hasFaceId && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-live-soft px-3 py-0.5 text-[12px] font-semibold text-live">
                <CheckCircle2 className="size-3" aria-hidden /> Auto-Vault Active
              </span>
            )}
          </div>
        }
      />

      {/* Auto-Vault Activation Callout if not enrolled */}
      {!viewer.hasFaceId && (
        <FaceIdEnrollCard
          title="Activate Automatic Photo Vault"
          subtitle="Take a 1-time selfie so photos from every event you attend automatically land in your Vault without searching."
        />
      )}

      {byEvent.size === 0 ? (
        <EmptyState
          art="photos"
          icon={Images}
          title="No photos of you yet."
          body={
            viewer.hasFaceId
              ? "Your Face ID is active! As soon as organizers upload photos from your registered events, they will automatically appear here."
              : "Enable Auto-Vault above with a 1-time selfie, or browse your event galleries below."
          }
          action={
            galleries.length
              ? { label: "Browse your galleries", href: `/events/${galleries[0].slug}/photos` }
              : { label: "Find an event", href: "/events" }
          }
        />
      ) : (
        [...byEvent.entries()].map(([eventId, g]) => {
          const count = g.manualIds.length + g.autoPhotos.length;
          return (
            <section key={eventId} aria-label={g.title} className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="eyebrow">
                    {fmtDate(new Date(g.startsAt), { day: "numeric", month: "short", year: "numeric" })}, {count} of you
                  </p>
                  <h2 className="mt-2 text-display-md font-semibold">{g.title}</h2>
                </div>
                <LinkButton href={`/events/${g.slug}/photos`} variant="secondary" size="sm">
                  All photos <ArrowRight className="size-3.5" aria-hidden />
                </LinkButton>
              </div>

              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                {/* R2 manual tagged photos */}
                {g.manualIds.map((id) => (
                  <li key={id} className="group relative aspect-square overflow-hidden rounded-tile bg-sunken">
                    <a href={`/api/photos/${id}`} target="_blank" rel="noopener" aria-label="Open full size" className="block size-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/photos/${id}?size=thumb`} alt="" loading="lazy" className="size-full object-cover transition-transform duration-slow ease-out group-hover:scale-105" />
                    </a>
                  </li>
                ))}

                {/* AI Auto-matched photos */}
                {g.autoPhotos.map((m) => (
                  <li key={m.photoId} className="group relative aspect-square overflow-hidden rounded-tile bg-sunken">
                    <a href={m.downloadUrl} target="_blank" rel="noopener noreferrer" aria-label="Download Full HD" className="block size-full">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.thumbnailUrl} alt="" loading="lazy" className="size-full object-cover transition-transform duration-slow ease-out group-hover:scale-105" />
                      <span className="absolute bottom-1.5 right-1.5 flex size-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-opacity group-hover:bg-volt group-hover:text-ink">
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
                      <span className="font-mono tabular-nums text-ink">{g.photos}</span> photos, you&apos;re in <span className="font-mono tabular-nums text-ink">{g.mine}</span>
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
