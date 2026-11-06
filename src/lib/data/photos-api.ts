import "server-only";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { ApiError } from "@/lib/api";
import { getDB } from "@/lib/db";
import { PhotoError } from "./photos";

/** The R2 bucket, or a clear error if it hasn't been created/bound yet. */
export async function getBucket(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  const bucket = (env as CloudflareEnv).PHOTOS;
  if (!bucket) throw new ApiError(503, "storage_unavailable", "Photo storage isn't set up yet.");
  return bucket;
}

/** Run a photos.ts call and turn its errors into API errors. */
export async function withPhotos<T>(fn: (db: D1Database) => Promise<T>): Promise<T> {
  try {
    return await fn(await getDB());
  } catch (err) {
    if (err instanceof PhotoError) throw new ApiError(err.status, err.code, err.message);
    throw err;
  }
}
