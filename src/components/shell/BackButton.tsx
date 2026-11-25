"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "ec_nav_depth";

/** How many screens deep the person is inside EvntCult in this tab (1 = they arrived here directly). */
function depth(): number {
  try {
    return Number(sessionStorage.getItem(KEY)) || 0;
  } catch {
    return 0;
  }
}
function setDepth(n: number) {
  try {
    sessionStorage.setItem(KEY, String(Math.max(0, n)));
  } catch {
    /* private mode: back falls back to the parent link */
  }
}

/**
 * Keeps count of in-app navigation so Back can behave like a native app: go back one screen when
 * there is one to go back to, otherwise (a shared link, a fresh tab) go to the page's parent.
 * Called by AppShell on every route change.
 */
export function trackNavigation(first: boolean) {
  if (first) {
    let sameSite = false;
    try {
      sameSite = !!document.referrer && new URL(document.referrer).origin === location.origin;
    } catch {
      /* no referrer */
    }
    setDepth(sameSite && depth() > 0 ? depth() : 1);
  } else setDepth(depth() + 1);
}
/** Browser or app Back: the route change that follows adds one, so take two off to land one shallower. */
export const onPopState = () => setDepth(depth() - 2);

/**
 * Top-left back button for sub-pages, shaped for the phone it's on (data-platform on <html>):
 *  - iOS: a chevron and the parent's name, like a navigation bar ("‹ Discover").
 *  - Android: an arrow in a 48px round button, like a Material top app bar. The name stays for
 *    screen readers.
 * Works without JavaScript too: it's a link to the parent page.
 */
export function BackButton({ href, label, className }: { href: string; label: string; className?: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        if (depth() > 1) {
          e.preventDefault();
          router.back(); // counted by onPopState

        }
      }}
      aria-label={`Back to ${label}`}
      className={cn(
        "group -ml-2 inline-flex min-h-11 items-center gap-0.5 rounded-full pl-1 pr-3 text-[15px] font-semibold text-ink transition-colors duration-fast",
        "hover:bg-sunken active:bg-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink",
        // Android: a round 48px icon button, no text.
        "[[data-platform=android]_&]:size-12 [[data-platform=android]_&]:min-h-12 [[data-platform=android]_&]:justify-center [[data-platform=android]_&]:p-0",
        className,
      )}
    >
      <ChevronLeft
        className="size-6 shrink-0 transition-transform duration-fast group-hover:-translate-x-0.5 [[data-platform=android]_&]:hidden"
        strokeWidth={2.4}
        aria-hidden
      />
      <ArrowLeft className="hidden size-6 shrink-0 [[data-platform=android]_&]:block" strokeWidth={2.2} aria-hidden />
      <span className="truncate [[data-platform=android]_&]:sr-only">{label}</span>
    </Link>
  );
}

/** Which pages are sub-pages, and where Back goes when there's no history (shared link, new tab). */
const RULES: [RegExp, (m: RegExpMatchArray) => { href: string; label: string }][] = [
  [/^\/events\/([^/]+)\/photos$/, (m) => ({ href: `/events/${m[1]}`, label: "Event" })],
  [/^\/events\/[^/]+$/, () => ({ href: "/events", label: "Discover" })],
  [/^\/(category|city)\/[^/]+$/, () => ({ href: "/events", label: "Discover" })],
  [/^\/hosts\/[^/]+$/, () => ({ href: "/events", label: "Discover" })],
  [/^\/(vault|venues|profile|host|terms)$/, () => ({ href: "/dashboard", label: "Home" })],
  // The event editor (/organizer/events/new and /organizer/events/[id]) has Back in its own top bar.
  [/^\/organizer\/events\/([^/]+)\/published$/, (m) => ({ href: `/organizer/events/${m[1]}`, label: "Event" })],
  [/^\/organizer\/calendar$/, () => ({ href: "/organizer", label: "Your events" })],
];

/** The back button for the current page, if it's a sub-page. Placed by AppShell at the top-left. */
export function AutoBack({ pathname }: { pathname: string }) {
  for (const [re, to] of RULES) {
    const m = pathname.match(re);
    if (m) {
      const { href, label } = to(m);
      return (
        <div className="pt-3 md:pt-5">
          <BackButton href={href} label={label} />
        </div>
      );
    }
  }
  return null;
}
