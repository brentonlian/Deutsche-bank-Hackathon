"use client";

import { ArrowRight } from "lucide-react";
import { netWorthReal } from "@/lib/game/engine";
import type { Snapshot } from "@/lib/game/types";
import type { RegionPack } from "@/lib/regions/schema";
import { useApp } from "../AppState";

interface Row {
  key: string;
  label: string;
  value: number;
  detail?: string;
  /** Money that left your pocket for good (costs, interest, losses). */
  outflow?: boolean;
}

/**
 * The screen between decisions: what the choice cost, then where every unit of money went over
 * the following years. Every figure comes from the engine's ledger and the country's real rates.
 */
export function MoneyStory({ snap, region, onNext }: { snap: Snapshot; region: RegionPack; onNext: () => void }) {
  const { t, money, percent } = useApp();
  const { before, decided, after, ledger: L } = snap;
  const years = L.years.toLocaleString(region.locale, { maximumFractionDigits: 1 });

  // 1. The decision itself, before any time passes.
  const decision: Row[] = [
    { key: "cash", label: t("game.savings"), value: decided.cash - before.cash },
    { key: "invested", label: t("game.invested"), value: decided.invested - before.invested },
    { key: "debt", label: t("game.debt"), value: decided.debt - before.debt, outflow: true },
  ].filter((r) => Math.abs(r.value) >= 1);

  // 2. The years that follow.
  const avgIncome = L.earned / Math.max(L.years * 12, 1);
  const returns = L.marketReturns.map((r) => `${r >= 0 ? "+" : "−"}${Math.abs(r * 100).toFixed(0)}%`).join(", ");
  const flows: Row[] = [
    { key: "earned", label: t("story.earned"), value: L.earned, detail: t("story.earnedDetail", { monthly: money(avgIncome) }) },
    { key: "living", label: t("story.living"), value: -L.livingCosts, outflow: true },
    { key: "fixed", label: t("story.fixed"), value: -L.fixedCosts, outflow: true },
    { key: "saved", label: t("story.saved"), value: L.saved, detail: t("story.savedDetail", { share: percent((L.saved / Math.max(L.earned, 1)) * 100) }) },
    { key: "pension", label: t("story.pension"), value: L.toPension },
    { key: "drawdown", label: t("story.drawdown"), value: -L.drawdown, outflow: true },
    { key: "interest", label: t("story.interest"), value: L.cashInterest, detail: t("story.interestDetail", { rate: percent(L.savingsRatePct) }) },
    { key: "market", label: t("story.market"), value: L.marketChange, detail: returns ? t("story.marketDetail", { returns }) : undefined },
    { key: "pensionGrowth", label: t("story.pensionGrowth"), value: L.pensionGrowth, detail: t("story.pensionGrowthDetail", { rate: percent(region.products.retirementProduct.ratePct) }) },
    { key: "debtInterest", label: t("story.debtInterest"), value: -L.debtInterest, outflow: true, detail: before.debtApr || after.debtApr ? t("story.debtInterestDetail", { rate: percent(Math.max(before.debtApr, decided.debtApr)) }) : undefined },
    { key: "debtRepaid", label: t("story.debtRepaid"), value: L.debtRepaid },
    { key: "lost", label: t("story.lost"), value: -L.lost, outflow: true, detail: t("story.lostDetail") },
  ].filter((r) => Math.abs(r.value) >= 1);

  // 3. Where you stand now.
  const standing = [
    { key: "cash", label: t("game.savings"), from: before.cash, to: after.cash },
    { key: "invested", label: t("game.invested"), from: before.invested, to: after.invested },
    { key: "pension", label: t("game.pension"), from: before.pension, to: after.pension },
    { key: "debt", label: t("game.debt"), from: before.debt, to: after.debt, bad: true },
  ].filter((r) => r.from > 0.5 || r.to > 0.5);

  const signed = (v: number) => `${v >= 0 ? "+" : "−"}${money(Math.abs(v))}`;

  return (
    <div className="rise" role="status" aria-live="polite">
      {decision.length > 0 && (
        <section>
          <h2 className="text-lg font-bold text-ink-2">{t("story.decisionTitle")}</h2>
          <ul className="mt-3 flex flex-wrap gap-x-10 gap-y-3">
            {decision.map((r) => {
              const good = r.outflow ? r.value < 0 : r.value > 0;
              return (
                <li key={r.key}>
                  <span className="block text-ink-2">{r.label}</span>
                  <span className={`text-4xl font-extrabold tabular-nums ${good ? "text-express" : "text-danger"}`}>{signed(r.value)}</span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-tight tracking-[-0.02em]">{t("story.yearsTitle", { years })}</h2>
        <p className="mt-2 text-lg text-ink-2">{t("story.pricesRose", { pct: percent(L.inflationPct) })}</p>
        <dl className="mt-6 divide-y-2 divide-panel-strong border-y-2 border-panel-strong">
          {flows.map((r) => (
            <div key={r.key} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-6 py-3">
              <dt>
                <span className="text-lg font-bold">{r.label}</span>
                {r.detail && <span className="block text-ink-2">{r.detail}</span>}
              </dt>
              <dd className={`text-2xl font-extrabold tabular-nums ${r.value < 0 ? (r.outflow ? "text-ink-2" : "text-danger") : ""}`}>{signed(r.value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-bold text-ink-2">{t("story.standingTitle", { age: Math.round(after.age) })}</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {standing.map((r) => {
            const diff = r.to - r.from;
            const good = r.bad ? diff <= 0 : diff >= 0;
            return (
              <li key={r.key} className="rounded-sign bg-panel px-5 py-4">
                <span className="block text-ink-2">{r.label}</span>
                <span className="text-3xl font-extrabold tabular-nums">{money(r.to)}</span>
                <span className={`ml-3 font-bold tabular-nums ${good ? "text-express" : "text-danger"}`}>{signed(diff)}</span>
              </li>
            );
          })}
          <li className="rounded-sign bg-ink px-5 py-4 text-ground sm:col-span-2">
            <span className="block opacity-80">
              {t("game.netWorth")} ({t("game.inTodaysMoney")})
            </span>
            <span className="text-4xl font-extrabold tabular-nums">{money(netWorthReal(after))}</span>
          </li>
        </ul>
        <p className="mt-4 text-sm text-ink-2">{t("story.sourceNote", { countryIn: region.nameIn })}</p>
      </section>

      <button
        type="button"
        autoFocus
        onClick={onNext}
        className="mt-8 flex items-center gap-2 rounded-sign bg-ink px-6 py-3 text-lg font-bold text-ground hover:bg-ink-2"
      >
        {t("onboarding.next")} <ArrowRight aria-hidden="true" size={20} />
      </button>
    </div>
  );
}
