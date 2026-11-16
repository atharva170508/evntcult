import { cn } from "@/lib/utils";

/**
 * Generated poster for events without an uploaded image. Printed, not glowing:
 * a flat ink colour, one oversized geometric form in a tonal shade, a hairline ring,
 * a halftone band and paper grain. Each accent key gets its own composition so a
 * grid of events reads like a wall of gig posters.
 */
type Palette = { base: string; shade: string; tint: string; form: "sun" | "arc" | "split" | "stack" };

const palettes: Record<string, Palette> = {
  blue: { base: "#2C47C9", shade: "#1F3496", tint: "#9DB0FF", form: "sun" },
  violet: { base: "#4B2A7A", shade: "#34195A", tint: "#C7A8F0", form: "arc" },
  orange: { base: "#E2582A", shade: "#B8401A", tint: "#FFC9A8", form: "split" },
  teal: { base: "#0F6B63", shade: "#0A4D47", tint: "#9EE3D8", form: "stack" },
  pink: { base: "#C9466F", shade: "#9C2E52", tint: "#FFC2D3", form: "sun" },
  green: { base: "#3D6E33", shade: "#2A5023", tint: "#C4E3A6", form: "arc" },
  red: { base: "#B8321A", shade: "#8C2311", tint: "#FFB8A3", form: "stack" },
};

function Form({ p }: { p: Palette }) {
  switch (p.form) {
    case "sun":
      return (
        <>
          <circle cx="78" cy="30" r="34" fill={p.shade} />
          <circle cx="78" cy="30" r="46" fill="none" stroke={p.tint} strokeOpacity="0.35" strokeWidth="0.4" />
          <circle cx="78" cy="30" r="58" fill="none" stroke={p.tint} strokeOpacity="0.2" strokeWidth="0.4" />
        </>
      );
    case "arc":
      return (
        <>
          <path d="M-10 100 A 60 60 0 0 1 110 100 Z" fill={p.shade} />
          <path d="M5 100 A 45 45 0 0 1 95 100" fill="none" stroke={p.tint} strokeOpacity="0.35" strokeWidth="0.4" />
        </>
      );
    case "split":
      return (
        <>
          <path d="M100 0 L100 100 L30 100 Z" fill={p.shade} />
          <circle cx="26" cy="26" r="12" fill="none" stroke={p.tint} strokeOpacity="0.45" strokeWidth="0.5" />
        </>
      );
    case "stack":
      return (
        <>
          <rect x="54" y="-6" width="38" height="38" rx="19" fill={p.shade} />
          <rect x="54" y="36" width="38" height="38" rx="19" fill={p.shade} opacity="0.7" />
          <rect x="54" y="78" width="38" height="38" rx="19" fill={p.shade} opacity="0.45" />
        </>
      );
  }
}

export function EventArt({ accent, className, intensity = 1 }: { accent: string; className?: string; intensity?: number }) {
  const p = palettes[accent] ?? palettes.blue;
  const id = `ht-${accent}`;
  return (
    <div aria-hidden className={cn("grain pointer-events-none absolute inset-0 overflow-hidden", className)} style={{ background: p.base }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 size-full" style={{ opacity: Math.max(0.4, intensity) }}>
        <defs>
          <pattern id={id} width="3" height="3" patternUnits="userSpaceOnUse">
            <circle cx="1.5" cy="1.5" r="0.45" fill={p.tint} fillOpacity="0.35" />
          </pattern>
        </defs>
        <Form p={p} />
        <rect x="0" y="62" width="100" height="14" fill={`url(#${id})`} />
      </svg>
      {/* reading scrim for overlaid type */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/0 to-transparent" />
    </div>
  );
}

export const accentHex = (accent: string) => (palettes[accent] ?? palettes.blue).base;
