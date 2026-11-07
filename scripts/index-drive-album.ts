/**
 * Index a photographer's Google Drive album for AI Face Search (M11). Run it on your own computer.
 *
 *   npm run photos:index -- --event <EvntCult event id> --folder <Drive folder link or id>
 *
 * Options:
 *   --local <dir>      Use originals you already downloaded (matched by file name) instead of
 *                      downloading each one from Drive again. Missing files are downloaded.
 *   --reindex          Process photos again even if they're already indexed.
 *   --limit <n>        Only process the first n new photos (good for a test run).
 *   --dry-run          Detect faces and print what would happen, but upload nothing.
 *   --concurrency <n>  Downloads in parallel (default 3).
 *
 * Needs in .dev.vars (never commit it):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   Supabase → Project Settings → API
 *   GOOGLE_API_KEY                            Google Cloud console → APIs & Services → Credentials
 *                                             (enable "Google Drive API"; no billing needed)
 *
 * For each JPEG: find faces, make 128-number embeddings (same model as the selfie in the
 * browser), upload a small thumbnail to Supabase Storage, and save the photo + faces rows.
 * Originals stay in Drive; attendees download them straight from there.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { driveFolderId, parseDriveLink } from "../src/lib/googleDrive";
import { supabaseConfig } from "../src/lib/supabase-rest";
import { downloadFile, listFolderImages, type DriveImage } from "./face-index/drive";
import { analyzePhoto, initFaces, UnsupportedImageError } from "./face-index/faces";
import { indexedFileIds, savePhotoFaces, uploadThumbnail } from "./face-index/store";

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

const { values: args } = parseArgs({
  options: {
    event: { type: "string" },
    folder: { type: "string" },
    local: { type: "string" },
    reindex: { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
    limit: { type: "string" },
    concurrency: { type: "string", default: "3" },
  },
});

const eventId = args.event?.trim();
if (!eventId || !/^[A-Za-z0-9_-]{4,64}$/.test(eventId)) {
  fail("Pass the EvntCult event id with --event. It's the last part of the organizer page link: /organizer/events/<id>");
}
// A folder link, or a bare folder id (a bare id parses as "file", since ids look the same).
const folderArg = args.folder?.trim() ?? "";
const folderId = driveFolderId(folderArg) ?? (!folderArg.includes("/") && parseDriveLink(folderArg).ok ? folderArg : null);
if (!folderId) fail("Pass the photographer's Drive folder link with --folder (https://drive.google.com/drive/folders/...).");
const apiKey = process.env.GOOGLE_API_KEY?.trim();
if (!apiKey) fail("GOOGLE_API_KEY is missing from .dev.vars (needed to list the Drive folder).");
const dryRun = args["dry-run"];
const cfg = supabaseConfig();
if (!cfg && !dryRun) fail("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing or invalid in .dev.vars.");
// Narrowed copies for use inside main() (TypeScript forgets the checks above inside functions).
const EVENT: string = eventId;
const FOLDER: string = folderId;
const KEY: string = apiKey;
const limit = args.limit ? Math.max(1, Number(args.limit)) : Infinity;
const concurrency = Math.min(8, Math.max(1, Number(args.concurrency) || 3));

let localFiles = new Map<string, string>();
if (args.local) {
  if (!existsSync(args.local)) fail(`--local folder not found: ${args.local}`);
  localFiles = new Map(readdirSync(args.local).map((n) => [n.toLowerCase(), path.join(args.local!, n)]));
}

// The project is CommonJS for tsx, so no top-level await: everything runs inside main().
async function main() {
  const t0 = Date.now();
  console.log(`\nEvntCult album import → event ${eventId}${dryRun ? "  (dry run: nothing is uploaded)" : ""}`);
  console.log("Loading face model…");
  await initFaces();

  console.log("Listing the Drive folder…");
  const all = await listFolderImages(FOLDER, KEY);
  const done = cfg && !args.reindex ? await indexedFileIds(cfg, EVENT) : new Set<string>();
  const todo = all.filter((f) => !done.has(f.id)).slice(0, limit);
  console.log(`${all.length} images in the folder · ${done.size} already indexed · ${todo.length} to process\n`);

  const stats = { photos: 0, faces: 0, noFaces: 0, skipped: 0, failed: 0 };
  const failures: string[] = [];

  async function bytesFor(f: DriveImage): Promise<Uint8Array> {
    const local = localFiles.get(f.name.toLowerCase());
    return local ? new Uint8Array(readFileSync(local)) : downloadFile(f.id, KEY);
  }

  async function processOne(f: DriveImage, n: number) {
    const tag = `[${String(n).padStart(String(todo.length).length)}/${todo.length}] ${f.name}`;
    try {
      const bytes = await bytesFor(f);
      const photo = await analyzePhoto(bytes);
      const note = photo.skippedSmall ? ` (+${photo.skippedSmall} too small)` : "";
      if (!dryRun && cfg) {
        const thumbnailUrl = await uploadThumbnail(cfg, EVENT, f.id, photo.thumbnail);
        await savePhotoFaces(cfg, { eventId: EVENT, driveFileId: f.id, thumbnailUrl }, photo.faces);
      }
      stats.photos++;
      stats.faces += photo.faces.length;
      if (photo.faces.length === 0) stats.noFaces++;
      console.log(`${tag}: ${photo.faces.length} face${photo.faces.length === 1 ? "" : "s"}${note}, thumb ${Math.round(photo.thumbnail.length / 1024)} KB`);
    } catch (e) {
      if (e instanceof UnsupportedImageError) {
        stats.skipped++;
        console.log(`${tag}: skipped, ${e.message}`);
      } else {
        stats.failed++;
        failures.push(`${f.name}: ${e instanceof Error ? e.message : String(e)}`);
        console.log(`${tag}: FAILED, ${e instanceof Error ? e.message : e}`);
      }
    }
  }

  // Small worker pool: downloads overlap, while face detection runs one photo at a time per worker.
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(concurrency, todo.length) }, async () => {
      while (next < todo.length) {
        const i = next++;
        await processOne(todo[i], i + 1);
      }
    }),
  );

  const secs = Math.round((Date.now() - t0) / 1000);
  console.log(`\nDone in ${secs}s: ${stats.photos} photos, ${stats.faces} faces, ${stats.noFaces} with no usable face, ${stats.skipped} skipped, ${stats.failed} failed.`);
  if (failures.length) console.log(`Failed:\n  ${failures.join("\n  ")}\nRun the same command again to retry them.`);
  process.exit(stats.failed ? 1 : 0);
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
