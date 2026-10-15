"use client";

import { BookOpen, Calculator, Map, ScrollText, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, type ReactNode } from "react";
import { netWorthReal } from "@/lib/game/engine";
import type { LogItem } from "@/lib/game/lifeLog";
import { clamp, monthlyExpenses } from "@/lib/game/money";
import type { GameState } from "@/lib/game/types";
import { learningLine, TOOLS } from "@/lib/learning";
import type { RegionPack } from "@/lib/regions/schema";
import { useApp, type Profile } from "../AppState";
import { SourceLink } from "../SourceLink";
import { MoneyPanel } from "./MoneyPanel";

/**
 * A modal sheet on the native <dialog> element, which gives focus trapping and Escape for free.
 * Life events pass `locked` so they can't be dismissed without a decision.
 */
export function Sheet({ open, onClose, label, locked, children }: { open: boolean; onClose?: () => void; label: string; locked?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  const { t } = useApp();
  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        if (!locked) onClose?.();
      }}
      className="m-auto max-h-[92dvh] w-[min(56rem,calc(100vw-1.5rem))] overflow-y-auto rounded-sign border-[3px] border-ink bg-ground p-5 text-ink backdrop:bg-ink/60 sm:p-8"
    >
      {!locked && onClose && (
        <button type="button" onClick={onClose} className="float-right -mr-1 -mt-1 rounded-sign p-2 text-ink-2 hover:bg-panel hover:text-ink" aria-label={t("life.close")}>
          <X aria-hidden="true" size={22} />
        </button>
      )}
      {open && children}
    </dialog>
  );
}

/** The top of the screen: who you are, how old, where, and what you're worth. */
export function CharacterCard({ name, state, place, region }: { name: string; state: GameState; place: string; region: RegionPack }) {
  const { t, money } = useApp();
  return (
    <section aria-label={t("life.character")} className="flex items-center gap-4 rounded-sign bg-panel p-4 sm:p-5">
      <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full border-[4px] border-ink bg-line text-2xl font-extrabold text-line-ink sm:size-16">
        {name.slice(0, 1).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xl font-extrabold leading-tight sm:text-2xl">{name}</p>
        <p className="text-ink-2">
          {t("game.age", { age: Math.floor(state.age + 1e-6) })} · {place} {region.flag}
        </p>
        <p className="text-sm text-ink-2">{t("life.pay", { income: money(state.income) })}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm text-ink-2">{t("game.netWorth")}</p>
        <p className={`text-2xl font-extrabold tabular-nums sm:text-3xl ${netWorthReal(state) < 0 ? "text-danger" : ""}`}>{money(netWorthReal(state))}</p>
        <p className="text-xs text-ink-2">{t("game.inTodaysMoney")}</p>
      </div>
    </section>
  );
}

function Bar({ label, value, display }: { label: string; value: number; display: string }) {
  const v = clamp(value, 0, 100);
  const color = v >= 60 ? "bg-express" : v >= 30 ? "bg-line" : "bg-danger";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-bold">{label}</span>
        <span className="tabular-nums text-ink-2">{display}</span>
      </div>
      <span className="mt-1 block h-3 overflow-hidden rounded-full bg-panel-strong" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(v)} aria-valuetext={display}>
        <span className={`block h-full rounded-full transition-[width] duration-700 ${color}`} style={{ width: `${v}%` }} />
      </span>
    </div>
  );
}

/**
 * BitLife-style stat bars. Wellbeing, credit and the cash cushion come from the engine and count
 * toward the score; know-how is the player's progress on the learning line.
 */
export function StatBars({ state, profile }: { state: GameState; profile: Profile }) {
  const { t, progress } = useApp();
  const months = state.cash / Math.max(1, monthlyExpenses(state));
  const stations = learningLine(profile).filter((s) => s.kind !== "game");
  const learned = stations.filter((s) => progress[s.key]).length;
  return (
    <section aria-label={t("life.stats")} className="grid grid-cols-2 gap-x-6 gap-y-3 rounded-sign bg-panel p-4 sm:grid-cols-4">
      <Bar label={t("game.wellbeing")} value={state.wellbeing} display={`${Math.round(state.wellbeing)} / 100`} />
      <Bar label={t("life.statCredit")} value={state.credit} display={`${Math.round(state.credit)} / 100`} />
      <Bar label={t("life.statCushion")} value={(Math.min(months, 6) / 6) * 100} display={t("life.months", { n: Math.max(0, Math.floor(months)) })} />
      <Bar label={t("life.statKnowhow")} value={(learned / stations.length) * 100} display={t("life.learned", { done: learned, total: stations.length })} />
    </section>
  );
}

const TONE = { good: "text-express", bad: "text-danger", muted: "text-ink-2" } as const;

/** The scrolling life story, grouped by age, newest at the bottom like BitLife. */
export function LifeLog({ items, choiceLabel, onStory }: { items: LogItem[]; choiceLabel: (stageIndex: number) => string; onStory: (stageIndex: number) => void }) {
  const { t } = useApp();
  const list = useRef<HTMLOListElement>(null);
  const shown = useRef(false);
  // Keep the newest year in view inside the log, without moving the page. Jump on first show, glide after.
  useEffect(() => {
    const el = list.current;
    if (!el) return;
    const glide = shown.current && !matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: glide ? "smooth" : "auto" });
    shown.current = true;
  }, [items.length]);

  const groups: { age: number; from?: number; items: LogItem[] }[] = [];
  for (const it of items) {
    const g = groups.at(-1);
    if (g && g.age === it.age) g.items.push(it);
    else groups.push({ age: it.age, from: it.kind === "line" ? it.from : undefined, items: [it] });
  }

  return (
    <section aria-label={t("life.logTitle")} className="rounded-sign border-[3px] border-panel-strong bg-ground">
      <ol ref={list} className="max-h-[38dvh] min-h-40 overflow-y-auto px-4 py-3 sm:px-5" aria-live="polite">
        {groups.map((g, gi) => (
          <li key={`${g.age}-${gi}`} className="border-b-2 border-panel last:border-b-0">
            <p className="pt-3 font-extrabold text-line-ink">
              <span className="rounded-sign bg-line px-2 py-0.5">{g.from ? t("life.ageRange", { from: g.from, to: g.age }) : t("game.age", { age: g.age })}</span>
            </p>
            <ul className="space-y-1 py-2">
              {g.items.map((it, i) => (
                <li key={i} className="leading-snug">
                  {it.kind === "line" && <span className={it.line.tone ? TONE[it.line.tone] : ""}>{t(`life.log.${it.line.key}`, it.line.vars)}</span>}
                  {it.kind === "choice" && (
                    <span className="font-bold">
                      {t("results.youChose")}: {choiceLabel(it.stageIndex)}
                    </span>
                  )}
                  {it.kind === "story" && (
                    <button type="button" onClick={() => onStory(it.stageIndex)} className="mt-1 inline-flex items-center gap-2 font-bold underline hover:text-ink-2">
                      <ScrollText aria-hidden="true" size={18} /> {t("life.storyLink", { from: it.from, to: it.to })}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** What you own and owe, each with the real local product behind it and its source. */
export function AssetsPanel({ state, region }: { state: GameState; region: RegionPack }) {
  const { t, percent } = useApp();
  const p = region.products;
  const saver = { cash: p.cashAtHome, everyday: p.everydayAccount, savings: p.savingsAccount, informal: null }[state.vehicle];
  const rows = [
    saver
      ? { label: t("game.savings"), name: saver.name, rate: percent(saver.ratePct), source: saver.source, verified: saver.verified }
      : { label: t("game.savings"), name: region.informalSavings?.name ?? "", rate: percent(region.informalSavings?.ratePct ?? 0) },
    { label: t("game.invested"), name: p.indexFund.name, rate: percent(p.indexFund.ratePct), source: p.indexFund.source, verified: p.indexFund.verified },
    { label: t("game.pension"), name: p.retirementProduct.name, rate: percent(p.retirementProduct.ratePct), source: p.retirementProduct.source, verified: p.retirementProduct.verified },
  ];
  return (
    <div>
      <h2 className="text-2xl font-extrabold">{t("life.assets")}</h2>
      <div className="mt-4">
        <MoneyPanel state={state} />
      </div>
      <h3 className="mt-6 text-lg font-extrabold">{t("life.holdingsTitle")}</h3>
      <ul className="mt-2 divide-y-2 divide-panel-strong border-y-2 border-panel-strong">
        {rows.map((r) => (
          <li key={r.label} className="py-3">
            <span className="block text-sm text-ink-2">{r.label}</span>
            <span className="font-extrabold">{r.name}</span> <span className="tabular-nums text-ink-2">· {t("market.value.perYear", { rate: r.rate })}</span>
            {r.source && (
              <span className="block">
                <SourceLink href={r.source} date={r.verified} />
              </span>
            )}
          </li>
        ))}
        <li className="py-3">
          <span className="block text-sm text-ink-2">{t("game.debt")}</span>
          {state.debt >= 1 ? (
            <span className="font-extrabold text-danger">{t("life.debtAt", { rate: percent(state.debtApr) })}</span>
          ) : (
            <span className="font-extrabold text-express">{t("life.noDebt")}</span>
          )}
          <span className="block">
            <SourceLink href={p.expensiveCreditSource} date={region.economy.verified} />
          </span>
        </li>
      </ul>
      <p className="mt-4">
        <strong>{t("guide.depositInsurance")}</strong> {region.institutions.depositInsurance.value}{" "}
        <SourceLink href={region.institutions.depositInsurance.source} date={region.institutions.depositInsurance.verified} />
      </p>
    </div>
  );
}

/** BitLife's Activities menu, here: go and learn. The game picks up where you left it. */
export function ActivitiesPanel({ profile, region, periods, onStory }: { profile: Profile; region: RegionPack; periods: { stageIndex: number; from: number; to: number }[]; onStory: (i: number) => void }) {
  const { t, progress } = useApp();
  const line = learningLine(profile);
  const item = "flex items-center gap-3 rounded-sign border-[3px] border-panel-strong bg-panel px-4 py-3 font-bold hover:border-ink";
  const done = (key: string) => (progress[key] ? <span className="ml-auto text-sm text-express">✓</span> : null);
  return (
    <div>
      <h2 className="text-2xl font-extrabold">{t("life.activities")}</h2>
      <p className="mt-1 text-ink-2">{t("life.activitiesIntro")}</p>

      <h3 className="mt-6 text-lg font-extrabold">{t("life.learnTitle")}</h3>
      <ul className="mt-2 grid gap-2 sm:grid-cols-2">
        {line
          .filter((s) => s.kind === "guide" || s.kind === "lesson")
          .map((s) => (
            <li key={s.key}>
              <Link href={s.href} className={item}>
                {s.kind === "guide" ? <Map aria-hidden="true" size={20} /> : <BookOpen aria-hidden="true" size={20} />}
                {s.kind === "guide" ? t("hub.guideTitle", { countryIn: region.nameIn }) : t(`topics.${s.topic}`)}
                {done(s.key)}
              </Link>
            </li>
          ))}
      </ul>

      <h3 className="mt-6 text-lg font-extrabold">{t("life.practiseTitle")}</h3>
      <ul className="mt-2 grid gap-2 sm:grid-cols-3">
        {TOOLS.map((id) => (
          <li key={id}>
            <Link href={`/tools/${id}`} className={item}>
              <Calculator aria-hidden="true" size={20} /> {t(`tools.${id}.title`)}
              {done(`tool:${id}`)}
            </Link>
          </li>
        ))}
      </ul>

      <h3 className="mt-6 text-lg font-extrabold">{t("life.lookBackTitle")}</h3>
      {periods.length ? (
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {periods.map((p) => (
            <li key={p.stageIndex}>
              <button type="button" onClick={() => onStory(p.stageIndex)} className={`${item} w-full text-left`}>
                <ScrollText aria-hidden="true" size={20} /> {t("life.storyLink", { from: p.from, to: p.to })}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-ink-2">{t("life.lookBackEmpty")}</p>
      )}
    </div>
  );
}
