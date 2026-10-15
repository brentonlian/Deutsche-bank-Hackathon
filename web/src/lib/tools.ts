/** Plain finance math for the learning tools. Monthly compounding throughout. */

/** Value after `years` of paying `monthly` in at the start of each month, growing at `annualRatePct`. */
export function futureValue(monthly: number, annualRatePct: number, years: number): number {
  const r = annualRatePct / 100 / 12;
  const n = Math.round(years * 12);
  if (r === 0) return monthly * n;
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

/** Year-by-year balances for a chart, starting at year 0. */
export function growthPath(monthly: number, annualRatePct: number, years: number): { year: number; value: number }[] {
  return Array.from({ length: years + 1 }, (_, y) => ({ year: y, value: futureValue(monthly, annualRatePct, y) }));
}

/** What an amount `years` from now is worth in today's prices. */
export const inTodaysMoney = (amount: number, inflationPct: number, years: number) => amount / Math.pow(1 + inflationPct / 100, years);

export interface Payoff {
  months: number;
  totalInterest: number;
}

/** How long a balance takes to clear with a fixed monthly payment. Null when the payment never beats the interest. */
export function payoff(balance: number, aprPct: number, payment: number): Payoff | null {
  const r = aprPct / 100 / 12;
  if (payment <= balance * r) return null;
  let remaining = balance;
  let totalInterest = 0;
  let months = 0;
  while (remaining > 0.005 && months < 1200) {
    const interest = remaining * r;
    totalInterest += interest;
    remaining = remaining + interest - payment;
    months++;
  }
  return { months, totalInterest };
}

/** The 50/30/20 rule of thumb: needs, wants, savings. */
export const budgetSplit = (income: number) => ({ needs: income * 0.5, wants: income * 0.3, save: income * 0.2 });
