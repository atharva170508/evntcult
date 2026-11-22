import { ArrowRightIcon, TriangleAlert } from "lucide-react";

export default function Component() {
  return (
    <div className="rounded-md border px-4 py-3">
      <div className="flex gap-3">
        <TriangleAlert
          aria-hidden="true"
          className="hrink-0 mt-0.5 text-amber-500"
          size={16}
        />
        <div className="flex grow justify-between gap-3">
          <p className="text-sm">Some information is missing!</p>
          <a className="group whitespace-nowrap font-medium text-sm" href="#">
            Link
            <ArrowRightIcon
              aria-hidden="true"
              className="-mt-0.5 ms-1 inline-flex opacity-60 transition-transform group-hover:translate-x-0.5"
              size={16}
            />
          </a>
        </div>
      </div>
    </div>
  );
}
