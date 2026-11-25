export default function VaultLoading() {
  return (
    <div className="space-y-8 pb-12 pt-8">
      <div className="space-y-3 border-b border-line pb-6">
        <div className="h-12 w-64 animate-pulse rounded-xl bg-sunken" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded bg-sunken/80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-sunken/75" />
        ))}
      </div>
    </div>
  );
}
