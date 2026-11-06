/**
 * Deterministic sample data that tells the dashboard's story with real rows:
 *   - Aarav Mehta (organizer) runs RoboWars, Neon Night and Valorant (~1,550 registrations)
 *     and has 3v3 Hoops Night LIVE right now with 131 of 184 checked in.
 *   - Other clubs run a few campus events.
 *   - Diya Sharma (attendee) has passes for Valorant, RoboWars, Neon Night and Figma.
 *
 * Times are relative to the day you run it (so the live event is live), everything else
 * comes from a fixed random seed.
 *
 *   npm run seed           → local D1   (clears and re-seeds)
 *   npm run seed:remote    → production D1
 */
import { writeFileSync } from "node:fs";

// ---------- deterministic randomness ----------
let state = 20261106;
function rand() {
  state |= 0;
  state = (state + 0x6d2b79f5) | 0;
  let t = Math.imul(state ^ (state >>> 15), 1 | state);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T>(a: T[]) => a[Math.floor(rand() * a.length)];
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const token = () => Array.from({ length: 26 }, () => BASE32[Math.floor(rand() * 32)]).join("");
let idn = 0;
const id = (p: string) => `${p}_${(++idn).toString(36).padStart(6, "0")}`;
const q = (v: string | number | null) => (v === null ? "NULL" : typeof v === "number" ? String(v) : `'${v.replace(/'/g, "''")}'`);

// ---------- time helpers (stored UTC, chosen as IST clock times) ----------
const HOUR = 3_600_000;
const now = Date.now();
const IST = 5.5 * HOUR;
function istDay(days: number, hour: number) {
  const ist = new Date(now + IST);
  const midnight = Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()) - IST;
  return new Date(midnight + days * 24 * HOUR + hour * HOUR);
}
const iso = (d: Date) => d.toISOString();
const ago = (h: number) => iso(new Date(now - h * HOUR));

const sql: string[] = [
  "DELETE FROM photo_tags;",
  "DELETE FROM photos;",
  "DELETE FROM audit_log;",
  "DELETE FROM event_updates;",
  "DELETE FROM checkins;",
  "DELETE FROM registrations;",
  "DELETE FROM events;",
  "DELETE FROM users;",
];

// ---------- users ----------
type U = { id: string; email: string; name: string; role: string };
const users: U[] = [];
const addUser = (name: string, email: string, role = "attendee") => {
  const u = { id: id("usr"), email, name, role };
  users.push(u);
  return u;
};
const aarav = addUser("Aarav Mehta", "aarav@college.edu", "organizer");
const kabir = addUser("Kabir Shah", "kabir@college.edu", "organizer"); // Tech & Cultural clubs
const diya = addUser("Diya Sharma", "diya@college.edu");

const FIRST = ["Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Krishna", "Ishaan", "Rohan", "Ananya", "Diya", "Isha", "Meera", "Saanvi", "Aadhya", "Kavya", "Riya", "Tara", "Neha", "Pooja", "Sneha", "Nikhil", "Om", "Yash", "Pranav", "Shruti", "Tanvi", "Aryan", "Kunal"];
const LAST = ["Patil", "Kulkarni", "Deshmukh", "Joshi", "Shinde", "Pawar", "Jadhav", "More", "Gaikwad", "Chavan", "Mehta", "Shah", "Iyer", "Rao", "Nair", "Sharma", "Verma", "Gupta", "Reddy", "Bhosale"];
const attendees: U[] = [];
for (let i = 0; i < 1600; i++) {
  const f = pick(FIRST), l = pick(LAST);
  attendees.push(addUser(`${f} ${l}`, `${f.toLowerCase()}.${l.toLowerCase()}${i}@college.edu`));
}
for (const u of users) sql.push(`INSERT INTO users (id, email, name, role, created_at) VALUES (${q(u.id)}, ${q(u.email)}, ${q(u.name)}, ${q(u.role)}, ${q(ago(24 * 60))});`);

// ---------- events ----------
type E = { id: string; slug: string; title: string; price: number; capacity: number; start: Date; end: Date; status: string };
const events: E[] = [];
function addEvent(o: {
  slug: string; title: string; description: string; category: string; venue: string;
  start: Date; hours: number; capacity: number; price?: number; status?: string; access?: string; code?: string; org: U;
}) {
  const e: E = { id: id("evt"), slug: o.slug, title: o.title, price: o.price ?? 0, capacity: o.capacity, start: o.start, end: new Date(+o.start + o.hours * HOUR), status: o.status ?? "published" };
  events.push(e);
  sql.push(
    `INSERT INTO events (id, slug, title, description, category, venue, starts_at, ends_at, capacity, price_paise, status, access, access_code, organizer_id, banner_key, created_at) VALUES (` +
      [e.id, o.slug, o.title, o.description, o.category, o.venue, iso(e.start), iso(e.end), o.capacity, e.price, e.status, o.access ?? "public", o.code ?? null, o.org.id, null, ago(24 * 20)].map(q).join(", ") +
      ");",
  );
  return e;
}

const hoops = addEvent({ slug: "hoops-night", title: "3v3 Hoops Night", description: "Floodlights on.\nBring your team of three. Walk-in brackets, finals at 9.", category: "SPORTS", venue: "Sports Complex", start: new Date(Math.floor((now - HOUR) / 60_000) * 60_000), hours: 3, capacity: 200, org: aarav });
const valorant = addEvent({ slug: "valorant", title: "Valorant Campus Showdown", description: "5v5. One trophy.\nSingle elimination, best of three in the finals. Bring your own headset.", category: "GAMING", venue: "Seminar Hall 2", start: istDay(1, 10), hours: 6, capacity: 100, price: 10000, org: aarav });
const robowars = addEvent({ slug: "robowars", title: "RoboWars 2026", description: "Metal. Sparks. Glory.\nCombat robots up to 15 kg. Pit area behind the OAT.", category: "TECH", venue: "Open Air Theatre", start: istDay(2, 18), hours: 5, capacity: 1200, org: aarav });
const neon = addEvent({ slug: "neon-night", title: "Neon Night", description: "The freshers' party you'll actually remember.\nDress code: anything that glows.", category: "PARTY", venue: "Main Auditorium", start: istDay(4, 19.5), hours: 4, capacity: 700, price: 29900, access: "code", code: "NEXT7QR", org: aarav });
const talk = addEvent({ slug: "building-with-llms", title: "Building with LLMs", description: "A talk by alumni from Bengaluru startups.\nQ&A and pizza after.", category: "TALK", venue: "Seminar Hall 2", start: istDay(3, 16), hours: 2, capacity: 120, org: kabir });
const bgmi = addEvent({ slug: "bgmi-squad-cup", title: "BGMI Squad Cup", description: "Drop in. Last squad standing.\nSquads of four, ₹50 per player.", category: "GAMING", venue: "Computer Lab 4", start: istDay(1, 14), hours: 4, capacity: 64, price: 5000, org: kabir });
const garba = addEvent({ slug: "garba-night", title: "Garba Night", description: "Dandiya sticks provided.\nLive dhol, food stalls from 6 pm.", category: "CULTURAL", venue: "Open Air Theatre", start: istDay(7, 19), hours: 4, capacity: 1500, org: kabir });
const figma = addEvent({ slug: "figma-in-90", title: "Figma in 90 Minutes", description: "Hands-on design workshop.\nBring a laptop with Figma installed.", category: "WORKSHOP", venue: "Seminar Hall 2", start: istDay(5, 11), hours: 1.5, capacity: 60, org: kabir });
// Aarav's drafts — the dashboard's clash check runs on these.
addEvent({ slug: "open-mic-night", title: "Open Mic Night", description: "Poetry, stand-up, music.", category: "CULTURAL", venue: "Main Auditorium", start: new Date(+neon.end + 10 * 60_000), hours: 3, capacity: 300, status: "draft", org: aarav });
addEvent({ slug: "chess-blitz", title: "Chess Blitz", description: "5-minute games, Swiss format.", category: "GAMING", venue: "Central Library", start: new Date(+valorant.start + HOUR), hours: 2, capacity: 40, status: "draft", org: aarav });

// ---------- registrations ----------
const seq = new Map<string, number>();
const regsByEvent = new Map<string, string[]>();
function register(e: E, u: U, paid: boolean, createdHoursAgo = 24 + rand() * 24 * 10) {
  const n = (seq.get(e.id) ?? 0) + 1;
  seq.set(e.id, n);
  const prefix = e.slug.replace(/[^a-z0-9]/gi, "").slice(0, 4).toUpperCase();
  const rid = id("reg");
  (regsByEvent.get(e.id) ?? regsByEvent.set(e.id, []).get(e.id)!).push(rid);
  sql.push(
    `INSERT INTO registrations (id, event_id, user_id, status, pass_code, pass_token, payment_status, hold_expires_at, created_at, cancelled_at) VALUES (` +
      [rid, e.id, u.id, "registered", `EC-${prefix}-${String(n).padStart(4, "0")}`, token(), e.price > 0 && paid ? "paid" : "unpaid", null, ago(createdHoursAgo), null].map(q).join(", ") +
      ");",
  );
  return rid;
}
function fill(e: E, n: number, paidCount = 0, exclude: U[] = []) {
  const pool = attendees.filter((a) => !exclude.includes(a));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n).map((u, i) => register(e, u, i < paidCount));
}

// Diya's own passes first (so her pass codes are low numbers).
register(valorant, diya, true);
register(robowars, diya, true);
register(neon, diya, true);
register(figma, diya, true);
// Aarav attends other clubs' events too.
register(talk, aarav, true);
register(garba, aarav, true);

const hoopsRegs = fill(hoops, 184);
fill(valorant, 95, 90); //   96 total, 91 paid, 5 unpaid
fill(robowars, 841); //      842 total, free
fill(neon, 610, 547); //     611 total, 548 paid, 63 unpaid
fill(talk, 76);
fill(bgmi, 40, 34);
fill(garba, 979);
fill(figma, 57);

// ---------- live check-ins: 131 of 184 at Hoops Night ----------
hoopsRegs.slice(0, 131).forEach((rid, i) => {
  const at = iso(new Date(+hoops.start - 20 * 60_000 + i * 35_000));
  sql.push(`INSERT INTO checkins (id, registration_id, event_id, scanned_at, device_id, client_scan_id, method) VALUES (${[id("chk"), rid, hoops.id, at, "gate-1", null, i % 9 === 0 ? "manual" : "qr"].map(q).join(", ")});`);
});

// ---------- organizer updates ----------
const update = (e: E, kind: string, body: string, hoursAgo: number) =>
  sql.push(`INSERT INTO event_updates VALUES (${[id("upd"), e.id, kind, body, ago(hoursAgo)].map(q).join(", ")});`);
update(valorant, "schedule", "Check-in moved to 9:30 AM. Brackets go live 30 minutes earlier — bring your own headset.", 0.4);
update(robowars, "venue", "Pit area is now behind the OAT. Teams, load in through Gate 3.", 3);
update(neon, "update", "Dress code: anything that glows. Passes are scanned at the door.", 20);

writeFileSync("seed.sql", sql.join("\n") + "\n");
const regTotal = [...regsByEvent.values()].reduce((s, a) => s + a.length, 0);
console.log(`seed.sql: ${users.length} users, ${events.length} events, ${regTotal} registrations, 131 check-ins`);
