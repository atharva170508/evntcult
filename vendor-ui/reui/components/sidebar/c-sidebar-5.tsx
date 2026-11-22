"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import { cn } from "cn"

import { Button } from "@/registry/bases/radix/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/registry/bases/radix/ui/card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/registry/bases/radix/ui/input-group"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "@/registry/bases/radix/ui/sidebar"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

interface Project {
  id: string
  name: string
  open: number
  icon: ReactNode
}

interface Run {
  id: string
  label: string
  time: string
  failed?: boolean
}

// Demo data only: every row links to `href="#"`, so nothing here invents a
// route or an endpoint on the way into someone else's app.
const PINNED = [
  { id: "checkout", name: "Checkout API" },
  { id: "design-system", name: "Design system" },
  { id: "status", name: "Status page" },
]

// Icons are JSX nodes with a STATIC name per library, which is the shape
// `shadcn add` rewrites when it swaps in whichever icon package the installing
// project already uses.
const PROJECTS: Project[] = [
  {
    id: "checkout",
    name: "Checkout API",
    open: 8,
    icon: (
      <IconPlaceholder
        lucide="PackageIcon"
        tabler="IconPackage"
        hugeicons="PackageIcon"
        phosphor="PackageIcon"
        remixicon="RiBox3Line"
        aria-hidden="true"
      />
    ),
  },
  {
    id: "design-system",
    name: "Design system",
    open: 3,
    icon: (
      <IconPlaceholder
        lucide="PaletteIcon"
        tabler="IconPalette"
        hugeicons="PaintBoardIcon"
        phosphor="PaletteIcon"
        remixicon="RiPaletteLine"
        aria-hidden="true"
      />
    ),
  },
  {
    id: "edge-cache",
    name: "Edge cache",
    open: 2,
    icon: (
      <IconPlaceholder
        lucide="GlobeIcon"
        tabler="IconWorld"
        hugeicons="Globe02Icon"
        phosphor="GlobeIcon"
        remixicon="RiGlobalLine"
        aria-hidden="true"
      />
    ),
  },
  {
    id: "growth",
    name: "Growth experiments",
    open: 11,
    icon: (
      <IconPlaceholder
        lucide="BarChart3Icon"
        tabler="IconChartBar"
        hugeicons="Analytics01Icon"
        phosphor="ChartBarIcon"
        remixicon="RiBarChartLine"
        aria-hidden="true"
      />
    ),
  },
  {
    id: "marketing",
    name: "Marketing site",
    open: 4,
    icon: (
      <IconPlaceholder
        lucide="FileTextIcon"
        tabler="IconFileText"
        hugeicons="File02Icon"
        phosphor="FileTextIcon"
        remixicon="RiFileTextLine"
        aria-hidden="true"
      />
    ),
  },
  {
    id: "mobile",
    name: "Mobile client",
    open: 6,
    icon: (
      <IconPlaceholder
        lucide="SmartphoneIcon"
        tabler="IconDeviceMobile"
        hugeicons="SmartPhone01Icon"
        phosphor="DeviceMobileIcon"
        remixicon="RiSmartphoneLine"
        aria-hidden="true"
      />
    ),
  },
  {
    id: "payments",
    name: "Payments ledger",
    open: 1,
    icon: (
      <IconPlaceholder
        lucide="DatabaseIcon"
        tabler="IconDatabase"
        hugeicons="Database02Icon"
        phosphor="DatabaseIcon"
        remixicon="RiDatabase2Line"
        aria-hidden="true"
      />
    ),
  },
  {
    id: "search",
    name: "Search index",
    open: 5,
    icon: (
      <IconPlaceholder
        lucide="TerminalIcon"
        tabler="IconTerminal"
        hugeicons="ComputerTerminal01Icon"
        phosphor="TerminalIcon"
        remixicon="RiTerminalLine"
        aria-hidden="true"
      />
    ),
  },
]

const RUNS: Run[] = [
  { id: "r-311", label: "Nightly contract tests", time: "08:12" },
  { id: "r-310", label: "Payment webhook replay", time: "07:40", failed: true },
  { id: "r-309", label: "Index rebuild", time: "06:55" },
  { id: "r-308", label: "Locale export", time: "06:02" },
]

// Pinned rows sit above the filter's reach on purpose: a query that matches
// nothing still leaves a usable panel instead of an empty column.
function PinnedProjects() {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Pinned</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {PINNED.map((project) => (
            <SidebarMenuItem key={project.id}>
              <SidebarMenuButton asChild>
                <a href="#">
                  <IconPlaceholder
                    lucide="BookmarkIcon"
                    tabler="IconBookmark"
                    hugeicons="Bookmark02Icon"
                    phosphor="BookmarkSimpleIcon"
                    remixicon="RiBookmarkLine"
                    aria-hidden="true"
                  />
                  <span>{project.name}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// One recent run. Glyph and colour both carry the outcome visually, which is
// what makes the row readable without colour vision; neither reaches a screen
// reader, so the `sr-only` word is what does.
function RunRow({ run }: { run: Run }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {run.failed ? (
        <IconPlaceholder
          lucide="AlertCircleIcon"
          tabler="IconAlertCircle"
          hugeicons="AlertCircleIcon"
          phosphor="WarningCircleIcon"
          remixicon="RiErrorWarningLine"
          className="text-destructive size-3.5 shrink-0"
          aria-hidden="true"
        />
      ) : (
        <IconPlaceholder
          lucide="CircleCheckIcon"
          tabler="IconCircleCheck"
          hugeicons="CheckmarkCircle02Icon"
          phosphor="CheckCircleIcon"
          remixicon="RiCheckboxCircleLine"
          className="text-success size-3.5 shrink-0"
          aria-hidden="true"
        />
      )}
      <span className="sr-only">{run.failed ? "Failed" : "Succeeded"}</span>
      <span className="min-w-0 flex-1 truncate">{run.label}</span>
      <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
        {run.time}
      </span>
    </div>
  )
}

// The filter field. It boots empty, so the unfiltered list is what a visitor
// sees first, and the clear button only exists while there is something to
// clear rather than sitting there permanently disabled.
//
// Both affordances sit in an InputGroupAddon rather than on top of the input.
// The addon reserves real space in the group and the input's padding follows
// it, so neither the icon nor the clear button can ever overlap typed text the
// way an absolutely positioned overlay would.
function ProjectFilter({
  query,
  onChange,
}: {
  query: string
  onChange: (value: string) => void
}) {
  return (
    /*
      The form and the `py-0` group are shadcn's own SearchForm shape
      (blocks/sidebar-05): the form gives Enter somewhere to go instead of
      submitting the page, and the group lines the field up with the panel's
      gutter rather than the header's padding.
    */
    <form onSubmit={(event) => event.preventDefault()}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent>
          <InputGroup>
            <InputGroupAddon>
              <IconPlaceholder
                lucide="SearchIcon"
                tabler="IconSearch"
                hugeicons="Search01Icon"
                phosphor="MagnifyingGlassIcon"
                remixicon="RiSearchLine"
                aria-hidden="true"
              />
            </InputGroupAddon>
            <InputGroupInput
              value={query}
              onChange={(event) => onChange(event.target.value)}
              placeholder="Filter projects"
              aria-label="Filter projects"
            />
            {query ? (
              <InputGroupAddon align="inline-end">
                <InputGroupButton
                  size="icon-xs"
                  aria-label="Clear filter"
                  onClick={() => onChange("")}
                >
                  <IconPlaceholder
                    lucide="XIcon"
                    tabler="IconX"
                    hugeicons="Cancel01Icon"
                    phosphor="XIcon"
                    remixicon="RiCloseLine"
                    aria-hidden="true"
                  />
                </InputGroupButton>
              </InputGroupAddon>
            ) : null}
          </InputGroup>
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}

// The three states one list can be in. Six skeleton rows is roughly what the
// loaded list runs to, so the panel does not jump height while a refresh is in
// flight, and `aria-busy` tells assistive technology the rows are stale rather
// than gone.
//
// The empty message sits OUTSIDE SidebarMenu. That element is a `ul`, and a
// paragraph is not a permitted child of one.
function ProjectList({
  projects,
  loading,
  query,
  onRefresh,
}: {
  projects: Project[]
  loading: boolean
  query: string
  onRefresh: () => void
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>All projects</SidebarGroupLabel>
      <SidebarGroupAction type="button" onClick={onRefresh}>
        <IconPlaceholder
          lucide="LoaderCircleIcon"
          tabler="IconLoader2"
          hugeicons="Loading02Icon"
          phosphor="CircleNotchIcon"
          remixicon="RiLoader4Line"
          className={cn("size-4", loading && "animate-spin")}
          aria-hidden="true"
        />
        <span className="sr-only">Refresh projects</span>
      </SidebarGroupAction>
      <SidebarGroupContent>
        <SidebarMenu aria-busy={loading}>
          {loading
            ? Array.from({ length: 6 }, (_, index) => (
                <SidebarMenuItem key={`skeleton-${index}`}>
                  <SidebarMenuSkeleton showIcon />
                </SidebarMenuItem>
              ))
            : projects.map((project) => (
                <SidebarMenuItem key={project.id}>
                  <SidebarMenuButton asChild>
                    <a href="#">
                      {project.icon}
                      <span>{project.name}</span>
                    </a>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{project.open}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
        </SidebarMenu>
        {!loading && projects.length === 0 ? (
          <p className="text-sidebar-foreground/70 px-2 py-6 text-center text-xs">
            No projects match{" "}
            <span className="text-sidebar-foreground">{query}</span>.
          </p>
        ) : null}
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

// The page beside the panel. The run list is a Card rather than a div with a
// border and a radius, because a literal `rounded-lg` is square in lyra and
// sera and much rounder in maia and luma: only a component resolves the panel
// correctly under all eight styles.
function ProjectOverview() {
  return (
    <SidebarInset className="min-w-0 overflow-hidden">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ms-1" />
        <h2 className="truncate text-sm font-medium">Checkout API</h2>
        <span className="text-muted-foreground ml-auto shrink-0 text-xs">
          Updated 4m ago
        </span>
      </header>

      <div className="min-w-0 flex-1 overflow-auto p-4">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Recent runs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2.5">
              {RUNS.map((run) => (
                <RunRow key={run.id} run={run} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
}

// A filter field, a loading state and an empty state, which is the set a real
// sidebar needs and a demo usually skips.
//
// The visible list is derived during render from the query. Nothing copies the
// result into state, so there is no second source of truth to fall out of step.
//
// The refresh is an event handler, not an effect, so the panel boots LOADED and
// the skeletons are something the reader triggers. That also keeps
// SidebarMenuSkeleton out of the first paint, which matters because it picks a
// random width in a useState initializer and would otherwise differ between the
// server and the client render. The only effect in the file clears the pending
// timer, so a refresh can never land on an unmounted panel.
//
// `collapsible="none"` is the one Sidebar branch with no media query in it, so
// the panel is identical at every frame width. It ignores the open state too,
// which is why no SidebarTrigger appears here.
//
// `min-h-0` beside the height is load-bearing. SidebarProvider ships
// `min-h-svh`, and tailwind-merge only drops it when another `min-h-*` arrives
// with it, so without the pair the example is viewport tall inside its frame.
export default function Pattern() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    }
  }, [])

  function startRefresh() {
    if (timer.current) {
      clearTimeout(timer.current)
    }

    setLoading(true)
    timer.current = setTimeout(() => setLoading(false), 900)
  }

  const needle = query.trim().toLowerCase()
  const visible = PROJECTS.filter((project) =>
    project.name.toLowerCase().includes(needle)
  )

  return (
    <SidebarProvider className="relative h-dvh min-h-0 w-full overflow-hidden">
      {/*
        NOT `collapsible="none"`. That branch is a bare
        `flex h-full w-(--sidebar-width) flex-col bg-sidebar` with no border, so
        against a page background this close to `--sidebar` the panel and the
        content blur into one another. Only the desktop branch draws
        `group-data-[side=left]:border-r`, and it is the branch the framed
        preview always takes, so the divider is real rather than hand-painted.
        `absolute h-full` pins that branch's `fixed inset-y-0 h-svh` container
        back inside the example.
      */}
      <Sidebar className="absolute h-full">
        <SidebarHeader>
          <ProjectFilter query={query} onChange={setQuery} />
        </SidebarHeader>

        <SidebarContent role="navigation" aria-label="Projects">
          <PinnedProjects />
          {/*
            `mx-0` is a fix, not a preference. SidebarSeparator ships `w-auto`
            to undo Separator's `data-horizontal:w-full`, but a variant
            selector outranks a plain utility, so the rule stays full width and
            the primitive's own `mx-2` then pushes it 8px past the panel's
            right edge. In this scrolling content that is 16px of horizontal
            scroll on the whole nav; in the footer it is a rule that misses the
            left gutter and overhangs the right.
          */}
          <SidebarSeparator className="mx-0" />
          <ProjectList
            projects={visible}
            loading={loading}
            query={query}
            onRefresh={startRefresh}
          />
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator className="mx-0" />
          <p className="text-sidebar-foreground/70 px-2 text-xs">
            Free plan, 8 of 10 projects
          </p>
          <Button variant="outline" size="sm" className="w-full">
            Upgrade plan
          </Button>
        </SidebarFooter>
      </Sidebar>

      <ProjectOverview />
    </SidebarProvider>
  )
}
