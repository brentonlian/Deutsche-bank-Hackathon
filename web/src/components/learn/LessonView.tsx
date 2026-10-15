"use client";

import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { PERSONAS, getPersona } from "@/content/personas";
import type { AgeGroup } from "@/lib/game/types";
import { LANGUAGES, localizeRegion, type Lang } from "@/lib/i18n";
import { regionFacts, type Lesson, type Topic } from "@/lib/lessons";
import { REGIONS, REGION_IDS, type RegionId } from "@/lib/regions";
import { useApp } from "../AppState";
import { ReadAloud } from "../ReadAloud";
import { RequireProfile } from "../RequireProfile";

type Load = { status: "loading" } | { status: "error" } | { status: "ready"; lesson: Lesson };

interface Slot {
  key: string;
  regionId: RegionId;
  lang: Lang;
  group: AgeGroup;
  /** Shown above a column in compare view. */
  label?: string;
}

function useLesson(req: { topic: Topic; regionId: RegionId; lang: Lang; group: AgeGroup; simple: boolean }, attempt: number) {
  const [state, setState] = useState<{ key: string; load: Load } | null>(null);
  const body = JSON.stringify(req);
  const key = `${body}#${attempt}`;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/lesson", { method: "POST", headers: { "Content-Type": "application/json" }, body })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        const data = (await res.json()) as { lesson: Lesson };
        if (!cancelled) setState({ key, load: { status: "ready", lesson: data.lesson } });
      })
      .catch(() => !cancelled && setState({ key, load: { status: "error" } }));
    return () => {
      cancelled = true;
    };
  }, [body, key]);

  return state?.key === key ? state.load : ({ status: "loading" } as Load);
}

function LessonBody({ lesson, slot, compact }: { lesson: Lesson; slot: Slot; compact?: boolean }) {
  const { t, lang: uiLang } = useApp();
  const facts = regionFacts(REGIONS[slot.regionId]).filter((f) => lesson.factsUsed.includes(f.key));
  const text = [lesson.title, lesson.summary, ...lesson.sections.flatMap((s) => [s.heading, s.body]), lesson.example.title, lesson.example.body, lesson.takeaway].join(". ");
  const region = localizeRegion(REGIONS[slot.regionId], uiLang);

  return (
    <article className="rise" data-region={slot.regionId} lang={LANGUAGES[slot.lang].bcp47}>
      {compact && (
        <p className="mb-3 flex flex-wrap items-center gap-2 font-extrabold" lang={LANGUAGES[uiLang].bcp47}>
          <span aria-hidden="true" className="h-2 w-10 rounded-full bg-line" /> {slot.label ?? region.name}
          {slot.label && <span className="font-bold text-ink-2">· {region.name} · {LANGUAGES[slot.lang].label}</span>}
        </p>
      )}
      <h2 className={`${compact ? "text-2xl" : "text-[clamp(2rem,4vw,3rem)]"} font-extrabold leading-tight tracking-[-0.02em] text-balance`}>{lesson.title}</h2>
      <p className={`mt-3 ${compact ? "text-lg" : "text-xl"} text-ink-2`}>{lesson.summary}</p>
      {!compact && (
        <div className="mt-4">
          <ReadAloud key={lesson.title} text={text} lang={slot.lang} />
        </div>
      )}
      <div className="mt-8 space-y-7">
        {lesson.sections.map((s) => (
          <section key={s.heading}>
            <h3 className="text-xl font-extrabold">{s.heading}</h3>
            <p className="mt-2 max-w-[65ch] text-lg leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
      <aside className="mt-8 rounded-sign bg-line-soft p-5">
        <p className="text-lg font-extrabold">{lesson.example.title}</p>
        <p className="mt-2 max-w-[65ch] text-lg leading-relaxed">{lesson.example.body}</p>
      </aside>
      <p className="mt-8 rounded-sign bg-ink p-5 text-xl font-extrabold text-ground">{lesson.takeaway}</p>
      <details className="mt-8" lang={LANGUAGES[uiLang].bcp47}>
        <summary className="cursor-pointer text-lg font-bold">
          {t("learn.facts")} ({facts.length})
        </summary>
        <ul className="mt-3 space-y-2 text-ink-2" lang="en">
          {facts.map((f) => (
            <li key={f.key}>
              {f.text}{" "}
              {f.source && (
                <a href={f.source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm underline">
                  {t("game.source")} <ExternalLink aria-hidden="true" size={13} />
                </a>
              )}
              {f.verified && <span className="text-sm"> · {t("game.verified", { date: f.verified })}</span>}
            </li>
          ))}
        </ul>
      </details>
      <p className="mt-6 text-sm text-ink-3" lang={LANGUAGES[uiLang].bcp47}>
        {t("learn.aiLabel")}
      </p>
    </article>
  );
}

function LessonSlot({ topic, slot, compact }: { topic: Topic; slot: Slot; compact?: boolean }) {
  const { settings, t } = useApp();
  const [attempt, setAttempt] = useState(0);
  const load = useLesson({ topic, regionId: slot.regionId, lang: slot.lang, group: slot.group, simple: settings.simple }, attempt);
  if (load.status === "loading")
    return (
      <p role="status" className="py-10 text-xl font-bold text-ink-2" data-region={slot.regionId}>
        <span aria-hidden="true" className="station-here mr-3 inline-block size-4 rounded-full bg-line align-middle" />
        {t("learn.loading")}
      </p>
    );
  if (load.status === "error")
    return (
      <div role="alert" className="py-10">
        <p className="text-lg font-bold text-danger">{t("learn.error")}</p>
        <button type="button" onClick={() => setAttempt((a) => a + 1)} className="mt-4 rounded-sign bg-ink px-5 py-2.5 font-bold text-ground">
          {t("learn.retry")}
        </button>
      </div>
    );
  return <LessonBody lesson={load.lesson} slot={slot} compact={compact} />;
}

export function LessonView({ topic }: { topic: Topic }) {
  const { profile, t } = useApp();
  const [compare, setCompare] = useState(false);
  if (!profile) return <RequireProfile>{null}</RequireProfile>;

  const own: Slot = { key: "own", regionId: profile.regionId, lang: profile.lang, group: profile.group };
  const persona = getPersona(profile.personaId);
  // Demo personas compare against the other personas who have this lesson; custom profiles compare countries.
  const others: Slot[] = persona
    ? PERSONAS.filter((p) => p.id !== persona.id && (p.topics as readonly string[]).includes(topic)).map((p) => ({
        key: p.id,
        regionId: p.regionId,
        lang: p.lang,
        group: p.group,
        label: t(`personas.${p.id}.name`),
      }))
    : REGION_IDS.filter((r) => r !== profile.regionId).map((r) => ({ key: r, regionId: r, lang: profile.lang, group: profile.group }));
  const slots = [{ ...own, label: persona ? t(`personas.${persona.id}.name`) : undefined }, ...others];

  return (
    <RequireProfile>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/learn" className="inline-flex items-center gap-2 font-bold text-ink-2 underline hover:text-ink">
          <ArrowLeft aria-hidden="true" size={18} /> {t("learn.back")}
        </Link>
        {others.length > 0 && (
          <button
            type="button"
            aria-pressed={compare}
            onClick={() => setCompare((c) => !c)}
            className={`rounded-sign border-[3px] border-ink px-4 py-2 font-bold ${compare ? "bg-ink text-ground" : "hover:bg-ink hover:text-ground"}`}
          >
            {t("learn.compare")}
          </button>
        )}
      </div>
      <p className="mt-6 text-lg font-bold text-ink-2">{t(`topics.${topic}`)}</p>
      {compare && others.length > 0 ? (
        <>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.02em]">{t("learn.compareTitle")}</h1>
          <div className={`mt-8 grid gap-10 ${slots.length >= 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"}`}>
            {slots.slice(0, 3).map((s) => (
              <LessonSlot key={s.key} topic={topic} slot={s} compact />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-2 max-w-3xl">
          <LessonSlot topic={topic} slot={own} />
        </div>
      )}
    </RequireProfile>
  );
}
