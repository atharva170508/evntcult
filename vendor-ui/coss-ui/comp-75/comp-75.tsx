import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import { Textarea } from "@/registry/default/ui/textarea";

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Textarea with no resize</Label>
      <Textarea
        className="[resize:none]"
        id={id}
        placeholder="Leave a comment"
      />
    </div>
  );
}
