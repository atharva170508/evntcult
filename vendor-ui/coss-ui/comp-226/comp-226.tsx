import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/registry/default/ui/select";

export default function Component() {
  const id = useId();
  return (
    <div className="*:not-first:mt-2">
      <Label htmlFor={id}>Options with avatar</Label>
      <Select defaultValue="1">
        <SelectTrigger
          className="ps-2 [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_img]:shrink-0"
          id={id}
        >
          <SelectValue placeholder="Select framework" />
        </SelectTrigger>
        <SelectContent className="[&_*[role=option]>span]:start-auto [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:ps-2 [&_*[role=option]]:pe-8">
          <SelectGroup>
            <SelectLabel className="ps-2">Impersonate user</SelectLabel>
            <SelectItem value="1">
              <img
                alt="Frank Allison"
                className="size-5 rounded"
                height={20}
                src="/origin/avatar-20-01.jpg"
                width={20}
              />
              <span className="truncate">Jenny Hamilton</span>
            </SelectItem>
            <SelectItem value="2">
              <img
                alt="Xavier Guerra"
                className="size-5 rounded"
                height={20}
                src="/origin/avatar-20-02.jpg"
                width={20}
              />
              <span className="truncate">Paul Smith</span>
            </SelectItem>
            <SelectItem value="3">
              <img
                alt="Anne Kelley"
                className="size-5 rounded"
                height={20}
                src="/origin/avatar-20-03.jpg"
                width={20}
              />
              <span className="truncate">Luna Wyen</span>
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
}
