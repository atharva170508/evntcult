/**
 * Developer-only: change a user's role. There is deliberately no button in the app for this.
 *
 *   npm run organizer:verify -- someone@college.edu              → organizer (local DB)
 *   npm run organizer:verify -- someone@college.edu attendee     → back to attendee
 *   npm run organizer:verify -- someone@college.edu organizer --remote
 */
import { execFileSync } from "node:child_process";

const [email, roleArg, flag] = process.argv.slice(2);
const role = roleArg && !roleArg.startsWith("--") ? roleArg : "organizer";
const remote = [roleArg, flag].includes("--remote");

if (!email || !/^[^@\s]+@[^@\s]+$/.test(email) || !["attendee", "organizer", "admin"].includes(role)) {
  console.error("Usage: npm run organizer:verify -- <email> [attendee|organizer|admin] [--remote]");
  process.exit(1);
}

const esc = (s: string) => s.replace(/'/g, "''");
const stmt =
  `UPDATE users SET role = '${role}' WHERE email = '${esc(email.toLowerCase())}';` +
  ` INSERT INTO audit_log (id, actor_id, action, target_id, meta, created_at)` +
  ` SELECT lower(hex(randomblob(16))), NULL, 'role_change', id, '{"role":"${role}","by":"cli"}', strftime('%Y-%m-%dT%H:%M:%fZ','now') FROM users WHERE email = '${esc(email.toLowerCase())}';`;

execFileSync("npx", ["wrangler", "d1", "execute", "evntcult-db", remote ? "--remote" : "--local", "--command", stmt, "--yes"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});
console.log(`${email} → ${role}${remote ? " (production)" : " (local)"}`);
