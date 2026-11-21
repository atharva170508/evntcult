import type { Team } from "@/lib/data/questions";

/**
 * Teams for a hackathon or tournament: sign-ups grouped by the team name they gave, each checked
 * against the size rule. Incomplete and oversized teams float to the top so you can chase them.
 */
export function TeamsCard({
  teams,
  rule,
  noun,
}: {
  teams: Team[];
  rule: [number, number] | null;
  noun: "Teams" | "Squads";
}) {
  const state = (t: Team) =>
    !rule
      ? "ok"
      : t.members.length < rule[0]
        ? "short"
        : t.members.length > rule[1]
          ? "over"
          : "ok";
  const sorted = [...teams].sort(
    (a, b) => Number(state(a) === "ok") - Number(state(b) === "ok"),
  );
  const complete = teams.filter((t) => state(t) === "ok").length;
  const people = teams.reduce((n, t) => n + t.members.length, 0);

  return (
    <section
      aria-labelledby="teams-h"
      className="rounded-2xl border border-line-strong bg-white"
    >
      <div className="border-b border-line px-5 py-4">
        <h2 id="teams-h" className="text-[16px] font-semibold text-ink">
          {noun}
        </h2>
        <p className="mt-0.5 text-[13.5px] text-ink-muted">
          {teams.length === 0
            ? "Nobody has named a team yet. Guests join a team by typing the same team name at sign-up."
            : `${teams.length} ${noun.toLowerCase()}, ${people} people.${rule ? ` ${complete} of ${teams.length} have ${rule[0] === rule[1] ? rule[0] : `${rule[0]} to ${rule[1]}`} members.` : ""}`}
        </p>
      </div>
      {teams.length > 0 && (
        <ul className="max-h-[420px] divide-y divide-line overflow-y-auto">
          {sorted.map((t) => {
            const st = state(t);
            const inCount = t.members.filter((m) => m.checkedIn).length;
            return (
              <li key={t.name} className="px-5 py-3.5">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate text-[14.5px] font-semibold text-ink">
                    {t.name}
                  </p>
                  <p
                    className={`shrink-0 font-mono text-[12.5px] tabular-nums ${st === "ok" ? "text-ink-2" : "text-danger"}`}
                  >
                    {t.members.length}
                    {rule ? `/${rule[1]}` : ""}
                    {st === "short" ? " short" : st === "over" ? " over" : ""}
                  </p>
                </div>
                <p className="mt-1 text-[13px] leading-snug text-ink-muted">
                  {t.members.map((m, i) => (
                    <span key={i}>
                      {i > 0 && ", "}
                      <span
                        className={
                          m.checkedIn ? "font-medium text-ink" : undefined
                        }
                      >
                        {m.name}
                      </span>
                      {m.role && (
                        <span className="text-ink-subtle"> ({m.role})</span>
                      )}
                    </span>
                  ))}
                </p>
                {inCount > 0 && (
                  <p className="mt-1 text-[12px] text-ink-subtle">
                    {inCount === t.members.length
                      ? "Everyone's in."
                      : `${inCount} checked in.`}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
