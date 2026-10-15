"use client";

import { Check, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { mulberry32 } from "@/lib/game/rng";
import type { RegionPack, ScamCard } from "@/lib/regions/schema";
import { useApp } from "../AppState";

const ROUNDS = 4;
const PASS_MARK = 3;

/** Three local scams and one real message, in a seeded order. */
function deal(cards: ScamCard[], seed: number): ScamCard[] {
  const rng = mulberry32(seed);
  const shuffle = <T,>(a: T[]) => a.map((v) => [rng(), v] as const).sort((x, y) => x[0] - y[0]).map(([, v]) => v);
  const scams = shuffle(cards.filter((c) => c.isScam)).slice(0, ROUNDS - 1);
  const legit = shuffle(cards.filter((c) => !c.isScam)).slice(0, 1);
  return shuffle([...scams, ...legit]);
}

/** Scam or Legit? The mini-game that plays when the "scam" life event comes up. */
export function ScamGame({ region, seed, onDone }: { region: RegionPack; seed: number; onDone: (passed: boolean) => void }) {
  const { t } = useApp();
  const cards = useMemo(() => deal(region.scams, seed), [region.scams, seed]);
  const [round, setRound] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const answered = answers.length > round;
  const finished = answers.length === cards.length && round === cards.length;
  const card = cards[Math.min(round, cards.length - 1)];
  const correctCount = answers.filter(Boolean).length;

  const answer = useCallback(
    (saidScam: boolean) => {
      if (answered || finished) return;
      setAnswers((a) => [...a, saidScam === card.isScam]);
    },
    [answered, finished, card],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key.toLowerCase() === "s") answer(true);
      if (e.key.toLowerCase() === "l") answer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [answer]);

  if (finished) {
    const passed = correctCount >= PASS_MARK;
    return (
      <div className="rise rounded-sign bg-panel p-6">
        <p className="text-3xl font-extrabold">{t("scam.result", { correct: correctCount, total: cards.length })}</p>
        <p className={`mt-2 text-lg font-bold ${passed ? "text-express" : "text-danger"}`}>{t(passed ? "scam.passed" : "scam.failed")}</p>
        <button
          type="button"
          onClick={() => onDone(passed)}
          className="mt-6 rounded-sign bg-ink px-6 py-3 text-lg font-bold text-ground hover:bg-ink-2"
        >
          {t("onboarding.next")}
        </button>
      </div>
    );
  }

  const wasRight = answers[round];
  return (
    <div>
      <p className="font-bold text-ink-2">
        {t("scam.intro")} <span className="tabular-nums">({round + 1}/{cards.length})</span>
      </p>
      <article key={card.id} className="rise mt-4 max-w-xl rounded-sign bg-ink p-5 text-ground" aria-live="polite">
        <p className="text-sm opacity-75">
          {t(`scam.channel.${card.channel}`)} · <span className="font-bold">{card.sender}</span>
        </p>
        <p className="mt-2 text-xl font-bold leading-snug">{card.message}</p>
      </article>

      {!answered ? (
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => answer(true)}
            className="flex items-center gap-2 rounded-sign border-[3px] border-danger bg-danger px-6 py-3 text-lg font-extrabold text-white hover:brightness-110"
          >
            <ShieldAlert aria-hidden="true" size={22} /> {t("scam.scam")}
          </button>
          <button
            type="button"
            onClick={() => answer(false)}
            className="flex items-center gap-2 rounded-sign border-[3px] border-express bg-express px-6 py-3 text-lg font-extrabold text-white hover:brightness-110"
          >
            <ShieldCheck aria-hidden="true" size={22} /> {t("scam.legit")}
          </button>
          <p className="w-full text-sm text-ink-2">{t("scam.keys")}</p>
        </div>
      ) : (
        <div className="rise mt-5 max-w-xl" role="status">
          <p className={`flex items-center gap-2 text-xl font-extrabold ${wasRight ? "text-express" : "text-danger"}`}>
            {wasRight ? <Check aria-hidden="true" size={24} strokeWidth={3} /> : <X aria-hidden="true" size={24} strokeWidth={3} />}
            {t(wasRight ? "scam.correct" : "scam.wrong")} {card.isScam ? t("scam.scam") : t("scam.legit")}.
          </p>
          <p className="mt-1 text-lg">{card.tell}</p>
          <button
            type="button"
            autoFocus
            onClick={() => setRound((r) => r + 1)}
            className="mt-5 rounded-sign bg-ink px-6 py-3 text-lg font-bold text-ground hover:bg-ink-2"
          >
            {round + 1 < cards.length ? t("scam.next") : t("scam.finish")}
          </button>
        </div>
      )}
    </div>
  );
}
