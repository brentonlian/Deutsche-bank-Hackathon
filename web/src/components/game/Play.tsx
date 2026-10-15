"use client";

import { ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createContext, initialState, simulate } from "@/lib/game/engine";
import { stageVars } from "@/lib/game/vars";
import { getPersona } from "@/content/personas";
import { REGIONS } from "@/lib/regions";
import { useApp } from "../AppState";
import { ReadAloud } from "../ReadAloud";
import { LineRail } from "./LineRail";
import { MoneyPanel } from "./MoneyPanel";
import { Results } from "./Results";
import { ScamGame } from "./ScamGame";
import { StageIcon } from "./StageIcon";

export function Play() {
  const app = useApp();
  const { profile, game, region, t, money, percent } = app;
  const router = useRouter();
  /** Index of the stage whose outcome is being shown before moving on. */
  const [reveal, setReveal] = useState<number | null>(null);

  useEffect(() => {
    if (app.ready && (!profile || !game)) router.replace("/");
  }, [app.ready, profile, game, router]);

  const ctx = useMemo(
    () => (profile && game ? createContext(REGIONS[profile.regionId], profile.group, profile.age, profile.income, game.seed) : null),
    [profile, game],
  );
  const result = useMemo(() => (ctx && game ? simulate(ctx, game.choices) : null), [ctx, game]);

  if (!app.ready || !ctx || !game || !region || !result || !profile) return null;

  const stages = ctx.stages;
  const current = game.choices.length;
  const state = result.final.periods > 0 || current > 0 ? result.final : initialState(ctx);
  const vars = stageVars(region, state, money, percent);

  const choose = (optionId: string) => {
    app.setGame({ ...game, choices: [...game.choices, optionId] });
    setReveal(current);
  };

  if (current >= stages.length && reveal === null) {
    return <Results ctx={ctx} choices={game.choices} />;
  }

  const showing = reveal !== null ? reveal : current;
  const stage = stages[showing];
  const snapshot = reveal !== null ? result.timeline[reveal] : null;
  const varsAtStage = snapshot ? stageVars(region, snapshot.before, money, percent) : vars;
  const title = t(`stages.${stage.id}.title`, varsAtStage);
  const body = t(`stages.${stage.id}.body`, varsAtStage);
  const options = stage.options(ctx);
  // Demo personas only link to the lessons prepared for them.
  const persona = getPersona(profile.personaId);
  const hasLesson = !persona || (persona.topics as readonly string[]).includes(stage.topic);

  return (
    <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-12">
      <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
        <LineRail stages={stages} choices={game.choices} current={reveal ?? current} vars={vars} />
      </aside>

      <div className="min-w-0">
        <MoneyPanel state={snapshot ? snapshot.after : state} previous={snapshot?.before} />

        <section key={`${showing}-${reveal !== null}`} className="rise mt-8" aria-labelledby="stage-title">
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-full border-[5px] border-ink bg-line text-line-ink">
              <StageIcon id={stage.id} size={30} />
            </span>
            <p className="font-bold text-ink-2">
              {t("game.stationOf", { current: showing + 1, total: stages.length })} ·{" "}
              {t("game.age", { age: Math.round((snapshot?.before ?? state).age) })}
              {stage.minigame && <span className="ml-2 rounded-sign bg-ink px-2 py-0.5 text-sm text-ground">{t("game.minigame")}</span>}
            </p>
          </div>

          <h1 id="stage-title" className="mt-5 text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-balance">
            {title}
          </h1>
          <p className="mt-3 max-w-[62ch] text-xl leading-relaxed">{body}</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ReadAloud
              key={`${showing}-${reveal}`}
              text={[title, body, ...options.map((o) => t(`stages.${stage.id}.options.${o.id}.label`, varsAtStage))].join(". ")}
            />
            {hasLesson && (
            <Link href={`/learn/${stage.topic}`} className="inline-flex items-center gap-2 rounded-sign px-3 py-1.5 text-sm font-bold text-ink-2 underline hover:text-ink">
              <BookOpen aria-hidden="true" size={18} /> {t("game.learnWhy")}: {t(`topics.${stage.topic}`)}
            </Link>
            )}
          </div>

          {stage.id === "where-to-save" && reveal === null && (
            <aside className="mt-6 max-w-[62ch] rounded-sign bg-line-soft px-5 py-4">
              <p className="font-bold">{t("game.localFact", { country: region.name })}</p>
              <p className="mt-1">{region.institutions.depositInsurance.value}</p>
              <a href={region.institutions.depositInsurance.source} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-ink-2 underline">
                {t("game.source")} <ExternalLink aria-hidden="true" size={14} /> · {t("game.verified", { date: region.institutions.depositInsurance.verified })}
              </a>
            </aside>
          )}

          {reveal !== null && snapshot ? (
            <div className="mt-8 max-w-2xl" role="status">
              <p className="text-lg">
                {t("results.youChose")}: <strong>{t(`stages.${stage.id}.options.${snapshot.choice}.label`, varsAtStage)}</strong>
              </p>
              <p className="mt-2 text-2xl font-extrabold text-ink-2">
                {t("game.yearsPass", { years: ctx.yearsPerStage.toLocaleString(region.locale, { maximumFractionDigits: 1 }) })}
              </p>
              <button
                type="button"
                autoFocus
                onClick={() => setReveal(null)}
                className="mt-6 flex items-center gap-2 rounded-sign bg-ink px-6 py-3 text-lg font-bold text-ground hover:bg-ink-2"
              >
                {t("onboarding.next")} <ArrowRight aria-hidden="true" size={20} />
              </button>
            </div>
          ) : stage.minigame === "scam" ? (
            <div className="mt-8">
              <ScamGame region={region} seed={game.seed + showing} onDone={(passed) => choose(passed ? "pass" : "fail")} />
            </div>
          ) : (
            <fieldset className="mt-8">
              <legend className="mb-3 text-lg font-bold">{t("game.choose")}</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                {options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    onClick={() => choose(o.id)}
                    className="group rounded-sign border-[3px] border-panel-strong bg-panel p-5 text-left transition-colors hover:border-ink focus-visible:border-ink"
                  >
                    <span className="block text-xl font-extrabold leading-tight">{t(`stages.${stage.id}.options.${o.id}.label`, vars)}</span>
                    <span className="mt-1.5 block text-ink-2">{t(`stages.${stage.id}.options.${o.id}.hint`, vars)}</span>
                  </button>
                ))}
              </div>
            </fieldset>
          )}
        </section>
      </div>
    </div>
  );
}
