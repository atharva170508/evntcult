"use client"

import { useId, useState, type FormEvent } from "react"

import { Button } from "@/registry/bases/radix/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/registry/bases/radix/ui/card"
import { Label } from "@/registry/bases/radix/ui/label"
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from "@/registry/bases/radix/ui/questionnaire"

type Option = { value: string; label: string }

const SOURCES: Option[] = [
  { value: "colleague", label: "A colleague mentioned it" },
  { value: "talk", label: "A conference talk" },
  { value: "search", label: "Search" },
  { value: "newsletter", label: "A newsletter" },
]

const REPLACING: Option[] = [
  { value: "spreadsheet", label: "A spreadsheet and a group chat" },
  { value: "legacy", label: "A tool we have outgrown" },
  { value: "nothing", label: "Nothing, this is new for us" },
]

const TIMELINES: Option[] = [
  { value: "month", label: "Inside a month" },
  { value: "quarter", label: "This quarter" },
  { value: "exploring", label: "Still exploring" },
]

// No choices listed on these entries, because choices in items exist to hand
// out the single-key shortcuts and this flow does not use them. Names and the
// required flags still have to mirror the rendered tree or the root warns.
const ITEMS = [
  { name: "source", required: true },
  { name: "replacing", required: true },
  { name: "timeline", required: true },
]

type Answers = { source: string; replacing: string; timeline: string }

// An unrecognised entry is the typed answer, so it is returned verbatim rather
// than mapped. That is the only place the free-text value can surface, because
// the input and the radios share one field name.
//
// The engine hands that name to whichever control currently holds the answer
// and detaches the other with an empty form attribute, so typing clears the
// selected radio and one question never submits two values.
function answerLabel(options: Option[], value: FormDataEntryValue | null) {
  if (typeof value !== "string" || value.trim() === "") {
    return "Not answered"
  }

  return options.find((option) => option.value === value)?.label ?? value
}

export default function Pattern() {
  // CardHeader sits between each fieldset and its legend, which stops the
  // legend naming the group. Pairing these ids with aria-labelledby on each
  // item puts that name back.
  const titleId = useId()

  // The free-text row is a visible Label plus the input rather than a
  // placeholder: a placeholder is not an accessible name and vanishes on the
  // first keystroke. The id passed in wins over the generated one, which is
  // what lets htmlFor find the input at all.
  //
  // It sits inside the choices group for the per-style gap, not for the
  // wiring. Answer controls register against the item, so the input counts as
  // an answer anywhere inside the fieldset.
  const otherId = useId()
  const [answers, setAnswers] = useState<Answers | null>(null)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)

    setAnswers({
      source: answerLabel(SOURCES, formData.get("source")),
      replacing: answerLabel(REPLACING, formData.get("replacing")),
      timeline: answerLabel(TIMELINES, formData.get("timeline")),
    })
  }

  if (answers) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Thanks, that helps</CardTitle>
          <CardDescription>
            Your answers are attached to the account, so nobody has to ask again
            on the onboarding call.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3">
            <div className="grid min-w-0 gap-0.5">
              <dt className="text-muted-foreground text-sm">Heard about us</dt>
              <dd className="text-sm font-medium">{answers.source}</dd>
            </div>
            <div className="grid min-w-0 gap-0.5">
              <dt className="text-muted-foreground text-sm">Replacing</dt>
              <dd className="text-sm font-medium">{answers.replacing}</dd>
            </div>
            <div className="grid min-w-0 gap-0.5">
              <dt className="text-muted-foreground text-sm">Live by</dt>
              <dd className="text-sm font-medium">{answers.timeline}</dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter>
          <Button size="sm" variant="outline" onClick={() => setAnswers(null)}>
            Answer again
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    // shortcuts stays off here on purpose: single-key answer shortcuts and a
    // text field inside the same question would compete for every keystroke.
    //
    // The root ships noValidate on by default, so the browser never takes the
    // question over. What gates Next is the primitive's own rule, which counts
    // an item satisfied only once it is answered and not flagged invalid.
    <Questionnaire
      className="mx-auto w-full max-w-md"
      defaultItem="source"
      items={ITEMS}
      onSubmit={handleSubmit}
    >
      <Card>
        <QuestionnaireItem
          aria-labelledby={`${titleId}-source`}
          name="source"
          required
        >
          <CardHeader>
            <QuestionnaireTitle id={`${titleId}-source`} render={<CardTitle />}>
              How did you first hear about us?
            </QuestionnaireTitle>
            <QuestionnaireDescription render={<CardDescription />}>
              Pick the closest match, or write in what actually happened.
            </QuestionnaireDescription>
            <CardAction>
              <QuestionnaireProgress />
            </CardAction>
          </CardHeader>
          <CardContent>
            <QuestionnaireChoices>
              {SOURCES.map((source) => (
                <QuestionnaireChoice key={source.value} value={source.value}>
                  {source.label}
                </QuestionnaireChoice>
              ))}
              <div className="grid gap-1.5">
                <Label htmlFor={otherId}>Somewhere else</Label>
                <QuestionnaireInput id={otherId} placeholder="Tell us where" />
              </div>
            </QuestionnaireChoices>
            <QuestionnaireError />
          </CardContent>
        </QuestionnaireItem>

        <QuestionnaireItem
          aria-labelledby={`${titleId}-replacing`}
          name="replacing"
          required
        >
          <CardHeader>
            <QuestionnaireTitle
              id={`${titleId}-replacing`}
              render={<CardTitle />}
            >
              What are you replacing?
            </QuestionnaireTitle>
            <QuestionnaireDescription render={<CardDescription />}>
              It changes which import we offer you first.
            </QuestionnaireDescription>
            <CardAction>
              <QuestionnaireProgress />
            </CardAction>
          </CardHeader>
          <CardContent>
            <QuestionnaireChoices>
              {REPLACING.map((option) => (
                <QuestionnaireChoice key={option.value} value={option.value}>
                  {option.label}
                </QuestionnaireChoice>
              ))}
            </QuestionnaireChoices>
            <QuestionnaireError />
          </CardContent>
        </QuestionnaireItem>

        <QuestionnaireItem
          aria-labelledby={`${titleId}-timeline`}
          name="timeline"
          required
        >
          <CardHeader>
            <QuestionnaireTitle
              id={`${titleId}-timeline`}
              render={<CardTitle />}
            >
              When do you want to be live?
            </QuestionnaireTitle>
            <QuestionnaireDescription render={<CardDescription />}>
              An honest answer is more useful than an ambitious one.
            </QuestionnaireDescription>
            <CardAction>
              <QuestionnaireProgress />
            </CardAction>
          </CardHeader>
          <CardContent>
            <QuestionnaireChoices>
              {TIMELINES.map((option) => (
                <QuestionnaireChoice key={option.value} value={option.value}>
                  {option.label}
                </QuestionnaireChoice>
              ))}
            </QuestionnaireChoices>
            <QuestionnaireError />
          </CardContent>
        </QuestionnaireItem>

        <CardFooter>
          <QuestionnaireActions className="w-full">
            <QuestionnairePrevious />
            <QuestionnaireNext>Next</QuestionnaireNext>
            <QuestionnaireSubmit>Send answers</QuestionnaireSubmit>
          </QuestionnaireActions>
        </CardFooter>
      </Card>
    </Questionnaire>
  )
}
