import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, Images, Lock, ScanFace } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { first, getDB } from "@/lib/db";
import { eventPhotos, photoAccess } from "@/lib/data/photos";
import { fmtDate } from "@/lib/utils";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { PhotoUploader } from "@/components/photos/PhotoUploader";
import { PageHero } from "@/components/brand/PageHero";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { photoStorageReady } from "@/lib/data/photos-api";
import { supabaseConfig } from "@/lib/supabase-rest";
import { AIFaceMatcher } from "@/components/photos/AIFaceMatcher";

export const metadata: Metadata = { title: "Photos" };
export const dynamic = "force-dynamic";

export default async function EventPhotosPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ view?: string }> }) {
  const [{ slug }, { view }] = await Promise.all([params, searchParams]);
  const aiView = view === "ai";
  const event = await first<{ id: string; slug: string; title: string; starts_at: string; status: string }>(
    "SELECT id, slug, title, starts_at, status FROM events WHERE slug = ? OR id = ?",
    slug,
    slug,
  );
  if (!event || event.status === "draft") notFound();

  const viewer = await getViewer();
  const db = await getDB();
  const access = await photoAccess(db, viewer, event.id);
  const storageReady = await photoStorageReady();
  const back = (
    <Link href={`/events/${event.slug}`} className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-muted transition-colors hover:text-ink">
      <ArrowLeft className="size-4 transition-transform duration-base ease-out group-hover:-translate-x-0.5" aria-hidden /> {event.title}
    </Link>
  );

  if (!access.view) {
    return (
      <div className="space-y-8 pb-8 pt-6 md:pt-8">
        {back}
        <section className="card flex flex-col items-start p-8 md:p-12">
          <span className="grid size-11 place-items-center text-ink-2">
            <Lock className="size-5" aria-hidden />
          </span>
          <h1 className="mt-6 max-w-lg text-display-md font-semibold">Photos are for people who registered.</h1>
          <p className="mt-3 max-w-md text-body text-ink-muted">
            Only this event&apos;s registered attendees and its organizer can see its photos.
            {!viewer && " Sign in with the account you registered with."}
          </p>
          {!viewer && (
            <LinkButton href={`/signin?next=${encodeURIComponent(`/events/${event.slug}/photos`)}`} className="mt-6">
              Sign in
            </LinkButton>
          )}
        </section>
      </div>
    );
  }

  const photos = await eventPhotos(db, event.id, viewer!.id);
  const tagged = photos.filter((p) => p.mine).length;

  return (
    <div className="space-y-8 pb-8 pt-6 md:pt-8">
      {back}
      <PageHero
        className="pt-0 md:pt-0"
        eyebrow={`Photos, ${fmtDate(new Date(event.starts_at), { day: "numeric", month: "short", year: "numeric" })}`}
        title={event.title}
        sub={
          photos.length === 0 ? (
            "No photos yet."
          ) : (
            <span className="tabular-nums">
              {photos.length.toLocaleString("en-IN")} {photos.length === 1 ? "photo" : "photos"}
              {access.tag && tagged > 0 && <>, you&apos;re in {tagged}</>}
            </span>
          )
        }
      />

      {/* Two ways to find yourself: the manual gallery (R2, "That's me") and AI Face Search (Drive + Supabase). */}
      <nav aria-label="Photo views" className="inline-flex rounded-full bg-sunken p-1">
        {[
          { href: `/events/${event.slug}/photos`, label: "All photos", icon: Images, active: !aiView },
          { href: `/events/${event.slug}/photos?view=ai`, label: "AI Face Search", icon: ScanFace, active: aiView },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-[13.5px] font-medium transition-[background-color,color,box-shadow] duration-fast ${tab.active ? "bg-surface text-ink shadow-card" : "text-ink-muted hover:text-ink"}`}
          >
            <tab.icon className="size-4" aria-hidden /> {tab.label}
          </Link>
        ))}
      </nav>

      {aiView ? (
        supabaseConfig() ? (
          <AIFaceMatcher eventId={event.id} eventTitle={event.title} />
        ) : (
          <section className="card flex flex-col items-start p-8 md:p-10">
            <span className="grid size-11 place-items-center text-ink-2">
              <ScanFace className="size-5" aria-hidden />
            </span>
            <h2 className="mt-6 text-display-md font-semibold">AI Face Search isn&apos;t on yet.</h2>
            <p className="mt-3 max-w-md text-body text-ink-muted">
              It starts working once the photo database is connected and the photographers&apos; album has been indexed. Until then, use <b>All photos</b> and tap <b>That&apos;s me</b>.
            </p>
          </section>
        )
      ) : (
        <>
      {access.manage && storageReady && (
        <section aria-labelledby="upload-h" className="card p-5 md:p-6">
          <h2 id="upload-h" className="mb-4 text-h4 font-semibold">Upload photos</h2>
          <PhotoUploader eventId={event.id} />
        </section>
      )}

      {photos.length === 0 ? (
        <EmptyState icon={Camera} title="No photos yet" body={access.manage ? "Add the first ones above." : "The organizer hasn't uploaded any photos yet."} />
      ) : (
        <PhotoGrid photos={photos.map((p) => ({ id: p.id, width: p.width, height: p.height, mine: p.mine === 1 }))} canTag={access.tag} canManage={access.manage} />
      )}
        </>
      )}
    </div>
  );
}
