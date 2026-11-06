/**
 * Campus venues. The schema stores the venue as text; this list gives the event builder
 * a picker and the clash checker each venue's setup/teardown buffer.
 */
export interface VenueInfo {
  name: string;
  capacity: number;
  bufferMinutes: number;
}

export const VENUES: VenueInfo[] = [
  { name: "Seminar Hall 2", capacity: 120, bufferMinutes: 30 },
  { name: "Main Auditorium", capacity: 700, bufferMinutes: 30 },
  { name: "Open Air Theatre", capacity: 1500, bufferMinutes: 60 },
  { name: "Sports Complex", capacity: 250, bufferMinutes: 15 },
  { name: "Computer Lab 4", capacity: 64, bufferMinutes: 15 },
  { name: "Central Library", capacity: 80, bufferMinutes: 15 },
];

export const bufferFor = (venue: string) => VENUES.find((v) => v.name === venue)?.bufferMinutes ?? 30;
