"use client";

import { useState } from "react";
import { Search } from "lucide-react";
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
      className="ui-field mt-9 h-auto max-w-[560px] rounded-[18px] p-1.5 pl-1.5"
    >
      {type && <input type="hidden" name="type" value={type} />}
      <Select
        size="sm"
        label="Kind"
        value={type}
        onChange={setType}
        options={KINDS}
        className="shrink-0 [&_.ui-field]:shadow-none [&_.ui-field]:bg-sunken"
      />
      <label className="flex min-w-0 flex-1 items-center gap-2 px-2">
        <Search className="size-4 shrink-0 text-ink-muted" aria-hidden />
        <span className="sr-only">Search events</span>
        <input
          name="q"
          type="search"
          placeholder="Concerts, meetups, workshops…"
          className="h-10 min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none focus-visible:shadow-none placeholder:text-ink-subtle [&::-webkit-search-cancel-button]:hidden"
        />
      </label>
      <button
        type="submit"
        className="ui-press ui-sheen relative h-10 shrink-0 rounded-[12px] bg-ink px-4 text-[14px] font-semibold text-white hover:bg-black sm:px-5"
      >
        <span className="sm:hidden">Go</span>
        <span className="hidden sm:inline">Find events</span>
      </button>
    </form>
  );
}
