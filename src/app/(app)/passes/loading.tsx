/** Passes while they load: the lanyard badge's outline, so the page doesn't jump when it arrives. */
export default function Loading() {
  return (
    <div className="pt-6 md:pt-10" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading your passes…</span>
      <div className="skeleton h-10 w-40 rounded-xl" />
      <div className="mt-10 flex flex-col items-center">
        <div className="skeleton h-20 w-10 rounded-md" />
        <div className="skeleton -mt-1 h-[440px] w-full max-w-[340px] rounded-[28px]" />
        <div className="mt-6 flex gap-3">
          <div className="skeleton h-11 w-40 rounded-xl" />
          <div className="skeleton h-11 w-32 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
