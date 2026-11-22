"use client";

import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "@/registry/default/lib/utils";
import { Button } from "@/registry/default/ui/button";
import { Calendar } from "@/registry/default/ui/calendar";
import { Label } from "@/registry/default/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/default/ui/popover";

export default function Component() {
  const id = useId();
  const [date, setDate] = useState<Date | undefined>();

  return (
    <div>
      <div className="*:not-first:mt-2">
        <Label htmlFor={id}>Date picker</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className="group w-full justify-between border-input bg-background px-3 font-normal outline-none outline-offset-0 hover:bg-background focus-visible:outline-[3px]"
              id={id}
              variant={"outline"}
            >
              <span
                className={cn("truncate", !date && "text-muted-foreground")}
              >
                {date ? format(date, "PPP") : "Pick a date"}
              </span>
              <CalendarIcon
                aria-hidden="true"
                className="shrink-0 text-muted-foreground/80 transition-colors group-hover:text-foreground"
                size={16}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-2">
            <Calendar mode="single" onSelect={setDate} selected={date} />
          </PopoverContent>
        </Popover>
      </div>
      <p
        aria-live="polite"
        className="mt-2 text-muted-foreground text-xs"
        role="region"
      >
        Built with{" "}
        <a
          className="underline hover:text-foreground"
          href="https://daypicker.dev/"
          rel="noreferrer noopener nofollow"
          target="_blank"
        >
          React DayPicker
        </a>
      </p>
    </div>
  );
}
