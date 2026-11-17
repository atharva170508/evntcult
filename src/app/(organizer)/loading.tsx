/** Shown while a host page loads: placeholders in the shape of the events list. */
export default function Loading() {
  return (
    <div className="pt-8 md:pt-12" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="skeleton h-4 w-24" />
      <div className="skeleton mt-4 h-14 w-[min(420px,70%)] rounded-xl" />
      <div className="skeleton mt-10 h-[84px] rounded-card" />
      <div className="mt-10 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-[68px] rounded-card" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}
