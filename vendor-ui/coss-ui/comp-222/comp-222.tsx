import { RiGatsbyLine, RiNextjsLine, RiReactjsLine } from "@remixicon/react";
import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select";

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Options with icon</Label>
      <Select defaultValue="3">
        <SelectTrigger
          className="[&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0 [&>span_svg]:text-muted-foreground/80"
          id={id}
        >
          <SelectValue placeholder="Select framework" />
        </SelectTrigger>
        <SelectContent className="[&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]>span]:flex [&_*[role=option]>span]:gap-2">
          <SelectItem value="1">
            <RiReactjsLine aria-hidden="true" size={16} />
            <span className="truncate">React</span>
          </SelectItem>
          <SelectItem value="2">
            <RiNextjsLine aria-hidden="true" size={16} />
            <span className="truncate">Next.js</span>
          </SelectItem>
          <SelectItem value="3">
            <RiGatsbyLine aria-hidden="true" size={16} />
            <span className="truncate">Gatsby</span>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
