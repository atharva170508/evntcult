"use client"

import { TimePicker } from "@/registry-reui/bases/radix/reui/time-picker"

import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/registry/bases/radix/ui/field"

const BOOKED = new Set(["10:00", "14:30", "15:00"])

/* Values arrive as `HH:mm`, so plain string comparison orders them. Module
   scope keeps the function stable, and a function prop is also why this file
   is a client module although it holds no state. */
function isUnavailable(value: string) {
  return (value >= "12:00" && value < "13:00") || BOOKED.has(value)
}

export default function Pattern() {
  return (
    <div className="w-full max-w-xs">
      <Field>
        <FieldLabel id="appointment-time-label" htmlFor="appointment-time">
          Appointment
        </FieldLabel>
        {/* An hour with no free slot left is disabled whole, like 12. */}
        <TimePicker
          id="appointment-time"
          minuteStep={30}
          min="09:00"
          max="17:00"
          isTimeDisabled={isUnavailable}
          aria-labelledby="appointment-time-label"
          aria-describedby="appointment-time-description"
        />
        <FieldDescription id="appointment-time-description">
          Lunch from 12:00 to 13:00 and times already booked are unavailable.
        </FieldDescription>
      </Field>
    </div>
  )
}
