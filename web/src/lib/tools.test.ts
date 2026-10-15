import { describe, expect, it } from "vitest";
import { budgetSplit, futureValue, inTodaysMoney, payoff } from "./tools";

describe("learning tool math", () => {
  it("adds up deposits with no interest", () => {
    expect(futureValue(100, 0, 10)).toBe(12000);
  });

  it("compounds monthly deposits", () => {
    // $100 a month for 10 years at 8% is about $18,400 with deposits at the start of each month.
    expect(futureValue(100, 8, 10)).toBeCloseTo(18416.6, 0);
  });

  it("discounts to today's money", () => {
    expect(inTodaysMoney(110, 10, 1)).toBeCloseTo(100, 6);
  });

  it("pays off a card balance and counts the interest", () => {
    const r = payoff(1800, 22.4, 150)!;
    expect(r.months).toBe(14);
    expect(r.totalInterest).toBeGreaterThan(200);
    expect(r.totalInterest).toBeLessThan(300);
  });

  it("says when a minimum payment never clears the debt", () => {
    expect(payoff(1000, 390, 30)).toBeNull();
  });

  it("splits a budget 50/30/20", () => {
    expect(budgetSplit(1000)).toEqual({ needs: 500, wants: 300, save: 200 });
  });
});
