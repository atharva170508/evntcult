-- Deletes the sample data made by scripts/seed.ts, and nothing else.
-- Run preview.sql first. See scripts/sample-data/README.md.
--
-- Sample rows have short ids ("evt_00001a", "usr_000003", "reg_...", ...). Real rows made by the
-- app have long random ids (UUIDs), so they never match these patterns. A sample user who now
-- organizes a real event is kept, so that event keeps working.

-- Photos and tags on sample events, and tags by sample users
DELETE FROM photo_tags
 WHERE photo_id IN (SELECT id FROM photos WHERE (substr(event_id, 1, 4) = 'evt_' AND length(event_id) = 10))
    OR user_id IN (SELECT id FROM users WHERE (substr(id, 1, 4) = 'usr_' AND length(id) = 10)
                     AND NOT EXISTS (SELECT 1 FROM events e WHERE e.organizer_id = users.id AND NOT (substr(e.id, 1, 4) = 'evt_' AND length(e.id) = 10)));
DELETE FROM photos WHERE (substr(event_id, 1, 4) = 'evt_' AND length(event_id) = 10);

-- WhatsApp outbox
DELETE FROM notifications
 WHERE (substr(event_id, 1, 4) = 'evt_' AND length(event_id) = 10)
    OR (substr(user_id, 1, 4) = 'usr_' AND length(user_id) = 10);

-- Check-ins, updates, registrations on sample events or by sample users
DELETE FROM checkins
 WHERE (substr(event_id, 1, 4) = 'evt_' AND length(event_id) = 10)
    OR registration_id IN (SELECT id FROM registrations WHERE (substr(user_id, 1, 4) = 'usr_' AND length(user_id) = 10));
DELETE FROM event_updates WHERE (substr(event_id, 1, 4) = 'evt_' AND length(event_id) = 10);
DELETE FROM registrations
 WHERE (substr(event_id, 1, 4) = 'evt_' AND length(event_id) = 10)
    OR (substr(user_id, 1, 4) = 'usr_' AND length(user_id) = 10);

-- Audit entries about sample rows
DELETE FROM audit_log
 WHERE (substr(actor_id, 1, 4) = 'usr_' AND length(actor_id) = 10)
    OR (substr(target_id, 4, 1) = '_' AND length(target_id) = 10);

-- The sample events, then the sample users (except any who organize a real event)
DELETE FROM events WHERE (substr(id, 1, 4) = 'evt_' AND length(id) = 10);
DELETE FROM users
 WHERE (substr(id, 1, 4) = 'usr_' AND length(id) = 10)
   AND NOT EXISTS (SELECT 1 FROM events e WHERE e.organizer_id = users.id);
