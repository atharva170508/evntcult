-- §11: nothing is deleted. Undoing a check-in marks the row instead of removing it.
-- A check-in counts only while undone_at IS NULL. Re-admitting the same pass reuses the row.
ALTER TABLE checkins ADD COLUMN undone_at TEXT;
ALTER TABLE checkins ADD COLUMN undone_by TEXT;
CREATE INDEX IF NOT EXISTS idx_checkin_event_active ON checkins(event_id) WHERE undone_at IS NULL;
