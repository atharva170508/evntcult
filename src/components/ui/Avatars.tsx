import { cn } from "@/lib/utils";

/**
 * "184 going" with a stack of little profile circles (Luma / Meetup idea).
 * In demo mode the faces are initials picked from a fixed list, seeded by the event id.
 */
const NAMES = ["Aarav", "Diya", "Kabir", "Isha", "Vihaan", "Anaya", "Rohan", "Meera", "Arjun", "Sara", "Neel", "Tara"];
const COLORS = ["#ffd25e", "#b9f0d0", "#cfd8ff", "#ffc9d6", "#c7f0ff", "#ffe0bd", "#e1d4ff"];

function seed(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

export function Avatars({
  id,
  count,
  label = "going",
  size = 26,
  className,
  onDark,
}: {
  id: string;
  count: number;
  label?: string;
  size?: number;
  className?: string;
  onDark?: boolean;
}) {
  const s = seed(id);
  const shown = Math.min(4, count);
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex">
        {Array.from({ length: shown }, (_, i) => {
          const name = NAMES[(s + i * 5) % NAMES.length];
          return (
            <span
              key={i}
              className={cn("grid place-items-center rounded-full text-[10px] font-bold text-ink ring-2", onDark ? "ring-white/80" : "ring-white")}
              style={{ width: size, height: size, marginLeft: i ? -size / 3 : 0, background: COLORS[(s + i) % COLORS.length] }}
              title={name}
            >
              {name[0]}
            </span>
          );
        })}
      </div>
      <span className={cn("text-[12.5px] font-semibold", onDark ? "text-white" : "text-ink-2")}>
        {count.toLocaleString("en-IN")} <span className={onDark ? "text-white/75" : "text-ink-muted"}>{label}</span>
      </span>
    </div>
  );
}
