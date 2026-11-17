/** Human names for event kinds, in the order people browse them. */
export const CATEGORY_NAMES: Record<string, string> = {
  TECH: "Tech",
  CULTURAL: "Cultural",
  SPORTS: "Sports",
  GAMING: "Gaming",
  WORKSHOP: "Workshops",
  TALK: "Talks",
  PARTY: "Parties",
};

export const categoryName = (c: string | null | undefined) => (c && CATEGORY_NAMES[c]) || "Event";
