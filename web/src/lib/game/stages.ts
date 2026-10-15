import { addDebt, clamp, monthlyExpenses, payFromSavings } from "./money";
import type { GameContext, GameState, OptionDef, StageDef } from "./types";

const opt = (id: string, apply: OptionDef["apply"]): OptionDef => ({ id, apply });
/** A decision's immediate emotional effect; half of it lasts. */
const feel = (s: GameState, delta: number): GameState => ({
  ...s,
  wellbeing: clamp(s.wellbeing + delta, 0, 100),
  contentment: clamp(s.contentment + delta / 2, -20, 20),
});

/** Cover living costs for `months` without pay, softened by local unemployment benefits. */
function incomeGap(s: GameState, months: number, ctx: GameContext): GameState {
  const cover = ctx.region.institutions.unemploymentCover;
  const uncovered = Math.max(0, monthlyExpenses(s) - s.income * cover) * months;
  return payFromSavings(s, uncovered, ctx);
}

/**
 * The Life Path. Each stage is a life event; option ids double as i18n keys
 * (`stages.<stageId>.options.<optionId>`). Region data changes the products, costs and risks.
 */
export const STAGES: StageDef[] = [
  {
    id: "first-paycheck",
    topic: "budgeting",
    options: () => [
      opt("spend", (s) => feel({ ...s, savingRate: 0.05 }, 8)),
      opt("balanced", (s) => ({ ...s, savingRate: 0.15 })),
      opt("frugal", (s) => feel({ ...s, savingRate: 0.25 }, -8)),
    ],
  },
  {
    id: "where-to-save",
    topic: "banking-basics",
    options: (ctx) => [
      opt("cash", (s) => ({ ...s, vehicle: "cash" })),
      opt("everyday", (s) => ({ ...s, vehicle: "everyday" })),
      opt("savings", (s) => ({ ...s, vehicle: "savings" })),
      ...(ctx.region.informalSavings ? [opt("informal", (s) => feel({ ...s, vehicle: "informal" }, 3))] : []),
    ],
  },
  {
    id: "phone-offer",
    topic: "credit-and-debt",
    options: (ctx) => [
      opt("credit", (s) =>
        feel({ ...addDebt(s, s.income * 1.25, ctx.region.products.expensiveCreditApr), credit: clamp(s.credit - 5, 0, 100) }, 5),
      ),
      opt("save-up", (s) => (s.cash >= s.income ? feel({ ...s, cash: s.cash - s.income }, 6) : feel({ ...s, cash: s.cash * 0.5 }, 3))),
      opt("skip", (s) => feel(s, -2)),
    ],
  },
  {
    id: "pension",
    topic: "retirement",
    options: () => [
      opt("none", (s) => ({ ...s, pensionRate: 0 })),
      opt("five", (s) => ({ ...s, pensionRate: 0.05 })),
      opt("ten", (s) => feel({ ...s, pensionRate: 0.1 }, -2)),
    ],
  },
  {
    id: "insurance",
    topic: "insurance",
    options: () => [
      opt("insure", (s) => ({ ...s, insured: true, fixedCostRate: s.fixedCostRate + 0.01 })),
      opt("skip", (s) => s),
    ],
  },
  {
    id: "scam",
    minigame: "scam",
    topic: "scams-and-fraud",
    options: () => [
      opt("pass", (s) => feel(s, 2)),
      opt("fail", (s) => feel({ ...s, cash: s.cash * 0.6 }, -10)),
    ],
  },
  {
    id: "emergency",
    topic: "emergency-fund",
    options: (ctx) => {
      const p = ctx.region.products;
      const cost = (s: GameState, rng: () => number) => s.income * (3 + rng() * 2) * (s.insured ? 0.2 : 1);
      return [
        opt("savings", (s, _c, rng) => payFromSavings(s, cost(s, rng), ctx)),
        opt("lender", (s, _c, rng) => feel(addDebt(s, cost(s, rng), p.informalLenderApr), -6)),
        opt("family", (s, _c, rng) => feel(addDebt(s, cost(s, rng), 0), -5)),
        opt("sell-investments", (s, _c, rng) => {
          // Forced selling often happens in a dip: each unit of cash costs 1.1 units of investments.
          const bill = cost(s, rng);
          const raised = Math.min(s.invested / 1.1, bill);
          return payFromSavings({ ...s, invested: s.invested - raised * 1.1 }, bill - raised, ctx);
        }),
      ];
    },
  },
  {
    id: "invest",
    topic: "saving-vs-investing",
    options: () => [
      opt("keep-saving", (s) => ({ ...s, investShare: 0 })),
      opt("index", (s) => ({ ...s, investShare: 0.6 })),
      opt("crypto-tip", (s, _c, rng) => {
        const stake = s.cash * 0.5;
        const outcome = rng() < 0.2 ? 3 : 0.15;
        return feel({ ...s, cash: s.cash - stake + stake * outcome }, outcome > 1 ? 10 : -8);
      }),
    ],
  },
  {
    id: "big-life-event",
    topic: "budgeting",
    options: (ctx) => {
      const months = ctx.region.culture.bigLifeEvent.typicalCostMonths;
      return [
        opt("lavish", (s) => feel(payFromSavings(s, s.income * months * 2, ctx), 12)),
        opt("moderate", (s) => feel(payFromSavings(s, s.income * months * 0.7, ctx), 8)),
        opt("simple", (s) => feel(payFromSavings(s, s.income * months * 0.25, ctx), 1)),
      ];
    },
  },
  {
    id: "family-support",
    topic: "budgeting",
    options: (ctx) => [
      opt("monthly", (s) => feel({ ...s, fixedCostRate: s.fixedCostRate + 0.05 }, 7)),
      opt("one-off", (s) => feel(payFromSavings(s, s.income * 1.5, ctx), 4)),
      opt("decline", (s) => feel(s, -8)),
    ],
  },
  {
    id: "job-loss",
    topic: "emergency-fund",
    options: (ctx) => [
      opt("quick-job", (s) => incomeGap({ ...s, income: s.income * 0.92 }, 2, ctx)),
      opt("upskill", (s) => feel(incomeGap({ ...payFromSavings(s, s.income, ctx), income: s.income * 1.15 }, 6, ctx), 2)),
      opt("wait", (s) => incomeGap(s, 4, ctx)),
    ],
  },
];

export const STAGE_INDEX = Object.fromEntries(STAGES.map((st, i) => [st.id, i]));
