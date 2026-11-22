import { CircleAlert } from "lucide-react";

export default function Component() {
  return (
    <div className="rounded-md border px-4 py-3">
      <p className="text-sm">
        <CircleAlert
          aria-hidden="true"
          className="-mt-0.5 me-3 inline-flex text-red-500"
          size={16}
        />
        An error occurred!
      </p>
    </div>
  );
}
