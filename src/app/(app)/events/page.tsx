import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { listEvents } from "@/lib/data/events";
import { CATEGORIES } from "@/lib/data/types";
import { listQuerySchema } from "@/lib/validation";
import { EventCard } from "@/components/dashboard/sections";
import { PillNav } from "@/components/motion/PillNav";
import { Stagger, TextEffect } from "@/components/motion/primitives";

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
  const types = [{ href: href({ type: undefined }), label: "All types", active: !q.type }, ...CATEGORIES.map((c) => ({ href: href({ type: c }), label: LABEL[c], active: q.type === c }))];
  const when = [{ href: href({ when: undefined }), label: "Any day", active: !q.when }, ...Object.entries(WHEN).map(([k, v]) => ({ href: href({ when: k }), label: v, active: q.when === k }))];
  const price = [
    { href: href({ price: undefined }), label: "Any price", active: !q.price },
    { href: href({ price: "free" }), label: "Free", active: q.price === "free" },
    { href: href({ price: "paid" }), label: "Paid", active: q.price === "paid" },
  ];

  return (
    <div className="space-y-5 pt-4 md:pt-6">
      <header>
        <p className="eyebrow">Discover</p>
        <TextEffect text="Events on campus" className="headline mt-1.5 text-[clamp(34px,4.6vw,52px)] leading-[1] tracking-tightest" />
      </header>

      <form action="/events" className="flex h-12 items-center rounded-full border border-line bg-surface pl-4 pr-1.5 shadow-card transition-[border-color,box-shadow] focus-within:border-brand focus-within:shadow-brand md:max-w-xl">
        <Search className="size-[18px] text-ink-subtle" />
        <input name="q" defaultValue={q.q} placeholder="Search by name, venue…" className="min-w-0 flex-1 bg-transparent px-3 text-[14.5px] focus:outline-none" aria-label="Search events" />
        {q.type && <input type="hidden" name="type" value={q.type} />}
        {q.when && <input type="hidden" name="when" value={q.when} />}
        {q.price && <input type="hidden" name="price" value={q.price} />}
        <button className="rounded-full bg-ink px-4 py-2 text-[13px] font-semibold text-ink-contrast transition-transform active:scale-[0.97]">Search</button>
      </form>

      <div className="space-y-2">
        <PillNav id="type" label="Event type" items={types} className="lg:mx-0 lg:px-0" />
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <PillNav id="when" label="When" items={when} className="mx-0 shrink-0 overflow-visible px-0" />
          <span className="mx-1 h-6 w-px shrink-0 bg-line" aria-hidden />
          <PillNav id="price" label="Price" items={price} className="mx-0 shrink-0 overflow-visible px-0" />
        </div>
      </div>

      {events.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-[17px] font-bold">No events match these filters.</p>
          <p className="mt-1 text-[14px] text-ink-muted">Try another day or type, or clear the search.</p>
          <Link href="/events" className="mt-4 inline-block rounded-full border border-line px-4 py-2 text-[13px] font-semibold hover:border-ink">Clear filters</Link>
        </div>
      ) : (
        <Stagger key={JSON.stringify(q)} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" itemClassName="flex [&>article]:w-full">
          {events.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </Stagger>
      )}

      {nextCursor && (
        <div className="flex justify-center">
          <Link href={`${href({})}${href({}).includes("?") ? "&" : "?"}cursor=${encodeURIComponent(nextCursor)}`} className="rounded-full border border-line bg-surface px-5 py-2.5 text-[14px] font-semibold hover:border-ink">
            Next page →
          </Link>
        </div>
      )}
    </div>
  );
}
