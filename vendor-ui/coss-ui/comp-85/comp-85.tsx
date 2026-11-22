import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <Button className="group" variant="ghost">
      <ArrowLeftIcon
        aria-hidden="true"
        className="-ms-1 group-hover:-translate-x-0.5 opacity-60 transition-transform"
        size={16}
      />
      Button
    </Button>
  );
}
