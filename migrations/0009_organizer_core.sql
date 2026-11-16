-- Organizer dashboard, part 1: additive columns only. Existing rows keep working.

-- Bumped on every write. A save carrying an older number gets a 409 (two tabs open).
ALTER TABLE events ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- confirmed | tba | online
ALTER TABLE events ADD COLUMN venue_status TEXT NOT NULL DEFAULT 'confirmed';

ALTER TABLE events ADD COLUMN timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata';
ALTER TABLE events ADD COLUMN updated_at TEXT;
ALTER TABLE events ADD COLUMN published_at TEXT;

-- Prefilled into the Payout UPI field the next time this organizer makes a paid event.
ALTER TABLE users ADD COLUMN default_payout_upi TEXT;

UPDATE events SET updated_at = created_at;
UPDATE events SET published_at = created_at WHERE status IN ('published', 'closed');
UPDATE events SET venue_status = 'online' WHERE event_type = 'virtual';
