import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { listEvents } from "@/lib/data/events";
import { CATEGORIES } from "@/lib/data/types";
import { listQuerySchema } from "@/lib/validation";
import { EventCard } from "@/components/dashboard/sections";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";

export const metadata: Metadata = { title: "Discover" };
export const dynamic = "force-dynamic";

const LABEL: Record<string, string> = { GAMING: "Gaming", SPORTS: "Sports", TECH: "Tech", CULTURAL: "Cultural", WORKSHOP: "Workshops", TALK: "Talks", PARTY: "Parties" };
const WHEN: Record<string, string> = { today: "Today", weekend: "This weekend", week: "This week", month: "This month" };

export default async function EventsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const raw = await searchParams;
  const parsed = listQuerySchema.safeParse(raw);
  const q = parsed.success ? parsed.data : {};
  const { events, nextCursor } = await listEvents(q);

  /** Build a URL that keeps the other filters and drops the cursor. */
  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { type: q.type, when: q.when, price: q.price, q: q.q, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/events?${s}` : "/events";
  };
  const chip = (active: boolean) =>
    cn(
      "shrink-0 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors",
      active ? "border-volt bg-volt text-ink-inverse" : "border-line bg-surface text-ink-2 hover:border-volt/60",
    );

  return (
    <div className="space-y-5 pt-4 md:pt-6">
      <PageHero eyebrow="Discover" title={<>Events on <em>campus</em></>} sub="Fests, game nights, workshops and talks. Register in a tap." marquee={["Discover", "Gaming", "Sports", "Tech", "Cultural"]} />

      <form action="/events" className="flex h-12 items-center rounded-full border border-line bg-surface pl-4 pr-1.5 shadow-card transition-colors focus-within:border-volt/70 md:max-w-xl">
        <Search className="size-[18px] text-ink-subtle" />
        <input name="q" defaultValue={q.q} placeholder="Search by name, venue…" className="min-w-0 flex-1 bg-transparent px-3 text-[14.5px] focus:outline-none" aria-label="Search events" />
        {q.type && <input type="hidden" name="type" value={q.type} />}
        {q.when && <input type="hidden" name="when" value={q.when} />}
        {q.price && <input type="hidden" name="price" value={q.price} />}
        <button className="rounded-full bg-volt px-4 py-2 text-[13px] font-semibold text-ink-inverse">Search</button>
      </form>

      <div className="space-y-2.5">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <Link href={href({ type: undefined })} className={chip(!q.type)}>All types</Link>
          {CATEGORIES.map((c) => (
            <Link key={c} href={href({ type: c })} className={chip(q.type === c)}>{LABEL[c]}</Link>
          ))}
        </div>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <Link href={href({ when: undefined })} className={chip(!q.when)}>Any day</Link>
          {Object.entries(WHEN).map(([k, v]) => (
            <Link key={k} href={href({ when: k })} className={chip(q.when === k)}>{v}</Link>
          ))}
          <span className="mx-1 w-px shrink-0 bg-line" />
          <Link href={href({ price: undefined })} className={chip(!q.price)}>Any price</Link>
          <Link href={href({ price: "free" })} className={chip(q.price === "free")}>Free</Link>
          <Link href={href({ price: "paid" })} className={chip(q.price === "paid")}>Paid</Link>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-[17px] font-bold">No events match these filters.</p>
          <p className="mt-1 text-[14px] text-ink-muted">Try another day or type, or clear the search.</p>
          <Link href="/events" className="mt-4 inline-block rounded-full border border-line px-4 py-2 text-[13px] font-semibold hover:border-volt/60">Clear filters</Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center">
          <Link href={`${href({})}${href({}).includes("?") ? "&" : "?"}cursor=${encodeURIComponent(nextCursor)}`} className="rounded-full border border-line bg-surface px-5 py-2.5 text-[14px] font-semibold hover:border-volt/60">
            Next page →
          </Link>
        </div>
      )}
    </div>
  );
}
