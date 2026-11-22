import { useId } from "react";

import { Checkbox } from "@/registry/default/ui/checkbox";
import { Label } from "@/registry/default/ui/label";

export default function Component() {
  const id = useId();
  return (
    <div className="relative flex w-full items-start gap-2 rounded-md border border-input p-4 shadow-xs outline-none has-data-[state=checked]:border-primary/50">
      <Checkbox
        aria-describedby={`${id}-description`}
        className="order-1 after:absolute after:inset-0"
        id={id}
      />
      <div className="flex grow items-center gap-3">
        <svg
          aria-hidden="true"
          className="shrink-0"
          height={32}
          width={32}
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="16" cy="16" fill="#121212" r="16" />
          <g clipPath="url(#sb-a)">
            <path
              d="M17.63 25.52c-.506.637-1.533.287-1.545-.526l-.178-11.903h8.003c1.45 0 2.259 1.674 1.357 2.81l-7.637 9.618Z"
              fill="url(#sb-b)"
            />
            <path
              d="M17.63 25.52c-.506.637-1.533.287-1.545-.526l-.178-11.903h8.003c1.45 0 2.259 1.674 1.357 2.81l-7.637 9.618Z"
              fill="url(#sb-c)"
              fillOpacity=".2"
            />
            <path
              d="M14.375 6.367c.506-.638 1.532-.289 1.544.525l.078 11.903H8.094c-1.45 0-2.258-1.674-1.357-2.81l7.638-9.618Z"
              fill="#3ECF8E"
            />
          </g>
          <defs>
            <linearGradient
              gradientUnits="userSpaceOnUse"
              id="sb-b"
              x1="15.907"
              x2="23.02"
              y1="15.73"
              y2="18.713"
            >
              <stop stopColor="#249361" />
              <stop offset="1" stopColor="#3ECF8E" />
            </linearGradient>
            <linearGradient
              gradientUnits="userSpaceOnUse"
              id="sb-c"
              x1="12.753"
              x2="15.997"
              y1="11.412"
              y2="17.519"
            >
              <stop />
              <stop offset="1" stopOpacity="0" />
            </linearGradient>
            <clipPath id="sb-a">
              <path d="M6.354 6h19.292v20H6.354z" fill="#fff" />
            </clipPath>
          </defs>
        </svg>
        <div className="grid gap-2">
          <Label htmlFor={id}>
            Label{" "}
            <span className="font-normal text-muted-foreground text-xs leading-[inherit]">
              (Sublabel)
            </span>
          </Label>
          <p className="text-muted-foreground text-xs" id={`${id}-description`}>
            A short description goes here.
          </p>
        </div>
      </div>
    </div>
  );
}
