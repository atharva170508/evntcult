import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Search, SearchX } from "lucide-react";
import { listEvents } from "@/lib/data/events";
import { CATEGORIES } from "@/lib/data/types";
import { listQuerySchema } from "@/lib/validation";
import { EventCard } from "@/components/dashboard/sections";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/brand/PageHero";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkButton, buttonClass } from "@/components/ui/Button";

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
      "inline-flex h-8 shrink-0 items-center rounded-full px-3.5 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-fast ease-out",
      active ? "bg-ink text-white shadow-button" : "bg-surface text-ink-2 shadow-card hover:text-ink hover:shadow-raised",
    );
  const filtered = !!(q.type || q.when || q.price || q.q);
  const nextHref = nextCursor ? `${href({})}${href({}).includes("?") ? "&" : "?"}cursor=${encodeURIComponent(nextCursor)}` : null;

  return (
    <div className="pb-8">
      <PageHero
        eyebrow="Discover"
        title={
          <>
            Events <em>near you.</em>
          </>
        }
      />

      <div className="sticky top-[var(--header-h)] z-20 -mx-gutter border-b border-line bg-canvas/90 px-gutter py-4 backdrop-blur-xl">
        <form action="/events" role="search" className="flex h-11 items-center gap-2 rounded-full bg-surface pl-4 pr-1.5 shadow-card transition-shadow duration-fast focus-within:shadow-raised md:max-w-xl">
          <Search className="size-4 shrink-0 text-ink-subtle" aria-hidden />
          <input
            name="q"
            type="search"
            defaultValue={q.q}
            placeholder="Search by name or venue"
            className="min-w-0 flex-1 bg-transparent text-[14.5px] placeholder:text-ink-subtle focus:outline-none [&::-webkit-search-cancel-button]:hidden"
            aria-label="Search events"
          />
          {q.type && <input type="hidden" name="type" value={q.type} />}
          {q.when && <input type="hidden" name="when" value={q.when} />}
          {q.price && <input type="hidden" name="price" value={q.price} />}
          <button className={buttonClass("primary", "sm")}>Search</button>
        </form>

        <div className="mt-3 space-y-2">
          <nav aria-label="Category" className="no-scrollbar -mx-gutter flex gap-1.5 overflow-x-auto px-gutter py-0.5">
            <Link href={href({ type: undefined })} className={chip(!q.type)} aria-current={!q.type ? "true" : undefined}>
              All types
            </Link>
            {CATEGORIES.map((c) => (
              <Link key={c} href={href({ type: c })} className={chip(q.type === c)} aria-current={q.type === c ? "true" : undefined}>
                {LABEL[c]}
              </Link>
            ))}
          </nav>
          <nav aria-label="Date and price" className="no-scrollbar -mx-gutter flex items-center gap-1.5 overflow-x-auto px-gutter py-0.5">
            <Link href={href({ when: undefined })} className={chip(!q.when)}>
              Any day
            </Link>
            {Object.entries(WHEN).map(([k, v]) => (
              <Link key={k} href={href({ when: k })} className={chip(q.when === k)}>
                {v}
              </Link>
            ))}
            <span className="mx-1.5 h-5 w-px shrink-0 bg-line-strong" aria-hidden />
            <Link href={href({ price: undefined })} className={chip(!q.price)}>
              Any price
            </Link>
            <Link href={href({ price: "free" })} className={chip(q.price === "free")}>
              Free
            </Link>
            <Link href={href({ price: "paid" })} className={chip(q.price === "paid")}>
              Paid
            </Link>
          </nav>
        </div>
      </div>

      <div className="mt-8 flex items-baseline justify-between gap-4">
        <p className="text-[13px] text-ink-muted" role="status">
          <span className="font-mono tabular-nums text-ink">{events.length}</span> event{events.length === 1 ? "" : "s"}
          {nextCursor ? " on this page" : ""}
          {q.q ? (
            <>
              {" "}
              for &ldquo;<span className="text-ink">{q.q}</span>&rdquo;
            </>
          ) : null}
        </p>
        {filtered && (
          <Link href="/events" className="text-[13px] font-medium text-ink-muted underline decoration-line-strong underline-offset-4 hover:text-ink">
            Clear filters
          </Link>
        )}
      </div>

      {events.length === 0 ? (
        <div className="mt-6">
          <EmptyState icon={SearchX} title="No events match these filters" action={{ label: "Clear filters", href: "/events" }} />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 [&>article]:w-auto">
          {events.map((e) => (
            <EventCard key={e.id} e={e} />
          ))}
        </div>
      )}

      {nextHref && (
        <div className="mt-10 flex justify-center">
          <LinkButton href={nextHref} variant="secondary">
            Next page <ArrowRight className="size-4" aria-hidden />
          </LinkButton>
        </div>
      )}
    </div>
  );
}
