"use client"

import { useEffect, useRef, useState } from "react"
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/registry-reui/bases/radix/reui/stepper"
import { cn } from "cn"

import { Button } from "@/registry/bases/radix/ui/button"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

const steps = [
  {
    title: "Registration",
    description: "Account created and start date confirmed.",
  },
  {
    title: "Paperwork",
    description: "Tax forms, direct deposit and ID checked.",
  },
  {
    title: "Store Tour",
    description: "Walk the floor and stockroom with your manager.",
  },
  {
    title: "Job Training",
    description: "Register, returns and safety modules, about 2 hours.",
  },
  {
    title: "First Shift",
    description: "Saturday from 9:00 AM, paired with a team buddy.",
  },
]

// The design draws the 10px check with a 1.4px line: 3.36 on a 24-unit grid.
// stroke-[3.36] repeats it as CSS, which beats the svg's own stroke-width
// attribute, so the weight holds where a wrapper does not forward the prop.
const completed = (
  <IconPlaceholder
    lucide="CheckIcon"
    tabler="IconCheck"
    hugeicons="Tick02Icon"
    phosphor="CheckIcon"
    remixicon="RiCheckLine"
    strokeWidth={3.36}
    className="size-2.5 stroke-[3.36]"
    aria-hidden="true"
  />
)

// pathLength counts the circle as 28 units, so the 3:1 dash pattern closes
// in seven even dashes instead of leaving a stub at the seam.
function DashedRing({ spin = false }: { spin?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("size-4", spin && "motion-safe:animate-spin")}
    >
      <circle
        cx="8"
        cy="8"
        r="4.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeDasharray="3 1"
        pathLength={28}
      />
    </svg>
  )
}

const indicators = {
  completed,
  inactive: <DashedRing />,
  loading: <DashedRing spin />,
}

export default function Pattern() {
  const [current, setCurrent] = useState(3)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  // One past the last step marks every step complete. No tab is selected
  // then, so the last one keeps the tablist's tab stop.
  const allDone = current > steps.length

  // Past the collapsed width (many steps in a small box) the row scrolls, so
  // the current step comes back into view when it changes or the row resizes,
  // and a tab comes into view when focus lands on it (the browser leaves a
  // half-hidden one where it is). Only the row scrolls, never the page.
  const rowRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const row = rowRef.current
    if (!row) return
    const reveal = (tab: Element | null) => {
      if (!tab) return
      const box = row.getBoundingClientRect()
      const { left, right } = tab.getBoundingClientRect()
      if (left < box.left || right > box.right) {
        row.scrollLeft += (left + right - box.left - box.right) / 2
      }
    }
    const onFocus = (event: FocusEvent) =>
      reveal((event.target as Element).closest('[role="tab"]'))
    const observer = new ResizeObserver(() =>
      reveal(row.querySelector('[aria-selected="true"]'))
    )
    observer.observe(row)
    row.addEventListener("focusin", onFocus)
    return () => {
      observer.disconnect()
      row.removeEventListener("focusin", onFocus)
    }
  }, [current])

  function goTo(step: number) {
    setCurrent(step)
    // The pressed button disables itself at either end, so focus moves to its partner.
    if (step === 1) nextRef.current?.focus()
    if (step > steps.length) prevRef.current?.focus()
  }

  return (
    <Stepper
      value={current}
      onValueChange={setCurrent}
      indicators={indicators}
      className="flex max-w-200 flex-col gap-6"
      aria-label="New hire onboarding"
    >
      {/* Under 42rem the labels around the current step drop to their
          indicator; past that the row scrolls instead of crushing them. p-2
          keeps the focus ring in view, and -mx-1 reaches only 4px past the
          stepper, so a tightly padded parent does not scroll sideways. */}
      <div
        ref={rowRef}
        className="@container relative -mx-1 -my-2 overflow-x-auto p-2"
      >
        <StepperNav className="min-w-max gap-1">
          {steps.map((item, index) => {
            const step = index + 1

            // The primitive shows loading on the active step only, so every
            // step carries the flag and the ring spins on the current one.
            return (
              <StepperItem
                key={item.title}
                step={step}
                loading
                className="gap-1.5"
              >
                {/* -m-1 p-1 grows the target to 24px tall and gives the
                    focus ring room without moving the row. */}
                <StepperTrigger
                  tabIndex={allDone && step === steps.length ? 0 : undefined}
                  className="-m-1 gap-1.5 p-1"
                >
                  {/* The theme has no blue token, so done and current steps
                      take the palette blue-500, as does the connector. */}
                  <StepperIndicator className="bg-ring/20 text-ring/50 size-4 data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=completed]:bg-blue-500 data-[state=completed]:text-white" />
                  <StepperTitle className="data-[state=inactive]:text-muted-foreground whitespace-nowrap @max-2xl:not-data-[state=active]:sr-only">
                    {item.title}
                  </StepperTitle>
                  {step < current && (
                    <span className="sr-only">, completed</span>
                  )}
                </StepperTrigger>

                {/* Solid once the step is done, fading out of the current
                    step, gray ahead of it. */}
                {step < steps.length && (
                  <StepperSeparator className="to-ring/20 data-[state=inactive]:from-ring/20 m-0 min-w-6 bg-transparent bg-linear-to-r from-blue-500 data-[state=completed]:to-blue-500 rtl:bg-linear-to-l" />
                )}
              </StepperItem>
            )
          })}
        </StepperNav>
      </div>

      <StepperPanel className="text-center">
        {steps.map((item, index) => (
          <StepperContent key={item.title} value={index + 1}>
            <p className="text-muted-foreground text-xs">
              Step {index + 1} of {steps.length}
            </p>
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-muted-foreground text-sm">{item.description}</p>
          </StepperContent>
        ))}
        <StepperContent value={steps.length + 1}>
          <p className="text-muted-foreground text-xs">
            All {steps.length} steps done
          </p>
          <p className="text-sm font-medium">Onboarding complete</p>
          <p className="text-muted-foreground text-sm">Welcome to the team.</p>
        </StepperContent>
        <div className="mt-3 flex justify-center gap-2">
          <Button
            ref={prevRef}
            variant="outline"
            size="sm"
            disabled={current === 1}
            onClick={() => goTo(current - 1)}
          >
            Previous
          </Button>
          <Button
            ref={nextRef}
            variant="outline"
            size="sm"
            disabled={allDone}
            onClick={() => goTo(current + 1)}
          >
            Next
          </Button>
        </div>
      </StepperPanel>
    </Stepper>
  )
}
