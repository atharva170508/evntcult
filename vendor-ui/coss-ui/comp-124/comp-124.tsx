import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <Button className="gap-1" variant="link">
      <ChevronLeftIcon aria-hidden="true" className="opacity-60" size={16} />
      Go back
    </Button>
  );
}
