"use client"

import type { ReactNode } from "react"
import { Badge } from "@/registry-reui/bases/radix/reui/badge"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/bases/radix/ui/avatar"
import { Button } from "@/registry/bases/radix/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/bases/radix/ui/dropdown-menu"
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
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/registry/bases/radix/ui/sidebar"
import { IconPlaceholder } from "@/app/(create)/components/icon-placeholder"

interface Assignee {
  id: string
  name: string
  initials: string
  avatar: string
}

interface LinkedWork {
  id: string
  label: string
  count: number
  icon: ReactNode
}

interface ActivityEntry {
  id: string
  label: string
  time: string
  icon: ReactNode
}

// Demo data only: every link is `href="#"` and the faces come from the fixed
// set of photo ids this registry already ships, so nothing here points at a
// real person or an invented endpoint.
const ASSIGNEES: Assignee[] = [
  {
    id: "mara",
    name: "Mara Ellison",
    initials: "ME",
    avatar:
      "https://images.unsplash.com/photo-1485893086445-ed75865251e0?w=96&h=96&dpr=2&q=80",
  },
  {
    id: "tobias",
    name: "Tobias Reiner",
    initials: "TR",
    avatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=96&h=96&dpr=2&q=80",
  },
  {
    id: "priya",
    name: "Priya Raman",
    initials: "PR",
    avatar:
      "https://images.unsplash.com/photo-1543299750-19d1d6297053?w=96&h=96&dpr=2&q=80",
  },
]

// Icons are JSX nodes carrying a STATIC name per library, which is the shape
// `shadcn add` rewrites when it swaps the icon package for the one the
// installing project already uses.
const LINKED: LinkedWork[] = [
  {
    id: "subtasks",
    label: "Sub-tasks",
    count: 6,
    icon: (
      <IconPlaceholder
        lucide="ListChecksIcon"
        tabler="IconListCheck"
        hugeicons="TaskDone01Icon"
        phosphor="ChecksIcon"
        remixicon="RiListCheck"
        aria-hidden="true"
      />
    ),
  },
  {
    id: "pull-requests",
    label: "Pull requests",
    count: 2,
    icon: (
      <IconPlaceholder
        lucide="GitPullRequestArrowIcon"
        tabler="IconGitPullRequest"
        hugeicons="GitPullRequestIcon"
        phosphor="GitPullRequest"
        remixicon="RiGitPullRequestLine"
        aria-hidden="true"
      />
    ),
  },
  {
    id: "incidents",
    label: "Incidents",
    count: 1,
    icon: (
      <IconPlaceholder
        lucide="BugIcon"
        tabler="IconBug"
        hugeicons="Bug01Icon"
        phosphor="BugIcon"
        remixicon="RiBugLine"
        aria-hidden="true"
      />
    ),
  },
  {
    id: "docs",
    label: "Docs",
    count: 3,
    icon: (
      <IconPlaceholder
        lucide="BookOpenIcon"
        tabler="IconBook"
        hugeicons="BookOpen01Icon"
        phosphor="BookOpenIcon"
        remixicon="RiBookOpenLine"
        aria-hidden="true"
      />
    ),
  },
]

const ACTIVITY: ActivityEntry[] = [
  {
    id: "review",
    label: "Priya requested changes",
    time: "2h",
    icon: (
      <IconPlaceholder
        lucide="MessageSquareIcon"
        tabler="IconMessageDots"
        hugeicons="Message02Icon"
        phosphor="ChatIcon"
        remixicon="RiChat4Line"
        aria-hidden="true"
      />
    ),
  },
  {
    id: "deploy",
    label: "Deployed to staging",
    time: "5h",
    icon: (
      <IconPlaceholder
        lucide="RocketIcon"
        tabler="IconRocket"
        hugeicons="RocketIcon"
        phosphor="RocketIcon"
        remixicon="RiRocketLine"
        aria-hidden="true"
      />
    ),
  },
  {
    id: "assigned",
    label: "Mara took ownership",
    time: "Yesterday",
    icon: (
      <IconPlaceholder
        lucide="UserPlusIcon"
        tabler="IconUserPlus"
        hugeicons="UserAdd01Icon"
        phosphor="UserPlusIcon"
        remixicon="RiUserAddLine"
        aria-hidden="true"
      />
    ),
  },
]

// One person, with a row menu. `showOnHover` only hides the action from `md`
// up, so on a touch-width frame it stays visible, which is what makes the row
// usable without a hover state at all.
//
// The menu opens to the LEFT because the panel is flush against the right edge
// of the frame and a right-side popup would have nowhere to go.
function AssigneeRow({ assignee }: { assignee: Assignee }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild>
        <a href="#">
          <Avatar size="sm">
            <AvatarImage src={assignee.avatar} alt="" />
            <AvatarFallback>{assignee.initials}</AvatarFallback>
          </Avatar>
          <span>{assignee.name}</span>
        </a>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction
            showOnHover
            aria-label={`Actions for ${assignee.name}`}
          >
            <IconPlaceholder
              lucide="MoreHorizontalIcon"
              tabler="IconDots"
              hugeicons="MoreHorizontalCircle01Icon"
              phosphor="DotsThreeIcon"
              remixicon="RiMoreLine"
              aria-hidden="true"
            />
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="left" align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem>Make owner</DropdownMenuItem>
            <DropdownMenuItem>Notify</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem variant="destructive">Remove</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

// The inspector itself. SidebarMenuBadge stays a SIBLING of the button rather
// than a child: `asChild` puts every child inside the anchor, so a count
// nested there would join the link's hit target and its accessible name.
//
// In the activity rows the timestamp is the last span, and the menu button
// applies `truncate` to whichever span comes last. Giving the timestamp
// `shrink-0` and the label `min-w-0 flex-1` puts the ellipsis back on the text
// that actually needs one.
//
// `absolute h-full` is what keeps the panel inside the example. This is the
// desktop branch, whose container ships `fixed inset-y-0 h-svh`, and a fixed
// box neither reads the provider's height nor is clipped by its
// overflow-hidden, so it would be window tall against the right edge of the
// page. The className lands on that container and tailwind-merge swaps both
// groups; the provider's `relative` is what it then measures against, and its
// overflow-hidden is what finally clips the off-canvas slide to the example.
function Inspector() {
  return (
    <Sidebar
      side="right"
      variant="floating"
      collapsible="offcanvas"
      className="absolute h-full"
    >
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">Details</span>
          <Badge variant="warning-light" className="ml-auto shrink-0">
            In review
          </Badge>
        </div>
      </SidebarHeader>

      <SidebarContent role="complementary" aria-label="Issue details">
        <SidebarGroup>
          <SidebarGroupLabel>Assignees</SidebarGroupLabel>
          <SidebarGroupAction type="button">
            <IconPlaceholder
              lucide="UserPlusIcon"
              tabler="IconUserPlus"
              hugeicons="UserAdd01Icon"
              phosphor="UserPlusIcon"
              remixicon="RiUserAddLine"
              aria-hidden="true"
            />
            <span className="sr-only">Add assignee</span>
          </SidebarGroupAction>
          <SidebarGroupContent>
            <SidebarMenu>
              {ASSIGNEES.map((assignee) => (
                <AssigneeRow key={assignee.id} assignee={assignee} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Linked work</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {LINKED.map((entry) => (
                <SidebarMenuItem key={entry.id}>
                  <SidebarMenuButton asChild>
                    <a href="#">
                      {entry.icon}
                      <span>{entry.label}</span>
                    </a>
                  </SidebarMenuButton>
                  <SidebarMenuBadge>{entry.count}</SidebarMenuBadge>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Activity</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ACTIVITY.map((entry) => (
                <SidebarMenuItem key={entry.id}>
                  <SidebarMenuButton asChild>
                    <a href="#">
                      {entry.icon}
                      <span className="min-w-0 flex-1 truncate">
                        {entry.label}
                      </span>
                      <span className="text-sidebar-foreground/60 shrink-0 text-xs">
                        {entry.time}
                      </span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <Button variant="outline" size="sm" className="w-full">
          Open in board
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}

// The record the panel describes. `min-w-0` matters here: the inset is
// `w-full flex-1`, so without it a long title would grow the flex item and
// shove the inspector off the frame instead of wrapping.
function IssueView() {
  return (
    <SidebarInset className="min-w-0 overflow-hidden">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
        <span className="text-muted-foreground shrink-0 text-xs font-medium tabular-nums">
          ENG-2481
        </span>
        <Button variant="outline" size="sm" className="ml-auto">
          Share
        </Button>
        <SidebarTrigger />
      </header>

      <div className="min-w-0 flex-1 overflow-auto px-4 py-4">
        <h1 className="text-base font-medium">
          Retry failed webhook deliveries
        </h1>
        <p className="text-muted-foreground mt-2 max-w-prose text-sm">
          Deliveries that fail on a 5xx are dropped after the first attempt, so
          a customer whose endpoint restarts during a deploy never sees the
          event again.
        </p>
        <p className="text-muted-foreground mt-2 max-w-prose text-sm">
          Queue the failures and retry them with a backoff, then surface the
          attempt count on the delivery record.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="ghost" size="sm">
            <IconPlaceholder
              lucide="MessageSquareIcon"
              tabler="IconMessageDots"
              hugeicons="Message02Icon"
              phosphor="ChatIcon"
              remixicon="RiChat4Line"
              aria-hidden="true"
            />
            Comment
          </Button>
          <Button variant="ghost" size="sm">
            <IconPlaceholder
              lucide="PaperclipIcon"
              tabler="IconPaperclip"
              hugeicons="Attachment02Icon"
              phosphor="PaperclipIcon"
              remixicon="RiAttachment2"
              aria-hidden="true"
            />
            Attach
          </Button>
          <Button variant="ghost" size="sm">
            <IconPlaceholder
              lucide="EyeIcon"
              tabler="IconEye"
              hugeicons="ViewIcon"
              phosphor="EyeIcon"
              remixicon="RiEyeLine"
              aria-hidden="true"
            />
            Watch
          </Button>
        </div>
      </div>
    </SidebarInset>
  )
}

// The same parts doing a second job: a right-hand inspector beside the record
// it describes, rather than a navigation panel.
//
// The children are in INSET-FIRST order, and that is what puts the panel on
// the right. `side="right"` only decides which edge the fixed container pins
// to; the space it occupies comes from a spacer rendered in flex order, so a
// Sidebar written before the inset would reserve its column on the left.
//
// `variant="floating"` draws its own chrome, a padded container with a ring
// and a radius that every style resolves for itself, so there is nothing here
// to hand-roll a border or a corner for.
//
// `collapsible="offcanvas"` means the panel can be entirely gone, so
// SidebarTrigger in the inset header is what brings it back. SidebarRail is
// left out rather than unavailable: it ships `tabIndex={-1}` and `sm:flex`, so
// it would add a second control for the one toggle that only a mouse on a wide
// frame can reach. Under 768px shadcn's Sidebar swaps to a Sheet and that same
// trigger opens it.
//
// `min-h-0` beside the height is load-bearing. SidebarProvider ships
// `min-h-svh`, and tailwind-merge only drops it when another `min-h-*` arrives
// with it, so without the pair the example is viewport tall inside its frame.
export default function Pattern() {
  return (
    <SidebarProvider className="relative h-dvh min-h-0 w-full overflow-hidden">
      <IssueView />
      <Inspector />
    </SidebarProvider>
  )
}
