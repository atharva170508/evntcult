/** Google Maps links for venues, and saving the optional place details. */
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { testDatabase } from "./helpers/d1";
import { createDraft, duplicateEvent, saveEvent } from "@/lib/data/organizer-events";
import { directionsUrl, mapsUrl } from "@/lib/organizer/shared";
import { saveEventSchema } from "@/lib/validation";

let db: D1Database;
let dispose: () => Promise<void>;
const now = new Date("2026-11-20T06:30:00.000Z");
const org = { id: "org", role: "organizer" as const };
const row = (id: string) => db.prepare("SELECT venue, venue_place_id, venue_lat, venue_lng, venue_address FROM events WHERE id = ?").bind(id).first<Record<string, unknown>>();
const place = { venuePlaceId: "ChIJabc-1_x", venueLat: 13.08, venueLng: 80.27, venueAddress: "Tamara, Anna Nagar" };

beforeAll(async () => {
  ({ db, dispose } = await testDatabase());
  await db.prepare("INSERT INTO users (id, email, name, role, created_at) VALUES ('org', 'o@college.edu', 'O', 'organizer', ?)").bind(now.toISOString()).run();
}, 60_000);
afterAll(() => dispose());

describe("maps links", () => {
  it("a matched place opens exactly that place", () => {
    expect(directionsUrl({ venue: "Tamara", venue_place_id: "ChIJabc", venue_lat: 13.08, venue_lng: 80.27 })).toBe("https://www.google.com/maps/dir/?api=1&destination=13.08,80.27&destination_place_id=ChIJabc");
    expect(mapsUrl({ venue: "Tamara", venue_place_id: "ChIJabc" })).toBe("https://www.google.com/maps/search/?api=1&query=Tamara&query_place_id=ChIJabc");
  });

  it("plain text becomes a Maps search, with special characters made safe", () => {
    expect(directionsUrl({ venue: "Back gate lawn, Koramangala" })).toBe("https://www.google.com/maps/search/?api=1&query=Back%20gate%20lawn%2C%20Koramangala");
    expect(directionsUrl({ venue: "A&B #1" })).toBe("https://www.google.com/maps/search/?api=1&query=A%26B%20%231");
  });

  it("broken on purpose: a place id with no coordinates still works, and latitude 0 counts as real", () => {
    expect(directionsUrl({ venue: "Hall", venue_place_id: "abc", venue_lat: null, venue_lng: null })).toBe("https://www.google.com/maps/dir/?api=1&destination=Hall&destination_place_id=abc");
    expect(mapsUrl({ venue: "Equator", venue_lat: 0, venue_lng: 10 })).toBe("https://www.google.com/maps/search/?api=1&query=0,10");
  });

  it("the server refuses bad map details", () => {
    expect(saveEventSchema.safeParse({ version: 1, venuePlaceId: "a&b=c" }).success).toBe(false);
    expect(saveEventSchema.safeParse({ version: 1, venueLat: 91 }).success).toBe(false);
    expect(saveEventSchema.safeParse({ version: 1, venueLng: -181 }).success).toBe(false);
  });
});

describe("saving place details", () => {
  it("stays null for a typed venue, saves a match, and clears when the organizer retypes", async () => {
    const d = await createDraft(db, org, { title: "One", date: "2026-12-20", venue: "Back gate lawn" }, now);
    expect(await row(d.id)).toMatchObject({ venue: "Back gate lawn", venue_place_id: null, venue_lat: null });
    const a = await saveEvent(db, org, d.id, 1, { venue: "Tamara", ...place }, now);
    expect(await row(d.id)).toMatchObject({ venue: "Tamara", venue_place_id: place.venuePlaceId, venue_lat: 13.08, venue_lng: 80.27, venue_address: place.venueAddress });
    await saveEvent(db, org, d.id, a.version, { venue: "Somewhere else", venuePlaceId: null, venueLat: null, venueLng: null, venueAddress: null }, now);
    expect(await row(d.id)).toMatchObject({ venue: "Somewhere else", venue_place_id: null, venue_lat: null, venue_lng: null, venue_address: null });
  });

  it("is kept on create and when duplicated", async () => {
    const d = await createDraft(db, org, { title: "Two", date: "2026-12-21", venue: "Tamara", ...place }, now);
    const copy = await duplicateEvent(db, org, d.id, now);
    expect(await row(copy.id)).toMatchObject({ venue_place_id: place.venuePlaceId, venue_lat: 13.08 });
  });
});
