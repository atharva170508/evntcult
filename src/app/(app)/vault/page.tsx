import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, ArrowUpRight, CheckCircle2, Download, Images, ScanFace } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { myGalleries, myTaggedPhotos } from "@/lib/data/photos";
import { myAutoMatchedPhotos, syncUserAutoVault, type AutoVaultPhoto } from "@/lib/data/auto-vault";
import { fmtDate } from "@/lib/utils";
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
    <div className="space-y-10 pb-14">
      {/* Editorial Photo Vault Masthead */}
      <header className="flex flex-col gap-5 border-b border-line pb-7 pt-8 sm:flex-row sm:items-end sm:justify-between md:pt-10">
        <div>
          <h1 className="font-display text-[clamp(40px,5vw,64px)] leading-[0.95] tracking-[-0.03em] text-ink">
            Your photo <em>vault.</em>
          </h1>
          <p className="mt-2.5 text-[15px] text-ink-muted">
            Every photo of you from campus events, automatically matched via on-device Face ID.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="font-mono text-[13px] font-semibold tabular-nums text-ink-muted">
            {totalPhotos} {totalPhotos === 1 ? "photo" : "photos"}
          </span>
          {viewer.hasFaceId ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-live-soft px-3 py-1 text-[12.5px] font-semibold text-live">
              <CheckCircle2 className="size-3.5" aria-hidden /> Auto-Vault Active
            </span>
          ) : (
            <Link
              href="/profile"
              className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1 text-[12.5px] font-semibold text-ink hover:bg-sunken"
            >
              <ScanFace className="size-3.5 text-ink-muted" aria-hidden /> Set up Face ID
            </Link>
          )}
        </div>
      </header>

      {/* Auto-Vault Activation Callout if not enrolled */}
      {!viewer.hasFaceId && (
        <FaceIdEnrollCard
          title="Activate Automatic Photo Vault"
          subtitle="Take a 1-time selfie so photos from every event you attend automatically land in your Vault without searching."
        />
      )}

      {byEvent.size === 0 ? (
        <section className="grid items-center gap-8 overflow-hidden rounded-[28px] bg-[#141312] p-7 text-[#FFFEF6] shadow-[0_32px_64px_-32px_rgba(20,14,6,0.6)] sm:p-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] font-semibold tracking-[0.06em] text-[#F0D7FF]">
              <Images className="size-3.5" aria-hidden />
              DARKROOM LIGHT TABLE
            </span>
            <h2 className="mt-4 font-display text-[clamp(30px,3.6vw,44px)] leading-[1.02] tracking-[-0.025em] text-[#FFFEF6]">
              No event photos matched yet.
            </h2>
            <p className="mt-3 max-w-[46ch] text-[15px] leading-relaxed text-[#FFFEF6]/70">
              {viewer.hasFaceId
                ? "Your Face ID is active. The moment organizers link their Google Drive album or upload event photos, shots with you in them drop straight here."
                : "Enroll your 1-time Face ID above so you never have to scroll through 2,000 Drive photos after a fest again."}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <Link
                href={galleries.length ? `/events/${galleries[0].slug}/photos` : "/events"}
                className="ui-press inline-flex h-12 items-center gap-2 rounded-xl bg-[#F0D7FF] px-6 text-[15px] font-semibold text-[#1A1A1A] hover:bg-[#E6C4FB]"
              >
                {galleries.length ? "Browse your galleries" : "Discover events"}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/passes"
                className="text-[14.5px] font-semibold text-[#FFFEF6]/80 underline decoration-white/25 underline-offset-[6px] hover:text-white"
              >
                Open my passes
              </Link>
            </div>
          </div>

          {/* 3-frame contact sheet preview */}
          <div aria-hidden className="grid grid-cols-3 gap-2.5">
            {["EXP 01", "EXP 02", "EXP 03"].map((frame) => (
              <div
                key={frame}
                className="flex aspect-[3/4] flex-col justify-between rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
              >
                <span className="font-mono text-[9px] tracking-[0.1em] text-[#FFFEF6]/45">{frame}</span>
                <span className="h-1 w-8 rounded-full bg-white/15" />
              </div>
            ))}
          </div>
        </section>
      ) : (
        [...byEvent.entries()].map(([eventId, g]) => {
          const count = g.manualIds.length + g.autoPhotos.length;
          return (
            <section key={eventId} aria-label={g.title} className="space-y-5">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-line pb-3">
                <div>
                  <h2 className="font-display text-[30px] leading-none tracking-[-0.02em] text-ink">{g.title}</h2>
                  <p className="mt-1.5 font-mono text-[12.5px] text-ink-muted">
                    {fmtDate(new Date(g.startsAt), { day: "numeric", month: "short", year: "numeric" })} · {count} photo{count === 1 ? "" : "s"}
                  </p>
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
