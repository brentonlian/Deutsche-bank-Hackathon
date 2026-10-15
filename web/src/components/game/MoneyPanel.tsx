"use client";

import { netWorthReal } from "@/lib/game/engine";
import type { GameState } from "@/lib/game/types";
import { useApp } from "../AppState";

/** Where the player stands right now, in local currency. Changes are explained on the money story screen. */
export function MoneyPanel({ state }: { state: GameState }) {
  const { t, money } = useApp();
  const items = [
    { key: "cash", label: t("game.savings"), value: state.cash },
    { key: "invested", label: t("game.invested"), value: state.invested },
    { key: "pension", label: t("game.pension"), value: state.pension },
    { key: "debt", label: t("game.debt"), value: state.debt, bad: true },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sign bg-panel-strong sm:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => (
        <div key={it.key} className="bg-panel px-4 py-3">
          <dt className="text-sm text-ink-2">{it.label}</dt>
          <dd className={`text-xl font-extrabold tabular-nums ${it.bad && it.value > 0 ? "text-danger" : ""}`}>{money(it.value)}</dd>
        </div>
      ))}
      <div className="bg-panel px-4 py-3">
        <dt className="text-sm text-ink-2">{t("game.wellbeing")}</dt>
        <dd>
          <span className="text-xl font-extrabold tabular-nums">{Math.round(state.wellbeing)}</span>
          <span className="text-ink-2"> / 100</span>
          <span aria-hidden="true" className="mt-1.5 block h-1.5 rounded-full bg-panel-strong">
            <span className="block h-full rounded-full bg-line transition-[width] duration-700" style={{ width: `${state.wellbeing}%` }} />
          </span>
        </dd>
      </div>
      <div className="bg-ink px-4 py-3 text-ground">
        <dt className="text-sm opacity-80">
          {t("game.netWorth")} <span className="whitespace-nowrap">({t("game.inTodaysMoney")})</span>
        </dt>
        <dd className="text-xl font-extrabold tabular-nums">{money(netWorthReal(state))}</dd>
      </div>
    </dl>
  );
}
