"use client"

import { useId, useRef, useState, type ReactNode } from "react"
import { Badge } from "@/registry-reui/bases/radix/reui/badge"
import {
  Tree,
  TreeItem,
  TreeItemLabel,
} from "@/registry-reui/bases/radix/reui/tree"
import {
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from "@headless-tree/core"
import { useTree } from "@headless-tree/react"
import { cn } from "cn"

import { Button } from "@/registry/bases/radix/ui/button"
import { Separator } from "@/registry/bases/radix/ui/separator"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

const severities = {
  High: "destructive-light",
  Mild: "success-light",
} as const

const statusLabels = {
  complete: "complete",
  current: "in progress",
  upcoming: "pending",
} as const

type Status = keyof typeof statusLabels

interface Entry {
  name: string
  icon?: ReactNode
  count?: number
  severity?: keyof typeof severities
  items?: (Entry | string)[]
}

// Areas hold numbered steps and steps hold checks. The checks are what the
// stepper moves through, in this order.
const areas: Entry[] = [
  {
    name: "Endpoint Security",
    icon: (
      <IconPlaceholder
        lucide="MonitorSmartphoneIcon"
        tabler="IconDevices"
        hugeicons="ComputerPhoneSyncIcon"
        phosphor="DevicesIcon"
        remixicon="RiDeviceLine"
        className="size-4"
        aria-hidden="true"
      />
    ),
    items: [
      {
        name: "Inventory",
        count: 248,
        items: ["Device Discovery", "Agent Coverage", "Installed Software"],
      },
      {
        name: "Threat Detection",
        count: 12,
        items: [
          "Overview",
          "Suspicious Activity",
          "Malware Events",
          "Network Anomalies",
        ],
      },
      {
        name: "Vulnerabilities",
        count: 37,
        severity: "High",
        items: ["Critical CVEs", "Missing Patches", "Exposed Services"],
      },
      {
        name: "Policies",
        count: 8,
        items: ["Disk Encryption", "Firewall Rules", "Screen Lock"],
      },
      {
        name: "Quarantine",
        count: 5,
        items: ["Isolated Devices", "Held Files"],
      },
      {
        name: "Response",
        count: 7,
        severity: "Mild",
        items: ["Open Incidents", "Remediation"],
      },
    ],
  },
  {
    name: "Identity & Access",
    icon: (
      <IconPlaceholder
        lucide="KeyRoundIcon"
        tabler="IconKey"
        hugeicons="Key02Icon"
        phosphor="KeyIcon"
        remixicon="RiKey2Line"
        className="size-4"
        aria-hidden="true"
      />
    ),
    items: [
      {
        name: "Accounts",
        count: 64,
        items: ["Privileged Users", "Stale Accounts"],
      },
      {
        name: "Authentication",
        count: 9,
        severity: "High",
        items: ["MFA Coverage", "Password Policy"],
      },
    ],
  },
  {
    name: "Application Security",
    icon: (
      <IconPlaceholder
        lucide="BracesIcon"
        tabler="IconBraces"
        hugeicons="CodeIcon"
        phosphor="BracketsCurly"
        remixicon="RiBracesLine"
        className="size-4"
        aria-hidden="true"
      />
    ),
    items: [
      {
        name: "Dependencies",
        count: 112,
        severity: "High",
        items: ["Known CVEs", "License Risks"],
      },
      {
        name: "Code Scanning",
        count: 23,
        items: ["Hardcoded Secrets", "Injection Flaws"],
      },
    ],
  },
  {
    name: "Data Protection",
    icon: (
      <IconPlaceholder
        lucide="DatabaseZapIcon"
        tabler="IconDatabase"
        hugeicons="DatabaseLightningIcon"
        phosphor="DatabaseIcon"
        remixicon="RiDatabase2Line"
        className="size-4"
        aria-hidden="true"
      />
    ),
    items: [
      {
        name: "Encryption",
        count: 4,
        items: ["Data at Rest", "Data in Transit"],
      },
      {
        name: "Backups",
        count: 3,
        severity: "Mild",
        items: ["Retention", "Restore Tests"],
      },
    ],
  },
]

interface TreeNode extends Omit<Entry, "items"> {
  parent: string
  children?: string[]
  first: number
  last: number
}

const nodes: Record<string, TreeNode> = {}
const checks: string[] = []

// first and last are the positions of the first and last check under a node,
// so comparing them with the active check gives any row its status.
function add(id: string, entry: Entry | string, parent: string): string {
  const { items, ...rest }: Entry =
    typeof entry === "string" ? { name: entry } : entry
  const first = checks.length
  const children = items?.map((item, index) => add(`${id}.${index}`, item, id))
  if (!children) checks.push(id)
  nodes[id] = { ...rest, parent, children, first, last: checks.length - 1 }
  return id
}

nodes.root = {
  name: "Security review",
  parent: "",
  children: areas.map((area, index) => add(`${index}`, area, "root")),
  first: 0,
  last: checks.length - 1,
}

function foldersAbove(id: string): string[] {
  const parent = nodes[id].parent
  return parent === "root" ? [] : [parent, ...foldersAbove(parent)]
}

// Rows sit flush (no pb-0.5) and each draws the guide of every indent level
// it sits under, so a guide runs unbroken down a branch and stops at its end.
// The gradient only runs left to right, so RTL mirrors the strip instead.
const guides =
  "relative not-last:pb-0 before:absolute before:inset-y-0 before:-start-1 before:w-(--tree-padding) before:bg-[repeating-linear-gradient(to_right,transparent_0,transparent_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)-1px),var(--border)_calc(var(--tree-indent)))] rtl:before:-scale-x-100"

// r=7 gives a circumference of 44: the track is eleven 3+1 dashes and the
// in-progress arc is 17 long (139 degrees), offset to start at 11 o'clock as
// in the design. Only the arc spins, so the dashed track holds still.
function StatusIcon({ status }: { status: Status }) {
  return (
    <span className="flex size-4.5 shrink-0 items-center justify-center">
      {status === "complete" ? (
        <span className="border-success bg-success/10 text-success flex size-4 items-center justify-center rounded-full border">
          <IconPlaceholder
            lucide="CheckIcon"
            tabler="IconCheck"
            hugeicons="Tick02Icon"
            phosphor="CheckIcon"
            remixicon="RiCheckLine"
            className="size-3"
            aria-hidden="true"
          />
        </span>
      ) : (
        <svg
          viewBox="0 0 16 16"
          fill="none"
          strokeWidth="1.6"
          aria-hidden="true"
          className="size-4"
        >
          <circle
            cx="8"
            cy="8"
            r="7"
            strokeDasharray="3 1"
            className="stroke-ring/50"
          />
          {status === "current" && (
            <circle
              cx="8"
              cy="8"
              r="7"
              strokeDasharray="17 27"
              strokeDashoffset="14.4"
              className="stroke-success origin-center motion-safe:animate-spin"
            />
          )}
        </svg>
      )}
    </span>
  )
}

export default function Pattern() {
  const labelId = useId()
  // Ids are index paths, so 0.1.1 is Endpoint Security, Threat Detection,
  // Suspicious Activity.
  const [active, setActive] = useState("0.1.1")
  // Next on the last check finishes the review: every row then reads
  // complete, and Previous returns to that check.
  const [allDone, setAllDone] = useState(false)
  const activeIndex = checks.indexOf(active)
  const progress = allDone ? checks.length : activeIndex
  const prevRef = useRef<HTMLButtonElement>(null)
  const nextRef = useRef<HTMLButtonElement>(null)
  const step = nodes[nodes[active].parent]

  const statusOf = (node: TreeNode): Status =>
    node.last < progress
      ? "complete"
      : node.first > progress
        ? "upcoming"
        : "current"

  const tree = useTree<TreeNode>({
    // Selection is pinned to the active check, so a click on a folder or a
    // multi-select gesture snaps back and only a check's primary action
    // moves it. Focusing it up front makes Tab land on it too.
    state: { selectedItems: allDone ? [] : [active] },
    initialState: {
      expandedItems: foldersAbove(active),
      focusedItem: active,
    },
    rootItemId: "root",
    // TreeItem announces this name in place of the row's content, so it
    // carries the count, severity and status the row shows.
    getItemName: (item) => {
      const node = item.getItemData()
      return [
        node.name,
        node.count !== undefined && `${node.count} findings`,
        node.severity && `${node.severity} severity`,
        statusLabels[statusOf(node)],
      ]
        .filter(Boolean)
        .join(", ")
    },
    isItemFolder: (item) => Boolean(item.getItemData().children),
    onPrimaryAction: (item) => {
      if (item.isFolder()) return
      setActive(item.getId())
      setAllDone(false)
    },
    dataLoader: {
      getItem: (itemId) => nodes[itemId],
      getChildren: (itemId) => nodes[itemId].children ?? [],
    },
    features: [syncDataLoaderFeature, selectionFeature, hotkeysCoreFeature],
  })

  // Previous and Next fold the branch being left and open the new check's, so
  // the open branch follows the active check as on first render, and move the
  // tree's focus along so Tab lands on the new check.
  function goTo(index: number) {
    const check = checks[index]
    const path = foldersAbove(check)
    for (const id of foldersAbove(active)) {
      if (!path.includes(id)) tree.getItemInstance(id).collapse()
    }
    for (const id of path) {
      const folder = tree.getItemInstance(id)
      if (!folder.isExpanded()) folder.expand()
    }
    tree.getItemInstance(check).setFocused()
    setActive(check)
    // The pressed button disables itself at either end, so focus moves to
    // its partner.
    if (index === 0) nextRef.current?.focus()
  }

  function finish() {
    setAllDone(true)
    prevRef.current?.focus()
  }

  // Side by side from 32rem, which leaves 12rem beside the 18rem tree for the
  // text and the Previous and Next row.
  return (
    <div className="@container w-full">
      <div className="mx-auto flex max-w-72 flex-col gap-6 @lg:max-w-none @lg:flex-row @lg:items-start">
        {/* Tree spreads getContainerProps() last, and its empty aria-label
            wins over ours, so the tree is named through aria-labelledby. */}
        <span id={labelId} className="sr-only">
          {nodes.root.name}
        </span>
        <Tree
          tree={tree}
          aria-labelledby={labelId}
          className="@lg:w-72 @lg:shrink-0"
        >
          {tree.getItems().map((item) => {
            const node = item.getItemData()
            const status = statusOf(node)
            const current = status === "current"

            return (
              <TreeItem
                key={item.getId()}
                item={item}
                aria-current={item.getId() === active ? "step" : undefined}
                className={guides}
              >
                {/* The primitive's chevron is the first svg child and an area
                    icon the only other one, so the row tone reaches both while
                    the 14px size reaches the chevron alone. Only hover and the
                    active check fill a row; the primitive's bg-background would
                    show as a block on any other surface. */}
                <TreeItemLabel
                  className={cn(
                    "h-8 gap-1.5 bg-transparent font-medium not-in-data-[folder=true]:ps-2 [&>svg:first-child]:size-3.5",
                    current ? "[&>svg]:text-foreground" : "[&>svg]:text-ring"
                  )}
                >
                  {node.icon ??
                    (item.isFolder() ? (
                      <Badge
                        variant={
                          status === "upcoming"
                            ? "warning-light"
                            : "success-light"
                        }
                        radius="full"
                      >
                        {item.getIndexInParent() + 1}
                      </Badge>
                    ) : (
                      <StatusIcon status={status} />
                    ))}
                  <span
                    className={cn(
                      "truncate",
                      !current && "text-muted-foreground"
                    )}
                  >
                    {node.name}
                  </span>
                  {node.count !== undefined && (
                    <Badge variant="outline">{node.count}</Badge>
                  )}
                  {node.severity && (
                    <Badge
                      variant={severities[node.severity]}
                      className="ms-auto"
                    >
                      {node.severity}
                    </Badge>
                  )}
                  {/* The theme has no focus token for focus-light to read, so
                      the design's focus blue comes from the palette. */}
                  {node.icon && current && (
                    <Badge
                      variant="focus-light"
                      className="ms-auto border-blue-500/15 bg-blue-500/10 text-blue-900 dark:border-blue-500/25 dark:bg-blue-500/15 dark:text-blue-400"
                    >
                      Review
                    </Badge>
                  )}
                </TreeItemLabel>
              </TreeItem>
            )
          })}
        </Tree>

        {/* Decorative, so hidden from assistive tech: a line across while the
            columns stack, a line between them once they sit side by side. */}
        <Separator aria-hidden="true" className="@lg:hidden" />
        <Separator
          aria-hidden="true"
          orientation="vertical"
          className="hidden @lg:block"
        />
        <div className="min-w-0 flex-1 px-2 @lg:px-0">
          <div role="status" className="flex flex-col gap-1">
            {allDone ? (
              <>
                <p className="text-muted-foreground text-xs">
                  All {checks.length} checks done
                </p>
                <p className="text-sm font-medium">Review complete</p>
                <p className="text-muted-foreground text-sm">
                  {nodes.root.name} finished across every area
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground text-xs">
                  Check {activeIndex - step.first + 1} of{" "}
                  {step.last - step.first + 1}
                </p>
                <p className="text-sm font-medium">{nodes[active].name}</p>
                <p className="text-muted-foreground text-sm">
                  {step.name} in {nodes[step.parent].name}
                </p>
              </>
            )}
          </div>
          <div className="mt-3 flex justify-start gap-2">
            <Button
              ref={prevRef}
              variant="outline"
              size="sm"
              disabled={activeIndex === 0 && !allDone}
              onClick={() =>
                allDone ? setAllDone(false) : goTo(activeIndex - 1)
              }
            >
              Previous
            </Button>
            <Button
              ref={nextRef}
              variant="outline"
              size="sm"
              disabled={allDone}
              onClick={() =>
                activeIndex === checks.length - 1
                  ? finish()
                  : goTo(activeIndex + 1)
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
