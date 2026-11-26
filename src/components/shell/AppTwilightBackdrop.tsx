"use client";

import { useEffect, useRef, useState } from "react";
import { m, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

/**
 * Persistent semi-opaque Obsidian Twilight backdrop + subtle floating embers
 * mounted behind all signed-in app pages in Dark mode.
 * Gives every signed-in route (/dashboard, /events, /calendar, /passes, /vault, /profile)
 * the same layered atmospheric depth as the public Cinema Hero without blocking clicks.
 */
export function AppTwilightBackdrop() {
  const reduced = !!useReducedMotion();
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 24 });
  const p = reduced ? scrollYProgress : smooth;
  const y = useTransform(p, [0, 1], ["0%", "-8%"]);
  const scale = useTransform(p, [0, 1], [1.04, 1.13]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || reduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const palette = [
      "rgba(240, 215, 255, ",
      "rgba(227, 38, 79, ",
      "rgba(237, 227, 218, ",
    ];

    const motes = Array.from({ length: 24 }, (_, i) => ({
      x: Math.random() * (w || 1440),
      y: Math.random() * (h || 900),
      r: 0.8 + Math.random() * 1.6,
      vy: 0.12 + Math.random() * 0.28,
      vx: (Math.random() - 0.5) * 0.14,
      phase: Math.random() * Math.PI * 2,
      color: palette[i % palette.length],
      alpha: 0.12 + Math.random() * 0.3,
    }));

    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const pt of motes) {
        pt.y -= pt.vy;
        pt.x += pt.vx + Math.sin(t * 0.0006 + pt.phase) * 0.12;
        if (pt.y < -10) {
          pt.y = h + 10;
          pt.x = Math.random() * w;
        }
        if (pt.x < -10) pt.x = w + 10;
        if (pt.x > w + 10) pt.x = -10;

        const twinkle = 0.65 + 0.35 * Math.sin(t * 0.0015 + pt.phase);
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fillStyle = `${pt.color}${(pt.alpha * twinkle).toFixed(3)})`;
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [mounted, reduced]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 hidden overflow-hidden bg-[#121110] dark:block"
    >
      <m.img
        src="/images/cinematic/scene2-plate.jpg"
        alt=""
        style={reduced ? undefined : { y, scale }}
        className="h-[112%] w-full object-cover object-center opacity-[0.14] saturate-[1.06] will-change-transform"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(880px circle at 84% 12%, rgba(227,38,79,0.13), transparent 56%), radial-gradient(760px circle at 12% 82%, rgba(240,215,255,0.1), transparent 56%), linear-gradient(to bottom, rgba(18,17,16,0.68) 0%, rgba(18,17,16,0.78) 52%, rgba(18,17,16,0.9) 100%)",
        }}
      />
      {mounted && !reduced && (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      )}
    </div>
  );
}
