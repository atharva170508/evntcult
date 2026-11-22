import { PrinterIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <Button variant="outline">
      <PrinterIcon aria-hidden="true" className="-ms-1 opacity-60" size={16} />
      Print
      <kbd className="-me-1 ms-1 inline-flex h-5 max-h-full items-center rounded border bg-background px-1 font-[inherit] font-medium text-[0.625rem] text-muted-foreground/70">
        ⌘P
      </kbd>
    </Button>
  );
}
