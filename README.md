# EvntCult

EvntCult is an app for managing campus events: parties, fests, gaming nights, sports, talks. It has an Apple-style dark mode UI.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind CSS · Prisma 6 + PostgreSQL · Auth.js v5

---

## Quick start: demo mode (no database needed)

```bash
npm install
cp .env.example .env        # DEMO_MODE=true by default
npm run dev                 # → http://localhost:3000
```

A bar at the top switches between the **Organizer** and **Student** views. The live headcount ring updates itself in demo mode, and the clash alerts come from the real clash-detection code run against the sample data.

## Real mode (Postgres + Google sign-in)

```bash
# 1. Postgres (any host works: Neon, Supabase, RDS, local Docker)
docker run -d --name evntcult-db -e POSTGRES_USER=evntcult -e POSTGRES_PASSWORD=evntcult -p 5432:5432 postgres:16

# 2. In .env set:
#    DEMO_MODE=false
#    AUTH_SECRET=$(npx auth secret)
#    AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET   (Google Cloud → OAuth client, redirect: http://localhost:3000/api/auth/callback/google)
#    PASS_SIGNING_SECRET=<32+ random chars>
#    ALLOWED_EMAIL_DOMAINS=yourcollege.edu   (optional, recommended)

# 3. Create tables, add the venue-clash constraint, load sample data
npx prisma migrate dev --name init
node scripts/apply-sql.mjs
npm run db:seed

npm run dev
```

### Verifying organizers (developers only)

There is deliberately no button in the app that promotes someone to organizer. A user submits an organizer application (an `OrganizerProfile` row with status `PENDING`), and a developer approves it from the command line:

```bash
npm run organizer:verify -- someone@college.edu              # approve
npm run organizer:verify -- someone@college.edu --reject "No proof of role"
npm run organizer:verify -- someone@college.edu --suspend
```

Every one of these actions is written to `AuditLog`. A signed-in user's role is re-read from the database every 5 minutes, so an approval or suspension reaches them without them signing out.

---

## Project structure

```
prisma/
  schema.prisma               All tables (see below)
  sql/001_venue_clash_guard.sql  Postgres exclusion constraint: no double-booked venues
  seed.ts                     Sample campus data
scripts/
  verify-organizer.ts         Developer CLI for organizer verification
  apply-sql.mjs               Runs the hand-written SQL after migrations
src/
  auth.ts / auth.config.ts    Auth.js (Google + optional email magic link), JWT sessions that carry the role
  middleware.ts               Route protection; /organizer is restricted to organizers
  lib/
    rbac.ts                   getViewer, requireVerifiedOrganizer, canManageEvent (per-event team permissions)
    clash.ts                  Clash detection logic (hard/soft clashes, venue buffers), no DB access
    clash-db.ts               Loads the relevant calendar slice from the DB and runs clash.ts on it
    event-code.ts             Google-Classroom-style 7-character codes (no look-alike characters)
    pass.ts                   HMAC-signed QR pass tokens
    money.ts                  Amounts stored as paise, ₹ formatting, NPCI UPI URI builder
    data/dashboard.ts         Dashboard queries (Prisma); uses data/mock.ts in demo mode
  app/
    (app)/dashboard           The main dashboard
    (app)/[...slug]           "Coming soon" placeholder so every nav link resolves
    signin                    Sign-in page
    api/events                POST create (checks for clashes, catches DB constraint races)
    api/events/clash-check    POST live clash feedback for the event builder
    api/events/[id]/headcount GET Server-Sent Events stream of live check-ins
    api/codes/redeem          POST unlock a code-only event (generic errors so codes can't be guessed)
  components/
    shell/                    Top nav (frosted, Apple-style), mobile menu, enter-code dialog, demo bar
    ui/                       Card, Chip, Button, Meter, EventArt (generated gradient covers)
    dashboard/                Hero, pass + QR, live headcount ring, organizer console, calendar, rails
tests/                        Vitest: clash detection, codes, passes, money
```

## Data model, in brief

| Area | Tables |
|---|---|
| Users & roles | `User` (role USER / ORGANIZER / ADMIN), `OrganizerProfile` (PENDING → VERIFIED), Auth.js tables |
| Events | `Event` (visibility PUBLIC / CODE_ONLY / UNLISTED, privacy controls, fee + UPI fields), `EventTeamMember` (per-event permissions), `EventCode` |
| Venues | `Venue` (capacity, coordinates, walking directions, setup buffer) |
| Single source of truth | `Registration` → `Pass` → `CheckIn`, `Payment`, `FootfallSnapshot` |
| Live updates | `Announcement` (can also go out on WhatsApp), `ScheduleItem` |
| After the event | `Certificate` (serial can be verified), `Resource` (unlocks after the event) |
| Photo vault | `MediaAsset`, opt-in `FaceProfile` (embedding deleted when consent is withdrawn), `PhotoMatch` |
| Reminders | `Reminder` (WhatsApp/email queue with delivery status) |
| Sponsors | `Sponsor`, `SponsorReport` (metrics stored as they were when generated) |
| Audit | `AuditLog` |

**Clash detection works at two levels.** `src/lib/clash.ts` warns organizers while they plan:

- A **hard** clash means the same venue at an overlapping time, including the venue's setup buffer. It blocks publishing.
- A **soft** clash means a similar or very large event at the same time somewhere else. It is a warning only.

Postgres also enforces an `EXCLUDE USING gist` constraint, so two simultaneous requests still can't double-book a venue.

**Payments are on hold.** Fee amounts, payment status and UPI IDs are stored and shown in the UI. `upiUri()` builds standard `upi://pay` links, but nothing charges money while `PAYMENTS_ENABLED=false`.

## Scripts

| | |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm test` | Unit tests (19) |
| `npm run typecheck` / `lint` | Type-check and lint |
| `npm run db:migrate` / `db:deploy` / `db:seed` / `db:studio` | Database |
| `npm run organizer:verify -- <email>` | Approve an organizer |

## Next build passes

1. Event builder (with live clash checking), event page, registration that redeems codes
2. Gate scanner (camera reads QR → `verifyPassToken` → creates a `CheckIn`) and the attendee list
3. Calendar (month/week/agenda), certificate PDFs, resource hub
4. Photo vault uploads (S3/R2) and the face-match worker
5. WhatsApp Cloud API reminder worker, broadcast composer
6. Sponsor ROI report and pitch-deck generator, venue navigator map

## Hosting on Cloudflare Workers (demo mode)

Live: https://evntcult.caliper.workers.dev

```bash
npm run cf:deploy
```

Builds with OpenNext and deploys with Wrangler (`wrangler.jsonc`, `DEMO_MODE=true`).

## Login codes by email (M6)

Students log in with a 6-digit code sent to their college email. Only a hash of the code is stored. A code expires after 10 minutes and allows 5 tries. Requests are rate-limited: one code per email every 30 seconds, 5 per hour per email, and 20 per hour per network.

Emails go through **Brevo** (free for 300 a day). To switch it on for the live site (Atharva):

1. Make a free Brevo account and verify the sender Gmail under **Senders**.
2. Create an API key under **SMTP & API → API keys**.
3. Run `npm run db:migrate:remote` once (this adds `0006_login_codes`).
4. Then set these two secrets:
   - `npx wrangler secret put BREVO_API_KEY`
   - `npx wrangler secret put EMAIL_FROM` (the verified Gmail)

Until both secrets are set, the old email-only login keeps working, and the sign-in page shows the code check as **Planned**. For local testing without Brevo, add `EMAIL_PROVIDER=log` to `.dev.vars`. Codes are then printed in the terminal.
