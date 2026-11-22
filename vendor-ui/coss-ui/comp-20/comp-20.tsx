import { DownloadIcon } from "lucide-react";
import { useId } from "react";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Input with end icon button</Label>
      <div className="flex rounded-md shadow-xs">
        <Input
          className="-me-px flex-1 rounded-e-none shadow-none focus-visible:z-10"
          id={id}
          placeholder="Email"
          type="email"
        />
        <button
          aria-label="Subscribe"
          className="inline-flex w-9 items-center justify-center rounded-e-md border border-input bg-background text-muted-foreground/80 text-sm outline-none transition-[color,box-shadow] hover:bg-accent hover:text-accent-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          <DownloadIcon aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  );
}
