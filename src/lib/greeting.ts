/** "Good morning / afternoon / evening", by the time in India (the campus clock, whatever the server's). */
export function greeting(now: Date = new Date()): "Good morning" | "Good afternoon" | "Good evening" {
  const h = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hourCycle: "h23", timeZone: "Asia/Kolkata" }).format(now));
  if (h >= 5 && h < 12) return "Good morning";
  if (h >= 12 && h < 17) return "Good afternoon";
  return "Good evening";
}
