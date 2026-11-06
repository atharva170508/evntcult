-- Shows what cleanup.sql WOULD delete. Changes nothing.
-- Sample rows come from scripts/seed.ts and have short ids like "evt_00001a" / "usr_000003".
-- Real rows made by the app always have long random ids (UUIDs), so they never match.
SELECT 'sample events' AS what, COUNT(*) AS n FROM events WHERE (substr(id, 1, 4) = 'evt_' AND length(id) = 10);
SELECT 'sample users' AS what, COUNT(*) AS n FROM users WHERE (substr(id, 1, 4) = 'usr_' AND length(id) = 10);
SELECT 'sample users kept (they organize a real event)' AS what, COUNT(*) AS n FROM users u
  WHERE (substr(u.id, 1, 4) = 'usr_' AND length(u.id) = 10)
    AND EXISTS (SELECT 1 FROM events e WHERE e.organizer_id = u.id AND NOT (substr(e.id, 1, 4) = 'evt_' AND length(e.id) = 10));
SELECT 'registrations removed' AS what, COUNT(*) AS n FROM registrations
  WHERE (substr(event_id, 1, 4) = 'evt_' AND length(event_id) = 10) OR (substr(user_id, 1, 4) = 'usr_' AND length(user_id) = 10);
SELECT 'real people registered for a sample event (their pass is removed too)' AS what, COUNT(DISTINCT user_id) AS n FROM registrations
  WHERE (substr(event_id, 1, 4) = 'evt_' AND length(event_id) = 10) AND NOT (substr(user_id, 1, 4) = 'usr_' AND length(user_id) = 10);
SELECT 'real events (kept)' AS what, COUNT(*) AS n FROM events WHERE NOT (substr(id, 1, 4) = 'evt_' AND length(id) = 10);
SELECT 'real users (kept)' AS what, COUNT(*) AS n FROM users WHERE NOT (substr(id, 1, 4) = 'usr_' AND length(id) = 10);
