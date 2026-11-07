/** M11 AI Face Search: Drive links, embeddings, rate limit, and the Supabase match call. */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { testDatabase } from "./helpers/d1";
import { driveDownloadUrl, driveFileId, driveFileUrls, driveFolderId, driveThumbnailUrl, parseDriveLink } from "@/lib/googleDrive";
import { matchPercent, normalizeEmbedding, toPgVector } from "@/lib/face/embedding";
import { DEFAULT_THRESHOLD, FaceSearchError, LIMITS, findMatches, matchThreshold, takeSearchSlot } from "@/lib/data/face-search";
import { SupabaseError, supabaseConfig } from "@/lib/supabase-rest";

const FILE = "1AbCdEfGhIjKlMnOpQrStUvWxYz012345"; // 33 chars, like real Drive ids
const FOLDER = "1ZyXwVuTsRqPoNmLkJiHgFeDcBa987654";

describe("googleDrive", () => {
  it.each([
    [`https://drive.google.com/file/d/${FILE}/view?usp=sharing`],
    [`https://drive.google.com/file/d/${FILE}`],
    [`https://drive.google.com/open?id=${FILE}`],
    [`https://drive.google.com/uc?id=${FILE}&export=download`],
    [`https://drive.google.com/thumbnail?id=${FILE}&sz=w800`],
    [`https://drive.usercontent.google.com/download?id=${FILE}&export=download`],
    [`https://lh3.googleusercontent.com/d/${FILE}=w1000`],
    [`drive.google.com/file/d/${FILE}/view`],
    [`  ${FILE}  `],
  ])("finds the file id in %s", (link) => {
    expect(driveFileId(link)).toBe(FILE);
  });

  it("recognises folders and keeps them apart from files", () => {
    expect(driveFolderId(`https://drive.google.com/drive/folders/${FOLDER}?usp=sharing`)).toBe(FOLDER);
    expect(driveFolderId(`https://drive.google.com/drive/u/0/folders/${FOLDER}`)).toBe(FOLDER);
    expect(driveFileId(`https://drive.google.com/drive/folders/${FOLDER}`)).toBeNull();
  });

  it.each([
    ["", "empty"],
    [null, "empty"],
    ["https://evil.example/file/d/" + FILE, "not_drive"],
    ["javascript:alert(1)", "not_drive"],
    ["https://drive.google.com/drive/my-drive", "no_id"],
    ["https://drive.google.com/open?id=short", "no_id"],
    ["not a link at all", "not_drive"],
  ])("rejects %s", (link, reason) => {
    expect(parseDriveLink(link as string)).toEqual({ ok: false, reason });
  });

  it("builds the thumbnail and direct download URLs", () => {
    expect(driveThumbnailUrl(FILE, 640)).toBe(`https://drive.google.com/thumbnail?id=${FILE}&sz=w640`);
    expect(driveThumbnailUrl(FILE, 99999)).toContain("sz=w2000");
    expect(driveDownloadUrl(FILE)).toBe(`https://drive.usercontent.google.com/download?id=${FILE}&export=download&confirm=t`);
    expect(driveFileUrls(`https://drive.google.com/file/d/${FILE}/view`)).toEqual({
      fileId: FILE,
      thumbnailUrl: driveThumbnailUrl(FILE),
      downloadUrl: driveDownloadUrl(FILE),
    });
    expect(driveFileUrls("https://example.com")).toBeNull();
  });
});

describe("embeddings", () => {
  const raw = Array.from({ length: 128 }, (_, i) => Math.sin(i) * 0.12);

  it("normalises to unit length and rejects bad input", () => {
    const v = normalizeEmbedding(raw)!;
    expect(v).toHaveLength(128);
    expect(Math.hypot(...v)).toBeCloseTo(1, 4);
    normalizeEmbedding(new Float32Array(raw))!.forEach((x, i) => expect(x).toBeCloseTo(v[i], 5));
    expect(normalizeEmbedding(raw.slice(1))).toBeNull();
    expect(normalizeEmbedding([...raw.slice(1), NaN])).toBeNull();
    expect(normalizeEmbedding(new Array(128).fill(0))).toBeNull();
    expect(normalizeEmbedding("[1,2,3]")).toBeNull();
    expect(toPgVector([0.5, -0.25])).toBe("[0.5,-0.25]");
    expect(matchPercent(0.9634)).toBe(96);
  });
});

describe("config", () => {
  it("only accepts a real Supabase project URL", () => {
    expect(supabaseConfig({ SUPABASE_URL: "https://abcd1234.supabase.co/", SUPABASE_SERVICE_ROLE_KEY: "k" })).toEqual({ url: "https://abcd1234.supabase.co", key: "k" });
    expect(supabaseConfig({ SUPABASE_URL: "http://abcd1234.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "k" })).toBeNull();
    expect(supabaseConfig({ SUPABASE_URL: "https://evil.example", SUPABASE_SERVICE_ROLE_KEY: "k" })).toBeNull();
    expect(supabaseConfig({ SUPABASE_URL: "https://abcd1234.supabase.co" })).toBeNull();
    expect(matchThreshold({})).toBe(DEFAULT_THRESHOLD);
    expect(matchThreshold({ FACE_MATCH_THRESHOLD: "0.9" })).toBe(0.9);
    expect(matchThreshold({ FACE_MATCH_THRESHOLD: "2" })).toBe(DEFAULT_THRESHOLD);
  });
});

describe("rate limit (real local D1)", () => {
  let db: D1Database;
  let dispose: () => Promise<void>;
  beforeAll(async () => {
    ({ db, dispose } = await testDatabase());
    await db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('u1', 'u1@college.edu', 'U', 'attendee', '2026-11-01T00:00:00Z')").run();
  }, 60_000);
  afterAll(async () => dispose?.());

  it("allows 6 searches a minute and 40 an hour", async () => {
    const T = Date.parse("2026-11-20T10:00:00Z");
    for (let i = 0; i < LIMITS.perMinute; i++) await takeSearchSlot(db, "u1", "e1", new Date(T + i * 1000));
    await expect(takeSearchSlot(db, "u1", "e1", new Date(T + 10_000))).rejects.toMatchObject({ code: "rate_limited", retryAfterSec: 60 });
    let t = T + 61_000;
    while ((await db.prepare("SELECT COUNT(*) AS n FROM face_search_log").first<{ n: number }>())!.n < LIMITS.perHour) {
      await takeSearchSlot(db, "u1", "e1", new Date(t));
      t += 11_000;
    }
    await expect(takeSearchSlot(db, "u1", "e1", new Date(t + 61_000))).rejects.toBeInstanceOf(FaceSearchError);
    await takeSearchSlot(db, "u1", "e1", new Date(T + 3_700_000 + 61_000 * 10)); // an hour later
  });
});

describe("findMatches", () => {
  const cfg = { url: "https://abcd1234.supabase.co", key: "service" };
  afterEach(() => vi.unstubAllGlobals());

  it("calls the RPC with the service key and only returns this event's photos", async () => {
    const fetchMock = vi.fn(async () =>
      Response.json([
        { photo_id: "p1", event_id: "e1", thumbnail_url: "https://abcd1234.supabase.co/storage/v1/object/public/event-thumbs/e1/x.jpg", drive_file_id: FILE, similarity: 0.97 },
        { photo_id: "p2", event_id: "OTHER", thumbnail_url: "https://x/y.jpg", drive_file_id: FILE, similarity: 0.99 },
        { photo_id: "p3", event_id: "e1", thumbnail_url: "javascript:alert(1)", drive_file_id: FILE, similarity: 0.95 },
      ]),
    );
    vi.stubGlobal("fetch", fetchMock);
    const out = await findMatches(cfg, { eventId: "e1", embedding: normalizeEmbedding(Array(128).fill(1))!, threshold: 0.93 });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://abcd1234.supabase.co/rest/v1/rpc/match_attendee_photos");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer service");
    const sent = JSON.parse(init.body as string);
    expect(sent).toMatchObject({ match_threshold: 0.93, filter_event_id: "e1" });
    expect(sent.query_embedding).toMatch(/^\[(-?[\d.]+,){127}-?[\d.]+\]$/);
    expect(out.map((m) => m.photoId)).toEqual(["p1", "p3"]);
    expect(out[0].downloadUrl).toBe(driveDownloadUrl(FILE));
    expect(out[1].thumbnailUrl).toBe(driveThumbnailUrl(FILE)); // unsafe URL replaced by Drive's thumbnail
  });

  it("sends new sb_secret_ keys only in the apikey header", async () => {
    const fetchMock = vi.fn(async () => Response.json([]));
    vi.stubGlobal("fetch", fetchMock);
    await findMatches({ url: cfg.url, key: "sb_secret_abc123" }, { eventId: "e1", embedding: normalizeEmbedding(Array(128).fill(1))!, threshold: 0.93 });
    const headers = (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].headers as Record<string, string>;
    expect(headers.apikey).toBe("sb_secret_abc123");
    expect(headers.Authorization).toBeUndefined();
  });

  it("turns Supabase failures into SupabaseError", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("paused", { status: 503 })));
    await expect(findMatches(cfg, { eventId: "e1", embedding: normalizeEmbedding(Array(128).fill(1))!, threshold: 0.93 })).rejects.toBeInstanceOf(SupabaseError);
  });
});
