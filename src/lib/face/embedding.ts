/**
 * 128-d face embeddings (M11 AI Face Search).
 *
 * Produced by @vladmandic/face-api's FaceRecognitionNet: in the browser for the selfie,
 * and in scripts/index-drive-album.ts for event photos. Same weights on both sides, so the
 * numbers are comparable. We L2-normalise every vector, so cosine similarity in pgvector
 * is just the dot product and scores are comparable across photos.
 *
 * Pure functions: safe in the browser, the Worker and Node.
 */
export const EMBEDDING_DIM = 128;

/**
 * Check and normalise an embedding. Returns null for anything that isn't 128 finite numbers
 * of a plausible size (face-api descriptors have a length of roughly 1–2).
 */
export function normalizeEmbedding(input: unknown): number[] | null {
  if (!Array.isArray(input) && !(input instanceof Float32Array)) return null;
  const v = Array.from(input as ArrayLike<unknown>);
  if (v.length !== EMBEDDING_DIM || !v.every((x) => typeof x === "number" && Number.isFinite(x))) return null;
  const nums = v as number[];
  const norm = Math.hypot(...nums);
  if (!(norm > 0.05 && norm < 50)) return null;
  // 6 decimals is far more precision than the model has, and keeps payloads small.
  return nums.map((x) => Math.round((x / norm) * 1e6) / 1e6);
}

/** pgvector text format: "[0.1,0.2,...]" */
export const toPgVector = (v: number[]) => `[${v.join(",")}]`;

/** Cosine similarity of two normalised vectors. */
export const similarity = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0);

/** "96% Match" style label. Similarities below the threshold never reach the UI. */
export const matchPercent = (sim: number) => Math.max(0, Math.min(100, Math.round(sim * 100)));
