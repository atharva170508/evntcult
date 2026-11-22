import { TriangleAlert } from "lucide-react";

export default function Component() {
  return (
    <div className="rounded-md border px-4 py-3">
      <p className="text-sm">
        <TriangleAlert
          aria-hidden="true"
          className="-mt-0.5 me-3 inline-flex text-amber-500"
          size={16}
        />
        Some information is missing!
      </p>
    </div>
  );
}
