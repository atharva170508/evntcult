/** The event page while it loads: poster on the left, title, date, venue and the ticket box on the right. */
export default function Loading() {
  return (
    <div className="grid gap-8 pt-6 md:pt-10 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:gap-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading the event…</span>
      <div>
        <div className="skeleton aspect-square w-full rounded-[24px]" />
        <div className="mt-6 flex items-center gap-3">
          <div className="skeleton size-9 rounded-full" />
          <div className="skeleton h-4 w-32" />
        </div>
      </div>
      <div>
        <div className="skeleton h-6 w-24 rounded-md" />
        <div className="skeleton mt-4 h-12 w-[min(520px,90%)] rounded-xl" />
        <div className="skeleton mt-3 h-4 w-[min(360px,70%)]" />
        {[0, 1].map((i) => (
          <div key={i} className="mt-5 flex items-center gap-4">
            <div className="skeleton size-12 rounded-xl" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-44" />
              <div className="skeleton h-3 w-28" />
            </div>
          </div>
        ))}
        <div className="skeleton mt-7 h-[220px] w-full rounded-[24px]" />
      </div>
    </div>
  );
}
