"use client";

import { getLocalTimeZone, isWeekend, today } from "@internationalized/date";
import { CalendarIcon } from "lucide-react";
import { useLocale } from "react-aria";
import type { DateValue } from "react-aria-components";
import {
  Button,
  DateRangePicker,
  Dialog,
  Group,
  Label,
  Popover,
} from "react-aria-components";

import { cn } from "@/registry/default/lib/utils";
import { RangeCalendar } from "@/registry/default/ui/calendar-rac";
import { DateInput, dateInputStyle } from "@/registry/default/ui/datefield-rac";

export default function Component() {
  const now = today(getLocalTimeZone());
  const disabledRanges = [
    [now, now.add({ days: 5 })],
    [now.add({ days: 14 }), now.add({ days: 16 })],
    [now.add({ days: 23 }), now.add({ days: 24 })],
  ];

  const { locale } = useLocale();
  const isDateUnavailable = (date: DateValue) =>
    isWeekend(date, locale) ||
    disabledRanges.some(
      (interval) =>
        date.compare(interval[0]) >= 0 && date.compare(interval[1]) <= 0,
    );
  const validate = (value: { start: DateValue; end: DateValue } | null) =>
    disabledRanges.some(
      (interval) =>
        value &&
        value.end.compare(interval[0]) >= 0 &&
        value.start.compare(interval[1]) <= 0,
    )
      ? "Selected date range may not include unavailable dates."
      : null;

  return (
    <DateRangePicker
      className="*:not-first:mt-2"
      isDateUnavailable={isDateUnavailable}
      validate={validate}
    >
      <Label className="font-medium text-foreground text-sm">
        Date range picker (unavailable dates)
      </Label>
      <div className="flex">
        <Group className={cn(dateInputStyle, "pe-9")}>
          <DateInput slot="start" unstyled />
          <span aria-hidden="true" className="px-2 text-muted-foreground/70">
            -
          </span>
          <DateInput slot="end" unstyled />
        </Group>
        <Button className="-ms-9 -me-px z-10 flex w-9 items-center justify-center rounded-e-md text-muted-foreground/80 outline-none transition-[color,box-shadow] hover:text-foreground data-focus-visible:border-ring data-focus-visible:ring-[3px] data-focus-visible:ring-ring/50">
          <CalendarIcon size={16} />
        </Button>
      </div>
      <Popover
        className="data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95 data-[placement=bottom]:slide-in-from-top-2 data-[placement=left]:slide-in-from-right-2 data-[placement=right]:slide-in-from-left-2 data-[placement=top]:slide-in-from-bottom-2 z-50 rounded-md border bg-background text-popover-foreground shadow-lg outline-hidden data-entering:animate-in data-exiting:animate-out"
        offset={4}
      >
        <Dialog className="max-h-[inherit] overflow-auto p-2">
          <RangeCalendar isDateUnavailable={isDateUnavailable} minValue={now} />
        </Dialog>
      </Popover>
      <p
        aria-live="polite"
        className="mt-2 text-muted-foreground text-xs"
        role="region"
      >
        Built with{" "}
        <a
          className="underline hover:text-foreground"
          href="https://react-spectrum.adobe.com/react-aria/DateRangePicker.html"
          rel="noreferrer noopener nofollow"
          target="_blank"
        >
          React Aria
        </a>
      </p>
    </DateRangePicker>
  );
}
