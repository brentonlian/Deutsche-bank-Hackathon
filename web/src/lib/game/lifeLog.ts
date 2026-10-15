import type { RegionPack } from "@/lib/regions/schema";
import { vehicleRatePct } from "./money";
import type { GameContext, GameResult, GameState, YearEntry } from "./types";

/** One line of the life log: an i18n key under `life.log.*` and its already-formatted values. */
export interface LogLine {
  key: string;
  vars: Record<string, string>;
  tone?: "good" | "bad" | "muted";
}

export type LogItem =
  /** `from` is set when one step covered more than one birthday (a period's part-year folded in). */
  | { kind: "line"; age: number; from?: number; line: LogLine }
  | { kind: "choice"; age: number; stageIndex: number }
  | { kind: "story"; age: number; stageIndex: number; from: number; to: number };

export interface Formatters {
  money: (v: number) => string;
  percent: (v: number) => string;
}

const vehicleName = (vehicle: GameState["vehicle"], region: RegionPack) => {
  const p = region.products;
  return { cash: p.cashAtHome.name, everyday: p.everydayAccount.name, savings: p.savingsAccount.name, informal: region.informalSavings?.name ?? "" }[vehicle];
};

/**
 * What happened in one year, in plain sentences. Every amount is the engine's own ledger figure and
 * every rate is the country's, so the log teaches the same thing the money story does, a year at a time.
 */
export function yearLines(y: YearEntry, prev: GameState, ctx: GameContext, f: Formatters): LogLine[] {
  const { region } = ctx;
  const p = region.products;
  const lines: LogLine[] = [];
  const amount = (v: number) => f.money(Math.abs(v));
  const big = (v: number) => Math.abs(v) >= 1;

  if (big(y.lost)) {
    lines.push({ key: prev.vehicle === "informal" ? "collapsed" : "stolen", vars: { amount: amount(y.lost) }, tone: "bad" });
  }
  if (big(y.earned)) {
    lines.push(big(y.saved) ? { key: "earned", vars: { earned: amount(y.earned), saved: amount(y.saved) } } : { key: "earnedNoSave", vars: { earned: amount(y.earned) } });
  }
  if (big(y.drawdown)) lines.push({ key: "drawdown", vars: { amount: amount(y.drawdown) }, tone: "muted" });
  if (big(y.newDebt)) lines.push({ key: "borrowed", vars: { amount: amount(y.newDebt) }, tone: "bad" });
  if (big(y.debtRepaid)) lines.push({ key: "repaid", vars: { amount: amount(y.debtRepaid) }, tone: "good" });
  if (big(y.debtInterest)) lines.push({ key: "debtInterest", vars: { amount: amount(y.debtInterest), rate: f.percent(prev.debtApr || y.end.debtApr) }, tone: "bad" });
  if (big(y.cashInterest)) {
    lines.push({
      key: "interest",
      vars: { name: vehicleName(y.end.vehicle, region), amount: amount(y.cashInterest), rate: f.percent(vehicleRatePct({ ...prev, vehicle: y.end.vehicle }, ctx)) },
      tone: "good",
    });
  }
  if (big(y.marketChange)) {
    const up = y.marketChange >= 0;
    lines.push({ key: up ? "marketUp" : "marketDown", vars: { pct: f.percent(Math.abs(y.marketReturn) * 100), amount: amount(y.marketChange), name: p.indexFund.name }, tone: up ? "good" : "bad" });
  }
  if (big(y.pensionGrowth)) lines.push({ key: "pension", vars: { name: p.retirementProduct.name, amount: amount(y.pensionGrowth) }, tone: "good" });
  lines.push({ key: "prices", vars: { pct: f.percent(y.inflationPct) }, tone: "muted" });
  return lines;
}

const FLOWS = ["earned", "saved", "toPension", "drawdown", "newDebt", "debtInterest", "debtRepaid", "cashInterest", "marketChange", "pensionGrowth", "lost", "years"] as const;

/**
 * The years as the player taps through them. Periods between events last a fractional number of
 * years, so the part-year at the end of a period is folded into the year before it: one tap of
 * "Age +1" is always one step, never a quarter-year with its own pay line.
 */
export function lifeYears(yearly: YearEntry[]): YearEntry[] {
  const out: YearEntry[] = [];
  for (const y of yearly) {
    const prev = out.at(-1);
    if (prev && y.years < 0.999) {
      const merged: YearEntry = { ...y };
      for (const k of FLOWS) merged[k] = prev[k] + y[k];
      merged.marketReturn = (1 + prev.marketReturn) * (1 + y.marketReturn) - 1;
      merged.inflationPct = ((1 + prev.inflationPct / 100) * (1 + y.inflationPct / 100) - 1) * 100;
      out[out.length - 1] = merged;
    } else out.push(y);
  }
  return out;
}

/** The player's position at the end of a year, as a full state for the stat bars. */
export const stateAfterYear = (base: GameState, y: YearEntry): GameState => ({ ...base, ...y.end, age: y.age });

/**
 * The life log so far. `revealed` is how many `lifeYears` of the latest period the player has lived
 * through; earlier periods are shown in full. Nothing beyond `revealed` is included, so the log
 * never shows what is coming.
 */
export function buildLog(result: GameResult, ctx: GameContext, revealed: number, f: Formatters): LogItem[] {
  const items: LogItem[] = [];
  result.timeline.forEach((snap, i) => {
    items.push({ kind: "choice", age: Math.floor(snap.age), stageIndex: i });
    const isLast = i === result.timeline.length - 1;
    const all = lifeYears(snap.ledger.yearly);
    const years = isLast ? all.slice(0, revealed) : all;
    let prev = snap.decided;
    for (const y of years) {
      const age = Math.floor(y.age + 1e-6);
      const from = Math.floor(y.age - y.years + 1e-6) + 1;
      for (const line of yearLines(y, prev, ctx, f)) items.push({ kind: "line", age, ...(from < age ? { from } : {}), line });
      prev = stateAfterYear(prev, y);
    }
    if (years.length === all.length && years.length > 0) {
      items.push({ kind: "story", age: Math.floor(snap.after.age + 1e-6), stageIndex: i, from: Math.floor(snap.age), to: Math.floor(snap.after.age + 1e-6) });
    }
  });
  return items;
}
