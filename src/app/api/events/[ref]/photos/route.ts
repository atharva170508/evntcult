import { ApiError, handle } from "@/lib/api";
import { requireEventOwner } from "@/lib/rbac";
import { MAX_PHOTO_BYTES, MAX_THUMB_BYTES, savePhoto } from "@/lib/data/photos";
import { getBucket, withPhotos } from "@/lib/data/photos-api";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

/**
 * POST /api/events/:id/photos   (multipart/form-data, one photo per request)
 *   photo  — the image (JPEG / PNG / WebP, max 10 MB; the type is checked from the bytes)
 *   thumb  — optional small JPEG made by the browser
 *   width, height — optional pixel size, for the gallery layout
 * Only the event's organizer (or an admin).
 */
export const POST = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  const viewer = await requireEventOwner(ref);

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_PHOTO_BYTES + MAX_THUMB_BYTES + 64 * 1024) throw new ApiError(413, "too_large", "Photos can be at most 10 MB.");

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new ApiError(400, "bad_form", "Send the photo as multipart/form-data.");
  }
  const photo = form.get("photo");
  const thumb = form.get("thumb");
  if (!(photo instanceof File)) throw new ApiError(400, "no_photo", "Choose a photo to upload.");

  const bucket = await getBucket();
  const saved = await withPhotos(async (db) =>
    savePhoto(db, bucket, {
      eventId: ref,
      uploaderId: viewer.id,
      full: new Uint8Array(await photo.arrayBuffer()),
      thumb: thumb instanceof File && thumb.size > 0 ? new Uint8Array(await thumb.arrayBuffer()) : null,
      width: Number(form.get("width")) || null,
      height: Number(form.get("height")) || null,
    }),
  );
  return Response.json({ ok: true, photo: { id: saved.id } }, { status: 201 });
});
