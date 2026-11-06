/** Shown while an app page loads its data: grey placeholder blocks in the page's shape. */
export default function Loading() {
  const block = "rounded-3xl border border-line bg-surface motion-safe:animate-pulse";
  return (
    <div className="mt-6 space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>
      <div className="h-9 w-56 rounded-xl bg-surface motion-safe:animate-pulse" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className={`${block} h-[260px] lg:col-span-8`} />
        <div className={`${block} h-[260px] lg:col-span-4`} />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-[104px]`} />
        ))}
      </div>
    </div>
  );
}
