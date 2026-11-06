import { cn } from "@/lib/utils";

/**
 * Generated poster for events without an uploaded image (Luma-style: each
 * event gets its own colours). Vivid base gradient + soft orbs + a light
 * dot pattern. Replace with coverImageUrl when set.
 */
const palettes: Record<string, [string, string, string]> = {
  blue: ["#3b82f6", "#6d5dfc", "#7dd3fc"],
  violet: ["#7c3aed", "#5b3fff", "#f472b6"],
  orange: ["#f97316", "#ef4444", "#fbbf24"],
  teal: ["#0ea5a4", "#22c55e", "#38bdf8"],
  pink: ["#ec4899", "#8b5cf6", "#fb923c"],
  green: ["#16a34a", "#0ea5a4", "#facc15"],
  red: ["#e11d48", "#f97316", "#7c3aed"],
};

export function EventArt({ accent, className, intensity = 1 }: { accent: string; className?: string; intensity?: number }) {
  const [a, b, c] = palettes[accent] ?? palettes.blue;
  return (
    <div
      aria-hidden
      className={cn("grain pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      <div className="absolute -left-[15%] -top-[35%] h-[90%] w-[70%] rounded-full blur-3xl" style={{ background: c, opacity: 0.55 * intensity }} />
      <div className="absolute -bottom-[45%] -right-[10%] h-[90%] w-[70%] rounded-full blur-3xl" style={{ background: a, opacity: 0.6 * intensity }} />
      <div
        className="absolute inset-0 opacity-[0.16]"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1.2px)", backgroundSize: "14px 14px" }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />
    </div>
  );
}

export const accentHex = (accent: string) => (palettes[accent] ?? palettes.blue)[0];
