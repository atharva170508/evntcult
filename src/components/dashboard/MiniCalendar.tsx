import Link from "next/link";
import { cn } from "@/lib/utils";

/** Month at a glance. Ink fill = today; accent dot = you're registered; grey dot = campus event. */
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
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <Link href="/calendar" className="text-h4 font-semibold hover:underline hover:decoration-line-strong hover:underline-offset-4">
          {monthName}
        </Link>
        <div className="flex items-center gap-3 text-[11.5px] text-ink-muted">
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-accent" /> Yours
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-ink-subtle" /> All events
          </span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 text-center">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div key={i} className="pb-1.5 font-mono text-[10.5px] uppercase text-ink-subtle">
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const key = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const info = data[key];
          const isToday = key === today;
          const label = `${d} ${monthName}${info ? `: ${info.campus} event${info.campus === 1 ? "" : "s"}${info.mine ? `, ${info.mine} yours` : ""}` : ""}`;
          return (
            <div key={i} className="flex flex-col items-center py-0.5" aria-label={label}>
              <span
                className={cn(
                  "grid size-8 place-items-center rounded-full font-mono text-[12.5px] tabular-nums",
                  isToday ? "bg-night font-medium text-white" : info ? "font-medium text-ink" : "text-ink-subtle",
                )}
              >
                {d}
              </span>
              <span className="mt-0.5 flex h-1 gap-0.5" aria-hidden>
                {info?.mine ? <span className="size-1 rounded-full bg-accent" /> : null}
                {info && info.campus > info.mine ? <span className="size-1 rounded-full bg-ink-subtle" /> : null}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
