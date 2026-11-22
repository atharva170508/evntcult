"use client"

import { useRef, useState } from "react"
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

const phases = [
  {
    title: "Choose Resolution",
    summary:
      "Compare a refund, a replacement and store credit for order #4821.",
  },
  {
    title: "Execute Resolution",
    summary: "Issue the $129.00 refund to the original payment method.",
  },
  {
    title: "Verify Outcome",
    summary: "Confirm the bank has settled the refund with the customer.",
  },
  {
    title: "Resolution Summary",
    summary: "Review every action taken, then close the case.",
  },
]

// pathLength counts the ring as 28 units, so the 3:1 dash pattern closes in
// seven even dashes instead of leaving a stub at the seam.
function Pending({ current = false }: { current?: boolean }) {
  return (
    <span
      className={cn(
        "flex size-4 rounded-full",
        current ? "bg-blue-500 text-white" : "bg-ring/20 text-ring"
      )}
    >
      <svg
        viewBox="0 0 16 16"
        fill="none"
        aria-hidden="true"
        className={cn("size-4", current && "motion-safe:animate-spin")}
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
    </span>
  )
}

// The 22px indicator is a disc of the page surface and the 16px dot inside
// it carries the state, so a 3px ring cuts the dot out of the track. The
// design draws the 10px check with a 1.4px line: 3.36 on a 24-unit grid.
const indicators = {
  completed: (
    <span className="bg-ring/20 text-ring flex size-4 items-center justify-center rounded-full">
      <IconPlaceholder
        lucide="CheckIcon"
        tabler="IconCheck"
        hugeicons="Tick02Icon"
        phosphor="CheckIcon"
        remixicon="RiCheckLine"
        strokeWidth={3.36}
        className="size-2.5"
        aria-hidden="true"
      />
    </span>
  ),
  inactive: <Pending />,
  loading: <Pending current />,
}

export default function Pattern() {
  const [current, setCurrent] = useState(3)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  // One past the last step marks every step complete. No tab is selected
  // then, so the last one keeps the tablist's tab stop.
  const allDone = current > phases.length

  function goTo(step: number) {
    setCurrent(step)
    // The pressed button disables itself at either end, so focus moves to its partner.
    if (step === 1) nextRef.current?.focus()
    if (step > phases.length) prevRef.current?.focus()
  }

  return (
    <Stepper
      value={current}
      onValueChange={setCurrent}
      indicators={indicators}
      className="@container max-w-200"
      aria-label="Resolution phases"
    >
      {/* Under 32rem the labels go screen-reader only and the row keeps its
          track, so any number of steps fits; the panel below names the
          current one. */}
      <StepperNav>
        {phases.map((phase, index) => {
          const step = index + 1

          // The primitive shows loading on the active phase only, so every
          // phase carries the flag and the spinner follows the selection.
          return (
            <StepperItem
              key={phase.title}
              step={step}
              loading
              className="relative min-w-0 flex-1 items-stretch"
            >
              {/* Items stretch to the tallest label and mt-auto pins each
                  track slice to the bottom, so the track stays one line when
                  a title wraps. mb-2.25 holds the indicator's 9px overhang. */}
              <StepperTrigger
                tabIndex={allDone && step === phases.length ? 0 : undefined}
                className="w-full flex-col gap-4"
              >
                <span className="flex flex-col items-center gap-1 px-1.75 text-center @max-lg:sr-only">
                  <span className="text-muted-foreground text-xs font-medium whitespace-nowrap uppercase">
                    Phase {step}
                  </span>
                  <StepperTitle className="data-[state=active]:font-semibold">
                    {phase.title}
                  </StepperTitle>
                  {step < current && (
                    <span className="sr-only">, completed</span>
                  )}
                </span>

                {/* Each phase draws one slice of the track, rounded only at
                    the outer ends; the active fill spans its whole slice, so
                    the first and last reach the track's ends. The theme has
                    no blue token, so it takes the palette blue. */}
                <span className="bg-ring/20 mt-auto mb-2.25 flex h-1 w-full group-first/step:rounded-s-full group-last/step:rounded-e-full">
                  <span className="flex flex-1 items-center justify-center rounded-full group-data-[state=active]/step:bg-blue-500">
                    <StepperIndicator className="bg-background data-[state=active]:bg-background data-[state=completed]:bg-background size-5.5" />
                  </span>
                </span>
              </StepperTrigger>

              {/* The design's 14px slash: a 1.2px line turned 45deg, centered
                  on the boundary and on the label rows by leaving out the
                  29px under them. px-1.75 keeps the labels out of its slot,
                  and pointer-events-none passes clicks to the trigger under it. */}
              {step < phases.length && (
                <StepperSeparator className="bg-ring/20 pointer-events-none absolute end-0 top-0 bottom-7.25 m-0 my-auto w-[1.2px] translate-x-1/2 rotate-45 group-data-[orientation=horizontal]/stepper-nav:h-4.5 @max-lg:hidden rtl:-translate-x-1/2" />
              )}
            </StepperItem>
          )
        })}
      </StepperNav>

      <StepperPanel className="mt-6 text-center">
        {phases.map((phase, index) => (
          <StepperContent key={phase.title} value={index + 1}>
            <p className="text-sm font-medium">{phase.title}</p>
            <p className="text-muted-foreground text-sm">{phase.summary}</p>
          </StepperContent>
        ))}
        <StepperContent value={phases.length + 1}>
          <p className="text-sm font-medium">Case closed</p>
          <p className="text-muted-foreground text-sm">
            The refund is settled and every action reviewed.
          </p>
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
