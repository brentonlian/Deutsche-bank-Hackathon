import type { RegionPack } from "@/lib/regions/schema";

export type SaverVehicle = "cash" | "everyday" | "savings" | "informal";

export interface GameState {
  age: number;
  /** Monthly take-home income, nominal local currency. */
  income: number;
  /** Share of income put aside each month. */
  savingRate: number;
  /** Share of income paid into a retirement product each month. */
  pensionRate: number;
  /** Share of the monthly savings flow that goes into the index fund. */
  investShare: number;
  /** Monthly fixed obligations that reduce saving (insurance premium, family support), as share of income. */
  fixedCostRate: number;
  vehicle: SaverVehicle;
  cash: number;
  invested: number;
  pension: number;
  debt: number;
  debtApr: number;
  insured: boolean;
  /** 0–100, relative creditworthiness. */
  credit: number;
  /** 0–100, how life feels. Saving everything is not free. */
  wellbeing: number;
  /** Lasting effect of life decisions on how life feels (a celebrated wedding, a strained family tie). */
  contentment: number;
  /** Cumulative price level since the start (1 = today's prices). */
  priceLevel: number;
  /** Running sum of wellbeing per period, so the score rewards a good life throughout, not just at the end. */
  wellbeingSum: number;
  periods: number;
}

export type AgeGroup = "young" | "middle" | "senior";

export interface GameContext {
  region: RegionPack;
  group: AgeGroup;
  stages: StageDef[];
  seed: number;
  startAge: number;
  startIncome: number;
  /** Years that pass after each stage. */
  yearsPerStage: number;
  /** Saving rate that feels "normal" for this life stage (seniors draw down savings). */
  baselineSaving: number;
  /** Real income growth per year on top of inflation. */
  realIncomeGrowth: number;
}

export interface OptionDef {
  id: string;
  /** Apply the decision. rng is the stage's own deterministic stream. */
  apply: (s: GameState, ctx: GameContext, rng: () => number) => GameState;
}

export interface StageDef {
  id: string;
  /** Mini-games appear as life events; their result is recorded as an option id. */
  minigame?: "scam";
  /** Lesson topic the "learn why" link points to. */
  topic: string;
  options: (ctx: GameContext) => OptionDef[];
}

export interface Snapshot {
  stageId: string;
  choice: string;
  age: number;
  before: GameState;
  after: GameState;
  netWorthReal: number;
}

export interface GameResult {
  timeline: Snapshot[];
  final: GameState;
  score: number;
  breakdown: ScoreBreakdown;
}

export interface ScoreBreakdown {
  /** Real net worth, in months of starting income. */
  netWorthMonths: number;
  /** Months of expenses covered by liquid savings at the end. */
  emergencyMonths: number;
  debtMonths: number;
  credit: number;
  wellbeing: number;
}
