"use client";

import { RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";
import { adviceForPath, netWorthReal, optimalPath, percentOfOptimal, simulate, whatIf } from "@/lib/game/engine";
import type { GameContext, GameResult } from "@/lib/game/types";
import { stageVars } from "@/lib/game/vars";
import { useApp } from "../AppState";
import { NetWorthChart, type Series } from "./NetWorthChart";
import { StageIcon } from "./StageIcon";

/** Beyond a year of cover the exact figure stops mattering. */
const cushion = (months: number) => (months >= 12 ? "12+" : months.toFixed(1));

const curve = (ctx: GameContext, r: GameResult) => [
  { age: ctx.startAge, value: netWorthReal(r.timeline[0]?.before ?? r.final) },
  ...r.timeline.map((s) => ({ age: Math.round(s.after.age * 10) / 10, value: s.netWorthReal })),
];

/**
 * The end of the line. Your line (country colour) runs beside the express line (the optimal
 * path, green). Where both took the same choice the stations merge into an interchange.
 */
export function Results({ ctx, choices }: { ctx: GameContext; choices: string[] }) {
  const { t, region, money, percent, game, setGame, profile } = useApp();
  const [selected, setSelected] = useState<number | null>(null);
  const [showWhatIf, setShowWhatIf] = useState(false);

  const player = useMemo(() => simulate(ctx, choices), [ctx, choices]);
  const best = useMemo(() => optimalPath(ctx), [ctx]);
  const express = useMemo(() => simulate(ctx, best.path), [ctx, best.path]);
  const advice = useMemo(() => adviceForPath(ctx, choices), [ctx, choices]);

  const detail = selected !== null ? advice[selected] : null;
  const alt = useMemo(
    () => (selected !== null && detail && detail.best !== choices[selected] ? whatIf(ctx, choices, selected, detail.best) : null),
    [ctx, choices, selected, detail],
  );

  if (!region || !game) return null;
  const vars = stageVars(region, player.final, money, percent);
  const label = (stageId: string, option: string) => t(`stages.${stageId}.options.${option}.label`, vars);
  const differ = choices.filter((c, i) => c !== best.path[i]).length;
  const pct = percentOfOptimal(player.score, best.score);

  const series: Series[] = [
    { id: "you", label: t("results.yourLine"), color: "var(--line)", points: curve(ctx, player) },
    { id: "express", label: t("results.express"), color: "var(--express)", points: curve(ctx, express) },
  ];
  if (showWhatIf && alt) series.push({ id: "whatif", label: t("results.whatIf"), color: "var(--whatif)", dashed: true, points: curve(ctx, alt) });

  const endAge = Math.round(player.final.age);
  const rows: { key: string; label: string; you: string; best: string }[] = [
    { key: "nw", label: t("results.scoreNetWorth"), you: money(netWorthReal(player.final)), best: money(netWorthReal(express.final)) },
    {
      key: "cushion",
      label: t("results.scoreCushion"),
      you: t("results.months", { value: cushion(player.breakdown.emergencyMonths) }),
      best: t("results.months", { value: cushion(express.breakdown.emergencyMonths) }),
    },
    { key: "debt", label: t("results.scoreDebt"), you: money(player.final.debt / player.final.priceLevel), best: money(express.final.debt / express.final.priceLevel) },
    { key: "credit", label: t("results.scoreCredit"), you: t("results.outOf", { value: Math.round(player.breakdown.credit) }), best: t("results.outOf", { value: Math.round(express.breakdown.credit) }) },
    { key: "wellbeing", label: t("results.scoreWellbeing"), you: t("results.outOf", { value: Math.round(player.breakdown.wellbeing) }), best: t("results.outOf", { value: Math.round(express.breakdown.wellbeing) }) },
  ];

  const detailPanel =
    detail && selected !== null ? (
            <section className="rise rounded-sign bg-panel p-6" aria-live="polite" key={selected}>
              <p className="flex items-center gap-3 text-2xl font-extrabold">
                <StageIcon id={ctx.stages[selected].id} size={26} /> {t(`stages.${ctx.stages[selected].id}.title`, vars)}
              </p>
              <dl className="mt-4 space-y-3 text-lg">
                <div>
                  <dt className="text-ink-2">{t("results.youChose")}</dt>
                  <dd className="font-extrabold">{label(detail.stageId, detail.chosen)}</dd>
                </div>
                <div>
                  <dt className="text-ink-2">{t("results.bestChoice")}</dt>
                  <dd className="font-extrabold text-express">{label(detail.stageId, detail.best)}</dd>
                </div>
              </dl>
              {alt ? (
                <>
                  <p className="mt-4 text-lg">{t("results.difference", {
                      points: Math.round(alt.score - player.score),
                      money: `${netWorthReal(alt.final) >= netWorthReal(player.final) ? "+" : "−"}${money(Math.abs(netWorthReal(alt.final) - netWorthReal(player.final)))}`,
                    })}</p>
                  <button
                    type="button"
                    onClick={() => setShowWhatIf((v) => !v)}
                    aria-pressed={showWhatIf}
                    className="mt-4 rounded-sign border-[3px] border-ink px-4 py-2 font-bold hover:bg-ink hover:text-ground"
                  >
                    {showWhatIf ? t("results.hideWhatIf") : t("results.showWhatIf")}
                  </button>
                </>
              ) : (
                <p className="mt-4 text-lg font-bold text-express">{t("results.sameAsBest")}</p>
              )}
              <button
                type="button"
                onClick={() => setGame({ ...game, choices: choices.slice(0, selected) })}
                className="mt-4 flex items-center gap-2 rounded-sign bg-ink px-4 py-2.5 font-bold text-ground hover:bg-ink-2"
              >
                <RotateCcw aria-hidden="true" size={18} /> {t("results.replayFrom")}
              </button>
            </section>
    ) : null;

  return (
    <div>
      <header className="rise">
        <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-extrabold leading-none tracking-[-0.03em]">{t("results.title")}</h1>
        <p className="mt-3 text-xl text-ink-2">{t("results.subtitle", { start: ctx.startAge, end: endAge, countryIn: profile?.city ? `${profile.city}, ${region.name}` : region.nameIn })}</p>
        <p className="mt-6 max-w-3xl text-[clamp(1.5rem,3vw,2.25rem)] font-extrabold leading-tight tracking-[-0.02em]">
          {t("results.percent", { percent: pct })}{" "}
          <span className="text-ink-2">{t("results.stationsDiffer", { count: differ })}</span>
        </p>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section aria-label={t("results.yourLine")}>
          <div className="mb-4 flex flex-wrap gap-x-6 gap-y-2 text-sm font-bold">
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-7 rounded-full bg-line" /> {t("results.yourLine")}
            </span>
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="h-1.5 w-7 rounded-full bg-express" /> {t("results.express")}
            </span>
          </div>
          <p className="mb-4 text-ink-2">{t("results.tapStation")}</p>
          <ol className="relative">
            {ctx.stages.map((stage, i) => {
              const same = choices[i] === best.path[i];
              const isSel = selected === i;
              const last = i === ctx.stages.length - 1;
              return (
                <li key={stage.id} className="relative">
                  {!last && (
                    <>
                      <span aria-hidden="true" className="absolute left-[18px] top-7 h-full w-1.5 bg-line" />
                      <span aria-hidden="true" className="absolute left-[58px] top-7 h-full w-1.5 bg-express" />
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(isSel ? null : i);
                      setShowWhatIf(false);
                    }}
                    aria-pressed={isSel}
                    className={`relative flex w-full items-start gap-0 rounded-sign py-2 pr-3 text-left ${isSel ? "bg-panel" : "hover:bg-panel/60"}`}
                  >
                    <span className="relative h-10 w-20 shrink-0">
                      {same ? (
                        // Interchange: both lines stop at the same station.
                        <span className="absolute left-[6px] top-1 h-8 w-[66px] rounded-full border-[4px] border-ink bg-ground" />
                      ) : (
                        <>
                          <span className="absolute left-[6px] top-1 size-8 rounded-full border-[4px] border-ink bg-line" />
                          <span className="absolute left-[46px] top-1 size-8 rounded-full border-[4px] border-ink bg-express" />
                        </>
                      )}
                    </span>
                    <span className="min-w-0 pl-2">
                      <span className="flex items-center gap-2 font-extrabold">
                        <StageIcon id={stage.id} size={18} className="shrink-0 text-ink-2" />
                        {t(`stages.${stage.id}.title`, vars)}
                      </span>
                      <span className="block text-ink-2">{label(stage.id, choices[i])}</span>
                      {!same && <span className="block font-bold text-express">→ {label(stage.id, best.path[i])}</span>}
                    </span>
                  </button>
                  {isSel && <div className="mb-4 ml-20 mt-1 lg:hidden">{detailPanel}</div>}
                </li>
              );
            })}
          </ol>
        </section>

        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="hidden lg:block">{detailPanel}</div>

          <div className="mt-8">
            <NetWorthChart series={series} title={t("results.chartTitle")} />
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-extrabold">{t("results.breakdown")}</h2>
            <table className="mt-3 w-full text-left">
              <thead>
                <tr className="text-sm text-ink-2">
                  <th scope="col" className="py-1.5 font-normal" />
                  <th scope="col" className="py-1.5 font-bold">{t("results.yourLine")}</th>
                  <th scope="col" className="py-1.5 font-bold text-express">{t("results.express")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.key} className="border-t-2 border-panel-strong">
                    <th scope="row" className="py-2 pr-3 font-normal text-ink-2">{r.label}</th>
                    <td className="py-2 pr-3 font-extrabold tabular-nums">{r.you}</td>
                    <td className="py-2 font-extrabold tabular-nums text-express">{r.best}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-sm text-ink-2">{t("results.scoreNote")}</p>
          </section>

          <button
            type="button"
            onClick={() => setGame({ seed: Math.floor(Math.random() * 2 ** 31), choices: [] })}
            className="mt-8 rounded-sign bg-line px-6 py-3 text-lg font-extrabold text-line-ink ring-[3px] ring-ink hover:brightness-95"
          >
            {t("results.playAgain")}
          </button>
        </div>
      </div>
    </div>
  );
}
