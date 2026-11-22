import { SendIcon } from "lucide-react";
import { useId } from "react";

import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Input with end inline button</Label>
      <div className="relative">
        <Input className="pe-9" id={id} placeholder="Email" type="email" />
        <button
          aria-label="Subscribe"
          className="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground focus:z-10 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          type="button"
        >
          <SendIcon aria-hidden="true" size={16} />
        </button>
      </div>
    </div>
  );
}
