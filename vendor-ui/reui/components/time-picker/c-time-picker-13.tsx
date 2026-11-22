"use client"

import { useState } from "react"
import {
  TimePicker,
  TimePickerColumns,
  TimePickerPanel,
} from "@/registry-reui/bases/radix/reui/time-picker"

import { Button } from "@/registry/bases/radix/ui/button"
import { Calendar } from "@/registry/bases/radix/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/bases/radix/ui/card"

/* Plain arrays rather than Intl or toLocale*, so the server and the browser
   always print the same summary. */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

/* Fixed dates, so the server and every visitor render the same month. */
const FIRST_MONTH = new Date(2026, 9, 1)
const SUGGESTED_DAY = new Date(2026, 9, 14)

export default function Pattern() {
  const [date, setDate] = useState(SUGGESTED_DAY)
  const [time, setTime] = useState("09:00")
  const [scheduled, setScheduled] = useState<string | null>(null)

  const summary = `${WEEKDAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()} at ${time}`
  /* Derived, so changing the day or the time after scheduling reads as a
     new, unsaved choice again. */
  const isScheduled = scheduled === summary

  return (
    <Card className="mx-auto w-fit max-w-full">
      <CardHeader>
        <CardTitle>Schedule a post</CardTitle>
        <CardDescription>
          Pick the day and the time it goes live.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          {/* `required` keeps one day selected, so the summary always has
              a date to show. */}
          <Calendar
            mode="single"
            required
            selected={date}
            onSelect={setDate}
            defaultMonth={FIRST_MONTH}
          />
          <div className="flex justify-center self-stretch max-sm:border-t max-sm:pt-4 sm:border-s sm:ps-4">
            <TimePicker
              aria-label="Publish time"
              value={time}
              onValueChange={(next) => {
                /* No footer means no Clear, so `next` is never null here. */
                if (next) setTime(next)
              }}
              minuteStep={15}
            >
              <TimePickerPanel className="[--time-picker-rows:7]">
                {/* No footer: Now would set the time but not the date. */}
                <TimePickerColumns />
              </TimePickerPanel>
            </TimePicker>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <p role="status" className="me-3 min-w-0 flex-1 text-sm">
          {isScheduled && (
            <span className="text-muted-foreground">Scheduled for </span>
          )}
          <span className="font-medium tabular-nums">{summary}</span>
        </p>
        <Button onClick={() => setScheduled(summary)}>Schedule</Button>
      </CardFooter>
    </Card>
  )
}
