export interface CityHub {
  slug: string;
  name: string;
  region: string;
  blurb: string;
  accent: string;
  matchTerms: string[];
}

export const CITIES: CityHub[] = [
  {
    slug: "campus",
    name: "Campus Central",
    region: "All campuses",
    blurb: "Every open campus hackathon, concert, cultural night, and club meetup happening right now.",
    accent: "violet",
    matchTerms: [],
  },
  {
    slug: "mumbai",
    name: "Mumbai",
    region: "Maharashtra",
    blurb: "College fests, late-night hackathons, design meetups, and seaside sessions across Mumbai.",
    accent: "orange",
    matchTerms: ["mumbai", "bandra", "andheri", "powai", "dadar", "juhu", "thane", "navi mumbai"],
  },
  {
    slug: "pune",
    name: "Pune",
    region: "Maharashtra",
    blurb: "Student-run tech talks, indie gigs, robotics clashes, and weekend workshops across Pune.",
    accent: "teal",
    matchTerms: ["pune", "kothrud", "baner", "hinjewadi", "viman", "shivajinagar", "wakad"],
  },
  {
    slug: "bengaluru",
    name: "Bengaluru",
    region: "Karnataka",
    blurb: "Demo days, AI build nights, founder panels, and campus socials across Bengaluru.",
    accent: "blue",
    matchTerms: ["bengaluru", "bangalore", "indiranagar", "koramangala", "hsr", "whitefield"],
  },
  {
    slug: "delhi",
    name: "Delhi NCR",
    region: "North India",
    blurb: "Cultural fests, debate circuits, design jams, and concerts across Delhi, Noida, and Gurugram.",
    accent: "pink",
    matchTerms: ["delhi", "noida", "gurgaon", "gurugram", "ncr", "hauz khas"],
  },
];

export interface CategoryHub {
  slug: string;
  code: string;
  name: string;
  blurb: string;
  accent: string;
}

export const CATEGORY_HUBS: CategoryHub[] = [
  {
    slug: "tech",
    code: "TECH",
    name: "Tech & Hackathons",
    blurb: "Overnight builds, AI jams, demo days, and engineering deep-dives.",
    accent: "blue",
  },
  {
    slug: "cultural",
    code: "CULTURAL",
    name: "Cultural & Music",
    blurb: "Live sets, Garba nights, open mics, drama showcases, and campus fests.",
    accent: "pink",
  },
  {
    slug: "workshop",
    code: "WORKSHOP",
    name: "Workshops",
    blurb: "Hands-on labs in design, hardware, photography, and code.",
    accent: "green",
  },
  {
    slug: "sports",
    code: "SPORTS",
    name: "Sports & Tournaments",
    blurb: "Box cricket, futsal, badminton brackets, and night runs under floodlights.",
    accent: "orange",
  },
  {
    slug: "party",
    code: "PARTY",
    name: "Parties & Socials",
    blurb: "After-hours sets, freshers nights, mixers, and lawn sessions.",
    accent: "violet",
  },
  {
    slug: "talk",
    code: "TALK",
    name: "Talks & Panels",
    blurb: "Fireside chats, founder Q&As, and guest lectures worth showing up for.",
    accent: "red",
  },
  {
    slug: "gaming",
    code: "GAMING",
    name: "Gaming & Esports",
    blurb: "LAN brackets, Valorant & FIFA nights, and tabletop socials.",
    accent: "teal",
  },
];

export function findCity(slug: string): CityHub | null {
  return CITIES.find((c) => c.slug === slug.toLowerCase()) ?? null;
}

export function findCategoryHub(slug: string): CategoryHub | null {
  const s = slug.toLowerCase();
  return CATEGORY_HUBS.find((c) => c.slug === s || c.code.toLowerCase() === s) ?? null;
}

export async function getTopicStats(
  db: D1Database,
  kind: "city" | "category",
  slug: string,
  viewerId: string | null,
): Promise<{ count: number; subscribed: boolean }> {
  const countRow = await db
    .prepare("SELECT COUNT(*) AS n FROM topic_subscriptions WHERE topic_kind = ? AND topic_slug = ?")
    .bind(kind, slug)
    .first<{ n: number }>();
  let subscribed = false;
  if (viewerId) {
    const mine = await db
      .prepare("SELECT 1 AS ok FROM topic_subscriptions WHERE user_id = ? AND topic_kind = ? AND topic_slug = ?")
      .bind(viewerId, kind, slug)
      .first<{ ok: number }>();
    subscribed = Boolean(mine?.ok);
  }
  return { count: Number(countRow?.n ?? 0), subscribed };
}

export async function getCategoryEventCounts(db: D1Database): Promise<Record<string, number>> {
  const rows = await db
    .prepare("SELECT category, COUNT(*) AS n FROM events WHERE status = 'published' AND access = 'public' AND ends_at > ? GROUP BY category")
    .bind(new Date().toISOString())
    .all<{ category: string | null; n: number }>();
  const out: Record<string, number> = {};
  for (const r of rows.results ?? []) {
    if (r.category) out[r.category] = Number(r.n ?? 0);
  }
  return out;
}
