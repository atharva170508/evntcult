import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDB } from "@/lib/db";
import { formatINR } from "@/lib/money";
import { ADMIN_COOKIE, readAdminValue } from "@/lib/session";
import { adminOverview } from "@/lib/data/admin";
import { istTime, ticketDate } from "@/lib/organizer/shared";
import { codeLoginOn } from "@/lib/email";
import { whatsappConnected } from "@/lib/notify";
import { AdminLock, OwnerAction } from "@/components/organizer-ui/AdminGate";

export const metadata: Metadata = { title: "Owners", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const inr = (p: number) => (p ? formatINR(p) : "₹0");
const when = (iso: string) => `${ticketDate(iso).slice(4)} ${istTime(new Date(iso))}`;

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  if (!(await readAdminValue((await cookies()).get(ADMIN_COOKIE)?.value))) redirect("/signin");

  const { q } = await searchParams;
  const { stats: s, events, users, activity, stuck, organizers, signups, outbox } = await adminOverview(await getDB(), q);
  const stats: [string, string][] = [
    ["Users", String(s.users)],
    ["New in 7 days", String(s.newUsers)],
    ["Live events", String(s.published)],
    ["Drafts", String(s.drafts)],
    ["Registrations", String(s.registrations)],
    ["Checked in", String(s.checkins)],
    ["Collected", inr(s.collected)],
    ["To verify", inr(s.toVerify)],
  ];

  const peak = Math.max(1, ...signups.map((d) => d.n));
  const health: [string, string, boolean][] = [
    ["User login", codeLoginOn() ? "Email code on" : "No verification", codeLoginOn()],
    ["WhatsApp", whatsappConnected() ? "Connected" : "Not connected", whatsappConnected()],
    ["Messages waiting", String(outbox.queued), true],
    ["Messages failed", String(outbox.failed), outbox.failed === 0],
  ];

  return (
    <>
      <header className="o-top">
        <div className="o-crumb">
          <b>Owners</b>
        </div>
        <span className="o-spacer" />
        <a className="o-btn" href="/api/admin/export?type=users">Users CSV</a>
        <a className="o-btn" href="/api/admin/export?type=events">Events CSV</a>
        <AdminLock />
      </header>
      <div className="o-page" style={{ maxWidth: 1100 }}>
        <dl className="a-stats">
          {stats.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        {stuck.length > 0 && (
          <>
            <h2 className="o-section-label a-head">Payments waiting over a day</h2>
            <div className="a-scroll">
              <table className="a-table">
                <thead>
                  <tr><th>Attendee</th><th>Event</th><th>Organizer</th><th>UPI ID</th><th>Submitted</th><th className="n">Amount</th></tr>
                </thead>
                <tbody>
                  {stuck.map((p) => (
                    <tr key={p.id}>
                      <td className="m">{p.student}</td>
                      <td>{p.event}</td>
                      <td className="m">{p.organizer ?? "None"}</td>
                      <td className="m">{p.utr}</td>
                      <td className="m">{when(p.claimed_at)}</td>
                      <td className="n">{inr(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="a-two">
          <section>
            <h2 className="o-section-label a-head">Sign-ups, 14 days</h2>
            <div className="a-bars">
              {signups.map((d) => (
                <div key={d.day} title={`${d.day}: ${d.n}`}>
                  <span className="a-n">{d.n || ""}</span>
                  <i style={{ height: `${Math.round((d.n / peak) * 64)}px` }} />
                  <span className="a-d">{Number(d.day.slice(8))}</span>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="o-section-label a-head">System</h2>
            {health.map(([k, v, ok]) => (
              <div className="a-kv" key={k}>
                <span>{k}</span>
                <span style={ok ? undefined : { color: "var(--warn)" }}>{v}</span>
              </div>
            ))}
          </section>
        </div>

        <h2 className="o-section-label a-head">Top organizers</h2>
        <div className="a-scroll">
          <table className="a-table">
            <thead>
              <tr><th>Organizer</th><th className="n">Events</th><th className="n">Passes</th><th className="n">Collected</th></tr>
            </thead>
            <tbody>
              {organizers.map((o) => (
                <tr key={o.email}>
                  <td className="m">{o.email}</td>
                  <td className="n">{o.events}</td>
                  <td className="n">{o.passes}</td>
                  <td className="n">{inr(o.collected)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="o-section-label a-head">Events</h2>
        <div className="a-scroll">
          <table className="a-table">
            <thead>
              <tr><th>Event</th><th>Organizer</th><th>Date</th><th>Status</th><th className="n">Passes</th><th className="n">Collected</th><th /></tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id}>
                  <td><a href={`/events/${e.slug}`}>{e.title}</a></td>
                  <td className="m">{e.organizer ?? "None"}</td>
                  <td className="m">{when(e.starts_at)}</td>
                  <td className="m">{e.status}</td>
                  <td className="n">{e.registered}</td>
                  <td className="n">{inr(e.collected)}</td>
                  <td className="n">
                    {e.status === "published" && <OwnerAction kind="take_down" id={e.id} label="Take down" ask={`Take down ${e.title}? Attendees will see it as cancelled.`} />}
                    {e.status === "cancelled" && <OwnerAction kind="restore" id={e.id} label="Restore" ask={`Put ${e.title} back online?`} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="a-head a-users">
          <h2 className="o-section-label">Users</h2>
          <form>
            <input name="q" defaultValue={q} aria-label="Search users" placeholder="Name or email" className="o-input" style={{ height: 26, width: 220, fontSize: 12 }} />
          </form>
        </div>
        <div className="a-scroll">
          <table className="a-table">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th /></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>{u.name}</td>
                  <td className="m">{u.email}</td>
                  <td className="m">{u.role}</td>
                  <td className="m">{when(u.created_at)}</td>
                  <td className="n">
                    {u.blocked_at ? <OwnerAction kind="unblock" id={u.id} label="Unblock" ask={`Unblock ${u.email}?`} /> : <OwnerAction kind="block" id={u.id} label="Block" ask={`Block ${u.email}? They will be signed out everywhere.`} />}
                  </td>
                </tr>
              ))}
              {users.length === 0 && <tr><td colSpan={5} className="m">Nobody matches.</td></tr>}
            </tbody>
          </table>
        </div>

        <h2 className="o-section-label a-head">Activity</h2>
        <div className="a-scroll">
          <table className="a-table">
            <tbody>
              {activity.map((a) => (
                <tr key={a.id}>
                  <td className="m">{when(a.created_at)}</td>
                  <td>{a.action.replace(/_/g, " ")}</td>
                  <td className="m">{a.actor ?? (a.action.startsWith("owner_") ? "Owner" : "System")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
