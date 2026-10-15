import { addDebt, clamp, monthlyExpenses, payFromSavings } from "./money";
import type { AgeGroup, GameContext, GameState, OptionDef, StageDef } from "./types";

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

// ---------------------------------------------------------------------------
// Stage builders. Stage ids are i18n keys (`stages.<id>`), option ids are
// `stages.<id>.options.<optionId>`. Region data changes products, costs and risks.
// ---------------------------------------------------------------------------

const budget = (id: string, rates: [number, number, number]): StageDef => ({
  id,
  topic: "budgeting",
  options: () => [
    opt("spend", (s) => feel({ ...s, savingRate: rates[0] }, 8)),
    opt("balanced", (s) => ({ ...s, savingRate: rates[1] })),
    opt("frugal", (s) => feel({ ...s, savingRate: rates[2] }, -8)),
  ],
});

const whereToSave: StageDef = {
  id: "where-to-save",
  topic: "banking-basics",
  options: (ctx) => [
    opt("cash", (s) => ({ ...s, vehicle: "cash" })),
    opt("everyday", (s) => ({ ...s, vehicle: "everyday" })),
    opt("savings", (s) => ({ ...s, vehicle: "savings" })),
    ...(ctx.region.informalSavings ? [opt("informal", (s) => feel({ ...s, vehicle: "informal" }, 3))] : []),
  ],
};

const phoneOffer: StageDef = {
  id: "phone-offer",
  topic: "credit-and-debt",
  options: (ctx) => [
    opt("credit", (s) =>
      feel({ ...addDebt(s, s.income * 1.25, ctx.region.products.expensiveCreditApr), credit: clamp(s.credit - 5, 0, 100) }, 5),
    ),
    opt("save-up", (s) => (s.cash >= s.income ? feel({ ...s, cash: s.cash - s.income }, 6) : feel({ ...s, cash: s.cash * 0.5 }, 3))),
    opt("skip", (s) => feel(s, -2)),
  ],
};

const carPurchase: StageDef = {
  id: "car",
  topic: "credit-and-debt",
  options: (ctx) => [
    opt("new-car-loan", (s) => feel(addDebt(s, s.income * 8, ctx.region.economy.policyRatePct + 5), 8)),
    opt("used-car", (s) => feel(payFromSavings(s, s.income * 3, ctx), 5)),
    opt("no-car", (s) => feel(s, -3)),
  ],
};

const pension: StageDef = {
  id: "pension",
  topic: "retirement",
  options: () => [
    opt("none", (s) => ({ ...s, pensionRate: 0 })),
    opt("five", (s) => ({ ...s, pensionRate: 0.05 })),
    opt("ten", (s) => feel({ ...s, pensionRate: 0.1 }, -2)),
  ],
};

const insurance: StageDef = {
  id: "insurance",
  topic: "insurance",
  options: () => [
    opt("insure", (s) => ({ ...s, insured: true, fixedCostRate: s.fixedCostRate + 0.01 })),
    opt("skip", (s) => s),
  ],
};

const scam: StageDef = {
  id: "scam",
  minigame: "scam",
  topic: "scams-and-fraud",
  options: () => [
    opt("pass", (s) => feel(s, 2)),
    opt("fail", (s) => feel({ ...s, cash: s.cash * 0.6 }, -10)),
  ],
};

const emergency: StageDef = {
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
};

const invest: StageDef = {
  id: "invest",
  minigame: "market",
  topic: "saving-vs-investing",
  options: () => [
    opt("keep-saving", (s) => ({ ...s, investShare: 0 })),
    opt("index", (s) => ({ ...s, investShare: 0.6 })),
    {
      id: "single-stock",
      speculative: true,
      // Putting a big share of savings into one hyped company: sometimes it soars, usually it doesn't.
      apply: (s, _c, rng) => {
        const stake = s.cash * 0.4;
        const outcome = rng() < 0.3 ? 2.2 : 0.45;
        return feel({ ...s, cash: s.cash - stake + stake * outcome }, outcome > 1 ? 8 : -6);
      },
    },
    {
      id: "crypto-tip",
      speculative: true,
      apply: (s, _c, rng) => {
        const stake = s.cash * 0.5;
        const outcome = rng() < 0.2 ? 3 : 0.15;
        return feel({ ...s, cash: s.cash - stake + stake * outcome }, outcome > 1 ? 10 : -8);
      },
    },
  ],
};

const bigLifeEvent: StageDef = {
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
};

const childEducation: StageDef = {
  id: "child-education",
  topic: "saving-vs-investing",
  options: (ctx) => [
    opt("private", (s) => feel(payFromSavings(s, s.income * 8, ctx), 8)),
    opt("public-plus", (s) => feel(payFromSavings(s, s.income * 3, ctx), 5)),
    opt("education-loan", (s) => feel(addDebt(s, s.income * 6, ctx.region.economy.policyRatePct + 5), 6)),
  ],
};

const familySupport = (id: string): StageDef => ({
  id,
  topic: "budgeting",
  options: (ctx) => [
    opt("monthly", (s) => feel({ ...s, fixedCostRate: s.fixedCostRate + 0.05 }, 7)),
    opt("one-off", (s) => feel(payFromSavings(s, s.income * 1.5, ctx), 4)),
    opt("decline", (s) => feel(s, -8)),
  ],
});

const jobLoss: StageDef = {
  id: "job-loss",
  topic: "emergency-fund",
  options: (ctx) => [
    opt("quick-job", (s) => incomeGap({ ...s, income: s.income * 0.92 }, 2, ctx)),
    opt("upskill", (s) => feel(incomeGap({ ...payFromSavings(s, s.income, ctx), income: s.income * 1.15 }, 6, ctx), 2)),
    opt("wait", (s) => incomeGap(s, 4, ctx)),
  ],
};

// --- Senior-specific stages -------------------------------------------------

const retirementBudget: StageDef = {
  id: "retirement-budget",
  topic: "retirement",
  options: () => [
    // Negative saving rate = drawing down the nest egg each month.
    opt("travel", (s) => feel({ ...s, savingRate: -0.35 }, 8)),
    opt("comfortable", (s) => feel({ ...s, savingRate: -0.15 }, 3)),
    opt("careful", (s) => feel({ ...s, savingRate: 0 }, -4)),
  ],
};

const nestEgg: StageDef = {
  id: "nest-egg",
  topic: "saving-vs-investing",
  options: () => [
    opt("all-cash", (s) => ({ ...s, cash: s.cash + s.invested, invested: 0, investShare: 0 })),
    opt("balanced", (s) => s),
    {
      id: "guaranteed-scheme",
      speculative: true,
      // "Guaranteed 12% a year" from a friendly adviser: usually too good to be true.
      apply: (s, _c, rng) => {
        const collapsed = rng() < 0.7;
        return feel({ ...s, invested: collapsed ? s.invested * 0.4 : s.invested * 1.3 }, collapsed ? -12 : 4);
      },
    },
  ],
};

const familyRequest: StageDef = {
  id: "family-request",
  topic: "budgeting",
  options: (ctx) => [
    opt("gift-large", (s) => feel(payFromSavings(s, s.income * 6, ctx), 9)),
    opt("gift-small", (s) => feel(payFromSavings(s, s.income * 1.5, ctx), 5)),
    opt("decline", (s) => feel(s, -8)),
  ],
};

const housing: StageDef = {
  id: "housing",
  topic: "retirement",
  options: () => [
    opt("stay", (s) => feel(s, 3)),
    opt("downsize", (s) => feel({ ...s, cash: s.cash + s.income * 24 }, -4)),
  ],
};

const lateWork: StageDef = {
  id: "late-work",
  topic: "retirement",
  options: () => [
    opt("part-time", (s) => feel({ ...s, income: s.income * 1.4 }, -2)),
    opt("volunteer", (s) => feel(s, 6)),
    opt("rest", (s) => feel(s, 2)),
  ],
};

const estate: StageDef = {
  id: "estate",
  topic: "retirement",
  options: () => [
    opt("make-will", (s) => feel({ ...s, cash: s.cash - s.income * 0.5 }, 5)),
    opt("skip", (s, _c, rng) => (rng() < 0.35 ? feel(s, -10) : s)),
  ],
};

export const STAGE_SETS: Record<AgeGroup, StageDef[]> = {
  young: [
    budget("first-paycheck", [0.05, 0.15, 0.25]),
    whereToSave,
    phoneOffer,
    pension,
    insurance,
    scam,
    emergency,
    invest,
    bigLifeEvent,
    familySupport("family-support"),
    jobLoss,
  ],
  middle: [
    budget("family-budget", [0.03, 0.12, 0.22]),
    whereToSave,
    carPurchase,
    pension,
    insurance,
    scam,
    emergency,
    invest,
    childEducation,
    familySupport("parents-care"),
    jobLoss,
  ],
  senior: [retirementBudget, whereToSave, scam, nestEgg, insurance, emergency, familyRequest, housing, lateWork, estate],
};
