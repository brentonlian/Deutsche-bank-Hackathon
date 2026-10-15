import type { RegionPack } from "@/lib/regions/schema";
import { advance, clamp, monthlyExpenses } from "./money";
import { stageRng } from "./rng";
import { STAGES } from "./stages";
import type { GameContext, GameResult, GameState, ScoreBreakdown, Snapshot } from "./types";

export const END_AGE = 60;
export const MIN_YEARS = 15;

export function createContext(region: RegionPack, startAge: number, startIncome: number, seed: number): GameContext {
  const years = Math.max(MIN_YEARS, END_AGE - startAge);
  return { region, seed, startAge, startIncome, yearsPerStage: years / STAGES.length };
}

export function initialState(ctx: GameContext): GameState {
  return {
    age: ctx.startAge,
    income: ctx.startIncome,
    savingRate: 0.1,
    pensionRate: 0,
    investShare: 0,
    fixedCostRate: 0,
    vehicle: "everyday",
    cash: ctx.startIncome * 0.5,
    invested: 0,
    pension: 0,
    debt: 0,
    debtApr: 0,
    insured: false,
    credit: 50,
    wellbeing: 60,
    contentment: 0,
    priceLevel: 1,
    wellbeingSum: 0,
    periods: 0,
  };
}

export const netWorthReal = (s: GameState) => (s.cash + s.invested + s.pension - s.debt) / s.priceLevel;

/** Option streams and market streams are separate so every option at a stage faces the same market. */
export function step(s: GameState, stageIndex: number, choice: string, ctx: GameContext): GameState {
  const stage = STAGES[stageIndex];
  const option = stage.options(ctx).find((o) => o.id === choice);
  if (!option) throw new Error(`Unknown option "${choice}" for stage "${stage.id}"`);
  const decided = option.apply(s, ctx, stageRng(ctx.seed, stageIndex * 2));
  return advance(decided, ctx, ctx.yearsPerStage, stageRng(ctx.seed, stageIndex * 2 + 1));
}

export function breakdown(s: GameState, ctx: GameContext): ScoreBreakdown {
  return {
    netWorthMonths: netWorthReal(s) / ctx.startIncome,
    emergencyMonths: s.cash / Math.max(1, monthlyExpenses(s)),
    debtMonths: s.debt / s.priceLevel / ctx.startIncome,
    credit: s.credit,
    wellbeing: s.periods ? s.wellbeingSum / s.periods : s.wellbeing,
  };
}

/**
 * One number to rank lives by. Wealth has diminishing returns (the 100th month of savings matters
 * less than the 10th), and a cash cushion, being debt-free, credit standing and how life felt along
 * the way all count, so the best path is a balanced life, not "save everything".
 */
export function score(b: ScoreBreakdown): number {
  const wealth = b.netWorthMonths >= 0 ? 60 * Math.log(1 + b.netWorthMonths / 24) : b.netWorthMonths;
  return wealth + 3 * Math.min(b.emergencyMonths, 6) - 2 * b.debtMonths + 0.2 * b.credit + 1.5 * b.wellbeing;
}

export function simulate(ctx: GameContext, choices: string[]): GameResult {
  let s = initialState(ctx);
  const timeline: Snapshot[] = [];
  choices.forEach((choice, i) => {
    const before = s;
    s = step(s, i, choice, ctx);
    timeline.push({ stageId: STAGES[i].id, choice, age: before.age, before, after: s, netWorthReal: netWorthReal(s) });
  });
  const b = breakdown(s, ctx);
  return { timeline, final: s, score: score(b), breakdown: b };
}

/** Options the optimiser may pick. Failing the scam quiz is never a "choice" worth recommending. */
const choosable = (stageIndex: number, ctx: GameContext) =>
  STAGES[stageIndex].options(ctx).filter((o) => !(STAGES[stageIndex].minigame && o.id === "fail"));

function bestFrom(s: GameState, stageIndex: number, ctx: GameContext): { score: number; path: string[] } {
  if (stageIndex === STAGES.length) return { score: score(breakdown(s, ctx)), path: [] };
  let best = { score: -Infinity, path: [] as string[] };
  for (const o of choosable(stageIndex, ctx)) {
    const sub = bestFrom(step(s, stageIndex, o.id, ctx), stageIndex + 1, ctx);
    if (sub.score > best.score) best = { score: sub.score, path: [o.id, ...sub.path] };
  }
  return best;
}

/** The globally best sequence of choices for this player, country and seed. */
export function optimalPath(ctx: GameContext): { score: number; path: string[] } {
  return bestFrom(initialState(ctx), 0, ctx);
}

export interface StepAdvice {
  stageId: string;
  chosen: string;
  /** Best option here, given the player's earlier choices and playing optimally afterwards. */
  best: string;
  /** Final score for each option at this stage under the same assumption. */
  scores: Record<string, number>;
}

/** For each stage: what was the best move from where the player actually stood? */
export function adviceForPath(ctx: GameContext, choices: string[]): StepAdvice[] {
  let s = initialState(ctx);
  return choices.map((chosen, i) => {
    const scores: Record<string, number> = {};
    for (const o of choosable(i, ctx)) {
      scores[o.id] = bestFrom(step(s, i, o.id, ctx), i + 1, ctx).score;
    }
    const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
    s = step(s, i, chosen, ctx);
    return { stageId: STAGES[i].id, chosen, best, scores };
  });
}

/** Change one decision, keep every other decision the same. */
export function whatIf(ctx: GameContext, choices: string[], index: number, alternative: string): GameResult {
  return simulate(ctx, choices.map((c, i) => (i === index ? alternative : c)));
}

/** Score as a share of the best achievable outcome, for display. */
export const percentOfOptimal = (playerScore: number, optimalScore: number) =>
  clamp(Math.round((playerScore / optimalScore) * 100), 0, 100);
