import { describe, expect, it } from "vitest";
import { hasKey } from "@/lib/i18n";
import { REGIONS, REGION_IDS } from "@/lib/regions";
import { createContext, simulate } from "./engine";
import { buildLog, lifeYears } from "./lifeLog";

const f = { money: (v: number) => v.toFixed(0), percent: (v: number) => `${v.toFixed(1)}%` };

describe("life log", () => {
  it.each(REGION_IDS)("%s shows only the years already lived, each with a translated line", (id) => {
    const ctx = createContext(REGIONS[id], "young", 24, 2000, 11);
    const r = simulate(ctx, ["spend", "cash", "credit"]);
    const last = r.timeline.at(-1)!;
    const lastAges = (log: ReturnType<typeof buildLog>) => log.filter((i) => i.kind === "line").map((i) => i.age);

    const none = buildLog(r, ctx, 0, f);
    const all = buildLog(r, ctx, lifeYears(last.ledger.yearly).length, f);
    // Before Age +1 the latest period has no year lines yet and no money story link.
    expect(Math.max(...lastAges(none))).toBeLessThanOrEqual(Math.floor(last.age));
    expect(none.filter((i) => i.kind === "story")).toHaveLength(2);
    expect(all.filter((i) => i.kind === "story")).toHaveLength(3);
    expect(Math.max(...lastAges(all))).toBe(Math.floor(last.after.age + 1e-6));

    for (const item of all) if (item.kind === "line") expect(hasKey(`life.log.${item.line.key}`), item.line.key).toBe(true);
  });

  it("folds the part-year at the end of a period into whole steps that still add up", () => {
    const ctx = createContext(REGIONS.DE, "young", 24, 2000, 3);
    const snap = simulate(ctx, ["balanced"]).timeline[0];
    const years = lifeYears(snap.ledger.yearly);
    expect(years.length).toBe(Math.floor(ctx.yearsPerStage));
    expect(years.reduce((a, y) => a + y.years, 0)).toBeCloseTo(ctx.yearsPerStage, 5);
    expect(years.reduce((a, y) => a + y.earned, 0)).toBeCloseTo(snap.ledger.earned, 4);
    expect(years.at(-1)!.end.cash).toBeCloseTo(snap.after.cash, 4);
  });
});
