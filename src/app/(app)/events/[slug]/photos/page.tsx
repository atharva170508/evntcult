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
import { PageHero } from "@/components/brand/PageHero";
import { LinkButton } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Notice } from "@/components/ui/Field";
import { photoStorageReady } from "@/lib/data/photos-api";

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
          <span className="grid size-11 place-items-center rounded-tile bg-sunken text-ink-2">
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
        eyebrow={`Photos · ${fmtDate(new Date(event.starts_at), { day: "numeric", month: "short", year: "numeric" })}`}
        title={event.title}
        sub={
          <>
            <span className="font-mono tabular-nums text-ink">{photos.length}</span> photo{photos.length === 1 ? "" : "s"}
            {access.tag && (
              <>
                {" "}
                · you&apos;re in <span className="font-mono tabular-nums text-ink">{tagged}</span>. Tap <span className="font-medium text-ink">That&apos;s me</span> on photos you appear in to save them to your Vault.
              </>
            )}
          </>
        }
      />

      {access.manage && (
        <section aria-labelledby="upload-heading" className="card p-5 md:p-6">
          <h2 id="upload-heading" className="mb-4 text-h4 font-semibold">
            Upload photos
          </h2>
          {storageReady ? <PhotoUploader eventId={event.id} /> : <Notice icon={Camera}>Photo storage isn&apos;t set up yet. Uploads open once Cloudflare R2 is turned on for this site.</Notice>}
        </section>
      )}

      {photos.length === 0 ? (
        <EmptyState icon={Camera} title="No photos yet" body={access.manage ? "Add the first ones above." : "The organizer hasn't uploaded any photos yet."} />
      ) : (
        <PhotoGrid photos={photos.map((p) => ({ id: p.id, width: p.width, height: p.height, mine: p.mine === 1 }))} canTag={access.tag} canManage={access.manage} />
      )}
    </div>
  );
}
