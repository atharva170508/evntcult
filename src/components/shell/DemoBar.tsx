import { cn } from "@/lib/utils";

/** Shown only in DEMO_MODE: switch between the organizer and student views. */
export function DemoBar({ persona }: { persona: "organizer" | "attendee" }) {
  const opt = (as: "organizer" | "attendee", label: string) => (
    <a
      href={`/api/demo/persona?as=${as}`}
      className={cn(
        "rounded-full px-3 py-1 font-semibold transition-colors duration-200",
        persona === as ? "bg-white text-ink shadow-card" : "text-white/70 hover:text-white",
      )}
    >
      {label}
    </a>
  );
  return (
    <div className="bg-ink text-white">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-2 px-4 py-2 text-[12px] lg:px-8">
        <p className="text-white/70">
          <span className="font-bold text-sun">Demo mode</span> · sample data, no database connected
        </p>
        <div className="flex items-center gap-1 rounded-full bg-white/10 p-0.5">
          {opt("organizer", "Organizer view")}
          {opt("attendee", "Student view")}
        </div>
      </div>
    </div>
  );
}
