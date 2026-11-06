-- Hard guarantee that no two live bookings overlap at the same venue,
-- even under concurrent writes. Prisma can't express exclusion constraints,
-- so this runs after `prisma migrate deploy` (see scripts/apply-sql.mjs).
--
-- The app's src/lib/clash.ts gives organizers a friendly warning first
-- (including setup buffers and soft "same-time" clashes); this constraint is
-- the last line of defence against race conditions.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Event" DROP CONSTRAINT IF EXISTS event_no_venue_overlap;

ALTER TABLE "Event"
  ADD CONSTRAINT event_no_venue_overlap
  EXCLUDE USING gist (
    "venueId" WITH =,
    tstzrange("startsAt", "endsAt", '[)') WITH &&
  )
  WHERE ("venueId" IS NOT NULL AND status IN ('PUBLISHED', 'LIVE'));

ALTER TABLE "Event" DROP CONSTRAINT IF EXISTS event_valid_range;
ALTER TABLE "Event" ADD CONSTRAINT event_valid_range CHECK ("endsAt" > "startsAt");
