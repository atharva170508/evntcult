/**
 * Seeds a realistic campus: venues, a verified organizer, a few events across
 * categories, codes, registrations with passes, payments and announcements.
 * Run: npm run db:seed
 */
import { PrismaClient } from "@prisma/client";
import { generateEventCode } from "../src/lib/event-code";
import { createPassToken, passSerial } from "../src/lib/pass";

const prisma = new PrismaClient();

const h = (hours: number) => new Date(Date.now() + hours * 3_600_000);

async function main() {
  console.log("Seeding EvntCult…");

  const venues = await Promise.all(
    [
      { name: "Main Auditorium", slug: "main-auditorium", building: "Admin Block", capacity: 800, latitude: 12.9716, longitude: 77.5946, directions: "From the main gate, walk straight past the fountain; auditorium is the domed building on your left.", amenities: ["stage", "projector", "AC", "wheelchair-access"] },
      { name: "Open Air Theatre", slug: "oat", building: "Central Lawns", capacity: 1500, indoor: false, latitude: 12.9721, longitude: 77.5952, directions: "Behind the library, follow the lit pathway down the steps.", amenities: ["stage", "sound"], bufferMinutes: 60 },
      { name: "Seminar Hall 2", slug: "seminar-hall-2", building: "CSE Block", floor: "2nd floor", capacity: 120, latitude: 12.9712, longitude: 77.5939, directions: "CSE Block, take the lift to 2F, second door on the right.", amenities: ["projector", "AC"] },
      { name: "Sports Complex", slug: "sports-complex", building: "Sports Complex", capacity: 400, latitude: 12.9705, longitude: 77.596, directions: "East end of campus, next to the hostel gate.", amenities: ["courts", "floodlights"], bufferMinutes: 15 },
    ].map((v) => prisma.venue.upsert({ where: { slug: v.slug }, update: {}, create: v })),
  );

  const dev = await prisma.user.upsert({
    where: { email: "dev@evntcult.app" },
    update: {},
    create: { email: "dev@evntcult.app", name: "EvntCult Dev", role: "ADMIN" },
  });

  const organizer = await prisma.user.upsert({
    where: { email: "aarav@college.edu" },
    update: {},
    create: {
      email: "aarav@college.edu",
      name: "Aarav Mehta",
      role: "ORGANIZER",
      phone: "+919800000001",
      whatsappOptIn: true,
      organizerProfile: {
        create: { clubName: "Robotics Club", designation: "Lead", status: "VERIFIED", verifiedAt: new Date(), verifiedById: dev.id },
      },
    },
  });

  const students = await Promise.all(
    ["Diya Sharma", "Kabir Rao", "Ananya Iyer", "Rohan Gupta", "Meera Nair", "Ishaan Verma"].map((name, i) =>
      prisma.user.upsert({
        where: { email: `${name.split(" ")[0].toLowerCase()}@college.edu` },
        update: {},
        create: {
          email: `${name.split(" ")[0].toLowerCase()}@college.edu`,
          name,
          phone: `+91980000010${i}`,
          whatsappOptIn: i % 2 === 0,
          department: ["CSE", "ECE", "MECH"][i % 3],
          graduationYear: 2027 + (i % 3),
        },
      }),
    ),
  );

  const events = [
    { slug: "robowars-2026", title: "RoboWars 2026", tagline: "Metal. Sparks. Glory.", category: "TECH", venue: venues[1], start: 50, dur: 5, capacity: 1200, fee: 0, visibility: "PUBLIC" },
    { slug: "neon-night", title: "Neon Night", tagline: "The fresher's party you'll actually remember.", category: "PARTY", venue: venues[0], start: 98, dur: 4, capacity: 700, fee: 29900, visibility: "CODE_ONLY" },
    { slug: "valorant-showdown", title: "Valorant Campus Showdown", tagline: "5v5. One trophy.", category: "GAMING", venue: venues[2], start: 26, dur: 6, capacity: 100, fee: 10000, visibility: "PUBLIC" },
    { slug: "3v3-hoops", title: "3v3 Hoops Night", tagline: "Floodlights on.", category: "SPORTS", venue: venues[3], start: 3, dur: 3, capacity: 200, fee: 0, visibility: "PUBLIC" },
  ] as const;

  for (const e of events) {
    const event = await prisma.event.upsert({
      where: { slug: e.slug },
      update: {},
      create: {
        slug: e.slug,
        title: e.title,
        tagline: e.tagline,
        description: `${e.title} — organised by the Robotics Club. ${e.tagline}`,
        category: e.category,
        status: "PUBLISHED",
        visibility: e.visibility,
        startsAt: h(e.start),
        endsAt: h(e.start + e.dur),
        venueId: e.venue.id,
        capacity: e.capacity,
        feeAmountPaise: e.fee,
        upiVpa: e.fee ? "roboticsclub@okaxis" : null,
        upiPayeeName: e.fee ? "Robotics Club" : null,
        hostId: organizer.id,
        allowFaceSearch: true,
        codes: e.visibility === "CODE_ONLY" ? { create: [{ code: generateEventCode(), label: "All years" }] } : undefined,
        schedule: {
          create: [
            { title: "Doors open", startsAt: h(e.start), sortOrder: 0 },
            { title: "Main event", startsAt: h(e.start + 1), sortOrder: 1 },
          ],
        },
        announcements: {
          create: [{ authorId: organizer.id, kind: "INFO", title: "Welcome!", body: "Bring your college ID — passes are scanned at the gate." }],
        },
      },
    });

    let seq = 1;
    for (const s of students) {
      const reg = await prisma.registration.upsert({
        where: { eventId_userId: { eventId: event.id, userId: s.id } },
        update: {},
        create: { eventId: event.id, userId: s.id },
      });
      await prisma.pass.upsert({
        where: { registrationId: reg.id },
        update: {},
        create: {
          registrationId: reg.id,
          serial: passSerial(e.slug, seq++),
          token: createPassToken({ registrationId: reg.id, eventId: event.id }),
        },
      });
      if (e.fee > 0) {
        await prisma.payment.upsert({
          where: { registrationId: reg.id },
          update: {},
          create: { registrationId: reg.id, amountPaise: e.fee, status: seq % 3 === 0 ? "PENDING" : "PAID", method: "UPI_QR" },
        });
      }
    }
  }

  console.log("Done. Organizer: aarav@college.edu · Admin: dev@evntcult.app");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
