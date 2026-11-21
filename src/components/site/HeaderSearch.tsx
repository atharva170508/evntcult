"use client";

import { Select } from "@/components/ui/Select";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_NAMES } from "./categories";

const WHEN: [string, string][] = [
  ["", "Any day"],
  ["today", "Today"],
  ["weekend", "This weekend"],
  ["week", "This week"],
  ["month", "This month"],
];

type Field = "q" | "when" | "type" | null;

/**
 * The big search pill: what, when, kind. Each segment lights up when active; the round red
 * button searches. Plain GET to /events, so it works before scripts load and the results page
 * keeps the same filters.
 */
export function HeaderSearch({ className }: { className?: string }) {
  const params = useSearchParams();
  const router = useRouter();
  const [active, setActive] = useState<Field>(null);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [when, setWhen] = useState(params.get("when") ?? "");
  const [type, setType] = useState(params.get("type") ?? "");
  const box = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => box.current && !box.current.contains(e.target as Node) && setActive(null);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (when) p.set("when", when);
    if (type) p.set("type", type);
    setActive(null);
    router.push(p.size ? `/events?${p}` : "/events");
  };

  const seg = (f: Field) =>
    cn(
      "relative flex h-full min-w-0 flex-1 cursor-pointer flex-col justify-center rounded-full px-8 text-left transition-colors duration-fast",
      active === f ? "bg-white shadow-[0_6px_20px_rgba(0,0,0,0.18)]" : active ? "hover:bg-line-strong/60" : "hover:bg-sunken",
    );

  return (
    <form
      ref={box}
      action="/events"
      method="get"
      role="search"
      aria-label="Find events"
      onSubmit={submit}
      className={cn(
        "relative flex h-[66px] w-full items-center rounded-full border border-line-strong shadow-search transition-colors duration-base",
        active ? "bg-mist" : "bg-white",
        className,
      )}
    >
      <label className={cn(seg("q"), "flex-[1.4]")} onClick={() => setActive("q")}>
        <span className="text-[12px] font-semibold text-ink">What</span>
        <input
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setActive("q")}
          placeholder="Search events"
          autoComplete="off"
          className="w-full truncate bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-subtle"
        />
      </label>
      <Divider hidden={active === "q" || active === "when"} />
      <label className={seg("when")} onClick={() => setActive("when")}>
        <span className="text-[12px] font-semibold text-ink">When</span>
        <Select bare name="when" label="When" size="sm" value={when} onChange={setWhen} onOpenChange={(o) => o && setActive("when")} options={WHEN.map(([v, l]) => ({ value: v, label: l }))} />
      </label>
      <Divider hidden={active === "when" || active === "type"} />
      <label className={cn(seg("type"), "pr-[72px]")} onClick={() => setActive("type")}>
        <span className="text-[12px] font-semibold text-ink">Kind</span>
        <Select
          bare
          name="type"
          label="Kind"
          size="sm"
          value={type}
          onChange={setType}
          onOpenChange={(o) => o && setActive("type")}
          options={[{ value: "", label: "Any kind" }, ...Object.entries(CATEGORY_NAMES).map(([v, l]) => ({ value: v, label: l }))]}
        />
      </label>
      <button
        type="submit"
        aria-label="Search"
        className={cn(
          "absolute right-2 top-1/2 flex h-12 -translate-y-1/2 items-center justify-center gap-2 rounded-full bg-accent text-white transition-[width,background-color] duration-base ease-out hover:bg-accent-hover",
          active ? "w-[116px] px-5" : "w-12",
        )}
      >
        <Search className="size-[18px] shrink-0" strokeWidth={2.6} aria-hidden />
        {active && <span className="text-[16px] font-semibold">Search</span>}
      </button>
    </form>
  );
}

function Divider({ hidden }: { hidden: boolean }) {
  return <span aria-hidden className={cn("h-8 w-px shrink-0 bg-line-strong transition-opacity", hidden && "opacity-0")} />;
}

/** The collapsed pill shown in the header after scrolling. Opens command search. */
export function CompactSearch({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="flex h-12 items-center rounded-full border border-line-strong bg-white pl-6 pr-2 text-[14px] shadow-search transition-shadow hover:shadow-raised"
      aria-label="Search events"
    >
      <span className="font-semibold text-ink">Any event</span>
      <span className="mx-4 h-6 w-px bg-line-strong" aria-hidden />
      <span className="font-semibold text-ink">Any day</span>
      <span className="mx-4 h-6 w-px bg-line-strong" aria-hidden />
      <span className="text-ink-subtle">Any kind</span>
      <span className="ml-3 grid size-8 place-items-center rounded-full bg-accent text-white">
        <Search className="size-3.5" strokeWidth={3} aria-hidden />
      </span>
    </button>
  );
}
