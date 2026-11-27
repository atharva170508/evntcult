"use client";

import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { Select } from "@/components/ui/Select";

const KINDS = [
  { value: "", label: "Anything" },
  { value: "TECH", label: "Hackathons" },
  { value: "SPORTS", label: "Sports" },
  { value: "PARTY", label: "Parties" },
  { value: "CULTURAL", label: "Cultural" },
  { value: "WORKSHOP", label: "Workshops" },
  { value: "TALK", label: "Talks" },
  { value: "GAMING", label: "Gaming" },
];

/** The hero's search capsule: kind of event, words, go. Submits to the Events page. */
export function HeroSearch() {
  const [type, setType] = useState("");
  return (
    <form
      action="/events"
      method="get"
      role="search"
      className="ui-field mt-8 h-auto max-w-[560px] rounded-[20px] border border-line-strong/80 bg-surface p-1.5 shadow-[0_2px_4px_rgba(26,26,26,0.04),0_16px_38px_-20px_rgba(45,35,15,0.22),inset_0_1px_0_rgba(255,255,255,0.95)] transition-shadow duration-200 focus-within:border-ink/40 focus-within:shadow-[var(--focus-field)] dark:shadow-[0_16px_36px_-18px_rgba(0,0,0,0.65)]"
    >
      {type && <input type="hidden" name="type" value={type} />}
      <Select
        size="sm"
        label="Kind"
        value={type}
        onChange={setType}
        options={KINDS}
        className="shrink-0 [&_.ui-field]:h-11 [&_.ui-field]:rounded-[13px] [&_.ui-field]:bg-sunken [&_.ui-field]:shadow-none"
      />
      <span className="hidden h-6 w-px shrink-0 bg-line-strong sm:block" aria-hidden />
      <label className="flex min-w-0 flex-1 items-center gap-2.5 px-2">
        <Search className="size-4 shrink-0 text-ink-muted" aria-hidden />
        <span className="sr-only">Search events</span>
        <input
          name="q"
          type="search"
          placeholder="Concerts, hackathons, workshops…"
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none focus-visible:shadow-none placeholder:text-ink-subtle [&::-webkit-search-cancel-button]:hidden"
        />
      </label>
      <button
        type="submit"
        className="group ui-press ui-sheen relative inline-flex h-11 shrink-0 items-center gap-1.5 rounded-[14px] bg-[#C81E45] px-4 text-[14px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_10px_22px_-10px_rgba(200,30,69,0.6)] hover:bg-[#AE173A] sm:px-5"
      >
        <span className="sm:hidden">Go</span>
        <span className="hidden sm:inline">Find events</span>
        <ArrowRight
          className="hidden size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 sm:block"
          aria-hidden
        />
      </button>
    </form>
  );
}
