import { TriangleAlert } from "lucide-react";

export default function Component() {
  return (
    <div className="rounded-md border border-amber-500/50 px-4 py-3 text-amber-600">
      <p className="text-sm">
        <TriangleAlert
          aria-hidden="true"
          className="-mt-0.5 me-3 inline-flex opacity-60"
          size={16}
        />
        Some information is missing!
      </p>
    </div>
  );
}
