export default function CalendarLoading() {
  return (
    <div className="space-y-8 pb-12 pt-8">
      <div className="flex items-end justify-between gap-4">
        <div className="h-12 w-56 animate-pulse rounded-xl bg-sunken" />
        <div className="h-9 w-36 animate-pulse rounded-full bg-sunken" />
      </div>
      <div className="overflow-hidden rounded-[24px] border border-line bg-surface p-5">
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="h-[72px] animate-pulse rounded-xl bg-sunken/70" />
          ))}
        </div>
      </div>
    </div>
  );
}
