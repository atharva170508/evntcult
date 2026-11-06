import { cn } from "@/lib/utils";

/**
 * Cinematic purple → blue gradient backdrop (Hosteve-style hero) with slow-moving
 * light blobs and film grain. Purely decorative; sits behind content.
 */
export function Aurora({ className, quiet = false }: { className?: string; quiet?: boolean }) {
  return (
    <div aria-hidden className={cn("grain pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <div
        className="absolute inset-0"
        style={{
          background: quiet
            ? "linear-gradient(140deg, #1a1440 0%, #10162f 55%, #08080c 100%)"
            : "linear-gradient(135deg, #8a63ff 0%, #5b6dff 45%, #3f4bd8 70%, #1c1446 100%)",
        }}
      />
      <div className="absolute -left-[10%] -top-[30%] h-[80%] w-[60%] rounded-full bg-[#b14dff] opacity-50 blur-[110px] motion-safe:animate-aurora" />
      <div
        className="absolute -bottom-[35%] right-[-10%] h-[85%] w-[65%] rounded-full bg-[#4f7bff] opacity-60 blur-[120px] motion-safe:animate-aurora"
        style={{ animationDelay: "-7s" }}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-canvas via-canvas/40 to-transparent" />
    </div>
  );
}
