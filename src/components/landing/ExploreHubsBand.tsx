import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CATEGORY_HUBS, CITIES } from "@/lib/discovery";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Luma-inspired homepage Discovery Directory: jump directly into any City Hub (/city/[slug])
 * or Category Hub (/category/[slug]). Clean editorial typography and hairline-divided rows.
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
          Browse by hub <em>or category.</em>
        </h2>
        <Link
          href="/events"
          className="text-[15px] font-semibold text-ink underline decoration-line-strong decoration-2 underline-offset-[5px] hover:decoration-ink"
        >
          Open full directory
        </Link>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14">
        {/* City Hubs */}
        <div>
          <p className="text-[13px] font-semibold text-ink-muted">Hubs &amp; cities</p>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {CITIES.map((city) => (
              <li key={city.slug}>
                <Link
                  href={`/city/${city.slug}`}
                  className="group flex items-center justify-between gap-4 py-4 transition-colors"
                >
                  <div className="min-w-0">
                    <span className="block text-[17px] font-semibold text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
                      {city.name}
                    </span>
                    <span className="mt-0.5 block truncate text-[13.5px] text-ink-muted">
                      {city.region}
                    </span>
                  </div>
                  <ArrowUpRight
                    className="size-4 shrink-0 text-ink-subtle transition-transform duration-fast group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Categories */}
        <div>
          <p className="text-[13px] font-semibold text-ink-muted">Categories</p>
          <ul className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {CATEGORY_HUBS.map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/category/${cat.slug}`}
                  className="group flex h-full flex-col justify-between rounded-2xl bg-surface p-4 shadow-card transition-[transform,box-shadow] duration-fast hover:-translate-y-0.5 hover:shadow-raised"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[15.5px] font-semibold text-ink">{cat.name}</span>
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
        </div>
      </div>
      </Reveal>
    </section>
  );
}
