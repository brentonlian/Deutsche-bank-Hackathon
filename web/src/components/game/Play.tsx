"use client";

import { BookOpen, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getPersona } from "@/content/personas";
import { createContext, initialState, simulate } from "@/lib/game/engine";
import { stageVars } from "@/lib/game/vars";
import { REGIONS } from "@/lib/regions";
import { useApp } from "../AppState";
import { ReadAloud } from "../ReadAloud";
import { MarketPick } from "./MarketPick";
import { MoneyPanel } from "./MoneyPanel";
import { MoneyStory } from "./MoneyStory";
import { Results } from "./Results";
import { ScamGame } from "./ScamGame";
import { StageIcon } from "./StageIcon";

/**
 * Progress without spoilers: you see how far along the line you are, never what is coming next
 * (knowing an emergency is two stops away would change how you play).
 */
function Progress({ done, total }: { done: number; total: number }) {
  const { t } = useApp();
  return (
    <div>
      <p className="text-sm font-bold text-ink-2">{t("game.stationOf", { current: Math.min(done + 1, total), total })}</p>
      <div className="mt-2 flex items-center" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <span key={i} className="flex flex-1 items-center last:flex-none">
            <span className={`size-4 shrink-0 rounded-full border-[3px] ${i < done ? "border-ink bg-line" : i === done ? "station-here border-ink bg-ground" : "border-panel-strong bg-ground"}`} />
            {i < total - 1 && <span className={`h-1.5 flex-1 ${i < done ? "bg-line" : "bg-panel-strong"}`} />}
          </span>
        ))}
      </div>
    </div>
  );
}

export function Play() {
  const app = useApp();
  const { profile, game, region, t, money, percent } = app;
  const router = useRouter();
  /** Index of the stage whose money story is being shown before moving on. */
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
  const state = current > 0 ? result.final : initialState(ctx);

  const choose = (optionId: string) => {
    app.setGame({ ...game, choices: [...game.choices, optionId] });
    setReveal(current);
  };

  if (current >= stages.length && reveal === null) {
    return <Results ctx={ctx} choices={game.choices} />;
  }

  // Between decisions: the full money story of what just happened.
  if (reveal !== null) {
    const snap = result.timeline[reveal];
    return (
      <div className="mx-auto max-w-3xl">
        <Progress done={reveal + 1} total={stages.length} />
        <p className="mt-8 font-bold text-ink-2">
          {t("results.youChose")}: {t(`stages.${snap.stageId}.options.${snap.choice}.label`, stageVars(region, snap.before, money, percent))}
        </p>
        <div className="mt-6">
          <MoneyStory snap={snap} region={region} onNext={() => setReveal(null)} />
        </div>
      </div>
    );
  }

  const stage = stages[current];
  const vars = stageVars(region, state, money, percent);
  const title = t(`stages.${stage.id}.title`, vars);
  const body = t(`stages.${stage.id}.body`, vars);
  const options = stage.options(ctx);
  // Demo personas only link to the lessons prepared for them.
  const persona = getPersona(profile.personaId);
  const hasLesson = !persona || (persona.topics as readonly string[]).includes(stage.topic);

  return (
    <div className="mx-auto max-w-4xl">
      <Progress done={current} total={stages.length} />
      <div className="mt-6">
        <MoneyPanel state={state} />
      </div>

      <section key={current} className="rise mt-10" aria-labelledby="stage-title">
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center rounded-full border-[5px] border-ink bg-line text-line-ink">
            <StageIcon id={stage.id} size={30} />
          </span>
          <p className="font-bold text-ink-2">
            {t("game.age", { age: Math.round(state.age) })}
            {stage.minigame && <span className="ml-2 rounded-sign bg-ink px-2 py-0.5 text-sm text-ground">{t("game.minigame")}</span>}
          </p>
        </div>

        <h1 id="stage-title" className="mt-5 text-[clamp(2rem,4.5vw,3.25rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-balance">
          {title}
        </h1>
        <p className="mt-3 max-w-[62ch] text-xl leading-relaxed">{body}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <ReadAloud key={current} text={[title, body, ...options.map((o) => t(`stages.${stage.id}.options.${o.id}.label`, vars))].join(". ")} />
          {hasLesson && (
            <Link href={`/learn/${stage.topic}`} className="inline-flex items-center gap-2 rounded-sign px-3 py-1.5 text-sm font-bold text-ink-2 underline hover:text-ink">
              <BookOpen aria-hidden="true" size={18} /> {t("game.learnWhy")}: {t(`topics.${stage.topic}`)}
            </Link>
          )}
        </div>

        {stage.id === "where-to-save" && (
          <aside className="mt-6 max-w-[62ch] rounded-sign bg-line-soft px-5 py-4">
            <p className="font-bold">{t("game.localFact", { countryIn: region.nameIn })}</p>
            <p className="mt-1">{region.institutions.depositInsurance.value}</p>
            <a href={region.institutions.depositInsurance.source} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-sm text-ink-2 underline">
              {t("game.source")} <ExternalLink aria-hidden="true" size={14} /> · {t("game.verified", { date: region.institutions.depositInsurance.verified })}
            </a>
          </aside>
        )}

        <div className="mt-8">
          {stage.minigame === "scam" ? (
            <ScamGame region={region} seed={game.seed + current} onDone={(passed) => choose(passed ? "pass" : "fail")} />
          ) : stage.minigame === "market" ? (
            <MarketPick region={region} onDone={choose} />
          ) : (
            <fieldset>
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
        </div>
      </section>
    </div>
  );
}
