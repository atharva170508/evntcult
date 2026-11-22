import { useId } from "react";

import { Button } from "@/registry/default/ui/button";
import { Input } from "@/registry/default/ui/input";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Input with button</Label>
      <div className="flex gap-2">
        <Input className="flex-1" id={id} placeholder="Email" type="email" />
        <Button variant="outline">Send</Button>
      </div>
    </div>
  );
}
