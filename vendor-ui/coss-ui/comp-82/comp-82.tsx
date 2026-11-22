import { TrashIcon } from "lucide-react";

import { Button } from "@/registry/default/ui/button";

export default function Component() {
  return (
    <Button variant="destructive">
      <TrashIcon aria-hidden="true" className="-ms-1 opacity-60" size={16} />
      Button
    </Button>
  );
}
