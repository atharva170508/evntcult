/**
 * Google Drive link helpers for AI Face Search (M11).
 *
 * Photographers share a Drive folder as "Anyone with the link can view". Each photo is
 * a Drive file; we only ever need its file ID to build two URLs:
 *   - a small preview (Drive's thumbnail endpoint), used only as a fallback when our own
 *     Supabase thumbnail fails, so the grid doesn't lean on Drive and hit its rate limits;
 *   - the direct download endpoint, which sends the original DSLR file as an attachment,
 *     so the browser saves it without ever showing Drive's UI.
 *
 * Pure functions, no Node or browser APIs: safe in the Worker, the browser and scripts.
 */

/** Drive IDs are URL-safe base64-ish: letters, digits, "-" and "_". Files are usually 33 chars, older ones 28. */
const ID = "[A-Za-z0-9_-]{20,}";
const ID_ONLY = new RegExp(`^${ID}$`);

const FILE_PATTERNS: RegExp[] = [
  new RegExp(`/file/d/(${ID})`), //            drive.google.com/file/d/<id>/view
  new RegExp(`/document/d/(${ID})`), //        docs.google.com/document/d/<id>
  new RegExp(`lh\\d\\.googleusercontent\\.com/d/(${ID})`), // lh3.googleusercontent.com/d/<id>
];
const FOLDER_PATTERN = new RegExp(`/folders/(${ID})`); // drive.google.com/drive/(u/0/)folders/<id>
const DRIVE_HOSTS = /^(drive|docs)\.google\.com$|^drive\.usercontent\.google\.com$|^lh\d\.googleusercontent\.com$/;

export type DriveLink =
  | { ok: true; kind: "file"; id: string }
  | { ok: true; kind: "folder"; id: string }
  | { ok: false; reason: "empty" | "not_drive" | "no_id" };

/**
 * Work out which Drive file or folder a link (or bare ID) points to.
 * Accepts every common format: /file/d/<id>/view, open?id=, uc?id=, thumbnail?id=,
 * drive.usercontent.google.com/download?id=, /folders/<id>, lh3.googleusercontent.com/d/<id>,
 * or just the ID itself.
 */
export function parseDriveLink(input: string | null | undefined): DriveLink {
  const raw = (input ?? "").trim();
  if (!raw) return { ok: false, reason: "empty" };
  if (ID_ONLY.test(raw)) return { ok: true, kind: "file", id: raw };

  let url: URL;
  try {
    url = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
  } catch {
    return { ok: false, reason: "not_drive" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return { ok: false, reason: "not_drive" };
  if (!DRIVE_HOSTS.test(url.hostname)) return { ok: false, reason: "not_drive" };

  const folder = url.pathname.match(FOLDER_PATTERN);
  if (folder) return { ok: true, kind: "folder", id: folder[1] };
  for (const re of FILE_PATTERNS) {
    const m = `${url.hostname}${url.pathname}`.match(re);
    if (m) return { ok: true, kind: "file", id: m[1] };
  }
  const q = url.searchParams.get("id");
  if (q && ID_ONLY.test(q)) return { ok: true, kind: "file", id: q };
  return { ok: false, reason: "no_id" };
}

/** Just the file ID, or null if the input isn't a Drive file link/ID. */
export function driveFileId(input: string | null | undefined): string | null {
  const r = parseDriveLink(input);
  return r.ok && r.kind === "file" ? r.id : null;
}

/** Just the folder ID, or null. */
export function driveFolderId(input: string | null | undefined): string | null {
  const r = parseDriveLink(input);
  return r.ok && r.kind === "folder" ? r.id : null;
}

/** Drive's own thumbnail for a public file. `width` is the longest side in px (Drive caps it). */
export function driveThumbnailUrl(fileId: string, width = 800): string {
  return `https://drive.google.com/thumbnail?id=${encodeURIComponent(fileId)}&sz=w${Math.max(16, Math.min(2000, Math.round(width)))}`;
}

/**
 * Direct download of the original file. `confirm=t` skips Drive's "can't scan this file for
 * viruses" page that appears for large files, so the download still starts straight away.
 */
export function driveDownloadUrl(fileId: string): string {
  return `https://drive.usercontent.google.com/download?id=${encodeURIComponent(fileId)}&export=download&confirm=t`;
}

export interface DriveFileUrls {
  fileId: string;
  thumbnailUrl: string;
  downloadUrl: string;
}

/** Everything the UI needs for one photo, or null for a malformed/unknown link. */
export function driveFileUrls(input: string | null | undefined, thumbWidth = 800): DriveFileUrls | null {
  const id = driveFileId(input);
  return id ? { fileId: id, thumbnailUrl: driveThumbnailUrl(id, thumbWidth), downloadUrl: driveDownloadUrl(id) } : null;
}
