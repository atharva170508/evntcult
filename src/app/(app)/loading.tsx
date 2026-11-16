/** Shown while an app page loads its data: shimmering placeholders in the page's shape. */
export default function Loading() {
  return (
    <div className="pt-6 md:pt-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="space-y-4 border-b border-line pb-10">
        <div className="skeleton h-3 w-28" />
        <div className="skeleton h-14 w-[min(520px,80%)] rounded-xl" />
        <div className="skeleton h-4 w-[min(380px,60%)]" />
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-12">
        <div className="skeleton h-[300px] rounded-card lg:col-span-8" />
        <div className="skeleton h-[300px] rounded-card lg:col-span-4" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="skeleton h-[124px] rounded-card" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}
