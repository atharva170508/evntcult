import { useId } from "react";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Input with end button</Label>
      <div className="flex rounded-md shadow-xs">
        <Input
          className="-me-px flex-1 rounded-e-none shadow-none focus-visible:z-10"
          id={id}
          placeholder="Email"
          type="email"
        />
        <button
          className="inline-flex items-center rounded-e-md border border-input bg-background px-3 font-medium text-foreground text-sm outline-none transition-[color,box-shadow] hover:bg-accent hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          Send
        </button>
      </div>
    </div>
  );
}
