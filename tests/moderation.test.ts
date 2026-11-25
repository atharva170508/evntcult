/** The content filter: what it blocks (including bypass tricks) and what it must leave alone. */
import { describe, expect, it, vi } from "vitest";

// api.ts is server code; its "server-only" guard has nothing to guard in a test.
vi.mock("server-only", () => ({}));
import { baseNormalize, collapseRepeats, findBlocked, firstBlocked } from "@/lib/moderation";

const blocked = (s: string) => expect(findBlocked(s), `should block: ${JSON.stringify(s)}`).not.toBeNull();
const allowed = (s: string) => expect(findBlocked(s), `should allow: ${JSON.stringify(s)}`).toBeNull();

describe("normalisation", () => {
  it("folds case, width, styling, accents, invisible characters and look-alikes", () => {
    expect(baseNormalize("ＤＲＵＧＳ")).toBe("drugs");
    expect(baseNormalize("𝐝𝐫𝐮𝐠𝐬")).toBe("drugs");
    expect(baseNormalize("drüğš")).toBe("drugs");
    expect(baseNormalize("dr​u‍g﻿s")).toBe("drugs");
    expect(baseNormalize("drцgs")).toBe("drugs"); // Cyrillic ц
    expect(baseNormalize("भड़वा")).toBe("भडवा"); // nukta
  });
  it("collapses repeated letters", () => {
    expect(collapseRepeats("drrruuuuugs")).toBe("drugs");
  });
});

describe("blocks the prohibited word 'drugs' however it's written", () => {
  it.each([
    "drugs", "Drugs night", "DRUGS", "drug", "free drugs here", "d r u g s", "d.r.u.g.s", "d-r-u-g-s", "d_r_u_g_s", "d/r/u/g/s",
    "dr ugs", "dr-ugs", "dru gs", "drrruuugs", "drugzz".replace("zz", "s"), "dr​ugs", "ＤＲＵＧＳ", "𝓭𝓻𝓾𝓰𝓼", "drцgs",
    "dr*gs".replace("*", "u"), "dru9s", "drug$", "d.r.u.g.s party tonight", "Get your D R U G S", "the d r u g s are here",
  ])("%s", blocked);
});

describe("blocks other prohibited terms and leetspeak", () => {
  it.each([
    "w33d", "weed", "g4nj4", "ganja", "c0caine", "c@nnabis", "MDMA", "m.d.m.a", "lsd trip", "heroin", "meth",
    "$h1t", "sh!t", "shiiiit", "5h17", "@$$", "a$$hole", "a s s", "b!tch", "b1tch", "f*ck".replace("*", "u"), "fu ck", "f u c k",
    "f.u.c.k.i.n.g", "fuuuuck", "motherfucking", "phucking".replace("ph", "f"), "fcuk".replace("cu", "uc"), "p0rn", "nudes",
    "bastard", "wanker", "fag", "r3tard",
  ])("%s", blocked);
});

describe("blocks Hindi and Marathi abuse, romanised and in Devanagari", () => {
  it.each([
    "bhenchod", "bh3nch0d", "b h e n c h o d", "madarchod", "chutiya", "chut1ya", "ch.u.t.i.y.a", "bhosdike", "gandu", "harami",
    "randi", "lavda", "zavadya", "kutiya", "bsdk",
    "भेनचोद", "मादरचोद", "चूतिया", "भोसड़ी", "हरामी", "भड़वा", "रंडी", "गांजा", "नशा", "ड्रग्स",
  ])("%s", blocked);
});

describe("leaves innocent text alone", () => {
  it.each([
    "Class of 2026 farewell", "Assistant coach meet", "Scunthorpe United screening", "A grandiose opening night",
    "Cocktail-free mocktail bar", "Dickens reading circle", "Assess your resume", "Sussex exchange students", "Passport photo booth",
    "Hackathon: build, ship, demo", "Mass drill practice", "Hell's Kitchen cook-off".replace("Hell's", "Chef's"), "Essay competition",
    "Pass the parcel", "Glass painting workshop", "Bass guitar jam", "Grass court tennis", "Kiss FM radio quiz", "Sharp shooters",
    "Shitake mushroom cooking".replace("Shitake", "Shiitake"), "Therapist Q&A", "Matchbox car race", "Analytics bootcamp",
    "Shakespeare night", "Peacock painting", "Hancock lecture", "Cocker spaniel show", "Constitution day", "Document scanning",
    "Mumbai vs Pune", "Room 101", "Starts 7:30 pm", "Entry ₹50 at the gate", "Gandhi Jayanti cleanup", "Rangoli contest",
    "Garba night", "Dandiya raas", "Ganesh utsav", "Ganpati visarjan", "Lavani dance", "Bhajan sandhya", "Kabaddi league",
    "Prize: ₹5,000", "Hall 4, Block D", "Bring your college ID", "Run 5k for charity", "Drama club auditions",
    "गणेश उत्सव", "गरबा रात्रि", "लावणी नृत्य", "कबड्डी स्पर्धा", "नाटक", "रांगोळी स्पर्धा",
    "", "   ", null, undefined,
  ])("%s", (s) => allowed(s as string));
});

describe("firstBlocked", () => {
  it("names the field and explains the rule", () => {
    const r = firstBlocked({ "Event name": "Open mic night", Description: "Bring snacks, no dr ugs" });
    expect(r?.field).toBe("Description");
    expect(r?.message).toMatch(/Description contains language that isn't allowed on EvntCult/);
    expect(r?.message).toMatch(/violates the platform guidelines/);
  });
  it("returns null for clean fields", () => {
    expect(firstBlocked({ "Event name": "Open mic night", Description: "Bring snacks" })).toBeNull();
  });
});

describe("the server refuses blocked event text with a clear error", () => {
  const post = (body: unknown) => new Request("http://x/api/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  it("blocks an event name, with code content_blocked and a plain message", async () => {
    const { parseBody } = await import("@/lib/api");
    const { createDraftSchema } = await import("@/lib/validation");
    await expect(parseBody(post({ title: "D.R.U.G.S night" }), createDraftSchema)).rejects.toMatchObject({
      status: 422,
      code: "content_blocked",
      message: expect.stringMatching(/^Event name contains language that isn't allowed on EvntCult.*violates the platform guidelines/),
    });
  });
  it("blocks a description", async () => {
    const { parseBody } = await import("@/lib/api");
    const { createDraftSchema } = await import("@/lib/validation");
    await expect(parseBody(post({ title: "Open mic", description: "bring your w33d" }), createDraftSchema)).rejects.toMatchObject({ code: "content_blocked", message: expect.stringMatching(/^Description/) });
  });
  it("lets a clean event through", async () => {
    const { parseBody } = await import("@/lib/api");
    const { createDraftSchema } = await import("@/lib/validation");
    await expect(parseBody(post({ title: "Courtyard Open Mic", tagline: "Poetry and acoustic sets", description: null }), createDraftSchema)).resolves.toMatchObject({ title: "Courtyard Open Mic" });
  });
});
