/**
 * Campus venues. The schema stores the venue as text; this list gives the event builder
 * a picker and the clash checker each venue's setup/teardown buffer.
 */
export interface VenueInfo {
  name: string;
  capacity: number;
  bufferMinutes: number;
  /**
   * Where it is, for the Venues page and the Directions button. Paste a Google Maps
   * place link (Share → Copy link) or "lat,lng". Until this is filled in, the venue
   * shows "Map location not added yet" instead of a Directions button.
   */
  map?: string;
  /** Short hint shown under the name, e.g. "Block B, 2nd floor". */
  where?: string;
}

export const VENUES: VenueInfo[] = [
  { name: "Seminar Hall 2", capacity: 120, bufferMinutes: 30 },
  { name: "Main Auditorium", capacity: 700, bufferMinutes: 30 },
  { name: "Open Air Theatre", capacity: 1500, bufferMinutes: 60 },
  { name: "Sports Complex", capacity: 250, bufferMinutes: 15 },
  { name: "Computer Lab 4", capacity: 64, bufferMinutes: 15 },
  { name: "Central Library", capacity: 80, bufferMinutes: 15 },
];

/** Google Maps link for a venue, or null if its location hasn't been added yet. */
export function directionsUrl(v: Pick<VenueInfo, "map"> | undefined): string | null {
  const m = v?.map?.trim();
  if (!m) return null;
  if (/^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|(www\.)?google\.[a-z.]+\/maps)\//.test(m)) return m;
  const ll = m.match(/^(-?\d{1,2}(?:\.\d+)?),\s*(-?\d{1,3}(?:\.\d+)?)$/);
  return ll ? `https://www.google.com/maps/dir/?api=1&destination=${ll[1]},${ll[2]}` : null;
}

export const venueInfo = (name: string) => VENUES.find((v) => v.name === name);

export const bufferFor = (venue: string) => VENUES.find((v) => v.name === venue)?.bufferMinutes ?? 30;
