"use client";

import { m, type Variants } from "motion/react";
import { EASE } from "./MotionProvider";

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: EASE } },
};

/** Appears once when scrolled into view: rises 12px and fades in (250ms). Use on section containers only. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
  ...aria
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "header";
  "aria-labelledby"?: string;
  "aria-label"?: string;
}) {
  const C = m[as];
  return (
    <C
      {...aria}
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      variants={item}
      transition={{ delay }}
    >
      {children}
    </C>
  );
}

/** A group whose children (StaggerItem) reveal one after another. */
export function StaggerGroup({ children, className, gap = 0.05, as = "div" }: { children: React.ReactNode; className?: string; gap?: number; as?: "div" | "ul" | "ol" }) {
  const C = m[as];
  return (
    <C
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: gap } } }}
    >
      {children}
    </C>
  );
}

export function StaggerItem({ children, className, as = "div" }: { children: React.ReactNode; className?: string; as?: "div" | "li" }) {
  const C = m[as];
  return (
    <C className={className} variants={item}>
      {children}
    </C>
  );
}
