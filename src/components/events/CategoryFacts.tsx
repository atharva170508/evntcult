import { Mic2, Music2, Sparkles, Wrench } from "lucide-react";
import { headlinePills, kindFor, parseConfig } from "@/lib/categories";

/** Category pills under the title: "Teams of 2 to 4", "6v6 Turf", "18+ only", "Bring a laptop". */
export function CategoryPills({
  category,
  raw,
}: {
  category: string | null;
  raw: string | null | undefined;
}) {
  const kind = kindFor(category);
  if (!kind) return null;
  const pills = headlinePills(kind, parseConfig(raw));
  if (!pills.length) return null;
  return (
    <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Event details">
      {pills.map((p) => (
        <li
          key={p}
          className="rounded-lg border border-line-strong bg-white px-2.5 py-1 text-[13px] font-medium text-ink-2"
        >
          {p}
        </li>
      ))}
    </ul>
  );
}

/** Longer category details as their own sections: tracks, lineup, speakers, what to bring. */
export function CategorySections({
  category,
  raw,
}: {
  category: string | null;
  raw: string | null | undefined;
}) {
  const kind = kindFor(category);
  if (!kind) return null;
  const c = parseConfig(raw);
  const blocks: React.ReactNode[] = [];

  if (kind.key === "hackathon" && Array.isArray(c.tracks) && c.tracks.length) {
    blocks.push(
      <Block key="tracks" icon={Sparkles} title="Tracks">
        <ul className="flex flex-wrap gap-2">
          {(c.tracks as string[]).map((t) => (
            <li
              key={t}
              className="rounded-xl bg-sunken px-3 py-2 text-[14.5px] font-semibold text-ink"
            >
              {t}
            </li>
          ))}
        </ul>
      </Block>,
    );
  }
  if (kind.key === "party" && typeof c.lineup === "string") {
    blocks.push(
      <Block key="lineup" icon={Music2} title="Lineup">
        <ol className="divide-y divide-line rounded-2xl border border-line-strong bg-white">
          {c.lineup.split("\n").map((l, i) => {
            const [act, ...rest] = l.split(",");
            return (
              <li
                key={i}
                className="flex items-baseline justify-between gap-4 px-4 py-3"
              >
                <span className="text-[15.5px] font-semibold text-ink">
                  {act.trim()}
                </span>
                {rest.length > 0 && (
                  <span className="shrink-0 text-[13.5px] tabular-nums text-ink-muted">
                    {rest.join(",").trim()}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </Block>,
    );
  }
  if (kind.key === "workshop" && typeof c.speakers === "string") {
    blocks.push(
      <Block key="speakers" icon={Mic2} title="Speakers">
        <ul className="grid gap-2 sm:grid-cols-2">
          {c.speakers.split("\n").map((l, i) => {
            const [name, ...topic] = l.split(",");
            const initials = name
              .trim()
              .split(/\s+/)
              .map((p, j, a) => (j === 0 || j === a.length - 1 ? p[0] : ""))
              .join("")
              .toUpperCase();
            return (
              <li
                key={i}
                className="flex items-center gap-3 rounded-2xl border border-line-strong bg-white p-3"
              >
                <span
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-lavender text-[13px] font-semibold text-ink"
                  aria-hidden
                >
                  {initials}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[15px] font-semibold text-ink">
                    {name.trim()}
                  </span>
                  {topic.length > 0 && (
                    <span className="block truncate text-[13.5px] text-ink-muted">
                      {topic.join(",").trim()}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </Block>,
    );
  }
  if (kind.key === "workshop" && (typeof c.prereq === "string" || c.laptop)) {
    blocks.push(
      <Block key="prep" icon={Wrench} title="Before you come">
        <ul className="space-y-1.5 text-[15px] text-ink-2">
          {c.laptop && <li>Bring a laptop, charged.</li>}
          {typeof c.prereq === "string" && <li>{c.prereq}</li>}
        </ul>
      </Block>,
    );
  }
  if (!blocks.length) return null;
  return (
    <div className="mt-10 space-y-8 border-t border-line pt-8">{blocks}</div>
  );
}

/** The category sections this event will show, for the page's jump bar. */
export function categorySectionList(category: string | null, raw: string | null | undefined): { id: string; label: string }[] {
  const kind = kindFor(category);
  if (!kind) return [];
  const c = parseConfig(raw);
  const out: { id: string; label: string }[] = [];
  if (kind.key === "hackathon" && Array.isArray(c.tracks) && c.tracks.length) out.push({ id: "tracks", label: "Tracks" });
  if (kind.key === "party" && typeof c.lineup === "string") out.push({ id: "lineup", label: "Lineup" });
  if (kind.key === "workshop" && typeof c.speakers === "string") out.push({ id: "speakers", label: "Speakers" });
  if (kind.key === "workshop" && (typeof c.prereq === "string" || c.laptop)) out.push({ id: "prep", label: "Before you come" });
  return out;
}

const BLOCK_ID: Record<string, string> = { Tracks: "tracks", Lineup: "lineup", Speakers: "speakers", "Before you come": "prep" };

function Block({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Mic2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={BLOCK_ID[title]} aria-label={title} className="scroll-mt-36">
      <h2 className="flex items-center gap-2 text-[20px] font-semibold text-ink">
        <Icon className="size-5 text-ink-subtle" aria-hidden /> {title}
      </h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
