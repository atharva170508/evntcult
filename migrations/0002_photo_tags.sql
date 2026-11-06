-- Photo Vault self-tags: an attendee taps "that's me" on a photo (no face data stored).
CREATE TABLE photo_tags (
  photo_id    TEXT NOT NULL REFERENCES photos(id),
  user_id     TEXT NOT NULL REFERENCES users(id),
  created_at  TEXT NOT NULL,
  PRIMARY KEY (photo_id, user_id)
);
CREATE INDEX idx_photo_tags_user ON photo_tags(user_id);
