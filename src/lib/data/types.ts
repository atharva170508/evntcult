import type { EventCategory, EventVisibility, AnnouncementKind } from "@prisma/client";
import type { Clash } from "@/lib/clash";

export interface EventSummary {
  id: string;
  slug: string;
  title: string;
  tagline?: string | null;
  category: EventCategory;
  visibility: EventVisibility;
  startsAt: Date;
  endsAt: Date;
  venueName: string | null;
  capacity: number | null;
  registered: number;
  feePaise: number;
  accent: string; // gradient key, see components/ui/EventArt
}

export interface NextUp extends EventSummary {
  passSerial: string;
  passToken: string;
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "WAIVED";
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

export interface CertificateItem {
  id: string;
  eventTitle: string;
  serial: string;
  issuedAt: Date;
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
  remindersQueued: number;
  whatsappReach: number; // registered attendees who opted in
}

export interface DashboardData {
  stats: { registered: number; thisWeek: number; certificates: number; photosOfYou: number };
  nextUp: NextUp | null;
  upcoming: EventSummary[];
  campus: EventSummary[];
  announcements: AnnouncementItem[];
  certificates: CertificateItem[];
  /** ISO date (yyyy-mm-dd, IST) → number of events that day, this month */
  calendar: Record<string, { campus: number; mine: number }>;
  organizer: OrganizerPanel | null;
}
