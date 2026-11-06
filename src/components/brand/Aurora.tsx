import { cn } from "@/lib/utils";

/**
 * Hero backdrop. Since M8 this is plain Apple-style dark: a graphite panel with a soft
 * white spotlight from the top and a fade into the page. No coloured gradients;
 * neon yellow is the only accent and lives in the content, not the background.
 * (Name kept so existing pages don't change.)
 */
export function Aurora({ className, quiet = false }: { className?: string; quiet?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div className="absolute inset-0" style={{ background: quiet ? "linear-gradient(180deg, #16161b 0%, #101014 100%)" : "linear-gradient(180deg, #1c1c22 0%, #111115 60%, #0b0b0f 100%)" }} />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(70% 60% at 50% 0%, rgba(255,255,255,${quiet ? 0.05 : 0.09}), transparent 70%)` }}
      />
      <div className="absolute inset-x-0 top-0 h-px bg-white/10" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-canvas/70 to-transparent" />
    </div>
  );
}
