"use client";

import { ArrowRight, BookOpen, Calculator, Check, Landmark, Route } from "lucide-react";
import Link from "next/link";
import { learningLine, type Station } from "@/lib/learning";
import { useApp } from "../AppState";
import { RequireProfile } from "../RequireProfile";

const KIND_ICON = { guide: Landmark, lesson: BookOpen, tool: Calculator, game: Route } as const;

/** The home after onboarding: one line of stations from understanding the system to practicing it. */
export function LearnHub() {
  const { t, region, profile, progress } = useApp();
  if (!profile || !region) return <RequireProfile>{null}</RequireProfile>;

  const line = learningLine(profile);
  const doneCount = line.filter((s) => progress[s.key]).length;
  const next = line.find((s) => !progress[s.key]);

  const title = (s: Station) =>
    s.kind === "guide"
      ? t("hub.guideTitle", { countryIn: region.nameIn })
      : s.kind === "lesson"
        ? t(`topics.${s.topic}`)
        : s.kind === "tool"
          ? t(`tools.${s.tool}.title`)
          : t("hub.gameTitle");
  const about = (s: Station) =>
    s.kind === "guide" ? t("hub.guideAbout") : s.kind === "lesson" ? t("hub.lessonAbout") : s.kind === "tool" ? t(`tools.${s.tool}.about`) : t("hub.gameAbout");

  return (
    <RequireProfile>
      <h1 className="max-w-[20ch] text-[clamp(2.25rem,5.5vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
        {t("hub.title", { countryIn: region.nameIn })}
      </h1>
      <p className="mt-4 max-w-[60ch] text-xl text-ink-2">{t("hub.intro")}</p>
      <p className="mt-6 text-lg font-extrabold">{t("hub.progress", { done: doneCount, total: line.length })}</p>

      <ol className="mt-8 max-w-3xl">
        {line.map((s, i) => {
          const done = Boolean(progress[s.key]);
          const here = s === next;
          const Icon = KIND_ICON[s.kind];
          const score = s.kind === "lesson" && progress[s.key] ? progress[s.key] - 1 : null;
          return (
            <li key={s.key} className="relative pb-4">
              {i < line.length - 1 && <span aria-hidden="true" className={`absolute left-[21px] top-12 h-full w-1.5 ${done ? "bg-line" : "bg-panel-strong"}`} />}
              <Link
                href={s.href}
                aria-current={here ? "step" : undefined}
                className={`group relative flex items-start gap-5 rounded-sign p-3 ${here ? "bg-panel" : "hover:bg-panel/70"}`}
              >
                <span
                  className={`relative z-10 grid size-12 shrink-0 place-items-center rounded-full border-[4px] ${
                    done ? "border-ink bg-line text-line-ink" : here ? "station-here border-ink bg-ground text-ink" : "border-panel-strong bg-ground text-ink-3"
                  }`}
                >
                  {done ? <Check aria-hidden="true" size={20} strokeWidth={3} /> : <Icon aria-hidden="true" size={20} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-ink-2">{t(`hub.kind.${s.kind}`)}</span>
                  <span className="block text-2xl font-extrabold leading-tight">{title(s)}</span>
                  <span className="mt-1 block text-ink-2">{about(s)}</span>
                  {score !== null && score >= 0 && <span className="mt-1 block font-bold text-express">{t("hub.quizScore", { score })}</span>}
                </span>
                <span className="mt-3 hidden items-center gap-1 font-bold sm:flex">
                  {done ? t("hub.review") : here ? t("hub.start") : ""}
                  {(done || here) && <ArrowRight aria-hidden="true" size={18} className="transition-transform group-hover:translate-x-1" />}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </RequireProfile>
  );
}
