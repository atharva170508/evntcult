-- Optional map details for a venue. The venue text stays what people see.
ALTER TABLE events ADD COLUMN venue_place_id TEXT;
ALTER TABLE events ADD COLUMN venue_lat REAL;
ALTER TABLE events ADD COLUMN venue_lng REAL;
ALTER TABLE events ADD COLUMN venue_address TEXT;
