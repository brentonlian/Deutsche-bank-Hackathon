"use client";

import { BookOpen, ExternalLink, Gem, Plus, Shapes, SkipForward } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getPersona } from "@/content/personas";
import { createContext, initialState, simulate } from "@/lib/game/engine";
import { buildLog, lifeYears, stateAfterYear } from "@/lib/game/lifeLog";
import type { GameContext, GameState } from "@/lib/game/types";
import { stageSources, stageVars } from "@/lib/game/vars";
import { REGIONS } from "@/lib/regions";
import type { RegionPack } from "@/lib/regions/schema";
import { useApp, type GameSave, type Profile } from "../AppState";
import { ReadAloud } from "../ReadAloud";
import { SourceLink } from "../SourceLink";
import { ActivitiesPanel, AssetsPanel, CharacterCard, LifeLog, Sheet, StatBars } from "./Life";
import { MarketPick } from "./MarketPick";
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

type Panel = { kind: "assets" } | { kind: "activities" } | { kind: "story"; index: number } | { kind: "result"; index: number };

/**
 * Life Path, played like BitLife: tap "Age +1" to live one year at a time and read what happened in
 * your life log, and decide when a life event pops up. Every year's numbers come from the same
 * deterministic engine, so the express line, what-if and replay still work at the end.
 */
export function Play() {
  const app = useApp();
  const { profile, game, region, t, money, percent } = app;
  const router = useRouter();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [showSummary, setShowSummary] = useState(false);

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
  const last = result.timeline.at(-1);
  const lastYears = last ? lifeYears(last.ledger.yearly) : [];
  const yearsInLast = lastYears.length;
  const revealed = Math.min(game.revealed ?? yearsInLast, yearsInLast);
  const aging = Boolean(last) && revealed < yearsInLast;
  const finished = current >= stages.length && !aging;

  // Where the player stands right now: after the years they have lived through, not the whole period.
  const state: GameState = !last ? initialState(ctx) : revealed === 0 ? last.decided : stateAfterYear(last.decided, lastYears[revealed - 1]);

  if (finished && showSummary) return <Results ctx={ctx} choices={game.choices} />;

  const fmt = { money, percent };
  const log = buildLog(result, ctx, revealed, fmt);
  const choiceLabel = (i: number) => {
    const snap = result.timeline[i];
    return t(`stages.${snap.stageId}.options.${snap.choice}.label`, stageVars(region, snap.before, money, percent));
  };
  const periods = log.flatMap((it) => (it.kind === "story" ? [{ stageIndex: it.stageIndex, from: it.from, to: it.to }] : []));
  const persona = getPersona(profile.personaId);
  const name = persona ? t(`personas.${persona.id}.name`) : t("life.you");
  const place = profile.city ? `${profile.city}, ${region.name}` : region.name;

  const choose = (optionId: string) => {
    app.setGame({ ...game, choices: [...game.choices, optionId], revealed: 0 });
    setPanel({ kind: "result", index: current });
  };
  const ageUp = () => app.setGame({ ...game, revealed: revealed + 1 });
  const skip = () => app.setGame({ ...game, revealed: yearsInLast });
  const eventDue = !aging && current < stages.length && panel?.kind !== "result";

  return (
    <div className="mx-auto max-w-4xl">
      <Progress done={current} total={stages.length} />
      <div className="mt-5 space-y-4">
        <CharacterCard name={name} state={state} place={place} region={region} />
        <LifeLog
          items={[{ kind: "line", age: Math.floor(ctx.startAge), line: { key: "start", vars: { age: String(ctx.startAge), place, income: money(ctx.startIncome) } } }, ...log]}
          choiceLabel={choiceLabel}
          onStory={(index) => setPanel({ kind: "story", index })}
        />
        <StatBars state={state} profile={profile} />
      </div>

      <nav aria-label={t("life.actions")} className="sticky bottom-0 z-10 -mx-4 mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-t-[3px] border-panel-strong bg-ground px-4 py-3">
        <button type="button" onClick={() => setPanel({ kind: "assets" })} className="flex flex-col items-center gap-1 rounded-sign px-2 py-2 font-bold hover:bg-panel sm:flex-row sm:justify-center sm:gap-2">
          <Gem aria-hidden="true" size={22} /> {t("life.assets")}
        </button>
        {finished ? (
          <button
            type="button"
            onClick={() => {
              setShowSummary(true);
              window.scrollTo({ top: 0 });
            }}
            className="rounded-full bg-express px-7 py-4 text-lg font-extrabold text-white hover:opacity-90">
            {t("life.summary")}
          </button>
        ) : aging ? (
          <div className="flex flex-col items-center gap-1">
            <button
              type="button"
              onClick={ageUp}
              className="flex size-24 flex-col items-center justify-center rounded-full border-[5px] border-ink bg-line text-line-ink hover:brightness-110 sm:size-28"
            >
              <Plus aria-hidden="true" size={28} strokeWidth={3} />
              <span className="text-lg font-extrabold leading-none">{t("life.ageUp")}</span>
            </button>
            <button type="button" onClick={skip} className="inline-flex items-center gap-1 text-sm font-bold text-ink-2 underline hover:text-ink">
              <SkipForward aria-hidden="true" size={14} /> {t("life.skip")}
            </button>
          </div>
        ) : (
          <span className="rounded-full bg-panel px-5 py-3 font-bold text-ink-2">{t("life.event")}</span>
        )}
        <button type="button" onClick={() => setPanel({ kind: "activities" })} className="flex flex-col items-center gap-1 rounded-sign px-2 py-2 font-bold hover:bg-panel sm:flex-row sm:justify-center sm:gap-2">
          <Shapes aria-hidden="true" size={22} /> {t("life.activities")}
        </button>
      </nav>

      <Sheet open={eventDue} label={t("life.event")} locked>
        {eventDue && <EventCard ctx={ctx} game={game} profile={profile} region={region} state={state} index={current} onChoose={choose} />}
      </Sheet>
      <Sheet open={panel?.kind === "result"} label={t("life.event")} onClose={() => setPanel(null)}>
        {panel?.kind === "result" && result.timeline[panel.index] && (
          <DecisionResult before={result.timeline[panel.index].before} after={result.timeline[panel.index].decided} label={choiceLabel(panel.index)} onClose={() => setPanel(null)} />
        )}
      </Sheet>
      <Sheet open={panel?.kind === "assets"} label={t("life.assets")} onClose={() => setPanel(null)}>
        <AssetsPanel state={state} region={region} />
      </Sheet>
      <Sheet open={panel?.kind === "activities"} label={t("life.activities")} onClose={() => setPanel(null)}>
        <ActivitiesPanel profile={profile} region={region} periods={periods} onStory={(index) => setPanel({ kind: "story", index })} />
      </Sheet>
      <Sheet open={panel?.kind === "story"} label={t("life.lookBackTitle")} onClose={() => setPanel(null)}>
        {panel?.kind === "story" && (
          <>
            <p className="font-bold text-ink-2">
              {t("results.youChose")}: {choiceLabel(panel.index)}
            </p>
            <div className="mt-4">
              <MoneyStory snap={result.timeline[panel.index]} region={region} onNext={() => setPanel(null)} nextLabel={t("life.resultContinue")} />
            </div>
          </>
        )}
      </Sheet>
    </div>
  );
}

/** BitLife's pop-up after a choice: what changed right away. The years that follow come one tap at a time. */
function DecisionResult({ before, after, label, onClose }: { before: GameState; after: GameState; label: string; onClose: () => void }) {
  const { t, money } = useApp();
  const rows = [
    { key: "cash", label: t("game.savings"), value: after.cash - before.cash },
    { key: "invested", label: t("game.invested"), value: after.invested - before.invested },
    { key: "debt", label: t("game.debt"), value: after.debt - before.debt, bad: true },
  ].filter((r) => Math.abs(r.value) >= 1);
  const mood = Math.round(after.wellbeing - before.wellbeing);
  const signed = (v: number) => `${v >= 0 ? "+" : "−"}${money(Math.abs(v))}`;
  return (
    <div className="rise">
      <p className="text-ink-2">{t("results.youChose")}</p>
      <h2 className="mt-1 text-[clamp(1.75rem,4vw,2.5rem)] font-extrabold leading-tight tracking-[-0.02em]">{label}</h2>
      {rows.length ? (
        <ul className="mt-5 flex flex-wrap gap-x-10 gap-y-3">
          {rows.map((r) => {
            const good = r.bad ? r.value < 0 : r.value > 0;
            return (
              <li key={r.key}>
                <span className="block text-ink-2">{r.label}</span>
                <span className={`text-4xl font-extrabold tabular-nums ${good ? "text-express" : "text-danger"}`}>{signed(r.value)}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-4 text-lg">{t("life.resultNothing")}</p>
      )}
      {mood !== 0 && (
        <p className={`mt-4 text-lg font-bold ${mood > 0 ? "text-express" : "text-danger"}`}>
          {t("game.wellbeing")} {mood > 0 ? "+" : "−"}
          {Math.abs(mood)}
        </p>
      )}
      <p className="mt-6 text-lg">{t("life.resultNext")}</p>
      <button type="button" autoFocus onClick={onClose} className="mt-4 rounded-sign bg-ink px-6 py-3 text-lg font-bold text-ground hover:bg-ink-2">
        {t("life.resultContinue")}
      </button>
    </div>
  );
}

/** A life event, as a pop-up card: the situation, local facts and sources, and the choices. */
function EventCard({ ctx, game, profile, region, state, index, onChoose }: { ctx: GameContext; game: GameSave; profile: Profile; region: RegionPack; state: GameState; index: number; onChoose: (id: string) => void }) {
  const { t, money, percent } = useApp();
  const stage = ctx.stages[index];
  const vars = stageVars(region, state, money, percent);
  const sources = stageSources(region, stage.id, { card: t("guide.cardApr"), lender: t("guide.lenderApr") });
  const title = t(`stages.${stage.id}.title`, vars);
  const body = t(`stages.${stage.id}.body`, vars);
  const options = stage.options(ctx);
  // Demo personas only link to the lessons prepared for them.
  const persona = getPersona(profile.personaId);
  const hasLesson = !persona || (persona.topics as readonly string[]).includes(stage.topic);

  return (
    <section className="rise" aria-labelledby="stage-title">
      <div className="flex items-center gap-4">
        <span className="grid size-16 shrink-0 place-items-center rounded-full border-[5px] border-ink bg-line text-line-ink">
          <StageIcon id={stage.id} size={30} />
        </span>
        <p className="font-bold text-ink-2">
          {t("life.event")} · {t("game.age", { age: Math.floor(state.age + 1e-6) })}
          {stage.minigame && <span className="ml-2 rounded-sign bg-ink px-2 py-0.5 text-sm text-ground">{t("game.minigame")}</span>}
        </p>
      </div>

      <h2 id="stage-title" className="mt-5 text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-balance">
        {title}
      </h2>
      <p className="mt-3 max-w-[62ch] text-lg leading-relaxed sm:text-xl">{body}</p>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <ReadAloud key={index} text={[title, body, ...options.map((o) => t(`stages.${stage.id}.options.${o.id}.label`, vars))].join(". ")} />
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

      <div className="mt-6">
        {stage.minigame === "scam" ? (
          <ScamGame region={region} seed={game.seed + index} onDone={(passed) => onChoose(passed ? "pass" : "fail")} />
        ) : stage.minigame === "market" ? (
          <MarketPick region={region} onDone={onChoose} />
        ) : (
          <fieldset>
            <legend className="mb-3 text-lg font-bold">{t("game.choose")}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {options.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onChoose(o.id)}
                  className="group rounded-sign border-[3px] border-panel-strong bg-panel p-5 text-left transition-colors hover:border-ink focus-visible:border-ink"
                >
                  <span className="block text-xl font-extrabold leading-tight">{t(`stages.${stage.id}.options.${o.id}.label`, vars)}</span>
                  <span className="mt-1.5 block text-ink-2">{t(`stages.${stage.id}.options.${o.id}.hint`, vars)}</span>
                </button>
              ))}
            </div>
            {sources.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1">
                {sources.map((s) => (
                  <li key={s.name}>
                    <SourceLink href={s.source} date={s.verified} label={s.name} />
                  </li>
                ))}
              </ul>
            )}
          </fieldset>
        )}
      </div>
    </section>
  );
}
