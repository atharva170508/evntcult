import { InfoIcon } from "lucide-react";

export default function Component() {
  return (
    <div className="rounded-md border px-4 py-3">
      <p className="text-sm">
        <InfoIcon
          aria-hidden="true"
          className="-mt-0.5 me-3 inline-flex text-blue-500"
          size={16}
        />
        Just a quick note!
      </p>
    </div>
  );
}
