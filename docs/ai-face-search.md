# AI Face Search: setup (₹0, no card)

Attendees open an event's photos → **AI Face Search** tab → take a selfie → see every photo they're in →
**Download Full HD (DSLR)** straight from the photographer's Google Drive.

```
Photographer's Drive folder ──► scripts/index-drive-album.ts (your laptop)
  (originals stay here)            finds faces → 128 numbers each → Supabase (pgvector)
                                   small JPEG thumbnail          → Supabase Storage
Attendee's phone: selfie → 128 numbers (face-api, on the phone) → /api/events/:id/face-match
  → Supabase match_attendee_photos() → matching photos → download from Drive
```

The selfie never leaves the phone. The server only receives 128 numbers, uses them for one search
and keeps nothing except a timestamp for the rate limit (6 searches/minute, 40/hour per student).

## One-time setup

1. **Supabase project (free, no card):**
   - Sign up at https://supabase.com and create a project. Pick the Mumbai region if it's offered.
   - Open **SQL Editor**, paste `supabase/migrations/20261107000000_face_search.sql` and click **Run**. Running it again later is safe.
   - From **Project Settings → API**, copy the **Project URL** and the **service_role** key. The service_role key is a secret: never put it in front-end code or commit it.
2. **Google API key (free, no billing):**
   - Go to https://console.cloud.google.com, create a project, then **APIs & Services → Library** and enable **Google Drive API**.
   - Under **Credentials → Create credentials → API key**, create a key. Restrict it to the Drive API.
3. **Local secrets.** Add these lines to `.dev.vars`. It's already git-ignored.
   ```
   SUPABASE_URL=https://<project>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service_role key>
   GOOGLE_API_KEY=<API key>
   ```
4. **Live site secrets.** Run each of these from `~/Projects/evntcult` with `CLOUDFLARE_ACCOUNT_ID` set:
   ```
   npx wrangler secret put SUPABASE_URL
   npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
   npm run db:migrate:remote        # adds the small rate-limit table (0007)
   npm run cf:deploy
   ```
   Until both Supabase secrets are set, the tab says "AI Face Search isn't switched on yet".

## For each event

1. The photographer puts the **JPEG** exports in a Drive folder shared as **Anyone with the link can view**. RAW, HEIC and PNG files are skipped.
2. Find the EvntCult event id. It's the last part of the organizer page link: `/organizer/events/<id>`.
3. Run:
   ```
   npm run photos:index -- --event <event id> --folder "<Drive folder link>" --limit 20 --dry-run   # test first
   npm run photos:index -- --event <event id> --folder "<Drive folder link>"
   ```
   - Re-running only processes new photos.
   - Add `--local ~/Downloads/album` if you already downloaded the album, so it isn't downloaded again.
   - Expect about 1–3 seconds per photo on a laptop.

## Tuning

- **Match threshold.** The default is 0.93 (cosine similarity).
  - On test photos, the same person scored 0.97–1.00 and different people scored 0.83–0.91.
  - If strangers show up in results, raise it with `npx wrangler secret put FACE_MATCH_THRESHOLD` (e.g. `0.94`).
  - If people miss photos they're in, lower it (e.g. `0.92`).
- **Small faces.** Faces smaller than about 32 px after the photo is scaled to 2400 px are skipped, because their numbers aren't reliable. These are faces far away in big group shots.

## Free-tier things to know

- **Supabase pauses idle free projects.** The first search after a long quiet spell fails with "Face search is waking up", so open the dashboard and click Restore if it stays paused. Free projects also have size limits: thumbnails are about 80–180 KB each, so check your project's usage page for big events.
- **Google Drive limits heavy downloading of one shared file.** If a very popular photo hits that limit, Drive shows an error page in the new tab for a while. Results stay open in EvntCult.
- **Privacy.** Face numbers of event photos are biometric data under India's DPDP Act. The tab asks for consent before every search. Delete an event's data when it's no longer needed:
  ```sql
  delete from public.event_photos where event_id = '<event id>';   -- faces are deleted with it
  ```
  To delete the thumbnails too, remove that event's folder in Supabase → Storage → `event-thumbs`.
