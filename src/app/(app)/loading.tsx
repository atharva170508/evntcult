/** §14/§15 loading: placeholder blocks in the page's shape, shown only after 300ms (see .after-300ms). */
export default function Loading() {
  const block = "rounded-md border border-line bg-surface";
  return (
    <div className="after-300ms mt-8 flex flex-col gap-4" aria-busy="true">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <div className="h-10 w-56 rounded-sm bg-surface" />
      <div className="grid gap-4 lg:grid-cols-12">
        <div className={`${block} h-52 lg:col-span-8`} />
        <div className={`${block} h-52 lg:col-span-4`} />
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`${block} h-24`} />
        ))}
      </div>
    </div>
  );
}
