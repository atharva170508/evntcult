import { newId } from "@/lib/tokens";

export interface TeamRow {
  id: string;
  event_id: string;
  name: string;
  join_code: string;
  captain_id: string;
}

export interface MyTeam {
  id: string;
  name: string;
  code: string;
  isCaptain: boolean;
  members: { name: string; captain: boolean; you: boolean }[];
}

const ALPHABET = "ACDEFGHJKMNPQRTUVWXY34679";
const makeCode = () => [...crypto.getRandomValues(new Uint8Array(6))].map((b) => ALPHABET[b % ALPHABET.length]).join("");
export const normalizeTeamCode = (c: string) => c.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
const ACTIVE = "('registered','waitlisted')";

/** A team by its join code, with how many people are on it now. */
export async function teamByCode(db: D1Database, eventId: string, code: string): Promise<(TeamRow & { members: number }) | null> {
  return db
    .prepare(
      `SELECT t.*, (SELECT COUNT(*) FROM registrations r WHERE r.team_id = t.id AND r.status IN ${ACTIVE}) AS members
         FROM teams t WHERE t.event_id = ? AND t.join_code = ?`,
    )
    .bind(eventId, normalizeTeamCode(code))
    .first<TeamRow & { members: number }>();
}

export async function teamNameTaken(db: D1Database, eventId: string, name: string): Promise<boolean> {
  return !!(await db.prepare("SELECT 1 FROM teams WHERE event_id = ? AND lower(name) = lower(?)").bind(eventId, name.trim()).first());
}

/** Create a team with a fresh join code and put the captain's registration on it. */
export async function createTeam(db: D1Database, eventId: string, captainId: string, regId: string, name: string): Promise<TeamRow> {
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 40);
  for (let attempt = 0; attempt < 5; attempt++) {
    const team: TeamRow = { id: newId(), event_id: eventId, name: clean, join_code: makeCode(), captain_id: captainId };
    try {
      await db.batch([
        db.prepare("INSERT INTO teams (id, event_id, name, join_code, captain_id, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(team.id, eventId, clean, team.join_code, captainId, new Date().toISOString()),
        db.prepare("UPDATE registrations SET team_id = ? WHERE id = ?").bind(team.id, regId),
      ]);
      return team;
    } catch (e) {
      if (String(e).includes("idx_teams_name") || String(e).includes("teams.event_id, lower")) throw new Error("name_taken");
      if (attempt === 4) throw e;
    }
  }
  throw new Error("unreachable");
}

/** Join a team, only if it still has room (checked in the same statement). */
export async function joinTeam(db: D1Database, teamId: string, regId: string, max: number): Promise<boolean> {
  const res = await db
    .prepare(`UPDATE registrations SET team_id = ?1 WHERE id = ?2 AND (SELECT COUNT(*) FROM registrations WHERE team_id = ?1 AND status IN ${ACTIVE}) < ?3`)
    .bind(teamId, regId, max)
    .run();
  return !!res.meta.changes;
}

/** The viewer's team for this registration: name, code to share, and who's on it. */
export async function myTeam(db: D1Database, regId: string, viewerId: string): Promise<MyTeam | null> {
  const t = await db
    .prepare("SELECT t.id, t.name, t.join_code, t.captain_id FROM registrations r JOIN teams t ON t.id = r.team_id WHERE r.id = ?")
    .bind(regId)
    .first<{ id: string; name: string; join_code: string; captain_id: string }>();
  if (!t) return null;
  const members = await db
    .prepare(`SELECT u.id, u.name FROM registrations r JOIN users u ON u.id = r.user_id WHERE r.team_id = ? AND r.status IN ${ACTIVE} ORDER BY r.created_at`)
    .bind(t.id)
    .all<{ id: string; name: string | null }>();
  return {
    id: t.id,
    name: t.name,
    code: t.join_code,
    isCaptain: t.captain_id === viewerId,
    members: (members.results ?? []).map((m) => ({ name: m.name ?? "Guest", captain: m.id === t.captain_id, you: m.id === viewerId })),
  };
}
