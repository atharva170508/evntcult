"use client"

import { useId, useState } from "react"
import {
  formatTimeValue,
  parseTimeValue,
  TimePicker,
} from "@/registry-reui/bases/radix/reui/time-picker"

import { Field, FieldGroup, FieldLabel } from "@/registry/bases/radix/ui/field"

/* The range cannot cross midnight: the start stops at 23:30, so the shortest
   meeting still ends by 23:45, the last 15-minute slot of the day. */
const STEP = 15
const LATEST_END = 23 * 60 + 45

/* Minutes since midnight, both ways, through the picker's own value format. */
function toMinutes(value: string) {
  const time = parseTimeValue(value)
  return time ? time.hour * 60 + time.minute : 0
}

function fromMinutes(minutes: number) {
  return formatTimeValue({
    hour: Math.floor(minutes / 60),
    minute: minutes % 60,
    second: 0,
  })
}

/* Plain text rather than Intl, so the server and the browser agree. */
function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

export default function Pattern() {
  const id = useId()
  const [start, setStart] = useState<string | null>("09:00")
  const [end, setEnd] = useState<string | null>("10:00")

  const changeStart = (next: string | null) => {
    setStart(next)
    if (!next || !end) return
    /* The end moves by the same amount, so the meeting keeps its length.
       After a Clear there is no old start to shift from, so the end is only
       pushed past the new start when it would otherwise sit before it. */
    const shift = start ? toMinutes(next) - toMinutes(start) : 0
    const shifted = Math.max(toMinutes(end) + shift, toMinutes(next) + STEP)
    setEnd(fromMinutes(Math.min(shifted, LATEST_END)))
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <FieldGroup className="grid grid-cols-2">
        <Field>
          <FieldLabel id={`${id}-start-label`} htmlFor={`${id}-start`}>
            Start
          </FieldLabel>
          <TimePicker
            id={`${id}-start`}
            minuteStep={STEP}
            max="23:30"
            value={start}
            onValueChange={changeStart}
            aria-labelledby={`${id}-start-label`}
          />
        </Field>
        <Field>
          <FieldLabel id={`${id}-end-label`} htmlFor={`${id}-end`}>
            End
          </FieldLabel>
          {/* A `min` that follows the start disables every earlier slot, so
              the duration can never reach zero or go negative. */}
          <TimePicker
            id={`${id}-end`}
            minuteStep={STEP}
            min={start ? fromMinutes(toMinutes(start) + STEP) : undefined}
            value={end}
            onValueChange={setEnd}
            aria-labelledby={`${id}-end-label`}
          />
        </Field>
      </FieldGroup>
      <p role="status" className="text-muted-foreground text-sm">
        {start && end
          ? `Duration: ${formatDuration(toMinutes(end) - toMinutes(start))}`
          : "Pick a start and an end time"}
      </p>
    </div>
  )
}
