"use client"

import { useEffect, useRef, useState } from "react"
import { Frame } from "@/registry-reui/bases/radix/reui/frame"
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperTitle,
  StepperTrigger,
} from "@/registry-reui/bases/radix/reui/stepper"

import { Button } from "@/registry/bases/radix/ui/button"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

const steps = [
  { title: "Intake", description: "Collect the brief and key dates" },
  { title: "Structure", description: "Outline clauses and owners" },
  { title: "Draft", description: "Write the first full version" },
  { title: "Internal check", description: "Legal and finance review" },
  { title: "Negotiate", description: "Trade redlines with the counterparty" },
  { title: "Package", description: "Bundle and send the signed files" },
]

// The check and the spinner are drawn at 1.4px, so their strokes are raised
// from lucide's default (1px at 12px, 1.17px at 14px). The dashed circle
// keeps the default.
const indicators = {
  completed: (
    <IconPlaceholder
      lucide="CheckIcon"
      tabler="IconCheck"
      hugeicons="Tick02Icon"
      phosphor="CheckIcon"
      remixicon="RiCheckLine"
      strokeWidth={2.8}
      className="size-3"
      aria-hidden="true"
    />
  ),
  loading: (
    <IconPlaceholder
      lucide="LoaderCircleIcon"
      tabler="IconLoader2"
      hugeicons="Loading02Icon"
      phosphor="CircleNotchIcon"
      remixicon="RiLoader4Line"
      strokeWidth={2.4}
      className="size-3.5 motion-safe:animate-spin"
      aria-hidden="true"
    />
  ),
  inactive: (
    <IconPlaceholder
      lucide="CircleDashedIcon"
      tabler="IconCircleDashed"
      hugeicons="CircleDashedIcon"
      phosphor="CircleDashedIcon"
      remixicon="RiCheckboxBlankCircleLine"
      className="size-3.5"
      aria-hidden="true"
    />
  ),
}

export default function Pattern() {
  const [current, setCurrent] = useState(4)
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
    // The pressed button disables itself at either end, so focus moves to
    // its partner.
    if (step === 1) nextRef.current?.focus()
    if (step > steps.length) prevRef.current?.focus()
  }

  return (
    <Stepper
      value={current}
      onValueChange={setCurrent}
      indicators={indicators}
      className="flex w-full flex-col items-center"
      aria-label="Contract plan"
    >
      {/* The design's 4px inset, 6px corner and 4px inner corners, each
          capped at the style's frame radius so square styles stay square. */}
      <Frame
        variant="inverse"
        className="border-input/50 w-full rounded-[min(var(--frame-radius),var(--radius-sm))] [--frame-panel-radius:min(var(--frame-radius),var(--radius-sm)_-_2px)] [--frame-px:--spacing(1)] [--frame-py:--spacing(1)]"
      >
        {/* The steps share the full width. Under 48rem the steps around the
            current one drop to their indicator, under 24rem the current one
            too (the panel names it); past that the row scrolls
            here, clipped to the frame's inner corners, and min-w-max keeps
            the nav from shrinking. relative keeps the sr-only text in the
            scroller: placed against the Frame, it escapes and widens the
            page. */}
        <div
          ref={rowRef}
          className="@container relative flex gap-0.5 overflow-x-auto rounded-(--frame-panel-radius)"
        >
          <span className="bg-input text-foreground/70 flex shrink-0 items-center rounded-(--frame-panel-radius) px-1.5 text-xs font-medium whitespace-nowrap uppercase">
            Plan {current - 1}/{steps.length}
          </span>

          <StepperNav className="min-w-max flex-1">
            {steps.map((item, index) => {
              const step = index + 1

              // The primitive shows loading on the active step only, so every
              // step carries the flag and the spinner follows the selection.
              // Pulled back 6px, each 8px notch wraps the previous arrow with
              // 2px between them. Folded steps hug their icon and the current
              // one takes the rest; once every label is folded they share the
              // width again.
              return (
                <StepperItem
                  key={item.title}
                  step={step}
                  loading
                  className="flex-1 not-first:-ms-1.5 @max-3xl:not-data-[state=active]:flex-none @max-sm:not-data-[state=active]:flex-1"
                >
                  {/* The design's chevron: an 8px --notch at the start, an
                      8px --arrow at the end, each corner rounded at 4px (1.2px
                      at the acute notch corners) through three points, y tuned
                      to the h-6 row and x to the two variables, so the outer
                      steps zero one and round that side instead. The clip
                      trims the hit area too, so a click lands where it hits. */}
                  <StepperTrigger
                    tabIndex={allDone && step === steps.length ? 0 : undefined}
                    className="bg-input/40 text-muted-foreground data-[state=completed]:bg-input/60 data-[state=completed]:text-foreground/70 h-6 flex-1 rounded-none px-3 [--arrow:--spacing(2)] [--notch:--spacing(2)] [clip-path:polygon(calc(var(--notch)*0.28)_0,calc(100%_-_var(--arrow)*1.268)_0,calc(100%_-_var(--arrow)*1.032)_1.97%,calc(100%_-_var(--arrow)*0.852)_7.42%,calc(100%_-_var(--arrow)*0.185)_40.75%,calc(100%_-_var(--arrow)*0.101)_50%,calc(100%_-_var(--arrow)*0.185)_59.25%,calc(100%_-_var(--arrow)*0.852)_92.58%,calc(100%_-_var(--arrow)*1.032)_98.03%,calc(100%_-_var(--arrow)*1.268)_100%,calc(var(--notch)*0.28)_100%,calc(var(--notch)*0.148)_97.36%,calc(var(--notch)*0.155)_92.23%,calc(var(--notch)*0.815)_59.25%,calc(var(--notch)*0.899)_50%,calc(var(--notch)*0.815)_40.75%,calc(var(--notch)*0.155)_7.77%,calc(var(--notch)*0.148)_2.64%)] group-first/step:rounded-s-(--frame-panel-radius) group-first/step:ps-1 group-first/step:[--notch:0px] group-last/step:rounded-e-(--frame-panel-radius) group-last/step:ps-2.5 group-last/step:pe-1.5 group-last/step:[--arrow:0px] data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-900 rtl:[clip-path:polygon(calc(100%_-_var(--notch)*0.28)_0,calc(var(--arrow)*1.268)_0,calc(var(--arrow)*1.032)_1.97%,calc(var(--arrow)*0.852)_7.42%,calc(var(--arrow)*0.185)_40.75%,calc(var(--arrow)*0.101)_50%,calc(var(--arrow)*0.185)_59.25%,calc(var(--arrow)*0.852)_92.58%,calc(var(--arrow)*1.032)_98.03%,calc(var(--arrow)*1.268)_100%,calc(100%_-_var(--notch)*0.28)_100%,calc(100%_-_var(--notch)*0.148)_97.36%,calc(100%_-_var(--notch)*0.155)_92.23%,calc(100%_-_var(--notch)*0.815)_59.25%,calc(100%_-_var(--notch)*0.899)_50%,calc(100%_-_var(--notch)*0.815)_40.75%,calc(100%_-_var(--notch)*0.155)_7.77%,calc(100%_-_var(--notch)*0.148)_2.64%)] dark:data-[state=active]:text-blue-400"
                  >
                    {/* clip-path cuts the trigger's own focus ring, so this
                        pill draws it: px-1 completes the step's padding, py-0.5
                        clears the label's descenders and keeps the ring inside
                        the 24px chevron. The design sets the last step 6px
                        past its notch with a 6px icon gap. */}
                    <span className="ring-ring flex items-center gap-1 rounded-full px-1 py-0.5 group-last/step:gap-1.5 in-focus-visible:ring-2">
                      <StepperIndicator className="size-3.5 bg-transparent text-current data-[state=active]:bg-transparent data-[state=active]:text-current data-[state=completed]:size-3 data-[state=completed]:bg-transparent data-[state=completed]:text-current" />
                      <StepperTitle className="whitespace-nowrap @max-3xl:not-data-[state=active]:sr-only @max-sm:sr-only">
                        {item.title}
                      </StepperTitle>
                      {step <= current && (
                        <span className="sr-only">
                          {step < current ? ", done" : ", in progress"}
                        </span>
                      )}
                    </span>
                  </StepperTrigger>
                </StepperItem>
              )
            })}
          </StepperNav>
        </div>
      </Frame>

      <StepperPanel className="mt-6 text-center">
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
          <p className="text-sm font-medium">Contract ready</p>
          <p className="text-muted-foreground text-sm">
            Every step is done and the contract is ready to sign.
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
