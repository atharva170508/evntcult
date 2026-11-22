"use client";

import { addDays } from "date-fns";
import { useState } from "react";
import type { DateRange } from "react-day-picker";

import { Calendar } from "@/registry/default/ui/calendar";

export default function Component() {
  const today = new Date();
  const [date, setDate] = useState<DateRange | undefined>({
    from: today,
    to: addDays(today, 48),
  });

  return (
    <div>
      <Calendar
        className="rounded-md border p-2"
        classNames={{
          month:
            "relative first-of-type:before:hidden before:absolute max-md:before:inset-x-2 max-md:before:h-px max-md:before:-top-4 md:before:inset-y-2 md:before:w-px before:bg-border md:before:-left-4",
          months: "sm:flex-col md:flex-row gap-8",
        }}
        mode="range"
        numberOfMonths={3}
        onSelect={setDate}
        pagedNavigation
        selected={date}
        showOutsideDays={false}
      />
      <p
        aria-live="polite"
        className="mt-4 text-center text-muted-foreground text-xs"
        role="region"
      >
        Three months calendar -{" "}
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
