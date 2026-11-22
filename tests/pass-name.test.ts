import { describe, expect, it } from "vitest";
import { passName, seqFromPassName } from "@/lib/pass-name";

describe("pass names", () => {
  it("names a pass and keeps its number", () => {
    const p = passName("EC-ROBO-0813");
    expect(p.no).toBe("0813");
    expect(p.name).toMatch(/^[A-Z][a-z]+ [A-Z][a-z]+$/);
    expect(p.label).toBe(`${p.name}, No. 0813`);
  });
  it("gives every number below 4096 its own name", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 4096; i++) seen.add(passName(`EC-X-${i}`).name);
    expect(seen.size).toBe(4096);
  });
  it("neighbouring passes don't share words", () => {
    const a = passName("EC-X-0001").name.split(" ");
    const b = passName("EC-X-0002").name.split(" ");
    expect(a[0]).not.toBe(b[0]);
  });
  it("reads a name back to its number", () => {
    for (const n of [1, 42, 813, 4095, 4096, 9000]) expect(seqFromPassName(passName(`EC-X-${n}`).name)).toBe(n);
    expect(seqFromPassName("hello there")).toBeNull();
  });
});
