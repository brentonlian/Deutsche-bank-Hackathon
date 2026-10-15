import type { GameContext, GameState } from "./types";

export const DEBT_CAP_MONTHS = 36;

export const clamp =(v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Monthly spending: what is left of income after saving. */
export const monthlyExpenses = (s: GameState) => s.income * (1 - s.savingRate);

export function addDebt(s: GameState, amount: number, apr: number): GameState {
  if (amount <= 0) return s;
  const debt = s.debt + amount;
  return { ...s, debt, debtApr: (s.debt * s.debtApr + amount * apr) / debt };
}

/** Pay from liquid savings; whatever is missing goes on expensive credit. */
export function payFromSavings(s: GameState, amount: number, ctx: GameContext): GameState {
  const fromCash = Math.min(s.cash, amount);
  const next = { ...s, cash: s.cash - fromCash };
  const shortfall = amount - fromCash;
  if (shortfall <= 0) return next;
  return { ...addDebt(next, shortfall, ctx.region.products.expensiveCreditApr), credit: clamp(s.credit - 4, 0, 100) };
}

export function vehicleRatePct(s: GameState, ctx: GameContext): number {
  const p = ctx.region.products;
  switch (s.vehicle) {
    case "cash":
      return p.cashAtHome.ratePct;
    case "everyday":
      return p.everydayAccount.ratePct;
    case "savings":
      return p.savingsAccount.ratePct;
    case "informal":
      return ctx.region.informalSavings?.ratePct ?? 0;
  }
}

/** Approximately normal noise with mean 0 and standard deviation `sd`. */
export const noise = (rng: () => number, sd: number) => (rng() + rng() + rng() + rng() - 2) * sd * Math.sqrt(3);

/** Let `years` pass: income comes in, savings are split, balances grow, prices rise. */
export function advance(state: GameState, ctx: GameContext, years: number, rng: () => number): GameState {
  const { region } = ctx;
  const p = region.products;
  const inflation = region.economy.inflationPct / 100;
  let s = { ...state };

  // Risks of holding money outside the banking system, drawn once per stage.
  const mishap = rng();
  if (s.vehicle === "cash" && mishap < 0.06) s.cash *= 0.75;
  if (s.vehicle === "informal" && mishap < 0.05) s.cash *= 0.7;

  const whole = Math.floor(years);
  const fractions = [...Array(whole).fill(1), ...(years - whole > 0.01 ? [years - whole] : [])];
  for (const f of fractions) {
    const flow = Math.max(0, s.savingRate - s.fixedCostRate);
    const pensionPart = Math.min(s.pensionRate, flow);
    let toSave = s.income * 12 * f * (flow - pensionPart);
    s.pension += s.income * 12 * f * pensionPart;

    s.debt *= 1 + (s.debtApr / 100) * f;
    const repay = Math.min(s.debt, toSave);
    s.debt -= repay;
    toSave -= repay;
    if (s.debt < 1) s = { ...s, debt: 0, debtApr: 0 };
    // A debt spiral ends in restructuring: the balance is capped but credit is wrecked.
    if (s.debt > s.income * DEBT_CAP_MONTHS) s = { ...s, debt: s.income * DEBT_CAP_MONTHS, credit: 0 };

    s.invested += toSave * s.investShare;
    s.cash += toSave * (1 - s.investShare);

    const marketReturn = p.indexFund.ratePct / 100 + noise(rng, 0.15);
    s.cash *= 1 + (vehicleRatePct(s, ctx) / 100) * f;
    s.invested *= Math.max(0.3, 1 + marketReturn * f);
    s.pension *= 1 + (p.retirementProduct.ratePct / 100) * f;

    s.priceLevel *= 1 + inflation * f;
    s.income *= 1 + (inflation + 0.01) * f; // pay keeps up with prices plus modest real growth
    s.age += f;

    const debtMonths = s.debt / s.income;
    s.credit = clamp(s.credit + (s.debt === 0 ? 3 : debtMonths > 3 ? -6 : 0) * f, 0, 100);
    const target = clamp(
      60 + s.contentment - (s.savingRate - 0.15) * 120 - Math.min(20, debtMonths * 3) + (s.insured ? 3 : 0),
      0,
      100,
    );
    s.wellbeing = s.wellbeing + (target - s.wellbeing) * Math.min(1, 0.35 * f);
  }
  return { ...s, wellbeingSum: s.wellbeingSum + s.wellbeing, periods: s.periods + 1 };
}
