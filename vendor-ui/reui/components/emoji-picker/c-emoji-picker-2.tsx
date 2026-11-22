"use client"

import { useEffect, useRef, useState } from "react"
import {
  EmojiPicker,
  EmojiPickerContent,
  EmojiPickerTrigger,
} from "@/registry-reui/bases/radix/reui/emoji-picker"

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarImage,
} from "@/registry/bases/radix/ui/avatar"
import {
  Bubble,
  BubbleContent,
  BubbleGroup,
} from "@/registry/bases/radix/ui/bubble"
import { Button } from "@/registry/bases/radix/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/registry/bases/radix/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/registry/bases/radix/ui/input-group"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageHeader,
} from "@/registry/bases/radix/ui/message"
import { Separator } from "@/registry/bases/radix/ui/separator"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

type Author = { name: string; initials: string; avatar: string }

type ChatGroup = {
  id: string
  /* No author means the group is yours: end-aligned, primary, no avatar. */
  author?: Author
  time: string
  lines: string[]
}

const photo = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=96&h=96&dpr=2&q=80`

const AMARA: Author = {
  name: "Amara Okafor",
  initials: "AO",
  avatar: photo("1519699047748-de8e457a634e"),
}
const LUCAS: Author = {
  name: "Lucas Martin",
  initials: "LM",
  avatar: photo("1527980965255-d3b416303d12"),
}
const PRIYA: Author = {
  name: "Priya Shah",
  initials: "PS",
  avatar: photo("1584308972272-9e4e7685e80f"),
}
const MIRA: Author = {
  name: "Mira Stone",
  initials: "MS",
  avatar: photo("1494790108377-be9c29b29330"),
}

const MEMBERS = [AMARA, LUCAS, PRIYA, MIRA]

const THREAD: ChatGroup[] = [
  {
    id: "g0",
    author: PRIYA,
    time: "9:05 AM",
    lines: ["Morning! Slides are in the shared drive."],
  },
  {
    id: "g1",
    author: AMARA,
    time: "9:12 AM",
    lines: ["Launch review moved to 4 PM.", "Can everyone still make it?"],
  },
  {
    id: "g2",
    author: LUCAS,
    time: "9:14 AM",
    lines: ["Works for me 👍"],
  },
  {
    id: "g3",
    time: "9:15 AM",
    lines: ["I'm in. Demo build is ready."],
  },
  {
    id: "g4",
    author: PRIYA,
    time: "9:21 AM",
    lines: ["Same. Big room is booked."],
  },
]

export default function Pattern() {
  const [groups, setGroups] = useState(THREAD)
  const [text, setText] = useState("")
  const logRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const empty = !text.trim()

  /* Keyed on the array, not its length: a follow-up joins your last group
     and leaves the length unchanged. */
  useEffect(() => {
    const log = logRef.current
    if (log) log.scrollTop = log.scrollHeight
  }, [groups])

  /* A blurred input keeps its selection, so the emoji replaces it and the
     caret lands after it. Set here rather than after focus returns, because
     a Shift+click pick keeps the picker open. */
  const insert = (emoji: string) => {
    const field = inputRef.current
    if (!field) return
    const { value } = field
    const start = field.selectionStart ?? value.length
    const end = field.selectionEnd ?? start
    const next = value.slice(0, start) + emoji + value.slice(end)
    const caret = start + emoji.length
    field.value = next
    field.setSelectionRange(caret, caret)
    setText(next)
  }

  /* A fixed label, not a clock read, so the server render and the first
     client render agree. */
  const send = () => {
    if (empty) return
    const line = text.trim()
    const last = groups.at(-1)
    setGroups(
      last && !last.author
        ? [...groups.slice(0, -1), { ...last, lines: [...last.lines, line] }]
        : [
            ...groups,
            { id: `g${groups.length + 1}`, time: "Just now", lines: [line] },
          ]
    )
    setText("")
    inputRef.current?.focus()
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>#launch-crew</CardTitle>
        <CardDescription>4 members</CardDescription>
        <CardAction>
          {/* Decorative: the description already gives the count, and four
              names read out before the thread would only be noise. */}
          <AvatarGroup aria-hidden="true">
            {MEMBERS.map((member) => (
              <Avatar key={member.name} size="sm">
                <AvatarImage src={member.avatar} alt="" />
                <AvatarFallback>{member.initials}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
        </CardAction>
      </CardHeader>
      {/* One wrapper, so no Card gap falls between the rule and the
          scroller: once the thread outgrows its cap, older messages scroll
          under the rule itself. */}
      <div>
        <Separator />
        {/* The seeded thread fits under the cap in every style, so it opens
            whole; sends grow it until it scrolls. A log announces each
            message as it lands, and it is focusable so Safari keyboard users
            can scroll back through the history. */}
        <CardContent
          ref={logRef}
          role="log"
          aria-label="Messages in #launch-crew"
          tabIndex={0}
          className="max-h-160 overflow-y-auto"
        >
          <div className="flex flex-col gap-6 pt-4">
            {groups.map((group) => (
              <Message key={group.id} align={group.author ? "start" : "end"}>
                {group.author && (
                  /* Top-aligned beside the name line, so every group reads
                   the same way: who, when, then what. The header names the
                   sender, so the photo stays silent. */
                  <MessageAvatar aria-hidden="true" className="self-start">
                    <Avatar>
                      <AvatarImage src={group.author.avatar} alt="" />
                      <AvatarFallback>{group.author.initials}</AvatarFallback>
                    </Avatar>
                  </MessageAvatar>
                )}
                <MessageContent>
                  <MessageHeader>
                    <span className="flex items-center gap-1.5">
                      {group.author ? (
                        <>
                          <span className="text-foreground">
                            {group.author.name}
                          </span>
                          <span
                            aria-hidden="true"
                            className="bg-muted-foreground/40 size-1 shrink-0 rounded-full"
                          />
                        </>
                      ) : (
                        /* Your own groups show only the time, as chat apps
                         do. The hidden word keeps the log from announcing
                         a bare time. */
                        <span className="sr-only">You</span>
                      )}
                      <span className="font-normal">{group.time}</span>
                    </span>
                  </MessageHeader>
                  {/* An end row shrinks to fit, so the bubbles' 80% cap would
                    resolve against the group and wrap a short line. */}
                  <BubbleGroup className="w-full">
                    {group.lines.map((line, index) => (
                      <Bubble
                        key={index}
                        variant={group.author ? "muted" : "default"}
                      >
                        <BubbleContent>{line}</BubbleContent>
                      </Bubble>
                    ))}
                  </BubbleGroup>
                </MessageContent>
              </Message>
            ))}
          </div>
        </CardContent>
      </div>
      <CardContent>
        <InputGroup>
          <InputGroupInput
            ref={inputRef}
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              /* Enter that confirms an IME composition is not a send. */
              if (event.key === "Enter" && !event.nativeEvent.isComposing)
                send()
            }}
            placeholder="Message #launch-crew"
            aria-label="Message #launch-crew"
          />
          <InputGroupAddon align="inline-end">
            {/* Controlled to null so the trigger keeps its smiley: this
                button inserts, it does not hold a value. */}
            <EmojiPicker
              value={null}
              aria-label="Add emoji"
              onEmojiSelect={({ value }) => insert(value)}
            >
              <EmojiPickerTrigger variant="ghost" size="icon-sm" />
              {/* Above the field so the draft stays in view; it flips below
                  when the page leaves no room. */}
              <EmojiPickerContent
                side="top"
                align="end"
                returnFocus={inputRef}
              />
            </EmojiPicker>
            {/* Never `disabled`: inside an InputGroup that greys out the
                whole composer. An empty send is a no-op that says so, and
                the button fills once there is a draft. */}
            <Button
              variant={empty ? "ghost" : "default"}
              size="icon-sm"
              aria-label="Send message"
              aria-disabled={empty}
              onClick={send}
            >
              <IconPlaceholder
                lucide="SendIcon"
                tabler="IconSend"
                hugeicons="SentIcon"
                phosphor="PaperPlaneRightIcon"
                remixicon="RiSendPlaneLine"
                aria-hidden="true"
              />
            </Button>
          </InputGroupAddon>
        </InputGroup>
      </CardContent>
    </Card>
  )
}
