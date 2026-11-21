/** Discover while it loads: a filter row and a grid of poster cards. */
export default function Loading() {
  return (
    <div className="pt-6 md:pt-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading events…</span>
      <div className="skeleton h-12 w-[min(360px,70%)] rounded-xl" />
      <div className="mt-6 flex gap-2">
        {[96, 120, 140, 110].map((w, i) => (
          <div key={i} className="skeleton h-9 rounded-xl" style={{ width: w }} />
        ))}
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} style={{ animationDelay: `${i * 60}ms` }}>
            <div className="skeleton aspect-[4/5] rounded-[20px]" />
            <div className="skeleton mt-3 h-3 w-24" />
            <div className="skeleton mt-2 h-4 w-[85%]" />
          </div>
        ))}
      </div>
    </div>
  );
}
