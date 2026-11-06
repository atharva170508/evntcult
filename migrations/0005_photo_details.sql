-- M5: what we need to serve photos from R2 quickly and lay out the gallery.
ALTER TABLE photos ADD COLUMN thumb_key TEXT;          -- small JPEG for grids (made in the browser before upload)
ALTER TABLE photos ADD COLUMN content_type TEXT;       -- image/jpeg | image/png | image/webp (checked from the file's bytes)
ALTER TABLE photos ADD COLUMN width INTEGER;
ALTER TABLE photos ADD COLUMN height INTEGER;
ALTER TABLE photos ADD COLUMN size_bytes INTEGER;
CREATE INDEX idx_photos_event ON photos(event_id, created_at);
