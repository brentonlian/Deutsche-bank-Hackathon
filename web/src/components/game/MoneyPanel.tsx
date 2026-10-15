"use client";

import { netWorthReal } from "@/lib/game/engine";
import type { GameState } from "@/lib/game/types";
import { useApp } from "../AppState";

function Delta({ value, goodWhenUp }: { value: number; goodWhenUp: boolean }) {
  const { money } = useApp();
  if (Math.abs(value) < 1) return null;
  const good = value > 0 === goodWhenUp;
  return (
    <span className={`block text-sm font-bold ${good ? "text-express" : "text-danger"}`}>
      {value > 0 ? "+" : "−"}
      {money(Math.abs(value)).replace("-", "")}
    </span>
  );
}

/** Where the player stands, in local currency. Shows the change from the last decision when given. */
export function MoneyPanel({ state, previous }: { state: GameState; previous?: GameState }) {
  const { t, money } = useApp();
  const items: { key: string; label: string; value: number; prev?: number; bad?: boolean }[] = [
    { key: "cash", label: t("game.savings"), value: state.cash, prev: previous?.cash },
    { key: "invested", label: t("game.invested"), value: state.invested, prev: previous?.invested },
    { key: "pension", label: t("game.pension"), value: state.pension, prev: previous?.pension },
    { key: "debt", label: t("game.debt"), value: state.debt, prev: previous?.debt, bad: true },
  ];
  return (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-sign bg-panel-strong sm:grid-cols-3 xl:grid-cols-6">
      {items.map((it) => (
        <div key={it.key} className="bg-panel px-4 py-3">
          <dt className="text-sm text-ink-2">{it.label}</dt>
          <dd className={`text-xl font-extrabold tabular-nums ${it.bad && it.value > 0 ? "text-danger" : ""}`}>
            {money(it.value)}
            {it.prev !== undefined && <Delta value={it.value - it.prev} goodWhenUp={!it.bad} />}
          </dd>
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
