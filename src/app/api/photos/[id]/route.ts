import { ApiError, handle } from "@/lib/api";
import { getDB } from "@/lib/db";
import { getViewer, requireEventOwner } from "@/lib/rbac";
import { deletePhoto, getPhoto, photoAccess } from "@/lib/data/photos";
import { getBucket, withPhotos } from "@/lib/data/photos-api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/photos/:id?size=thumb  — the image itself, only for people who may see this event's photos.
 * Photos never change for a given id, so the browser may cache them (privately) for a day.
 */
export const GET = handle(async (req: Request, { params }: Ctx) => {
  const { id } = await params;
  const db = await getDB();
  const photo = await getPhoto(db, id);
  const viewer = await getViewer();
  // Same answer for "doesn't exist" and "not allowed", so ids can't be probed.
  if (!photo || !(await photoAccess(db, viewer, photo.event_id)).view) throw new ApiError(404, "not_found", "Photo not found.");

  const thumb = new URL(req.url).searchParams.get("size") === "thumb" && photo.thumb_key;
  const obj = await (await getBucket()).get(thumb ? photo.thumb_key! : photo.r2_key);
  if (!obj) throw new ApiError(404, "not_found", "Photo file is missing.");
  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? photo.content_type ?? "image/jpeg",
      "Cache-Control": "private, max-age=86400",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      ETag: obj.httpEtag,
    },
  });
});

/** DELETE /api/photos/:id — organizer removes a photo (and everyone's tags on it). */
export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const { id } = await params;
  const photo = await getPhoto(await getDB(), id);
  if (!photo) throw new ApiError(404, "not_found", "Photo not found.");
  const viewer = await requireEventOwner(photo.event_id);
  const bucket = await getBucket();
  await withPhotos((db) => deletePhoto(db, bucket, id, viewer.id));
  return Response.json({ ok: true });
});
