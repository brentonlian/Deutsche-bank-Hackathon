"use client";

import { Check, X } from "lucide-react";
import { useState } from "react";
import type { Lesson } from "@/lib/lessons";
import { useApp } from "../AppState";

type Question = NonNullable<Lesson["quiz"]>[number];

/** A short check for understanding after each lesson: answer, see why, move on. */
export function Quiz({ questions, lang, onFinish }: { questions: Question[]; lang: string; onFinish: (score: number) => void }) {
  const { t } = useApp();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const q = questions[index];
  const chosen = answers[index];
  const finished = answers.length === questions.length && index === questions.length - 1 && chosen !== undefined;
  const score = answers.filter((a, i) => a === questions[i].answer).length;

  return (
    <section aria-labelledby="quiz-title" className="mt-12 rounded-sign border-[3px] border-ink p-6">
      <h2 id="quiz-title" className="text-2xl font-extrabold">
        {t("quiz.title")} <span className="font-bold text-ink-2">({index + 1}/{questions.length})</span>
      </h2>
      <p lang={lang} className="mt-4 text-xl font-bold">
        {q.question}
      </p>
      <div className="mt-4 grid gap-2" role="radiogroup" aria-label={q.question}>
        {q.options.map((opt, i) => {
          const isChosen = chosen === i;
          const isRight = chosen !== undefined && i === q.answer;
          return (
            <button
              key={opt}
              type="button"
              role="radio"
              aria-checked={isChosen}
              lang={lang}
              disabled={chosen !== undefined}
              onClick={() => setAnswers((a) => [...a.slice(0, index), i])}
              className={`flex items-center gap-3 rounded-sign border-[3px] px-4 py-3 text-left text-lg font-bold ${
                isRight ? "border-express bg-express-soft" : isChosen ? "border-danger bg-danger-soft" : "border-panel-strong bg-panel enabled:hover:border-ink"
              }`}
            >
              {isRight ? <Check aria-hidden="true" className="shrink-0 text-express" /> : isChosen ? <X aria-hidden="true" className="shrink-0 text-danger" /> : null}
              {opt}
            </button>
          );
        })}
      </div>
      {chosen !== undefined && (
        <div className="rise mt-4" role="status">
          <p className={`text-lg font-extrabold ${chosen === q.answer ? "text-express" : "text-danger"}`}>{chosen === q.answer ? t("scam.correct") : t("scam.wrong")}</p>
          <p lang={lang} className="mt-1 text-lg">
            {q.why}
          </p>
          {finished ? (
            <div className="mt-5">
              <p className="text-2xl font-extrabold">{t("quiz.result", { score, total: questions.length })}</p>
              <button
                type="button"
                onClick={() => onFinish(score)}
                className="mt-4 rounded-sign bg-ink px-6 py-3 text-lg font-bold text-ground hover:bg-ink-2"
              >
                {t("quiz.finish")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              autoFocus
              onClick={() => setIndex((i) => i + 1)}
              className="mt-4 rounded-sign bg-ink px-6 py-3 text-lg font-bold text-ground hover:bg-ink-2"
            >
              {t("quiz.next")}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
