-- 0036_event_drive_folder.sql
-- Store the parsed Google Drive folder ID and link timestamp (reusing existing drive_folder_url)
ALTER TABLE events ADD COLUMN drive_folder_id TEXT;
ALTER TABLE events ADD COLUMN drive_linked_at TEXT;
