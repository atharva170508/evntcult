import { RiStarFill } from "@remixicon/react";
import { useId } from "react";

import { Label } from "@/registry/default/ui/label";
import { RadioGroup, RadioGroupItem } from "@/registry/default/ui/radio-group";

export default function Component() {
  const id = useId();
  return (
    <RadioGroup defaultValue="all">
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${id}-1`} value="all" />
        <Label htmlFor={`${id}-1`}>
          All reviews{" "}
          <span className="font-normal text-muted-foreground text-xs leading-[inherit]">
            (12,921)
          </span>
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${id}-2`} value="5-stars" />
        <Label className="inline-flex items-center gap-1" htmlFor={`${id}-2`}>
          <span
            aria-hidden="true"
            className="inline-flex items-center text-amber-500"
          >
            <RiStarFill size={16} />
            <RiStarFill size={16} />
            <RiStarFill size={16} />
            <RiStarFill size={16} />
            <RiStarFill size={16} />
          </span>
          <span className="sr-only">5 stars</span>{" "}
          <span className="font-normal text-muted-foreground text-xs leading-[inherit]">
            (5,168)
          </span>
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${id}-3`} value="4-stars" />
        <Label className="inline-flex items-center gap-1" htmlFor={`${id}-3`}>
          <span
            aria-hidden="true"
            className="inline-flex items-center text-amber-500"
          >
            <RiStarFill size={16} />
            <RiStarFill size={16} />
            <RiStarFill size={16} />
            <RiStarFill size={16} />
            <RiStarFill className="opacity-30" size={16} />
          </span>
          <span className="sr-only">4 stars</span>{" "}
          <span className="font-normal text-muted-foreground text-xs leading-[inherit]">
            (4,726)
          </span>
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${id}-4`} value="3-stars" />
        <Label className="inline-flex items-center gap-1" htmlFor={`${id}-4`}>
          <span
            aria-hidden="true"
            className="inline-flex items-center text-amber-500"
          >
            <RiStarFill size={16} />
            <RiStarFill size={16} />
            <RiStarFill size={16} />
            <RiStarFill className="opacity-30" size={16} />
            <RiStarFill className="opacity-30" size={16} />
          </span>
          <span className="sr-only">3 stars</span>{" "}
          <span className="font-normal text-muted-foreground text-xs leading-[inherit]">
            (3,234)
          </span>
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${id}-5`} value="2-stars" />
        <Label className="inline-flex items-center gap-1" htmlFor={`${id}-5`}>
          <span
            aria-hidden="true"
            className="inline-flex items-center text-amber-500"
          >
            <RiStarFill size={16} />
            <RiStarFill size={16} />
            <RiStarFill className="opacity-30" size={16} />
            <RiStarFill className="opacity-30" size={16} />
            <RiStarFill className="opacity-30" size={16} />
          </span>
          <span className="sr-only">2 stars</span>{" "}
          <span className="font-normal text-muted-foreground text-xs leading-[inherit]">
            (1,842)
          </span>
        </Label>
      </div>
      <div className="flex items-center gap-2">
        <RadioGroupItem id={`${id}-6`} value="1-star" />
        <Label className="inline-flex items-center gap-1" htmlFor={`${id}-6`}>
          <span
            aria-hidden="true"
            className="inline-flex items-center text-amber-500"
          >
            <RiStarFill size={16} />
            <RiStarFill className="opacity-30" size={16} />
            <RiStarFill className="opacity-30" size={16} />
            <RiStarFill className="opacity-30" size={16} />
            <RiStarFill className="opacity-30" size={16} />
          </span>
          <span className="sr-only">1 star</span>{" "}
          <span className="font-normal text-muted-foreground text-xs leading-[inherit]">
            (452)
          </span>
        </Label>
      </div>
    </RadioGroup>
  );
}
