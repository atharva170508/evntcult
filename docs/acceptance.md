# Acceptance — master build prompt §16

Checked on 11 Nov 2026 against a local build (OpenNext on `wrangler dev`, local D1 with the sample data).
**Unit** = a Vitest test in `tests/`, run on every change. **Browser** = a scripted run in headless Chrome against the local build.

## Design

| Check | Result | Evidence |
|---|---|---|
| No gradient / shadow / glow outside overlays | Pass | Unit: `design-tokens` — no shadows outside overlays, no gradient/blur classes |
| 5–7 type sizes | Pass (7) | Unit: `design-tokens` — type stays on the seven sizes |
| Accent ≤ 5 per screen | Pass (1–5) | Browser: lime counted on every student and organizer screen |
| Radius ≤ 8 | Pass | Tailwind radius scale is 4 / 6 / 8 / pill; unit: no pill-shaped buttons |
| All text ≥ 4.5:1 | Pass | Unit: `design-tokens` contrast. Two spec tokens nudged to pass: `--text-dim` #7A7A86→#7F7F8A, `--bad` #C4514E→#C9605D |
| Keyboard-only walkthrough | Pass | Browser: 27 gallery checks (menu, tabs, modal, toast, inputs); skip link first and moves to `main`; tab walk on 22 pages |
| prefers-reduced-motion instant and unbroken | Pass | Browser: menus open in 1ms, fade only; nothing animates on load |
| 320px, no horizontal overflow | Pass | Browser: every student and organizer page at 320px |
| One h1, landmarks, names, labels, alt text | Pass | Browser: accessibility audit on 22 pages |
| Targets ≥ 44px (24px floor) | Pass | Browser: nothing under 24px; under-44 targets are dense table/row actions |

## Product

| Check | Result | Evidence |
|---|---|---|
| A free event publishes in < 60s | Pass (4.6s) | Browser: type a name, Publish |
| Ticket reflects typed values before save | Pass | Browser: the ticket shows the name as it's typed |
| Paid reveals price + payout, free hides both | Pass | Browser: Free → Paid → Free |
| Autosave survives reload | Pass | Browser: tagline typed, reload, still there |
| Two tabs → 409 | Pass | Browser: second tab shows "This event changed in another tab"; unit: `organizer-events` version conflict |
| Duplicate is one click | Pass | Browser: Duplicate opens a new draft |

## Money

Razorpay (§12) was **not built**, by decision. Payment is UPI to the organizer's own ID, confirmed by the organizer (Guests: Started payment → Received), or cash at the gate. None of the §16 money rows apply until Razorpay is added.

| Check | Result | Evidence |
|---|---|---|
| Paid event with inactive payout cannot publish | Pass for UPI | A paid event needs a payout UPI ID before it can publish (editor checklist; unit: `organizer-events`) |
| Free never calls a payment provider | Pass | No provider is called at all |
| Webhook / transfer / signature rows | Not applicable | Razorpay skipped |
| Key secret in no response or bundle | Pass | No payment secrets exist |

## Gate

| Check | Result | Evidence |
|---|---|---|
| Express scan < 500ms | Pass (~200–280ms) | Browser: manual check-in, request to verdict |
| Duplicate amber, no increment | Pass | Unit: `checkins` — "a duplicate is amber with the first time, and the count doesn't move" |
| Undo restores | Pass | Browser: count back, search offers Check in again; unit: undo keeps the row, re-admit reuses it |
| Offline replay lands once | Pass | Browser: admitted offline, back online, one row; unit: replayed scan id lands once |

## Notifications

| Check | Result | Evidence |
|---|---|---|
| Schedule enqueues at publish | Pass | Unit: `whatsapp` — queues reminders at the right times |
| Moving the event re-keys reminders | Pass | Unit: `whatsapp` — moving an event replaces the reminders |
| Six edits produce one message | Pass | Unit: `whatsapp` — six edits send one update, 5 minutes after the last |
| Cap at 5 | Pass | Unit: `whatsapp` — at the cap of 5 a message is skipped, except a cancellation |
| Quiet hours held | Pass | Unit: `whatsapp` — a message due at 02:00 moves to 08:15 |
| Dry-run works with no token | Pass | Unit: `whatsapp` — with no token, rows become dry_run |

## Proof

| Check | Result | Evidence |
|---|---|---|
| Certificate only for someone who checked in | Pass | Unit: `certificates-merch` |
| Revoked if the only check-in is undone | Pass | Unit: `certificates-merch`; returns if the person is re-admitted |
| `/verify/:code` never 404s a revoked certificate | Pass | Shows "Revoked on {date}" and a Status row |
| Goodies can't be claimed twice; stock decrements atomically | Pass | Unit: `certificates-merch` |

## Data rules (§11)

- Every event write bumps `version` and appends to `audit_log` (unit: `organizer-events`).
- **Nothing is deleted:** undoing a check-in sets `undone_at` / `undone_by` (migration `0019_checkin_undo.sql`). A unit test reads the source and fails if any query on `checkins` forgets to skip undone rows.
- Deletes that remain are housekeeping only: expired login codes and rate-limit logs, unsent reminders replaced when an event moves, photos an organizer removes, and setup items (merch, questions) nobody has used yet.
- The atomic capacity claim and the UNIQUE constraints are unchanged.

## Not done

- Razorpay Route (§12, build steps 8–9) — skipped by decision.
- The organizer sidebar stays 84px with words; the spec's collapsed 56px rail assumes icons, which §3 forbids.
- The browser scripts used above live outside the repo (they need `puppeteer-core`, which isn't a project dependency).
