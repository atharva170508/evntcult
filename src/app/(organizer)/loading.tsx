/** §14/§15 loading: skeletons appear only if loading takes longer than 300ms (see .after-300ms). */
export default function OrganizerLoading() {
  return (
    <div className="o-page after-300ms" aria-busy="true">
      <span className="sr-only" role="status">
        Loading…
      </span>
      <div className="h-10 w-64 rounded-sm bg-surface-2" />
      <div className="mt-8 flex flex-col gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 rounded-sm border-b border-line" />
        ))}
      </div>
    </div>
  );
}
