"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUpRight,
  Award,
  Calendar,
  Camera,
  Compass,
  MapPin,
  Play,
  QrCode,
  ShieldCheck,
  Ticket,
  Zap,
} from "lucide-react";
import {
  m,
  type MotionValue,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import { BrandLogo } from "@/components/site/Brand";
import { BorderTrail } from "@/components/shadcn/border-trail";
import { TextScramble } from "@/components/shadcn/text-scramble";
import { ScrollProgress } from "@/components/shadcn/scroll-progress";
import { ProgressiveBlur } from "@/components/shadcn/progressive-blur";
import { COUT, QOUT } from "@/lib/motion-curves";

const WORD_LETTERS = ["E", "v", "n", "t", "c", "u", "l", "t"];
// Non-linear editorial reveal wave order (1, 2, 7, 5, 4, 3, 6, 8)
const LETTER_DELAYS = [0, 0.08, 0.22, 0.18, 0.14, 0.26, 0.1, 0.3];

const NAV_LINKS = [
  { label: "Events", href: "/events" },
  { label: "Calendar", href: "/calendar" },
  { label: "Venues", href: "/venues" },
  { label: "Host", href: "/host" },
];

const CAPTIONS: [string, string, string][] = [
  ["01", "0% platform fee,", "direct UPI to clubs."],
  ["02", "Offline QR gates,", "scans under a second."],
  ["03", "On-device Face ID,", "photos in your Vault."],
  ["04", "Verified certificates,", "tamper-proof codes."],
];

const SCENE2_CARDS = [
  {
    num: "01",
    label: "Mainstage",
    sub: "Concerts & cultural nights",
    href: "/events",
    bgPos: "0% 0%",
  },
  {
    num: "02",
    label: "Hackathons",
    sub: "24-hour builds & demos",
    href: "/events",
    bgPos: "100% 0%",
  },
  {
    num: "03",
    label: "Workshops",
    sub: "Clubs, talks & meetups",
    href: "/events",
    bgPos: "0% 100%",
  },
] as const;

const SYSTEM_PILLS = [
  { icon: Zap, text: "30s publishing" },
  { icon: QrCode, text: "Offline QR gates" },
  { icon: ShieldCheck, text: "Private Face ID" },
] as const;

/** Individual letter in the giant wordmark with its own staggered scroll-cascade exit. */
function CascadeLetter({
  ch,
  idx,
  p,
  reduced,
}: {
  ch: string;
  idx: number;
  p: MotionValue<number>;
  reduced: boolean;
}) {
  const start = 0.04 + idx * 0.018;
  const end = start + 0.22;
  const y = useTransform(p, [start, end], [0, 260]);
  const opacity = useTransform(p, [start + 0.06, end], [1, 0]);

  return (
    <m.span
      initial={reduced ? false : { opacity: 0, y: "0.1em" }}
      animate={{ opacity: 1, y: "0em" }}
      transition={{
        delay: 0.48 + (LETTER_DELAYS[idx] ?? idx * 0.05),
        duration: 0.48,
        ease: COUT,
      }}
      className="inline-block"
    >
      <m.span style={reduced ? undefined : { y, opacity }} className="inline-block will-change-transform">
        {ch}
      </m.span>
    </m.span>
  );
}

/** Lightweight ambient twilight motes drifting gently through the amphitheatre skylight. */
function TwilightEmbers({ reduced }: { reduced: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (reduced) return;
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
      "rgba(197, 121, 75, ",
    ];

    const motes = Array.from({ length: 40 }, (_, i) => ({
      x: Math.random() * (w || 1440),
      y: Math.random() * (h || 900),
      r: 0.9 + Math.random() * 2,
      vy: 0.16 + Math.random() * 0.38,
      vx: (Math.random() - 0.5) * 0.2,
      phase: Math.random() * Math.PI * 2,
      color: palette[i % palette.length],
      alpha: 0.16 + Math.random() * 0.45,
    }));

    const tick = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      for (const p of motes) {
        p.y -= p.vy;
        p.x += p.vx + Math.sin(t * 0.0007 + p.phase) * 0.16;
        if (p.y < -12) {
          p.y = h + 12;
          p.x = Math.random() * w;
        }
        if (p.x < -12) p.x = w + 12;
        if (p.x > w + 12) p.x = -12;

        const twinkle = 0.65 + 0.35 * Math.sin(t * 0.0018 + p.phase);
        const a = (p.alpha * twinkle).toFixed(3);

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${a})`;
        ctx.fill();

        if (p.r > 1.9) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
          ctx.fillStyle = `${p.color}${(Number(a) * 0.2).toFixed(3)})`;
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [reduced]);

  if (reduced) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[5] h-full w-full"
    />
  );
}

/**
 * Sticky, scroll-scrubbed 320vh 2-Act Cinematic Stage:
 * - Act 1: Full, completely readable "Evntcult" wordmark gently framed by low sculptural wings,
 *   masked headline/body/captions, live twilight embers, and multi-plane mouse parallax.
 * - Scroll Transition: Letters cascade downward left-to-right individually, wings part smoothly,
 *   camera arcs cleanly into the three-quarter plate, and 9 rich Act 2 elements rise up in
 *   staggered waves from below the viewport (eyebrow, title, story, live pills, CTAs, QR pass,
 *   and 3 tall hover-zoom cards) before seamlessly handing off to OnePass Engine.
 */
export function CinematicHero({ qrSvg }: { qrSvg: string }) {
  const reduced = !!useReducedMotion();
  const runwayRef = useRef<HTMLDivElement>(null);
  const [scrambleTick, setScrambleTick] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [navFrosted, setNavFrosted] = useState(false);
  const [act2Interactive, setAct2Interactive] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { scrollYProgress } = useScroll({
    target: runwayRef,
    offset: ["start start", "end end"],
  });

  const smooth = useSpring(scrollYProgress, {
    stiffness: 95,
    damping: 24,
    mass: 0.35,
    restDelta: 0.0005,
  });
  const p = reduced ? scrollYProgress : smooth;

  useEffect(() => {
    const unsub = scrollYProgress.on("change", (v) => {
      setAct2Interactive(v > 0.34);
    });
    const onScroll = () => setNavFrosted(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      unsub();
      window.removeEventListener("scroll", onScroll);
    };
  }, [scrollYProgress]);

  // Multi-plane 3D mouse depth parallax
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 70, damping: 20 });
  const smy = useSpring(my, { stiffness: 70, damping: 20 });

  const plateMouseX = useTransform(smx, [-1, 1], [10, -10]);
  const plateMouseY = useTransform(smy, [-1, 1], [6, -6]);
  const wordMouseX = useTransform(smx, [-1, 1], [14, -14]);
  const wingMouseX = useTransform(smx, [-1, 1], [24, -24]);
  const spotX = useTransform(smx, [-1, 1], ["28%", "72%"]);
  const spotY = useTransform(smy, [-1, 1], ["20%", "68%"]);
  const cursorHaloBg = useTransform(
    [spotX, spotY],
    ([x, y]) =>
      `radial-gradient(560px circle at ${x} ${y}, rgba(240,215,255,0.16), rgba(227,38,79,0.08) 38%, transparent 70%)`,
  );

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reduced || e.pointerType !== "mouse") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
    mx.set(nx);
    my.set(ny);
  };

  // ── Non-overlapping, rock-steady scroll curves ──
  // Camera Plate 1 -> Plate 2 arc (0.14 -> 0.50)
  const p1Scale = useTransform(p, [0, 0.5], [1, 1.15]);
  const p1X = useTransform(p, [0, 0.5], ["0%", "-5.5%"]);
  const p1Opacity = useTransform(p, [0.16, 0.48], [1, 0]);

  const p2Scale = useTransform(p, [0.18, 0.62, 1], [1.13, 1, 1.03]);
  const p2X = useTransform(p, [0.18, 0.62], ["5.5%", "0%"]);
  const p2Opacity = useTransform(p, [0.18, 0.5], [0, 1]);

  // Act 1 Hero UI exits cleanly (0.02 -> 0.28)
  const h1ExitY = useTransform(p, [0.02, 0.24], ["0%", "-115%"]);
  const h1ExitOp = useTransform(p, [0.06, 0.24], [1, 0]);
  const bodyExitY = useTransform(p, [0.03, 0.26], ["0%", "115%"]);
  const bodyExitOp = useTransform(p, [0.07, 0.26], [1, 0]);
  const cardExitOp = useTransform(p, [0.08, 0.25], [1, 0]);
  const cardExitY = useTransform(p, [0.08, 0.25], [0, 24]);
  const capsExitY = useTransform(p, [0.03, 0.24], ["0%", "120%"]);
  const capsExitOp = useTransform(p, [0.06, 0.24], [1, 0]);

  // Foreground sculptural wings part cleanly left & right (0.04 -> 0.36)
  const wingLeftX = useTransform(p, [0.04, 0.38], ["0%", "-65%"]);
  const wingRightX = useTransform(p, [0.06, 0.4], ["0%", "65%"]);
  const wingOp = useTransform(p, [0.18, 0.38], [1, 0]);

  // Act 2: 9 rich staggered rising elements coming up from below the screen (0.30 -> 0.80)
  const s2EyebrowY = useTransform(p, [0.28, 0.52], [180, 0]);
  const s2EyebrowOp = useTransform(p, [0.28, 0.48], [0, 1]);

  const s2TitleY = useTransform(p, [0.31, 0.58], [240, 0]);
  const s2TitleOp = useTransform(p, [0.31, 0.54], [0, 1]);

  const s2ParaY = useTransform(p, [0.36, 0.63], [260, 0]);
  const s2ParaOp = useTransform(p, [0.36, 0.58], [0, 1]);

  const s2PillsY = useTransform(p, [0.4, 0.67], [220, 0]);
  const s2PillsOp = useTransform(p, [0.4, 0.62], [0, 1]);

  const s2ActY = useTransform(p, [0.44, 0.71], [200, 0]);
  const s2ActOp = useTransform(p, [0.44, 0.66], [0, 1]);

  const s2QrY = useTransform(p, [0.34, 0.62], [220, 0]);
  const s2QrOp = useTransform(p, [0.34, 0.58], [0, 1]);

  // 3 Tall Cards rising in dramatic staggered waterfall from deep below viewport
  const card1Y = useTransform(p, [0.34, 0.66], [360, 0]);
  const card1Op = useTransform(p, [0.34, 0.58], [0, 1]);
  const card2Y = useTransform(p, [0.41, 0.73], [440, 0]);
  const card2Op = useTransform(p, [0.41, 0.65], [0, 1]);
  const card3Y = useTransform(p, [0.48, 0.8], [520, 0]);
  const card3Op = useTransform(p, [0.48, 0.72], [0, 1]);

  const cardTransforms = [
    { y: card1Y, opacity: card1Op },
    { y: card2Y, opacity: card2Op },
    { y: card3Y, opacity: card3Op },
  ];

  // Bottom status bar rising late in Act 2
  const s2FootY = useTransform(p, [0.56, 0.82], [90, 0]);
  const s2FootOp = useTransform(p, [0.56, 0.78], [0, 1]);

  // Seamless dark veil handoff into Chapter 01
  const handoffVeilOp = useTransform(p, [0.88, 1], [0, 0.6]);

  const scrollToProgress = (frac: number) => {
    const el = runwayRef.current;
    if (!el) return;
    const maxScroll = el.offsetHeight - window.innerHeight;
    window.scrollTo({
      top: el.offsetTop + maxScroll * frac,
      behavior: reduced ? "instant" : "smooth",
    });
  };

  return (
    <>
      {/* Persistent Floating Dark Twilight Navbar */}
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ${
          navFrosted
            ? "border-b border-white/10 bg-[#121110]/80 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <ScrollProgress className="absolute inset-x-0 bottom-0 h-[2px] bg-gradient-to-r from-[#E3264F] via-[#F0D7FF] to-[#E3264F]" />
        <div className="mx-auto flex h-[74px] max-w-[1440px] items-center justify-between px-5 md:h-[82px] md:px-9">
          <Link href="/dashboard" aria-label="EvntCult home">
            <BrandLogo tone="white" className="text-[20px] md:text-[22px]" />
          </Link>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-10 lg:gap-14">
              {NAV_LINKS.map((item, i) => (
                <li key={item.href} className="overflow-hidden">
                  <m.div
                    initial={reduced ? false : { y: "-115%" }}
                    animate={{ y: "0%" }}
                    transition={{ delay: 0.08 + i * 0.07, duration: 0.34, ease: COUT }}
                  >
                    <Link
                      href={item.href}
                      className="inline-block py-1.5 text-[12.5px] font-medium uppercase tracking-[0.08em] text-[#EDE3DA]/90 transition-opacity duration-300 hover:opacity-55"
                    >
                      {item.label}
                    </Link>
                  </m.div>
                </li>
              ))}
            </ul>
          </nav>

          <m.div
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.42, duration: 0.25 }}
            className="flex items-center gap-3.5"
          >
            <Link
              href="/signin"
              className="hidden text-[13px] font-medium text-[#EDE3DA]/85 transition-opacity hover:opacity-60 sm:inline"
            >
              Sign in
            </Link>
            <Link
              href="/signin?mode=signup"
              className="relative inline-flex h-9 items-center gap-1.5 overflow-hidden rounded-full border border-[#EDE3DA]/25 bg-[#1F1815]/85 px-4 text-[12.5px] font-semibold text-[#EDE3DA] backdrop-blur-md transition-colors hover:bg-[#EDE3DA] hover:text-[#121110]"
            >
              <BorderTrail
                size={46}
                className="bg-gradient-to-l from-[#F0D7FF] via-[#E3264F] to-transparent"
                transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
              />
              <span className="relative z-10">Get your pass</span>
            </Link>
          </m.div>
        </div>
      </header>

      {/* 320vh Sticky Scroll-Scrubbed Cinema Runway */}
      <div
        ref={runwayRef}
        onPointerMove={handlePointerMove}
        className="relative h-[320vh] w-full bg-[#121110]"
      >
        <div
          role="region"
          aria-label="EvntCult cinematic showcase"
          className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-[#121110] text-[#EDE3DA]"
        >
          {/* 1. Camera Plates with Opening Zoom-Out + Mouse Depth + Scroll Camera Arc */}
          <m.div
            className="pointer-events-none absolute -inset-4 overflow-hidden"
            style={{ x: plateMouseX, y: plateMouseY }}
          >
            <m.div
              initial={reduced ? false : { scale: 1.24 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.3, ease: QOUT }}
              className="absolute inset-0"
            >
              <m.img
                src="/images/cinematic/hero-plate.jpg"
                alt=""
                fetchPriority="high"
                decoding="async"
                style={{ scale: p1Scale, x: p1X, opacity: p1Opacity }}
                className="h-full w-full object-cover object-center will-change-transform"
              />
            </m.div>

            <m.img
              src="/images/cinematic/scene2-plate.jpg"
              alt=""
              decoding="async"
              style={{ scale: p2Scale, x: p2X, opacity: p2Opacity }}
              className="absolute inset-0 h-full w-full object-cover object-center will-change-transform"
            />
          </m.div>

          {/* 2. Interactive Volumetric Cursor Light Halo */}
          {mounted && !reduced && (
            <m.div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-[4] opacity-40 mix-blend-screen"
              style={{ background: cursorHaloBg }}
            />
          )}

          {/* 3. Live Ambient Floating Twilight Motes */}
          {mounted && <TwilightEmbers reduced={reduced} />}

          {/* 4. Atmospheric Vignette Shade */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[6]"
            style={{
              background:
                "linear-gradient(to bottom, rgba(18,17,16,0.78) 0%, rgba(18,17,16,0.22) 26%, rgba(18,17,16,0.06) 46%, rgba(18,17,16,0.18) 72%, rgba(18,17,16,0.86) 100%)",
            }}
          />

          {/* 5. Seamless Bottom Handoff Veil into Chapter 01 */}
          <m.div
            aria-hidden
            style={{ opacity: handoffVeilOp }}
            className="pointer-events-none absolute inset-0 z-[18] bg-gradient-to-b from-transparent via-[#121110]/45 to-[#121110]"
          />

          {/* 6. Foreground Depth Layer: 100% Readable Giant "Evntcult" Wordmark + Low Sculptural Framing Wings */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-[8] h-[54vh] overflow-hidden md:h-[58vh]"
          >
            {/* Fully visible, edge-safe giant Evntcult wordmark with per-letter scroll cascade */}
            <m.div
              style={{ x: wordMouseX }}
              className="absolute inset-x-0 bottom-[14vh] flex justify-center whitespace-nowrap px-4 font-display text-[clamp(62px,14.8vw,224px)] font-semibold leading-[0.88] tracking-[-0.035em] text-[#F5EDE4] drop-shadow-[0_12px_36px_rgba(0,0,0,0.65)] md:bottom-[12.5vh]"
            >
              {WORD_LETTERS.map((ch, idx) => (
                <CascadeLetter key={`${ch}-${idx}`} ch={ch} idx={idx} p={p} reduced={reduced} />
              ))}
            </m.div>

            {/* Low Sculptural Left Wing (frames bottom edge without hiding Evntcult) */}
            <m.div
              initial={reduced ? false : { x: "-42%" }}
              animate={{ x: "0%" }}
              transition={{ delay: 0.04, duration: 1.5, ease: QOUT }}
              className="absolute bottom-0 left-0 h-[34%] w-[52%] md:h-[36%]"
            >
              <m.div
                style={{ x: wingLeftX, opacity: wingOp }}
                className="h-full w-full will-change-transform"
              >
                <m.div style={{ x: wingMouseX }} className="h-full w-full">
                  <div
                    className="h-full w-full"
                    style={{
                      clipPath: "polygon(0 26%, 28% 46%, 68% 82%, 100% 100%, 0 100%)",
                      background:
                        "linear-gradient(155deg, rgba(227,38,79,0.34) 0%, rgba(31,24,21,0.96) 28%, #121110 80%)",
                    }}
                  />
                </m.div>
              </m.div>
            </m.div>

            {/* Low Sculptural Right Wing */}
            <m.div
              initial={reduced ? false : { x: "42%" }}
              animate={{ x: "0%" }}
              transition={{ delay: 0, duration: 1.5, ease: QOUT }}
              className="absolute bottom-0 right-0 h-[34%] w-[52%] md:h-[36%]"
            >
              <m.div
                style={{ x: wingRightX, opacity: wingOp }}
                className="h-full w-full will-change-transform"
              >
                <m.div style={{ x: wingMouseX }} className="h-full w-full">
                  <div
                    className="h-full w-full"
                    style={{
                      clipPath: "polygon(100% 24%, 72% 46%, 32% 82%, 0 100%, 100% 100%)",
                      background:
                        "linear-gradient(205deg, rgba(240,215,255,0.28) 0%, rgba(31,24,21,0.96) 28%, #121110 80%)",
                    }}
                  />
                </m.div>
              </m.div>
            </m.div>
          </div>

          {/* 7. Persistent Left Glyph Rail */}
          <m.div
            aria-hidden
            initial={reduced ? false : { opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55, duration: 0.4, ease: COUT }}
            className="pointer-events-none absolute left-6 top-[27vh] z-20 hidden flex-col gap-3.5 text-[#EDE3DA]/75 lg:flex"
          >
            <Ticket className="size-4" strokeWidth={1.5} />
            <Calendar className="size-4" strokeWidth={1.5} />
            <MapPin className="size-4" strokeWidth={1.5} />
            <QrCode className="size-4" strokeWidth={1.5} />
            <Camera className="size-4" strokeWidth={1.5} />
            <Award className="size-4" strokeWidth={1.5} />
            <Compass className="size-4" strokeWidth={1.5} />
          </m.div>

          {/* ═══════════════════ ACT 01: STRAIGHT-ON HERO ═══════════════════ */}
          <section
            aria-hidden={act2Interactive}
            className="pointer-events-none absolute inset-0 z-[12]"
          >
            {/* Masked Editorial Headline */}
            <h1 className="absolute left-5 right-5 top-[88px] overflow-hidden pb-2 font-display text-[clamp(28px,3.6vw,52px)] font-normal uppercase leading-[1.12] tracking-[-0.015em] text-[#EDE3DA] md:left-[56px] md:right-[320px] md:top-[96px]">
              <m.span
                initial={reduced ? false : { y: "-108%" }}
                animate={{ y: "0%" }}
                transition={{ delay: 0.34, duration: 0.88, ease: COUT }}
                className="block"
              >
                <m.span style={{ y: h1ExitY, opacity: h1ExitOp }} className="block">
                  Every campus night, forged into one pass.
                </m.span>
              </m.span>
            </h1>

            {/* Masked Top-Right Lead */}
            <p className="absolute left-5 top-[174px] w-[min(300px,62vw)] overflow-hidden text-[12.5px] leading-[1.45] text-[#EDE3DA]/86 md:left-auto md:right-[40px] md:top-[102px] md:w-[230px] md:text-[13px]">
              <m.span
                initial={reduced ? false : { y: "108%" }}
                animate={{ y: "0%" }}
                transition={{ delay: 0.42, duration: 0.84, ease: COUT }}
                className="block"
              >
                <m.span style={{ y: bodyExitY, opacity: bodyExitOp }} className="block">
                  Concerts, hackathons, workshops, and club nights on one live calendar. Register in a tap and walk straight in offline.
                </m.span>
              </m.span>
            </p>

            {/* Interactive Preview Tile */}
            <m.button
              type="button"
              onClick={() => scrollToProgress(0.74)}
              onMouseEnter={() => setScrambleTick((t) => t + 1)}
              initial={reduced ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.54, duration: 0.35 }}
              style={{ opacity: cardExitOp, y: cardExitY }}
              aria-label="Scroll into Scene 2"
              className={`group absolute right-5 top-[174px] h-[84px] w-[124px] overflow-hidden rounded-lg border border-[#EDE3DA]/20 bg-[#1F1815] text-left transition-transform duration-300 hover:scale-[1.04] md:left-[88px] md:right-auto md:top-[232px] md:h-[118px] md:w-[178px] ${
                act2Interactive ? "pointer-events-none" : "pointer-events-auto"
              }`}
            >
              <div
                className="absolute inset-0 bg-cover transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-110"
                style={{
                  backgroundImage: "url('/images/cinematic/cards-sheet.jpg')",
                  backgroundSize: "200% 200%",
                  backgroundPosition: "100% 100%",
                }}
              />
              <div className="absolute inset-0 bg-[#121110]/30" />
              <BorderTrail
                size={48}
                className="bg-gradient-to-l from-[#F0D7FF] via-[#E3264F] to-transparent"
                transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
              />
              <span className="absolute inset-0 grid place-items-center text-[#EDE3DA]">
                <span className="grid size-9 place-items-center rounded-full border border-[#EDE3DA]/45 bg-[#121110]/45 backdrop-blur-sm transition-transform duration-300 group-hover:scale-110">
                  <Play className="ml-0.5 size-3.5 fill-current" aria-hidden />
                </span>
              </span>
              <span className="absolute bottom-1.5 left-2 right-2 truncate font-mono text-[9.5px] uppercase tracking-[0.1em] text-[#EDE3DA]/90">
                <TextScramble trigger={scrambleTick >= 0} key={scrambleTick}>
                  VELVET-COMET-0042
                </TextScramble>
              </span>
            </m.button>

            {/* Scroll Cue Pill */}
            <m.button
              type="button"
              onClick={() => scrollToProgress(0.74)}
              style={{ opacity: cardExitOp, y: cardExitY }}
              className={`absolute bottom-[84px] right-6 hidden items-center gap-2 rounded-full border border-[#EDE3DA]/22 bg-[#121110]/65 px-3.5 py-1.5 text-[11.5px] font-medium uppercase tracking-[0.08em] text-[#EDE3DA]/90 backdrop-blur-md transition-colors hover:border-[#EDE3DA]/55 hover:text-white md:inline-flex ${
                act2Interactive ? "pointer-events-none" : "pointer-events-auto"
              }`}
            >
              Scroll to explore <ArrowDown className="size-3.5 animate-bounce" aria-hidden />
            </m.button>

            {/* Bottom 01–04 Numbered Masked Captions */}
            <div className="absolute inset-x-5 bottom-4 grid grid-cols-2 gap-x-4 gap-y-2.5 md:inset-x-9 md:bottom-5 md:grid-cols-4 md:gap-6">
              {CAPTIONS.map(([num, l1, l2], idx) => (
                <div key={num} className="overflow-hidden">
                  <m.div
                    initial={reduced ? false : { y: "108%" }}
                    animate={{ y: "0%" }}
                    transition={{ delay: 0.7 + idx * 0.08, duration: 0.28, ease: COUT }}
                  >
                    <m.div
                      style={{ y: capsExitY, opacity: capsExitOp }}
                      className="flex items-center gap-3"
                    >
                      <span className="font-display text-[24px] font-light leading-none text-[#EDE3DA] md:text-[32px]">
                        {num}
                      </span>
                      <span className="border-l border-[#EDE3DA]/40 pl-2.5 text-[11px] leading-[1.3] text-[#EDE3DA]/84 md:text-[11.5px]">
                        <span className="block">{l1}</span>
                        <span className="block">{l2}</span>
                      </span>
                    </m.div>
                  </m.div>
                </div>
              ))}
            </div>
          </section>

          {/* ═══════════════════ ACT 02: STAGGERED RISING STAGE (9 RISING ELEMENTS) ═══════════════════ */}
          <section
            aria-hidden={!act2Interactive}
            className={`absolute inset-0 z-[14] ${
              act2Interactive ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            {/* 1. Chapter Eyebrow rises first */}
            <m.p
              style={{ y: s2EyebrowY, opacity: s2EyebrowOp }}
              className="absolute left-5 top-[86px] font-mono text-[11px] uppercase tracking-[0.14em] text-[#F0D7FF] md:left-[74px] md:top-[102px]"
            >
              02 · THE CAMPUS SYSTEM
            </m.p>

            {/* 2. Giant 3-line Display Title rises */}
            <m.h2
              style={{ y: s2TitleY, opacity: s2TitleOp }}
              className="absolute left-5 top-[110px] font-display text-[clamp(28px,3.3vw,48px)] font-normal uppercase leading-[1.04] tracking-[-0.015em] text-[#EDE3DA] md:left-[74px] md:top-[128px]"
            >
              Unveiling
              <br />
              every stage
              <br />
              on campus.
            </m.h2>

            {/* 3. Editorial Story Paragraph trails smoothly */}
            <m.p
              style={{ y: s2ParaY, opacity: s2ParaOp }}
              className="absolute left-5 top-[214px] w-[min(330px,calc(100vw-40px))] text-[13px] leading-[1.58] text-[#EDE3DA]/86 md:left-[74px] md:top-[296px] md:w-[290px] md:text-[14px]"
            >
              Step into one calm instrument built for campus clubs and attendees. Publish an event in thirty seconds, scan offline QR passes at the gate, sync calendar invites automatically, and collect face-matched photos in your Vault.
            </m.p>

            {/* 4. Rising Feature Pills Strip */}
            <m.div
              style={{ y: s2PillsY, opacity: s2PillsOp }}
              className="absolute left-5 top-[328px] hidden flex-wrap gap-2 md:left-[74px] md:top-[424px] md:flex"
            >
              {SYSTEM_PILLS.map(({ icon: Icon, text }) => (
                <span
                  key={text}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-[#121110]/70 px-3 py-1 text-[11.5px] font-medium text-[#EDE3DA]/90 backdrop-blur-md"
                >
                  <Icon className="size-3 text-[#F0D7FF]" aria-hidden />
                  {text}
                </span>
              ))}
            </m.div>

            {/* 5. Action CTAs rise in */}
            <m.div
              style={{ y: s2ActY, opacity: s2ActOp }}
              className="absolute left-5 top-[348px] flex flex-wrap items-center gap-3 md:left-[74px] md:top-[472px]"
            >
              <Link
                href="/signin?mode=signup"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-[#F0D7FF] px-5 py-2.5 text-[13.5px] font-semibold text-[#121110] transition-colors hover:bg-white"
              >
                <BorderTrail
                  size={44}
                  className="bg-gradient-to-l from-[#E3264F] via-[#121110] to-transparent"
                  transition={{ repeat: Infinity, duration: 4.5, ease: "linear" }}
                />
                <span className="relative z-10 inline-flex items-center gap-2">
                  Enter EvntCult
                  <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
              <a
                href="#onepass"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#EDE3DA]/25 bg-[#121110]/60 px-4 py-2.5 text-[12.5px] font-medium text-[#EDE3DA]/90 backdrop-blur-md transition-colors hover:border-[#EDE3DA]/60 hover:text-white"
              >
                Keep scrolling <ArrowDown className="size-3.5" aria-hidden />
              </a>
            </m.div>

            {/* 6. Floating Live Gate QR Pass Card rises on the top-right */}
            <m.div
              style={{ opacity: s2QrOp, y: s2QrY }}
              className="pointer-events-none absolute right-9 top-[112px] hidden items-center gap-3.5 overflow-hidden rounded-2xl border border-[#EDE3DA]/18 bg-[#121110]/78 p-3.5 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.85)] backdrop-blur-xl lg:flex"
            >
              <BorderTrail
                size={52}
                className="bg-gradient-to-l from-[#F0D7FF] via-[#E3264F] to-transparent opacity-70"
                transition={{ repeat: Infinity, duration: 5.5, ease: "linear" }}
              />
              <div
                className="relative z-10 size-12 rounded-lg bg-[#FFFEF6] p-1"
                dangerouslySetInnerHTML={{ __html: qrSvg }}
              />
              <div className="relative z-10">
                <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#F0D7FF]">
                  ONEPASS · 0.4S OFFLINE GATE
                </p>
                <p className="mt-0.5 font-display text-[18px] leading-tight text-[#EDE3DA]">
                  Instant Campus Pass
                </p>
              </div>
            </m.div>

            {/* 7, 8, 9. Three Tall Hover-Zoom Cards Rising in Staggered Waterfall */}
            <div className="absolute inset-x-5 bottom-8 grid grid-cols-3 gap-2.5 md:inset-x-auto md:bottom-[58px] md:right-[44px] md:flex md:gap-5">
              {SCENE2_CARDS.map((card, idx) => (
                <m.div
                  key={card.label}
                  style={cardTransforms[idx]}
                  className="aspect-[216/246] will-change-transform md:h-[252px] md:w-[218px]"
                >
                  <Link
                    href={card.href}
                    className="group relative block h-full w-full overflow-hidden rounded-sm border border-[#EDE3DA]/15 bg-[#1F1815] transition-colors duration-300 hover:border-[#F0D7FF]/50"
                  >
                    <div
                      className="absolute inset-0 bg-cover transition-transform duration-[900ms] ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-[1.07]"
                      style={{
                        backgroundImage: "url('/images/cinematic/cards-sheet.jpg')",
                        backgroundSize: "200% 200%",
                        backgroundPosition: card.bgPos,
                      }}
                    />
                    <ProgressiveBlur
                      direction="bottom"
                      blurIntensity={0.45}
                      className="pointer-events-none absolute bottom-0 left-0 h-[44%] w-full"
                    />
                    <div
                      aria-hidden
                      className="absolute inset-0"
                      style={{
                        background:
                          "linear-gradient(to bottom, rgba(18,17,16,0) 45%, rgba(18,17,16,0.78) 100%)",
                      }}
                    />
                    <span className="absolute right-3 top-3 font-mono text-[10px] tracking-[0.1em] text-[#EDE3DA]/70">
                      {card.num}
                    </span>
                    <div className="absolute inset-x-3 bottom-3 md:inset-x-4 md:bottom-3.5">
                      <p className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#EDE3DA] md:text-[15.5px]">
                        {card.label}
                      </p>
                      <p className="mt-0.5 hidden text-[11.5px] text-[#EDE3DA]/75 md:block">
                        {card.sub}
                      </p>
                    </div>
                  </Link>
                </m.div>
              ))}
            </div>

            {/* Bottom Rising Status Line */}
            <m.div
              style={{ y: s2FootY, opacity: s2FootOp }}
              className="pointer-events-none absolute bottom-4 left-5 hidden items-center gap-4 font-mono text-[10.5px] uppercase tracking-[0.12em] text-[#EDE3DA]/55 md:left-[74px] md:flex"
            >
              <span>0% COMMISSION</span>
              <span>·</span>
              <span>AUTO .ICS SYNC</span>
              <span>·</span>
              <span>ON-DEVICE PHOTO VAULT</span>
            </m.div>
          </section>
        </div>
      </div>
    </>
  );
}
