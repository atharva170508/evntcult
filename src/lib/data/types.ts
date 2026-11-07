import type { Clash } from "@/lib/clash";

export const CATEGORIES = ["GAMING", "SPORTS", "TECH", "CULTURAL", "WORKSHOP", "TALK", "PARTY"] as const;
export type EventCategory = (typeof CATEGORIES)[number];
export type EventStatus = "draft" | "published" | "closed" | "cancelled";
export type EventAccess = "public" | "code";
/** UI-facing visibility (kept from the original components). */
export type EventVisibility = "PUBLIC" | "CODE_ONLY";
export type AnnouncementKind = "SCHEDULE_CHANGE" | "VENUE_CHANGE" | "INFO";

/** Raw `events` row. */
export interface EventRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: EventCategory;
  venue: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  price_paise: number;
  status: EventStatus;
  access: EventAccess;
  access_code: string | null;
  organizer_id: string;
  banner_key: string | null;
  created_at: string;
  /** Added by migration 0008 (Host an Event). */
  event_type: "in_person" | "virtual";
  meeting_url: string | null;
  tagline: string | null;
  organizer_upi_id: string | null;
  drive_folder_url: string | null;
  banner_url: string | null;
}

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  category: EventCategory;
  visibility: EventVisibility;
  status: EventStatus;
  startsAt: Date;
  endsAt: Date;
  venueName: string | null;
  capacity: number | null;
  registered: number;
  feePaise: number;
  accent: string; // gradient key, see components/ui/EventArt
}

export interface NextUp extends EventSummary {
  registrationId: string;
  passSerial: string;
  /** QR payload: evntcult://p/<pass_token> */
  passToken: string;
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID";
  directions?: string | null;
}

export interface AnnouncementItem {
  id: string;
  eventTitle: string;
  kind: AnnouncementKind;
  title: string;
  body: string;
  createdAt: Date;
}

export interface HostedEvent {
  id: string;
  title: string;
  startsAt: Date;
  status: string;
  capacity: number | null;
  registered: number;
  checkedIn: number;
  paid: number;
  pendingPayments: number;
  feePaise: number;
}

export interface OrganizerPanel {
  live: { id: string; title: string; capacity: number; registered: number; checkedIn: number } | null;
  hosted: HostedEvent[];
  clashes: (Clash & { forEvent: string })[];
}

export interface DashboardData {
  stats: { registered: number; thisWeek: number; attended: number; photosOfYou: number };
  /** Up to 6 photo ids I've tagged myself in, newest first (thumbnails for the Vault card). */
  vaultPreview: string[];
  nextUp: NextUp | null;
  upcoming: EventSummary[];
  campus: EventSummary[];
  announcements: AnnouncementItem[];
  /** ISO date (yyyy-mm-dd, IST) → number of events that day, this month */
  calendar: Record<string, { campus: number; mine: number }>;
  organizer: OrganizerPanel | null;
}
