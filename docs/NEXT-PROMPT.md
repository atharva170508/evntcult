# Prompt to continue EvntCult (M2 → M6)

Paste everything below the line into Claude Code, opened in the `evntcult` folder.

---

You are continuing **EvntCult**, a campus event management app. M0 and M1 are done and live at https://evntcult.caliper.workers.dev. Build **M2 through M6**, one milestone at a time. After each milestone: run the tests, typecheck and lint, check it in the browser, commit, and stop so I can review before you start the next one.

## Stack (already set up — don't change it)
- Next.js 15 App Router on Cloudflare Workers via OpenNext (`@opennextjs/cloudflare`). Config is in `wrangler.jsonc`, so use **Wrangler**, not `cf`.
- Database: **Cloudflare D1, raw SQL** (no Prisma). Helpers are in `src/lib/db.ts` (`all`, `first`, `run`, `count`, `isUniqueViolation`). Migrations are in `/migrations`. Apply with `npm run db:migrate` (local) and `npm run db:migrate:remote`.
- Sessions: HMAC-signed httpOnly cookie `ec_session` (`src/lib/session.ts`). Roles come from `src/lib/rbac.ts` (`getViewer`, `requireUser`, `requireOrganizer`, `requireEventOwner`).
- API conventions (`src/lib/api.ts`): wrap routes in `handle()`. Errors are `{error:{code,message}}`. Validate bodies with zod `.strict()` schemas in `src/lib/validation.ts`.
- Times are stored as UTC ISO and shown in Asia/Kolkata (`src/lib/time.ts`). Money is integer paise.
- Pass tokens: 128-bit base32. The QR payload is `evntcult://p/<token>` (`src/lib/tokens.ts`).
- Seed: `npm run seed` (local), `npm run seed:remote`. Deploy: `npm run cf:deploy` (stop any `next dev` first, because they share `.next`).
- Public browsing is on: `/dashboard`, `/events` and event pages work signed out. Only `/passes`, `/vault` and `/organizer` are protected (`src/middleware.ts`).

## Rules
- **Every number is a query.** No hard-coded counts and no fake data.
- **Never a dead end that looks live.** If a feature isn't built, show it as "Planned".
- Ask me before adding any dependency. **jsQR is already approved** for the scanner.
- Never commit `.env` or `.dev.vars`. Secrets go in through `wrangler secret put` only.
- Commit locally after each milestone. **Don't push** unless I ask.

## M2 — Registration, waitlist, passes
1. `POST /api/events/:ref/register`: one atomic `INSERT … SELECT … WHERE (seats taken) < capacity`.
   - Seats taken = `registered` + `waitlisted` (`SEATS_TAKEN_SQL` in `src/lib/data/events.ts`).
   - If it inserts 0 rows, add the user to the waitlist instead.
   - `UNIQUE(event_id,user_id)` prevents double registration, so map it with `isUniqueViolation`.
   - Code-only events need the code.
   - Paid events start as `payment_status='unpaid'`.
2. `DELETE /api/registrations/:id` (cancel). Cancelling frees a seat and gives the waitlist head a `hold_expires_at` (for example 2 hours).
3. `POST /api/registrations/:id/confirm` lets the waitlist head take the held seat.
4. A **cron trigger** in wrangler.jsonc expires old holds and moves the queue along. OpenNext needs a custom worker entry that re-exports its fetch handler and adds `scheduled`.
5. In `src/components/events/RegisterPanel.tsx`, set **`actionsLive` to true** (it's false today, so the buttons read "opens in the next build").
6. Build the `/passes` page with my passes and server-rendered QR codes (the `qrcode` package is already installed), plus an `.ics` calendar download per pass.
7. Tests: racing registrations never go over capacity, the waitlist order is right, and holds expire.

## M3 — Gate scanner (works offline)
1. Build `/organizer/scan/[id]` (the link already exists on event pages). It uses the camera with **jsQR**, which is needed for the iPhone.
2. `POST /api/checkins` takes `{pass_token, client_scan_id}`. It is idempotent through `UNIQUE(registration_id)` and `UNIQUE(client_scan_id)`. It returns green (admitted), amber (already in, with the time) or red (not valid for this event).
3. A **Durable Object** per event keeps the live count. Scanners connect to it to see the count update.
4. A **service worker with an offline queue**: scans are saved locally when the network drops and synced when it comes back. Duplicates are safe because of `client_scan_id`.
5. Only the event's organizer (or an admin) can scan.

## M4 — Organizer console
- An `/organizer` home with my events, counts, check-ins and the clash warnings already computed in `src/lib/data/dashboard.ts`.
- An attendee table with search, a CSV export, and a "mark paid" button (payment reconcile). Every change writes to `audit_log` (`src/lib/audit.ts`).
- Post event updates (schedule / venue / info) into `event_updates`. They already show on dashboards.
- Turn the Planned quick actions in `src/components/dashboard/sections.tsx` into real ones only where they are actually built.

## M5 — Photo Vault (upload + self-tag only)
- Organizers upload event photos to **R2**. R2 needs a card on the Cloudflare account, so check with me first.
- Attendees of that event tap "that's me" to tag themselves (`photo_tags` table, migration 0002).
- `/vault` shows photos I'm tagged in. Face matching stays a **"Planned"** card.

## M6 — Polish + dark theme
- Apply the brief's dark "campus poster meets control room" tokens across the whole app in `tailwind.config`: **colours and type only, keep the layouts**.
- Add empty states, loading states, mobile checks and accessibility checks (focus rings, labels, contrast).
- Then do a final `npm run seed:remote` (if asked) and `npm run cf:deploy`, and check the live site.

Start with **M2 only**. Read the files named above first, then tell me your plan in a few lines before writing code.
