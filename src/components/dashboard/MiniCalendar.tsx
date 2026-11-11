import { cn } from "@/lib/utils";

/** Month at a glance. Today = accent circle on the number. Yours = bold with a dot; other events = a dot. */
export function MiniCalendar({ data }: { data: Record<string, { campus: number; mine: number }> }) {
  const tz = "Asia/Kolkata";
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  const [y, m] = today.split("-").map(Number);
  const first = new Date(Date.UTC(y, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const lead = (first.getUTCDay() + 6) % 7; // Monday-first
  const monthName = new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(first);

  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  return (
    <div>
      <div className="mb-3 flex flex-col gap-1">
        <p className="text-title">{monthName}</p>
        <p className="font-mono text-caption text-ink-subtle">● yours · ○ others</p>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center font-mono text-caption text-ink-subtle">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="pb-1">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const info = data[key];
          const isToday = key === today;
          return (
            <div key={i} className="flex flex-col items-center py-1">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full font-mono text-label tabular-nums",
                  isToday ? "bg-accent text-accent-ink" : info?.mine ? "font-semibold text-ink" : info ? "text-ink" : "text-ink-subtle",
                )}
              >
                {d}
              </span>
              <span className="mt-0.5 flex h-1 gap-1" aria-hidden>
                {info?.mine ? <span className="size-1 rounded-full bg-ink" /> : null}
                {info && info.campus > info.mine ? <span className="size-1 rounded-full border border-ink-subtle" /> : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
