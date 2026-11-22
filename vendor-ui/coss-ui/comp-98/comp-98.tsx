"use client";

import { PlusIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <Button
      aria-expanded={open}
      aria-label={open ? "Close menu" : "Open menu"}
      className="group rounded-full"
      onClick={() => setOpen((prevState) => !prevState)}
      size="icon"
      variant="outline"
    >
      <PlusIcon
        aria-hidden="true"
        className="transition-transform duration-500 ease-[cubic-bezier(0.68,-0.6,0.32,1.6)] group-aria-expanded:rotate-135"
        size={16}
      />
    </Button>
  );
}
