-- The notification bell, and questions organizers ask at registration.
ALTER TABLE notifications ADD COLUMN read_at TEXT;
CREATE INDEX idx_notif_user ON notifications(user_id, scheduled_for);

CREATE TABLE event_questions (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES events(id),
  label TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'text',
  options TEXT,
  required INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_questions_event ON event_questions(event_id);

CREATE TABLE registration_answers (
  registration_id TEXT NOT NULL REFERENCES registrations(id),
  question_id TEXT NOT NULL REFERENCES event_questions(id),
  value TEXT NOT NULL,
  PRIMARY KEY (registration_id, question_id)
);
