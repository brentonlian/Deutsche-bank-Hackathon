import { describe, expect, it } from "vitest";
import { REGIONS, REGION_IDS, type RegionId } from "@/lib/regions";
import { AGE_GROUPS, adviceForPath, createContext, optimalPath, simulate, whatIf } from "./engine";
import { mulberry32 } from "./rng";
import type { AgeGroup, GameContext } from "./types";

const GROUPS = Object.keys(AGE_GROUPS) as AgeGroup[];

const ctxFor = (id: RegionId, group: AgeGroup = "young", seed = 42) =>
  createContext(REGIONS[id], group, AGE_GROUPS[group].defaultAge, REGIONS[id].typicalMonthlyIncome, seed);

const randomPath = (ctx: GameContext, rnd: () => number) =>
  ctx.stages.map((st) => {
    const opts = st.options(ctx);
    return opts[Math.floor(rnd() * opts.length)].id;
  });

const pickFrom = (ctx: GameContext, path: string[]) => (stageId: string) =>
  path[ctx.stages.findIndex((s) => s.id === stageId)];

const cases = REGION_IDS.flatMap((id) => GROUPS.map((g) => [id, g] as const));

describe("Life Path engine", () => {
  it("is deterministic for the same seed and choices", () => {
    const ctx = ctxFor("IN");
    const path = randomPath(ctx, mulberry32(1));
    expect(simulate(ctx, path)).toEqual(simulate(ctx, path));
  });

  it("what-if changes only the chosen decision", () => {
    const ctx = ctxFor("MX");
    const path = randomPath(ctx, mulberry32(7));
    const alt = whatIf(ctx, path, 2, path[2] === "skip" ? "save-up" : "skip");
    alt.timeline.forEach((snap, i) => {
      if (i !== 2) expect(snap.choice).toBe(path[i]);
    });
    expect(alt.timeline[1].after).toEqual(simulate(ctx, path).timeline[1].after);
  });

  it.each(cases)("optimal path in %s (%s) beats 150 random lives", (id, group) => {
    const ctx = ctxFor(id, group);
    const best = optimalPath(ctx);
    expect(best.path).toHaveLength(ctx.stages.length);
    const rnd = mulberry32(99);
    for (let i = 0; i < 150; i++) {
      expect(simulate(ctx, randomPath(ctx, rnd)).score).toBeLessThanOrEqual(best.score + 1e-9);
    }
  });

  it.each(cases)("optimal path in %s (%s) teaches the core habits", (id, group) => {
    const ctx = ctxFor(id, group);
    const pick = pickFrom(ctx, optimalPath(ctx).path);
    expect(pick("scam")).toBe("pass");
    expect(pick("where-to-save")).toBe("savings");
    expect(pick("emergency")).not.toBe("lender");
    if (group === "senior") {
      expect(pick("nest-egg")).not.toBe("guaranteed-scheme");
    } else {
      expect(pick("invest")).toBe("index");
    }
    if (group === "young") expect(pick("phone-offer")).not.toBe("credit");
  });

  it("advice scores every option and marks the best one", () => {
    const ctx = ctxFor("DE", "middle");
    const advice = adviceForPath(ctx, randomPath(ctx, mulberry32(3)));
    expect(advice).toHaveLength(ctx.stages.length);
    for (const a of advice) {
      expect(a.scores[a.best]).toBe(Math.max(...Object.values(a.scores)));
    }
  });

  it("unemployment benefits soften a job loss (Germany vs. no cover)", () => {
    const de = ctxFor("DE");
    const noCover = { ...de, region: { ...de.region, institutions: { ...de.region.institutions, unemploymentCover: 0 } } };
    const path = optimalPath(de).path.map((c, i) => (de.stages[i].id === "job-loss" ? "wait" : c));
    expect(simulate(de, path).score).toBeGreaterThan(simulate(noCover, path).score);
  });

  it("caps runaway debt instead of producing absurd balances", () => {
    const ctx = ctxFor("MX");
    const worst = ["spend", "cash", "credit", "none", "skip", "fail", "lender", "crypto-tip", "lavish", "decline", "wait"];
    const r = simulate(ctx, worst);
    expect(r.breakdown.debtMonths).toBeLessThan(80);
    expect(r.final.credit).toBe(0);
  });

  it("records a ledger that explains each period", () => {
    const ctx = ctxFor("US");
    const r = simulate(ctx, ["balanced", "savings"]);
    const [first, second] = r.timeline.map((s) => s.ledger);
    expect(first.years).toBeCloseTo(ctx.yearsPerStage, 5);
    expect(first.earned).toBeGreaterThan(0);
    // Saving 15% means about 15% of pay was put aside.
    expect(first.saved / first.earned).toBeCloseTo(0.15, 2);
    expect(second.savingsRatePct).toBe(REGIONS.US.products.savingsAccount.ratePct);
    expect(second.cashInterest).toBeGreaterThan(0);
    expect(first.marketReturns.length).toBe(Math.ceil(ctx.yearsPerStage - 0.01));
  });

  it("splits each period into years that add up to the period", () => {
    for (const id of REGION_IDS) {
      const ctx = ctxFor(id, "young", 7);
      const r = simulate(ctx, ["spend", "cash", "credit", "none"]);
      for (const snap of r.timeline) {
        const L = snap.ledger;
        const sum = (k: "earned" | "saved" | "cashInterest" | "marketChange" | "debtInterest" | "lost" | "years") =>
          L.yearly.reduce((a, y) => a + y[k], 0);
        for (const k of ["earned", "saved", "cashInterest", "marketChange", "debtInterest", "lost", "years"] as const) {
          expect(sum(k), `${id} ${snap.stageId} ${k}`).toBeCloseTo(L[k], 4);
        }
        const last = L.yearly.at(-1)!;
        expect(last.age).toBeCloseTo(snap.after.age, 5);
        expect(last.end.cash).toBeCloseTo(snap.after.cash, 4);
        expect(last.end.debt).toBeCloseTo(snap.after.debt, 4);
      }
    }
  });

  it("never recommends a gamble, even when the dice favour it", () => {
    for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
      for (const id of REGION_IDS) {
        const ctx = ctxFor(id, "young", seed);
        const pick = pickFrom(ctx, optimalPath(ctx).path);
        expect(["index", "keep-saving"]).toContain(pick("invest"));
      }
    }
  });

  it("seniors draw down savings rather than saving", () => {
    const ctx = ctxFor("DE", "senior");
    const r = simulate(ctx, ["comfortable"]);
    expect(r.final.cash + r.final.invested).toBeLessThan(ctx.startIncome * 24);
  });
});
