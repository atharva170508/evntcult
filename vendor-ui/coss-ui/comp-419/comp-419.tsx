import { CheckIcon } from "lucide-react";

import { Badge } from "@/registry/default/ui/badge";

export default function Component() {
  return (
    <Badge className="gap-1" variant="outline">
      <CheckIcon aria-hidden="true" className="text-emerald-500" size={12} />
      Badge
    </Badge>
  );
}
