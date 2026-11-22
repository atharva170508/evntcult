"use client";

import { XIcon } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/registry/default/ui/badge";

export default function Component() {
  const [isActive, setIsActive] = useState(true);

  if (!isActive) return null;

  return (
    <Badge className="gap-0 rounded-md px-2 py-1" variant="outline">
      Tag
      <button
        aria-label="Delete"
        className="-my-[5px] -ms-0.5 -me-2 inline-flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-[inherit] p-0 text-foreground/60 outline-none transition-[color,box-shadow] hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        onClick={() => setIsActive(false)}
        type="button"
      >
        <XIcon aria-hidden="true" size={14} />
      </button>
    </Badge>
  );
}
