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

import { Button } from "@/registry/bases/radix/ui/button"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

const steps = [{ title: "Account" }, { title: "Profile" }, { title: "Review" }]

export default function Pattern() {
  const [current, setCurrent] = useState(2)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  // One past the last step marks every step complete. No tab is selected
  // then, so the last one keeps the tablist's tab stop.
  const allDone = current > steps.length

  function goTo(step: number) {
    setCurrent(step)
    // The pressed button disables itself at either end, so focus moves to its partner.
    if (step === 1) nextRef.current?.focus()
    if (step > steps.length) prevRef.current?.focus()
  }

  return (
    <div className="flex items-center justify-center">
      <Stepper
        className="flex flex-col items-center justify-center gap-10"
        value={current}
        onValueChange={setCurrent}
        orientation="vertical"
        indicators={{
          completed: (
            <IconPlaceholder
              lucide="CheckIcon"
              tabler="IconCheck"
              hugeicons="Tick02Icon"
              phosphor="CheckIcon"
              remixicon="RiCheckLine"
              className="size-3.5"
            />
          ),
          loading: (
            <IconPlaceholder
              lucide="LoaderCircleIcon"
              tabler="IconLoader2"
              hugeicons="Loading02Icon"
              phosphor="CircleNotchIcon"
              remixicon="RiLoader4Line"
              className="size-3.5 animate-spin"
            />
          ),
        }}
      >
        <StepperNav>
          {steps.map((step, index) => (
            <StepperItem
              key={index}
              step={index + 1}
              className="relative items-start not-last:flex-1"
            >
              <StepperTrigger
                tabIndex={allDone && index === steps.length - 1 ? 0 : undefined}
                className="items-start gap-2.5 pb-12 last:pb-0"
              >
                <StepperIndicator className="data-[state=completed]:bg-success data-[state=completed]:text-white">
                  {index + 1}
                </StepperIndicator>
                <div className="mt-0.5 text-left">
                  <StepperTitle>{step.title}</StepperTitle>
                </div>
              </StepperTrigger>
              {index < steps.length - 1 && (
                <StepperSeparator className="group-data-[state=completed]/step:bg-success absolute inset-y-0 top-7 left-3 -order-1 m-0 -translate-x-1/2 group-data-[orientation=vertical]/stepper-nav:h-[calc(100%-2rem)]" />
              )}
            </StepperItem>
          ))}
        </StepperNav>

        <StepperPanel className="w-56 text-center text-sm">
          {steps.map((step, index) => (
            <StepperContent key={index} value={index + 1}>
              {step.title} content
            </StepperContent>
          ))}
          <StepperContent value={steps.length + 1}>
            All steps complete
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
    </div>
  )
}
