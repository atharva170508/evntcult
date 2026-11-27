import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_HUBS } from "@/lib/discovery";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Hairline-ruled editorial category directory (distinct visual rhythm from interactive modules).
 */
export function ExploreHubsBand() {
  return (
    <section id="explore" aria-labelledby="explore-h" className="scroll-mt-28 py-14 md:py-22">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink pb-5">
          <div>
            <h2
              id="explore-h"
              className="font-display text-[clamp(40px,4.8vw,64px)] leading-[0.94] tracking-[-0.02em] text-ink"
            >
              Browse by <em>category.</em>
            </h2>
            <p className="mt-2 text-[15px] text-ink-muted">
              Jump straight to the corner of campus you care about.
            </p>
          </div>
          <Link
            href="/events"
            className="inline-flex min-h-[44px] items-center text-[15px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[6px] transition-colors hover:decoration-ink"
          >
            Open full directory
          </Link>
        </div>

        <ul className="grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
          {CATEGORY_HUBS.map((cat) => (
            <li key={cat.slug} className="border-b border-line">
              <Link
                href={`/category/${cat.slug}`}
                className="group flex items-center justify-between gap-6 py-5 transition-colors hover:text-ink"
              >
                <div className="min-w-0">
                  <span className="block font-display text-[clamp(24px,2.4vw,30px)] leading-[1.08] tracking-[-0.015em] text-ink transition-transform duration-fast group-hover:translate-x-1">
                    {cat.name}
                  </span>
                  <p className="mt-1 line-clamp-1 text-[13.5px] text-ink-muted">
                    {cat.blurb}
                  </p>
                </div>
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-ink-muted transition-all duration-fast group-hover:border-ink group-hover:bg-ink group-hover:text-canvas">
                  <ArrowUpRight className="size-4" aria-hidden />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}
