import { describe, expect, it } from "vitest";
import { REGIONS, REGION_IDS } from "@/lib/regions";
import { adviceForPath, createContext, optimalPath, simulate, whatIf } from "./engine";
import { mulberry32 } from "./rng";
import { STAGES } from "./stages";

const ctxFor = (id: keyof typeof REGIONS, age = 22, seed = 42) =>
  createContext(REGIONS[id], age, REGIONS[id].typicalMonthlyIncome, seed);

const randomPath = (ctx: ReturnType<typeof ctxFor>, rnd: () => number) =>
  STAGES.map((st) => {
    const opts = st.options(ctx);
    return opts[Math.floor(rnd() * opts.length)].id;
  });

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
    // Everything before the change is identical.
    expect(alt.timeline[1].after).toEqual(simulate(ctx, path).timeline[1].after);
  });

  it.each(REGION_IDS)("optimal path in %s beats 200 random lives", (id) => {
    const ctx = ctxFor(id);
    const best = optimalPath(ctx);
    expect(best.path).toHaveLength(STAGES.length);
    const rnd = mulberry32(99);
    for (let i = 0; i < 200; i++) {
      expect(simulate(ctx, randomPath(ctx, rnd)).score).toBeLessThanOrEqual(best.score + 1e-9);
    }
  });

  it.each(REGION_IDS)("optimal path in %s teaches the core habits", (id) => {
    const { path } = optimalPath(ctxFor(id));
    const pick = (stageId: string) => path[STAGES.findIndex((s) => s.id === stageId)];
    expect(pick("scam")).toBe("pass");
    expect(pick("phone-offer")).not.toBe("credit");
    expect(pick("where-to-save")).toBe("savings");
    expect(pick("invest")).toBe("index");
    expect(pick("emergency")).not.toBe("lender");
  });

  it("advice scores every option and marks the best one", () => {
    const ctx = ctxFor("DE");
    const path = randomPath(ctx, mulberry32(3));
    const advice = adviceForPath(ctx, path);
    expect(advice).toHaveLength(STAGES.length);
    for (const a of advice) {
      const top = Math.max(...Object.values(a.scores));
      expect(a.scores[a.best]).toBe(top);
    }
  });

  it("unemployment benefits soften a job loss (Germany vs. no cover)", () => {
    const de = ctxFor("DE");
    const noCover = { ...de, region: { ...de.region, institutions: { ...de.region.institutions, unemploymentCover: 0 } } };
    const path = optimalPath(de).path.map((c, i) => (STAGES[i].id === "job-loss" ? "wait" : c));
    expect(simulate(de, path).score).toBeGreaterThan(simulate(noCover, path).score);
  });

  it("caps runaway debt instead of producing absurd balances", () => {
    const ctx = ctxFor("MX");
    const worst = ["spend", "cash", "credit", "none", "skip", "fail", "lender", "crypto-tip", "lavish", "decline", "wait"];
    const r = simulate(ctx, worst);
    expect(r.breakdown.debtMonths).toBeLessThan(80);
    expect(r.final.credit).toBe(0);
  });
});
