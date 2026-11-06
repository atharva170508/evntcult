import { cn } from "@/lib/utils";

/** Month-at-a-glance. Violet dot = you're registered; grey dot = campus event. */
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
      <div className="mb-3 flex items-baseline justify-between">
        <p className="text-[16px] font-bold tracking-tight">{monthName}</p>
        <div className="flex items-center gap-3 text-[11px] font-semibold text-ink-subtle">
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-brand" /> Yours
          </span>
          <span className="flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-ink-subtle" /> Campus
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-semibold text-ink-subtle">
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
            <div key={i} className="flex flex-col items-center py-0.5">
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full text-[12.5px] font-semibold tabular-nums transition-colors",
                  isToday ? "bg-ink text-ink-contrast" : info?.mine ? "bg-brand-soft text-brand-ink" : info ? "text-ink hover:bg-canvas" : "text-ink-muted",
                )}
              >
                {d}
              </span>
              <span className="mt-0.5 flex h-1 gap-0.5">
                {info?.mine ? <span className="size-1 rounded-full bg-brand" /> : null}
                {info && info.campus > info.mine ? <span className="size-1 rounded-full bg-ink-subtle" /> : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
