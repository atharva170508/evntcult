/**
 * Build a one-event iCalendar (.ics) file (RFC 5545) that Apple Calendar,
 * Google Calendar and Outlook can all import. Times are written in UTC.
 */

export interface IcsEvent {
  uid: string;
  title: string;
  startsAt: string; // UTC ISO
  endsAt: string; // UTC ISO
  location?: string | null;
  description?: string | null;
  url?: string | null;
  now?: Date;
  method?: "PUBLISH" | "REQUEST" | "CANCEL";
  sequence?: number;
  status?: "CONFIRMED" | "CANCELLED";
  organizerName?: string | null;
  organizerEmail?: string | null;
  attendeeName?: string | null;
  attendeeEmail?: string | null;
}

/** 2026-11-20T04:30:00.000Z → 20261120T043000Z */
export const icsDate = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

/** Escape text values: backslash, semicolon, comma and newlines. */
export const icsEscape = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** Lines longer than 75 bytes are folded: CRLF + one space. Never splits a multi-byte character. */
export function foldLine(line: string): string {
  const enc = new TextEncoder();
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of line) {
    const n = enc.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + n > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += n;
  }
  out.push(current);
  return out.join("\r\n ");
}

export function buildIcs(e: IcsEvent): string {
  const method = e.method ?? "PUBLISH";
  const alarms =
    method === "CANCEL"
      ? []
      : [
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          "DESCRIPTION:Event tomorrow",
          "TRIGGER:-P1D",
          "END:VALARM",
          "BEGIN:VALARM",
          "ACTION:DISPLAY",
          "DESCRIPTION:Starts in 1 hour",
          "TRIGGER:-PT1H",
          "END:VALARM",
        ];
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EvntCult//Events//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${icsDate((e.now ?? new Date()).toISOString())}`,
    `DTSTART:${icsDate(e.startsAt)}`,
    `DTEND:${icsDate(e.endsAt)}`,
    ...(e.sequence != null ? [`SEQUENCE:${e.sequence}`] : []),
    ...(e.status ? [`STATUS:${e.status}`] : []),
    `SUMMARY:${icsEscape(e.title)}`,
    ...(e.location ? [`LOCATION:${icsEscape(e.location)}`] : []),
    ...(e.description ? [`DESCRIPTION:${icsEscape(e.description)}`] : []),
    ...(e.url ? [`URL:${e.url}`] : []),
    ...(e.organizerEmail
      ? [`ORGANIZER;CN=${icsEscape(e.organizerName || "EvntCult")}:mailto:${e.organizerEmail}`]
      : []),
    ...(e.attendeeEmail
      ? [
          `ATTENDEE;CN=${icsEscape(e.attendeeName || "Guest")};PARTSTAT=ACCEPTED:mailto:${e.attendeeEmail}`,
        ]
      : []),
    ...alarms,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** Encode a UTF-8 string (such as an .ics file) to base64 for email attachments. */
export function toBase64Utf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/** A subscribable calendar with many events (no alarms: calendar apps refetch it every few hours). */
export function buildCalendar(name: string, events: IcsEvent[], now = new Date()): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//EvntCult//Events calendar//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${icsEscape(name)}`,
    "X-WR-TIMEZONE:Asia/Kolkata",
    "REFRESH-INTERVAL;VALUE=DURATION:PT4H",
    "X-PUBLISHED-TTL:PT4H",
  ];
  for (const e of events) {
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${icsDate(now.toISOString())}`,
      `DTSTART:${icsDate(e.startsAt)}`,
      `DTEND:${icsDate(e.endsAt)}`,
      `SUMMARY:${icsEscape(e.title)}`,
      ...(e.location ? [`LOCATION:${icsEscape(e.location)}`] : []),
      ...(e.description ? [`DESCRIPTION:${icsEscape(e.description)}`] : []),
      ...(e.url ? [`URL:${e.url}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

/** A safe download file name from an event title. */
export const icsFileName = (title: string) => `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "event"}.ics`;
