import { describe, expect, it } from "vitest";
import {
  KINDS,
  cleanConfig,
  headlinePills,
  kindFor,
  parseConfig,
  teamRule,
} from "@/lib/categories";

describe("categories", () => {
  it("maps every category to a kind", () => {
    for (const c of [
      "GAMING",
      "SPORTS",
      "TECH",
      "CULTURAL",
      "WORKSHOP",
      "TALK",
      "PARTY",
    ])
      expect(kindFor(c)).not.toBeNull();
    expect(kindFor(null)).toBeNull();
    expect(kindFor("NOPE")).toBeNull();
  });

  it("keeps only fields the kind defines, clamped", () => {
    const c = cleanConfig(KINDS.hackathon, {
      teamSize: [0, 99],
      tracks: ["AI", "AI", " Web3 ", ""],
      overnight: true,
      hacker: "x",
      prizes: "  ₹1L  ",
    });
    expect(c).toEqual({
      teamSize: [1, 6],
      tracks: ["AI", "Web3"],
      overnight: true,
      prizes: "₹1L",
    });
    expect(cleanConfig(KINDS.party, { age: "16" })).toEqual({});
    expect(cleanConfig(KINDS.party, { age: "21" })).toEqual({ age: "21" });
  });

  it("swaps a reversed range", () => {
    expect(
      cleanConfig(KINDS.tournament, { squadSize: [8, 5] }).squadSize,
    ).toEqual([8, 8]);
  });

  it("builds readable pills", () => {
    expect(
      headlinePills(KINDS.hackathon, { teamSize: [2, 4], overnight: true }),
    ).toEqual(["Teams of 2 to 4", "Overnight"]);
    expect(
      headlinePills(KINDS.tournament, {
        format: ["6v6 Turf"],
        squadSize: [6, 6],
        entry: "team",
      }),
    ).toEqual(["6v6 Turf", "Squads of 6 players", "Entry per team"]);
    expect(
      headlinePills(KINDS.party, { age: "18", dress: "All black" }),
    ).toEqual(["18+ only", "Dress code: All black"]);
    expect(
      headlinePills(KINDS.workshop, { level: "beginner", laptop: true }),
    ).toEqual(["Beginner", "Bring a laptop"]);
  });

  it("reads team rules and survives bad JSON", () => {
    expect(teamRule(KINDS.hackathon, { teamSize: [2, 4] })).toEqual([2, 4]);
    expect(teamRule(KINDS.party, {})).toBeNull();
    expect(parseConfig("{oops")).toEqual({});
    expect(parseConfig("[1]")).toEqual({});
  });
});

import { applyPromo, cleanPromos, cleanTiers, normalizeCode, promoLabel } from "@/lib/tickets";

describe("tickets", () => {
  it("cleans ticket types", () => {
    expect(cleanTiers([{ name: " Stag ", pricePaise: 49900 }, { name: "stag", pricePaise: 1 }, { name: "", pricePaise: 5 }, { name: "VIP", pricePaise: -1 }])).toEqual([{ id: "stag", name: "Stag", pricePaise: 49900 }]);
  });
  it("cleans promo codes", () => {
    expect(cleanPromos([{ code: "club-20", percentOff: 120 }, { code: "CLUB20", percentOff: 5 }, { code: "x", percentOff: 5 }, { code: "FLAT", amountOffPaise: 10000, maxUses: 0 }])).toEqual([
      { code: "CLUB20", percentOff: 100, maxUses: null },
      { code: "FLAT", amountOffPaise: 10000, maxUses: 1 },
    ]);
    expect(normalizeCode(" early bird ")).toBe("EARLYBIRD");
  });
  it("applies discounts without going below zero", () => {
    expect(applyPromo(49900, { code: "A", percentOff: 20 })).toBe(39900);
    expect(applyPromo(5000, { code: "B", amountOffPaise: 10000 })).toBe(0);
    expect(applyPromo(5000, null)).toBe(5000);
    expect(promoLabel({ code: "B", amountOffPaise: 10000 })).toBe("₹100 off");
  });
});
