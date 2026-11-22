"use client";

import { getLocalTimeZone, today } from "@internationalized/date";
import { useState } from "react";
import type { DateRange } from "react-aria-components";

import { RangeCalendar } from "@/registry/default/ui/calendar-rac";

export default function Component() {
  const now = today(getLocalTimeZone());
  const [date, setDate] = useState<DateRange | null>({
    end: now.add({ days: 3 }),
    start: now,
  });

  return (
    <div>
      <RangeCalendar
        className="rounded-md border p-2"
        onChange={setDate}
        value={date}
      />
      <p
        aria-live="polite"
        className="mt-4 text-center text-muted-foreground text-xs"
        role="region"
      >
        Range calendar -{" "}
        <a
          className="underline hover:text-foreground"
          href="https://react-spectrum.adobe.com/react-aria/DateRangePicker.html"
          rel="noreferrer noopener nofollow"
          target="_blank"
        >
          React Aria
        </a>
      </p>
    </div>
  );
}
