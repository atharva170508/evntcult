/**
 * Check how well a selfie matches an event's indexed photos: prints the similarity score of the
 * closest faces, so you can see where the real "it's me" scores land and pick FACE_MATCH_THRESHOLD.
 *
 *   npm run photos:check -- --event <event id> --selfie ~/Desktop/me.jpg [--folder "<Drive link>"]
 *
 * --folder is optional: with it, results show the photo's file name instead of only its Drive id.
 * Uses the same face model as the importer and the website. Changes nothing anywhere.
 */
import { existsSync, readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { driveFolderId } from "../src/lib/googleDrive";
import { supabaseConfig, supabaseRpc } from "../src/lib/supabase-rest";
import { toPgVector } from "../src/lib/face/embedding";
import { DEFAULT_THRESHOLD } from "../src/lib/data/face-search";
import { listFolderImages } from "./face-index/drive";
import { embedSelfieLikeBrowser, UnsupportedImageError } from "./face-index/faces";

function fail(msg: string): never {
  console.error(`\n✖ ${msg}\n`);
  process.exit(1);
}

const { values: args } = parseArgs({ options: { event: { type: "string" }, selfie: { type: "string" }, folder: { type: "string" }, top: { type: "string", default: "25" } } });
const eventId = args.event?.trim();
const selfiePath = args.selfie?.trim();
if (!eventId) fail("Pass the event id with --event.");
if (!selfiePath || !existsSync(selfiePath)) fail("Pass a selfie JPEG with --selfie (e.g. --selfie ~/Desktop/me.jpg).");
const cfg = supabaseConfig();
if (!cfg) fail("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing or invalid in .dev.vars.");
const EVENT: string = eventId;
const SELFIE: string = selfiePath;

async function main() {
  console.log("\nReading your selfie…");
  let selfie;
  try {
    selfie = await embedSelfieLikeBrowser(new Uint8Array(readFileSync(SELFIE)));
  } catch (e) {
    fail(e instanceof UnsupportedImageError ? `Selfie is ${e.message}: export it as JPEG.` : String(e));
  }
  if (!selfie) fail("No face found in the selfie. Use a well-lit, front-facing photo.");
  if (selfie.faces > 1) console.log(`(${selfie.faces} faces in the selfie; using the biggest, like the website does)`);

  const rows = await supabaseRpc<{ drive_file_id: string; similarity: number }[]>(cfg!, "match_attendee_photos", {
    query_embedding: toPgVector(selfie.embedding),
    match_threshold: 0.5,
    match_count: Math.min(200, Math.max(1, Number(args.top) || 25)),
    filter_event_id: EVENT,
  });

  let names = new Map<string, string>();
  const folderId = driveFolderId(args.folder);
  if (folderId && process.env.GOOGLE_API_KEY) {
    names = new Map((await listFolderImages(folderId, process.env.GOOGLE_API_KEY)).map((f) => [f.id, f.name]));
  }

  const current = Number(process.env.FACE_MATCH_THRESHOLD) || DEFAULT_THRESHOLD;
  console.log(`\nClosest photos in event ${EVENT} (best face per photo). Current threshold: ${current}\n`);
  if (rows.length === 0) console.log("  No faces at all for this event. Did the import run with this exact event id?");
  rows.forEach((r, i) => {
    const mark = r.similarity >= current ? "✓ shown" : "  hidden";
    console.log(`${String(i + 1).padStart(3)}. ${r.similarity.toFixed(3)}  ${mark}  ${names.get(r.drive_file_id) ?? r.drive_file_id}`);
  });
  console.log("\nLook at which photos are really you. Pick a threshold just below the lowest score of a real you,");
  console.log("and above the highest score of someone else. Then: npx wrangler secret put FACE_MATCH_THRESHOLD\n");
}

main().catch((e) => fail(e instanceof Error ? e.message : String(e)));
