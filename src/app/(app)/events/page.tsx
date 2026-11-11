import type { Metadata } from "next";
import Link from "next/link";
import { listEvents } from "@/lib/data/events";
import { CATEGORIES } from "@/lib/data/types";
import { listQuerySchema } from "@/lib/validation";
import { EventCard } from "@/components/dashboard/sections";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";
import { buttonClass } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

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
      "press inline-flex h-8 shrink-0 items-center justify-center rounded-sm border px-3 text-label",
      active ? "border-line-strong bg-surface-2 font-semibold text-ink" : "border-line text-ink-muted hover:border-line-strong hover:text-ink",
    );

  return (
    <div className="flex flex-col gap-6">
      <PageHero eyebrow="Discover" title="Events near you" sub={`${events.length}${nextCursor ? "+" : ""} event${events.length === 1 ? "" : "s"}`} />

      <form action="/events" role="search" className="flex h-12 items-center gap-1 rounded-sm border border-line-strong bg-surface pl-1 pr-1 focus-within:border-accent md:h-10 md:max-w-xl">
        <input name="q" defaultValue={q.q} placeholder="Search by name, venue…" className="min-w-0 flex-1 bg-transparent px-2 text-body focus-visible:!border-0 focus-visible:!shadow-none" aria-label="Search events" />
        {q.type && <input type="hidden" name="type" value={q.type} />}
        {q.when && <input type="hidden" name="when" value={q.when} />}
        {q.price && <input type="hidden" name="price" value={q.price} />}
        <button className="press inline-flex items-center justify-center rounded-sm bg-accent px-4 h-8 text-body-sm font-semibold text-ink-inverse hover:bg-[color-mix(in_srgb,var(--accent)_90%,var(--text))]">Search</button>
      </form>

      <div className="space-y-3">
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <Link href={href({ type: undefined })} className={chip(!q.type)}>All types</Link>
          {CATEGORIES.map((c) => (
            <Link key={c} href={href({ type: c })} className={chip(q.type === c)}>{LABEL[c]}</Link>
          ))}
        </div>
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
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
        <EmptyState title="No events match these filters." action={{ label: "Clear filters", href: "/events" }} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {events.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center">
          <Link href={`${href({})}${href({}).includes("?") ? "&" : "?"}cursor=${encodeURIComponent(nextCursor)}`} className={buttonClass("secondary")}>
            Next page ›
          </Link>
        </div>
      )}
    </div>
  );
}
