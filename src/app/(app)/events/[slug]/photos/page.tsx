import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Camera, Lock } from "lucide-react";
import { getViewer } from "@/lib/rbac";
import { first, getDB } from "@/lib/db";
import { eventPhotos, photoAccess } from "@/lib/data/photos";
import { fmtDate } from "@/lib/utils";
import { PhotoGrid } from "@/components/photos/PhotoGrid";
import { PhotoUploader } from "@/components/photos/PhotoUploader";

export const metadata: Metadata = { title: "Photos" };
export const dynamic = "force-dynamic";

export default async function EventPhotosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const event = await first<{ id: string; slug: string; title: string; starts_at: string; status: string }>(
    "SELECT id, slug, title, starts_at, status FROM events WHERE slug = ? OR id = ?",
    slug,
    slug,
  );
  if (!event || event.status === "draft") notFound();

  const viewer = await getViewer();
  const db = await getDB();
  const access = await photoAccess(db, viewer, event.id);
  const back = (
    <Link href={`/events/${event.slug}`} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink-muted hover:text-ink">
      <ArrowLeft className="size-4" /> {event.title}
    </Link>
  );

  if (!access.view) {
    return (
      <div className="space-y-5 pt-4 md:pt-6">
        {back}
        <section className="card flex flex-col items-start gap-3 p-8">
          <Lock className="size-8 text-ink-subtle" />
          <h1 className="headline text-[22px]">Photos are for people who registered</h1>
          <p className="max-w-md text-[14.5px] text-ink-muted">
            Only this event&apos;s registered attendees and its organizer can see its photos.
            {!viewer && " Sign in with the account you registered with."}
          </p>
          {!viewer && (
            <Link href={`/signin?next=${encodeURIComponent(`/events/${event.slug}/photos`)}`} className="rounded-full bg-ink px-5 py-2.5 text-[14px] font-semibold text-white">Sign in</Link>
          )}
        </section>
      </div>
    );
  }

  const photos = await eventPhotos(db, event.id, viewer!.id);
  const tagged = photos.filter((p) => p.mine).length;

  return (
    <div className="space-y-5 pt-4 md:pt-6">
      {back}
      <header>
        <p className="eyebrow">Photos · {fmtDate(new Date(event.starts_at), { day: "numeric", month: "short", year: "numeric" })}</p>
        <h1 className="headline mt-1 text-[clamp(28px,4vw,40px)] tracking-tightest">{event.title}</h1>
        <p className="mt-1 text-[14px] text-ink-muted">
          <span className="font-mono tabular-nums">{photos.length}</span> photo{photos.length === 1 ? "" : "s"}
          {access.tag && <> · you&apos;re in <span className="font-mono tabular-nums">{tagged}</span>. Tap <b>That&apos;s me</b> on photos you appear in to save them to your Vault.</>}
        </p>
      </header>

      {access.manage && (
        <section className="card p-5">
          <h2 className="headline mb-3 text-[17px]">Upload photos</h2>
          <PhotoUploader eventId={event.id} />
        </section>
      )}

      {photos.length === 0 ? (
        <section className="card flex flex-col items-start gap-2 p-8">
          <Camera className="size-8 text-ink-subtle" />
          <h2 className="headline text-[19px]">No photos yet</h2>
          <p className="text-[14px] text-ink-muted">{access.manage ? "Add the first ones above." : "The organizer hasn't uploaded any photos yet."}</p>
        </section>
      ) : (
        <PhotoGrid photos={photos.map((p) => ({ id: p.id, width: p.width, height: p.height, mine: p.mine === 1 }))} canTag={access.tag} canManage={access.manage} />
      )}
    </div>
  );
}
