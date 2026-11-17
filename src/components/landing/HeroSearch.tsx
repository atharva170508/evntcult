import { ChevronDown, Search } from "lucide-react";
import { CATEGORY_NAMES } from "@/components/site/categories";

const WHEN: [string, string][] = [
  ["", "Any day"],
  ["today", "Today"],
  ["weekend", "This weekend"],
  ["week", "This week"],
  ["month", "This month"],
];

const seg = "relative flex min-w-0 flex-col justify-center px-5 py-3 transition-colors duration-fast hover:bg-sunken/70 focus-within:bg-sunken/70 md:py-0";
const label = "text-[12px] font-semibold text-ink";
const control = "w-full min-w-0 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-subtle";

/**
 * Three questions, one bar: what, when, what kind. A plain GET form to /events, so it works
 * before JavaScript loads and the results page shows the same filters.
 */
export function HeroSearch() {
  return (
    <form
      action="/events"
      method="get"
      role="search"
      aria-label="Find events"
      className="flex flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_0_0_1px_#E5E7EB,0_14px_40px_-16px_rgba(11,22,38,0.22)] md:h-[72px] md:flex-row md:items-stretch md:rounded-[20px] md:p-2"
    >
      <label className={`${seg} md:flex-[1.5] md:rounded-[14px]`}>
        <span className={label}>What</span>
        <input name="q" type="search" placeholder="Hackathon, open mic, finals…" className={`${control} [&::-webkit-search-cancel-button]:hidden`} />
      </label>
      <span aria-hidden className="mx-5 h-px bg-line md:mx-0 md:my-3 md:h-auto md:w-px" />
      <label className={`${seg} md:flex-1 md:rounded-[14px]`}>
        <span className={label}>When</span>
        <span className="relative">
          <select name="when" defaultValue="" className={`${control} cursor-pointer appearance-none pr-6`}>
            {WHEN.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
        </span>
      </label>
      <span aria-hidden className="mx-5 h-px bg-line md:mx-0 md:my-3 md:h-auto md:w-px" />
      <label className={`${seg} md:flex-1 md:rounded-[14px]`}>
        <span className={label}>Kind</span>
        <span className="relative">
          <select name="type" defaultValue="" className={`${control} cursor-pointer appearance-none pr-6`}>
            <option value="">Anything</option>
            {Object.entries(CATEGORY_NAMES).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-ink-subtle" aria-hidden />
        </span>
      </label>
      <div className="p-2 md:p-0 md:pl-2">
        <button
          type="submit"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] bg-accent px-6 text-[15px] font-semibold text-white shadow-accent transition-[background-color,transform] duration-fast hover:bg-accent-hover active:scale-[0.98] md:h-full"
        >
          <Search className="size-[18px]" strokeWidth={2.4} aria-hidden />
          Search
        </button>
      </div>
    </form>
  );
}
