import { z } from "zod";
import { ApiError, handle } from "@/lib/api";
import { requireEventOwner } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { driveFolderId, parseDriveLink } from "@/lib/googleDrive";
import { nowIso } from "@/lib/time";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ ref: string }> };

const putSchema = z.object({
  url: z.string().trim().min(10, "Paste a Google Drive folder link.").max(500),
});

export const GET = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const db = await getDB();
  const row = await db
    .prepare("SELECT drive_folder_id, drive_folder_url, drive_linked_at FROM events WHERE id = ?")
    .bind(ref)
    .first<{ drive_folder_id: string | null; drive_folder_url: string | null; drive_linked_at: string | null }>();
  return Response.json({
    ok: true,
    folderId: row?.drive_folder_id ?? null,
    folderUrl: row?.drive_folder_url ?? null,
    linkedAt: row?.drive_linked_at ?? null,
  });
});

export const PUT = handle(async (req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);

  const body = await req.json().catch(() => null);
  const parsed = putSchema.safeParse(body);
  if (!parsed.success) {
    throw new ApiError(400, "bad_request", parsed.error.issues[0]?.message ?? "Paste a Google Drive folder link.");
  }

  const raw = parsed.data.url;
  const folderId =
    driveFolderId(raw) ??
    (!raw.includes("/") && parseDriveLink(raw).ok ? raw : null);

  if (!folderId) {
    throw new ApiError(
      400,
      "invalid_drive_folder",
      "That doesn't look like a Google Drive folder link. Copy the link starting with https://drive.google.com/drive/folders/...",
    );
  }

  const normalizedUrl = `https://drive.google.com/drive/folders/${folderId}`;
  const linkedAt = nowIso();
  const db = await getDB();
  await db
    .prepare("UPDATE events SET drive_folder_id = ?, drive_folder_url = ?, drive_linked_at = ? WHERE id = ?")
    .bind(folderId, normalizedUrl, linkedAt, ref)
    .run();

  return Response.json({ ok: true, folderId, folderUrl: normalizedUrl, linkedAt });
});

export const DELETE = handle(async (_req: Request, { params }: Ctx) => {
  const { ref } = await params;
  await requireEventOwner(ref);
  const db = await getDB();
  await db
    .prepare("UPDATE events SET drive_folder_id = NULL, drive_folder_url = NULL, drive_linked_at = NULL WHERE id = ?")
    .bind(ref)
    .run();
  return Response.json({ ok: true });
});
