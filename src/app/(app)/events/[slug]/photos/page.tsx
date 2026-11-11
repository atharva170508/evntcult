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
    <Link href={`/events/${event.slug}`} className="inline-flex items-center gap-2 text-body-sm font-semibold text-ink-muted hover:text-ink">
      <ArrowLeft className="size-4" /> {event.title}
    </Link>
  );

  if (!access.view) {
    return (
      <div className="space-y-6 pt-4 md:pt-6">
        {back}
        <section className="card flex flex-col items-start gap-3 p-8">
          <Lock className="size-8 text-ink-subtle" />
          <h1 className="title-xl text-display">Photos are for people who registered</h1>
          <p className="max-w-md text-body text-ink-muted">
            Only this event&apos;s registered attendees and its organizer can see its photos.
            {!viewer && " Sign in with the account you registered with."}
          </p>
          {!viewer && (
            <Link href={`/signin?next=${encodeURIComponent(`/events/${event.slug}/photos`)}`} className="rounded-full bg-volt px-6 py-3 text-body font-semibold text-ink-inverse">Sign in</Link>
          )}
        </section>
      </div>
    );
  }

  const photos = await eventPhotos(db, event.id, viewer!.id);
  const tagged = photos.filter((p) => p.mine).length;

  return (
    <div className="space-y-6 pt-4 md:pt-6">
      {back}
      <PageHero
        eyebrow={`Photos · ${fmtDate(new Date(event.starts_at), { day: "numeric", month: "short", year: "numeric" })}`}
        title={event.title}
        sub={
          <>
            <span className="font-mono tabular-nums">{photos.length}</span> photo{photos.length === 1 ? "" : "s"}
            {access.tag && <> · you&apos;re in <span className="font-mono tabular-nums">{tagged}</span></>}
          </>
        }
      />

      {/* Two ways to find yourself: the manual gallery (R2, "That's me") and AI Face Search (Drive + Supabase). */}
      <nav aria-label="Photo views" className="flex gap-2">
        {[
          { href: `/events/${event.slug}/photos`, label: "All photos", icon: Images, active: !aiView },
          { href: `/events/${event.slug}/photos?view=ai`, label: "AI Face Search", icon: ScanFace, active: aiView },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            aria-current={tab.active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-3 text-body font-semibold transition-colors ${tab.active ? "border-volt bg-volt text-ink-inverse" : "border-line bg-surface text-ink-2 hover:border-volt/60"}`}
          >
            <tab.icon className="size-4" aria-hidden /> {tab.label}
          </Link>
        ))}
      </nav>

      {aiView ? (
        supabaseConfig() ? (
          <AIFaceMatcher eventId={event.id} eventTitle={event.title} />
        ) : (
          <section className="card flex flex-col items-start gap-3 p-8">
            <ScanFace className="size-8 text-ink-subtle" aria-hidden />
            <h2 className="title-xl text-display">AI Face Search isn&apos;t switched on yet</h2>
            <p className="max-w-md text-body text-ink-muted">
              It starts working once the photo database is connected and the photographers&apos; album has been indexed. Until then, use <b>All photos</b> and tap <b>That&apos;s me</b>.
            </p>
          </section>
        )
      ) : (
        <>
      {access.manage && storageReady && (
        <section className="card p-6">
          <h2 className="headline mb-3 text-title">Upload photos</h2>
          <PhotoUploader eventId={event.id} />
        </section>
      )}

      {photos.length === 0 ? (
        <section className="card flex flex-col items-start gap-2 p-8">
          <Camera className="size-8 text-ink-subtle" />
          <h2 className="title-xl text-display">No photos yet</h2>
          <p className="text-body text-ink-muted">{access.manage ? "Add the first ones above." : "The organizer hasn't uploaded any photos yet."}</p>
        </section>
      ) : (
        <PhotoGrid photos={photos.map((p) => ({ id: p.id, width: p.width, height: p.height, mine: p.mine === 1 }))} canTag={access.tag} canManage={access.manage} />
      )}
        </>
      )}
    </div>
  );
}
