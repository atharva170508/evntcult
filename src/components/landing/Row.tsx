"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** A titled, horizontally scrolling row with arrow buttons, like a shelf. */
export function Row({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  const track = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ start: true, end: false });

  const update = useCallback(() => {
    const el = track.current;
    if (!el) return;
    setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
  }, []);

  useEffect(() => {
    update();
    const el = track.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const page = (dir: 1 | -1) => {
    const el = track.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  const arrow = "grid size-8 place-items-center rounded-full border border-line-strong bg-white text-ink transition-[opacity,box-shadow] hover:shadow-raised disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:shadow-none";

  return (
    <section className="py-5">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-ink">
          <Link href={href} className="group inline-flex items-center gap-1.5">
            {title}
            <ChevronRight className="size-5 transition-transform duration-base group-hover:translate-x-0.5" strokeWidth={2.4} aria-hidden />
          </Link>
        </h2>
        <div className="hidden gap-2 sm:flex">
          <button type="button" aria-label={`Previous ${title}`} disabled={edge.start} onClick={() => page(-1)} className={arrow}>
            <ChevronLeft className="size-4" strokeWidth={2.4} aria-hidden />
          </button>
          <button type="button" aria-label={`Next ${title}`} disabled={edge.end} onClick={() => page(1)} className={arrow}>
            <ChevronRight className="size-4" strokeWidth={2.4} aria-hidden />
          </button>
        </div>
      </div>
      <ul
        ref={track}
        className={cn(
          "no-scrollbar -mx-gutter flex snap-x snap-mandatory scroll-px-gutter gap-4 overflow-x-auto px-gutter sm:mx-0 sm:scroll-px-0 sm:px-0 md:gap-5",
          "[&>li]:w-[44%] [&>li]:shrink-0 [&>li]:snap-start sm:[&>li]:w-[calc((100%-2*16px)/3)] md:[&>li]:w-[calc((100%-3*20px)/4)] lg:[&>li]:w-[calc((100%-4*20px)/5)] xl:[&>li]:w-[calc((100%-5*20px)/6)]",
        )}
      >
        {children}
      </ul>
    </section>
  );
}
