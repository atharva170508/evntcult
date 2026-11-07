-- "Host an Event" modal (Luma/Partiful-style quick create). All columns are optional add-ons
-- to the existing events table, so every older event keeps working unchanged.

-- in_person: `venue` holds the place. virtual: `venue` is 'Online' and `meeting_url` holds the link.
ALTER TABLE events ADD COLUMN event_type TEXT NOT NULL DEFAULT 'in_person'; -- in_person | virtual
ALTER TABLE events ADD COLUMN meeting_url TEXT;

-- One-line hook shown on cards (falls back to the description's first line when empty).
ALTER TABLE events ADD COLUMN tagline TEXT;

-- Paid passes: where attendees send money. Payments themselves stay "pay the organizer" for now.
ALTER TABLE events ADD COLUMN organizer_upi_id TEXT;

-- Public Google Drive folder with the event's photos, for AI Face Search.
ALTER TABLE events ADD COLUMN drive_folder_url TEXT;

-- Optional banner image link (no file storage needed).
ALTER TABLE events ADD COLUMN banner_url TEXT;
