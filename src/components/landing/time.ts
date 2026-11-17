import { istYmd } from "@/lib/time";

export { fmtDate } from "@/lib/utils";

/** "Today", "Tomorrow" or a short weekday, on India time. */
export function istDayLabel(d: Date, now = new Date()) {
  const day = istYmd(d);
  if (day === istYmd(now)) return "Today";
  if (day === istYmd(new Date(+now + 86_400_000))) return "Tomorrow";
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", weekday: "short" }).format(d);
}
