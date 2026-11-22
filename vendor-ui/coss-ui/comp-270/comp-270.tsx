import { CircleAlert } from "lucide-react";

export default function Component() {
  return (
    <div className="rounded-md border border-red-500/50 px-4 py-3 text-red-600">
      <p className="text-sm">
        <CircleAlert
          aria-hidden="true"
          className="-mt-0.5 me-3 inline-flex opacity-60"
          size={16}
        />
        An error occurred!
      </p>
    </div>
  );
}
