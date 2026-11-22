import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import { Textarea } from "@/registry/default/ui/textarea";

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Textarea with error</Label>
      <Textarea
        aria-invalid
        defaultValue="Hello!"
        id={id}
        placeholder="Leave a comment"
      />
      <p
        aria-live="polite"
        className="mt-2 text-destructive text-xs"
        role="alert"
      >
        Message should be at least 10 characters
      </p>
    </div>
  );
}
