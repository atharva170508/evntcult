import { z } from "zod";
import { ApiError, handle, parseBody } from "@/lib/api";
import { requireUser } from "@/lib/rbac";
import { getDB } from "@/lib/db";
import { EMBEDDING_DIM, centroidEmbedding, normalizeEmbedding } from "@/lib/face/embedding";
import { deleteUserFaceId, getUserFaceId, saveUserFaceId, syncUserAutoVault } from "@/lib/data/auto-vault";

export const dynamic = "force-dynamic";

const postSchema = z
  .object({
    embedding: z.array(z.number().finite()).length(EMBEDDING_DIM).optional(),
    embeddings: z.array(z.array(z.number().finite()).length(EMBEDDING_DIM)).min(1).max(6).optional(),
  })
  .refine((d) => Boolean(d.embedding || (d.embeddings && d.embeddings.length > 0)), {
    message: "A face embedding must be provided",
  });

/**
 * GET /api/me/face-id — Check current Face ID enrollment status.
 */
export const GET = handle(async () => {
  const viewer = await requireUser();
  const db = await getDB();
  const res = await getUserFaceId(db, viewer.id);
  return Response.json({ enrolled: res.enrolled, updatedAt: res.updatedAt });
});

/**
 * POST /api/me/face-id — Save/update the user's 1-time Face ID descriptor and auto-sync events.
 */
export const POST = handle(async (req: Request) => {
  const viewer = await requireUser();
  const db = await getDB();
  const parsed = await parseBody(req, postSchema);

  const vectors: number[][] = [];
  if (parsed.embedding) vectors.push(parsed.embedding);
  if (parsed.embeddings) vectors.push(...parsed.embeddings);

  const valid = vectors
    .map((v) => normalizeEmbedding(v))
    .filter((v): v is number[] => v !== null);

  if (valid.length === 0) {
    throw new ApiError(400, "bad_embedding", "Could not read face numbers from photo.");
  }

  // Use the centroid if multiple angles were provided, or the single vector
  const embedding = valid.length > 1 ? centroidEmbedding(valid) ?? valid[0] : valid[0];

  const result = await saveUserFaceId(db, viewer.id, embedding);
  return Response.json(result);
});

/**
 * PUT /api/me/face-id — Re-sync existing Face ID across registered events (e.g. after new photos are uploaded).
 */
export const PUT = handle(async () => {
  const viewer = await requireUser();
  const db = await getDB();
  const sync = await syncUserAutoVault(db, viewer.id);
  return Response.json({ ok: true, ...sync });
});

/**
 * DELETE /api/me/face-id — Remove the user's Face ID descriptor.
 */
export const DELETE = handle(async () => {
  const viewer = await requireUser();
  const db = await getDB();
  await deleteUserFaceId(db, viewer.id);
  return Response.json({ ok: true });
});
