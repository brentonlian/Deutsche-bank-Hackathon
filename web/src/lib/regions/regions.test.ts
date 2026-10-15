import { describe, expect, it } from "vitest";
import { REGIONS, REGION_IDS } from ".";

describe("region packs", () => {
  it.each(REGION_IDS)("%s has unique scam ids and both scam and legit cards", (id) => {
    const { scams } = REGIONS[id];
    expect(new Set(scams.map((s) => s.id)).size).toBe(scams.length);
    expect(scams.some((s) => s.isScam)).toBe(true);
    expect(scams.some((s) => !s.isScam)).toBe(true);
  });

  it.each(REGION_IDS)("%s formats money in its own locale", (id) => {
    const r = REGIONS[id];
    const formatted = new Intl.NumberFormat(r.locale, { style: "currency", currency: r.currency }).format(123456);
    expect(formatted).toMatch(/\d/);
  });

  it.each(REGION_IDS)("%s links every product and borrowing rate to an official source", (id) => {
    const p = REGIONS[id].products;
    const vehicles = [p.cashAtHome, p.everydayAccount, p.savingsAccount, p.indexFund, p.retirementProduct];
    for (const v of vehicles) {
      expect(v.source, v.id).toMatch(/^https:\/\//);
      expect(v.verified, v.id).toMatch(/^\d{4}-\d{2}$/);
    }
    expect(p.expensiveCreditSource).toMatch(/^https:\/\//);
    expect(p.informalLenderSource).toMatch(/^https:\/\//);
  });

  it("uses Indian digit grouping for India", () => {
    const r = REGIONS.IN;
    expect(new Intl.NumberFormat(r.locale).format(123456)).toBe("1,23,456");
  });
});
