"use client";

import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Select } from "@/components/ui/Select";

const KINDS = [
  { value: "", label: "All categories" },
  { value: "TECH", label: "Hackathons" },
  { value: "SPORTS", label: "Sports" },
  { value: "PARTY", label: "Parties" },
  { value: "CULTURAL", label: "Cultural" },
  { value: "WORKSHOP", label: "Workshops" },
  { value: "TALK", label: "Talks" },
  { value: "GAMING", label: "Gaming" },
];

/** Full-width editorial command search capsule connecting the masthead to the stage. */
export function HeroSearch() {
  const [type, setType] = useState("");
  return (
    <form
      action="/events"
      method="get"
      role="search"
      className="ui-field h-auto w-full rounded-[20px] border border-line-strong bg-surface p-1.5 shadow-[0_2px_6px_rgba(26,26,26,0.04),0_20px_44px_-24px_rgba(45,35,15,0.24),inset_0_1px_0_rgba(255,255,255,0.95)] transition-shadow duration-200 focus-within:border-ink/45 focus-within:shadow-[var(--focus-field)] dark:shadow-[0_20px_44px_-20px_rgba(0,0,0,0.7)]"
    >
      {type && <input type="hidden" name="type" value={type} />}
      <Select
        size="sm"
        label="Category"
        value={type}
        onChange={setType}
        options={KINDS}
        className="shrink-0 [&_.ui-field]:h-12 [&_.ui-field]:rounded-[14px] [&_.ui-field]:bg-sunken [&_.ui-field]:px-3.5 [&_.ui-field]:shadow-none"
      />
      <span className="hidden h-6 w-px shrink-0 bg-line-strong sm:block" aria-hidden />
      <label className="flex min-w-0 flex-1 items-center gap-2.5 px-2.5">
        <Search className="size-4 shrink-0 text-ink-muted" aria-hidden />
        <span className="sr-only">Search events</span>
        <input
          name="q"
          type="search"
          placeholder="Search concerts, hackathons, workshops, or clubs…"
          className="h-12 min-w-0 flex-1 bg-transparent text-[15.5px] text-ink outline-none focus-visible:shadow-none placeholder:text-ink-subtle [&::-webkit-search-cancel-button]:hidden"
        />
      </label>
      <button
        type="submit"
        className="group ui-press ui-sheen relative inline-flex h-12 shrink-0 items-center gap-2 rounded-[14px] bg-[#C81E45] px-5 text-[14.5px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.24),0_12px_24px_-10px_rgba(200,30,69,0.65)] hover:bg-[#AE173A] sm:px-6"
      >
        <span className="sm:hidden">Search</span>
        <span className="hidden sm:inline">Find events</span>
        <ArrowRight
          className="hidden size-4 transition-transform duration-200 group-hover:translate-x-0.5 sm:block"
          aria-hidden
        />
      </button>
    </form>
  );
}
