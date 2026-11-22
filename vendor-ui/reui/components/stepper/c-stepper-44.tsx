"use client"

import { useId, useRef, useState } from "react"
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperTitle,
  StepperTrigger,
  useStepItem,
} from "@/registry-reui/bases/radix/reui/stepper"
import { cn } from "cn"

import { Button } from "@/registry/bases/radix/ui/button"
import {
  Collapsible,
  CollapsibleContent,
} from "@/registry/bases/radix/ui/collapsible"
import { Separator } from "@/registry/bases/radix/ui/separator"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

const phases = [
  {
    title: "Resolution Planning",
    tasks: ["Review Ticket", "Find Root Cause", "Draft Plan"],
  },
  {
    title: "Scope Alignment",
    tasks: ["Confirm Impact", "Agree on Scope", "Assign Owners"],
  },
  {
    title: "Implementation",
    tasks: [
      "Configure Solution",
      "Connect Systems",
      "Apply Changes",
      "Run Workflow",
      "Prepare Output",
    ],
  },
  {
    title: "Outcome Verification",
    tasks: ["Run Tests", "Validate Results", "Confirm with Customer"],
  },
  {
    title: "Final Summary",
    tasks: ["Write Summary", "Share Report", "Close Ticket"],
  },
]

// Every task in reading order, so Previous and Next walk straight across
// phase boundaries, then one stop past the final phase, where every phase
// and task reads complete.
const sequence = [
  ...phases.flatMap((phase, index) =>
    phase.tasks.map((_, taskIndex) => ({
      phase: index + 1,
      task: taskIndex + 1,
    }))
  ),
  { phase: phases.length + 1, task: 1 },
]

// The design draws its icons with a 1.2px line: 2.88 on the 24-unit grid of
// the 10px check, 1.44 on the 20px dashed circle. The *:stroke class repeats
// it on the paths, so the weight holds where a wrapper drops the prop.
function Completed({ className }: { className: string }) {
  return (
    <span
      className={cn(
        "border-success bg-success/10 text-success flex items-center justify-center rounded-full border",
        className
      )}
    >
      <IconPlaceholder
        lucide="CheckIcon"
        tabler="IconCheck"
        hugeicons="Tick02Icon"
        phosphor="CheckIcon"
        remixicon="RiCheckLine"
        strokeWidth={2.88}
        className="size-2.5 *:stroke-[2.88]"
        aria-hidden="true"
      />
    </span>
  )
}

function Pending({
  className,
  strokeWidth,
}: {
  className: string
  strokeWidth?: number
}) {
  return (
    <IconPlaceholder
      lucide="CircleDashedIcon"
      tabler="IconCircleDashed"
      hugeicons="CircleDashedIcon"
      phosphor="CircleDashedIcon"
      remixicon="RiCheckboxBlankCircleLine"
      strokeWidth={strokeWidth}
      className={cn("text-ring/60", className)}
      aria-hidden="true"
    />
  )
}

// A repeating conic mask cuts the track into dashes at the drawn 3:1 rhythm,
// and a blue-500 arc (the theme has no blue token) spins over it.
function Running({
  className,
  track,
  arc,
}: {
  className: string
  track: string
  arc: string
}) {
  return (
    <span className={cn("relative block", className)}>
      <span
        className={cn(
          "border-ring/60 absolute inset-0 rounded-full border-[1.2px]",
          track
        )}
      />
      <span
        className={cn(
          "absolute inset-0 rounded-full border-[1.2px] border-blue-500 motion-safe:animate-spin",
          arc
        )}
      />
    </span>
  )
}

// 16 dashes fit the 22px phase ring and 9 the 13px task ring, and each arc
// keeps its drawn sweep.
const phaseIndicators = {
  completed: <Completed className="size-5" />,
  inactive: <Pending className="size-5 *:stroke-[1.44]" strokeWidth={1.44} />,
  loading: (
    <Running
      className="size-5.5"
      track="mask-[repeating-conic-gradient(#000_0_16.875deg,transparent_0_22.5deg)]"
      arc="mask-[conic-gradient(from_-17deg,#000_152deg,transparent_0)]"
    />
  ),
}

const taskIndicators = {
  completed: <Completed className="size-3.5" />,
  inactive: <Pending className="size-3.5" />,
  loading: (
    <Running
      className="size-3.25"
      track="mask-[repeating-conic-gradient(#000_0_30deg,transparent_0_40deg)]"
      arc="mask-[conic-gradient(from_-28deg,#000_140deg,transparent_0)]"
    />
  ),
}

// The rails are drawn in pieces that stop 2px short of each indicator, the
// gap the design cuts with a white ring. A painted ring would show as a halo
// on any surface that is not exactly the page background. The pieces cross
// the corners of each trigger's box, so they let clicks through.
const phaseSegment =
  "bg-input pointer-events-none absolute end-3 w-[1.2px] translate-x-1/2 rounded-full rtl:-translate-x-1/2"

const taskSegment =
  "bg-input pointer-events-none absolute end-2.25 w-px translate-x-1/2 rounded-full rtl:-translate-x-1/2"

const indicator =
  "bg-transparent data-[state=active]:bg-transparent data-[state=completed]:bg-transparent"

const stepTitle =
  "data-[state=inactive]:text-muted-foreground whitespace-nowrap"

// Reads the enclosing item's state, so what is announced cannot drift from
// the data-state the trigger is styled by.
function StepStatus() {
  const { state } = useStepItem()
  if (state === "inactive") return null

  return (
    <span className="sr-only">
      {state === "completed" ? ", completed" : ", in progress"}
    </span>
  )
}

export default function Pattern() {
  const id = useId()
  const [current, setCurrent] = useState(3)
  const [task, setTask] = useState(3)
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const panelId = `${id}-panel`
  const position = sequence.findIndex(
    (stop) => stop.phase === current && stop.task === task
  )
  const last = sequence.length - 1
  // No tab is selected once every phase is done, so the last phase keeps
  // the tablist's tab stop.
  const allDone = current > phases.length

  // Reselecting the current phase keeps its progress; a newly chosen one
  // starts on its first task.
  function selectPhase(next: number) {
    if (next === current) return
    setCurrent(next)
    setTask(1)
  }

  // Crossing into a neighboring phase opens it on its first or last task.
  function goTo(next: number) {
    setCurrent(sequence[next].phase)
    setTask(sequence[next].task)
    // The pressed button disables itself at either end, so focus moves to
    // its partner.
    if (next === 0) nextRef.current?.focus()
    if (next === last) prevRef.current?.focus()
  }

  // Side by side from 28rem, which leaves 11rem beside the 15rem stepper for
  // the text and the Previous and Next row. Below that the content stacks
  // under the stepper, end-aligned with its phase titles.
  return (
    <Stepper
      value={current}
      onValueChange={selectPhase}
      orientation="vertical"
      indicators={phaseIndicators}
      className="@container mx-auto max-w-lg"
      aria-label="Ticket resolution"
    >
      <div className="mx-auto flex max-w-60 flex-col gap-6 @md:max-w-none @md:flex-row @md:items-start">
        {/* Both steppers number their tabs from 1 and the primitive derives
            ids from that number alone, so every trigger takes its own id and
            an aria-controls that names the one content panel. */}
        <StepperNav className="flex @md:w-60 @md:shrink-0">
          {phases.map((phase, index) => {
            const step = index + 1
            const active = step === current
            // A phase folding away shows its tasks all done or all pending,
            // never the live one, and ignores clicks on them.
            const progress = active
              ? task
              : step < current
                ? phase.tasks.length + 1
                : 0

            // The primitive shows loading on the active step only, so every
            // step carries the flag and the spinner follows the selection. A
            // min height rather than padding holds the drawn 61px pitch, so an
            // opening phase grows out of it without a jump.
            return (
              <StepperItem
                key={phase.title}
                step={step}
                loading
                className="relative min-h-15.25 items-end justify-start last:min-h-0"
              >
                {/* The running ring is 2px wider than the others, so its
                    gaps start 1px further out. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    phaseSegment,
                    "top-0",
                    active ? "h-1.25" : "h-1.5"
                  )}
                />
                <span
                  aria-hidden="true"
                  className={cn(
                    phaseSegment,
                    "bottom-0",
                    active ? "top-7.75" : "top-7.5"
                  )}
                />
                {/* leading-5 restores text-sm's 20px line over the 16px caption,
                    so the indicator centers 18px down. */}
                <StepperTrigger
                  tabIndex={allDone && step === phases.length ? 0 : undefined}
                  id={`${id}-phase-${step}`}
                  aria-controls={panelId}
                  className="gap-2 text-end"
                >
                  <span className="flex flex-col">
                    <StepperTitle className={cn(stepTitle, "leading-5")}>
                      {phase.title}
                    </StepperTitle>
                    <StepperDescription className="text-xs">
                      Step {step}
                    </StepperDescription>
                  </span>
                  <StepStatus />
                  <StepperIndicator className={indicator} />
                </StepperTrigger>

                <Collapsible open={active}>
                  <CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down overflow-hidden motion-reduce:animate-none">
                    <Stepper
                      value={progress}
                      onValueChange={active ? setTask : undefined}
                      orientation="vertical"
                      indicators={taskIndicators}
                      aria-label={`${phase.title} tasks`}
                    >
                      {/* me-7.5 sets the task rail 27px in from the phase
                          rail, and mt-2 with mb-2.5 land the open phase on its
                          drawn 204px. ms-1 keeps the widest task's focus ring
                          inside the clipped panel. */}
                      <StepperNav className="ms-1 me-7.5 mt-2 mb-2.5">
                        {phase.tasks.map((label, taskIndex) => {
                          const taskStep = taskIndex + 1

                          return (
                            <StepperItem
                              key={label}
                              step={taskStep}
                              loading
                              className="relative items-end"
                            >
                              {taskIndex > 0 && (
                                <span
                                  aria-hidden="true"
                                  className={cn(taskSegment, "top-0 h-1.5")}
                                />
                              )}
                              {taskStep < phase.tasks.length && (
                                <span
                                  aria-hidden="true"
                                  className={cn(taskSegment, "top-6 bottom-0")}
                                />
                              )}
                              <StepperTrigger
                                id={`${id}-task-${step}-${taskStep}`}
                                aria-controls={panelId}
                                className="min-h-7.5 gap-1.5 text-end"
                              >
                                <StepperTitle
                                  className={cn(stepTitle, "font-normal")}
                                >
                                  {label}
                                </StepperTitle>
                                <StepStatus />
                                <StepperIndicator
                                  className={cn(indicator, "size-4.5")}
                                />
                              </StepperTrigger>
                            </StepperItem>
                          )
                        })}
                      </StepperNav>
                    </Stepper>
                  </CollapsibleContent>
                </Collapsible>
              </StepperItem>
            )
          })}
        </StepperNav>

        {/* pe-8 lines the stacked content up with the phase titles. */}
        {/* Decorative, so hidden from assistive tech: a line across while the
            columns stack, a line between them once they sit side by side. */}
        <Separator aria-hidden="true" className="@md:hidden" />
        <Separator
          aria-hidden="true"
          orientation="vertical"
          className="hidden @md:block"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-3 pe-8 text-end @md:pe-0 @md:text-start">
          <StepperPanel>
            {phases.map((phase, index) => (
              <StepperContent key={phase.title} value={index + 1}>
                <div id={panelId}>
                  <p className="text-muted-foreground text-xs">
                    Task {task} of {phase.tasks.length}
                  </p>
                  <p className="text-sm font-medium">{phase.tasks[task - 1]}</p>
                  <p className="text-muted-foreground text-sm">{phase.title}</p>
                </div>
              </StepperContent>
            ))}
            <StepperContent value={phases.length + 1}>
              <div id={panelId}>
                <p className="text-muted-foreground text-xs">
                  All {phases.length} phases done
                </p>
                <p className="text-sm font-medium">Ticket resolved</p>
                <p className="text-muted-foreground text-sm">
                  Every task is complete.
                </p>
              </div>
            </StepperContent>
          </StepperPanel>
          <div className="flex justify-end gap-2 @md:justify-start">
            <Button
              ref={prevRef}
              variant="outline"
              size="sm"
              disabled={position === 0}
              onClick={() => goTo(position - 1)}
            >
              Previous
            </Button>
            <Button
              ref={nextRef}
              variant="outline"
              size="sm"
              disabled={position === last}
              onClick={() => goTo(position + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </Stepper>
  )
}
