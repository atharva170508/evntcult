import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_HUBS } from "@/lib/discovery";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Homepage Category Directory: jump directly into any campus event category (/category/[slug]).
 */
export function ExploreHubsBand() {
  return (
    <section id="explore" aria-labelledby="explore-h" className="scroll-mt-28 py-14 md:py-22">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2
            id="explore-h"
            className="font-display text-[clamp(38px,4.8vw,60px)] leading-[0.95] tracking-[-0.03em] text-ink"
          >
            Browse by <em>category.</em>
          </h2>
          <Link
            href="/events"
            className="text-[15px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[5px] hover:decoration-ink"
          >
            Open full directory
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORY_HUBS.map((cat) => (
            <li key={cat.slug}>
              <Link
                href={`/category/${cat.slug}`}
                className="group flex h-full flex-col justify-between rounded-2xl bg-surface p-5 shadow-card transition-[transform,box-shadow] duration-fast hover:-translate-y-0.5 hover:shadow-raised"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[16px] font-semibold text-ink">{cat.name}</span>
                  <ArrowUpRight
                      className="size-4 shrink-0 text-ink-subtle transition-transform duration-fast group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                      aria-hidden
                    />
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-ink-muted">
                    {cat.blurb}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
      </Reveal>
    </section>
  );
}
