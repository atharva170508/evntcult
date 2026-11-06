"use client";

/**
 * Motion primitives (in the spirit of motion-primitives.com, written for this app).
 * Each one does one job, works inside server components as a wrapper, and respects
 * the reduced-motion setting from <MotionProvider>.
 */

import { Children, useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type Variants,
} from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ------------------------------------------------------------------ Reveal */

/** Fades and lifts its content in the first time it scrolls into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 14,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "header" | "article";
}) {
  const Comp = motion[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </Comp>
  );
}

/* ----------------------------------------------------------------- Stagger */

const groupVariants: Variants = { hidden: {}, show: { transition: { staggerChildren: 0.055, delayChildren: 0.04 } } };
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.985 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: EASE } },
};

/** Children appear one after another (lists, card grids). Each direct child is wrapped. */
export function Stagger({
  children,
  className,
  itemClassName,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  itemClassName?: string;
  as?: "div" | "ul";
}) {
  const Group = as === "ul" ? motion.ul : motion.div;
  const Item = as === "ul" ? motion.li : motion.div;
  return (
    <Group className={className} variants={groupVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: "0px 0px -5% 0px" }}>
      {Children.toArray(children).map((child, i) => (
        <Item key={i} variants={itemVariants} className={itemClassName}>
          {child}
        </Item>
      ))}
    </Group>
  );
}

/* ---------------------------------------------------------- AnimatedNumber */

/** Counts up to `value` when it scrolls into view, and springs to new values after that. */
export function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const spring = useSpring(0, { stiffness: 90, damping: 22, mass: 0.8 });
  const text = useTransform(spring, (n) => Math.round(n).toLocaleString("en-IN"));

  useEffect(() => {
    if (!inView) return;
    if (reduce) spring.jump(value);
    else spring.set(value);
  }, [inView, value, reduce, spring]);

  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      <span className="sr-only">{value.toLocaleString("en-IN")}</span>
      <motion.span aria-hidden>{text}</motion.span>
    </span>
  );
}

/* -------------------------------------------------------------- TextEffect */

/** Headline that arrives word by word with a soft blur (hero text only — don't overuse). */
export function TextEffect({ text, className, delay = 0, as = "h1" }: { text: string; className?: string; delay?: number; as?: "h1" | "h2" | "p" }) {
  const Comp = motion[as];
  const words = text.split(" ");
  return (
    <Comp className={className} aria-label={text} initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.045, delayChildren: delay } } }}>
      {words.map((w, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="inline-block whitespace-pre"
          variants={{
            hidden: { opacity: 0, y: "0.35em", filter: "blur(8px)" },
            show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE } },
          }}
        >
          {w + (i < words.length - 1 ? " " : "")}
        </motion.span>
      ))}
    </Comp>
  );
}

/* ---------------------------------------------------------------- Magnetic */

/** Pulls its child a few pixels toward the cursor. Mouse/trackpad only — no effect on touch. */
export function Magnetic({ children, strength = 0.22, className }: { children: React.ReactNode; strength?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const x = useSpring(0, { stiffness: 260, damping: 18 });
  const y = useSpring(0, { stiffness: 260, damping: 18 });
  const reduce = useReducedMotion();

  function move(e: React.PointerEvent) {
    if (reduce || e.pointerType !== "mouse" || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  }
  function leave() {
    x.set(0);
    y.set(0);
  }
  return (
    <motion.span ref={ref} className={cn("inline-flex", className)} style={{ x, y }} onPointerMove={move} onPointerLeave={leave}>
      {children}
    </motion.span>
  );
}

/* --------------------------------------------------------------- Spotlight */

/** Card surface with a soft light that follows the cursor. */
export function Spotlight({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  return (
    <div
      ref={ref}
      className={cn("relative overflow-hidden", className)}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        setPos({ x: e.clientX - r.left, y: e.clientY - r.top });
      }}
      onPointerLeave={() => setPos(null)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: pos ? 1 : 0,
          background: pos ? `radial-gradient(340px circle at ${pos.x}px ${pos.y}px, rgb(var(--primary) / 0.09), transparent 65%)` : undefined,
        }}
      />
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------- Tilt */

/** Gentle 3D tilt toward the cursor (for the pass card). */
export function Tilt({ children, className, max = 5 }: { children: React.ReactNode; className?: string; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const rx = useSpring(useTransform(py, [0, 1], [max, -max]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(px, [0, 1], [-max, max]), { stiffness: 200, damping: 20 });
  const reduce = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      style={reduce ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width);
        py.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        animate(px, 0.5);
        animate(py, 0.5);
      }}
    >
      {children}
    </motion.div>
  );
}
