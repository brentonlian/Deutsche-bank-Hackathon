"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { TOPICS } from "@/lib/lessons";
import { useApp } from "../AppState";
import { RequireProfile } from "../RequireProfile";

/** Every topic as a station on one line; the lessons read like a route you can ride end to end. */
export function LessonIndex() {
  const { t, region } = useApp();
  return (
    <RequireProfile>
      <h1 className="text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-none tracking-[-0.03em]">
        {t("learn.title", { country: region?.name ?? "" })}
      </h1>
      <p className="mt-4 max-w-[60ch] text-xl text-ink-2">{t("learn.intro")}</p>
      <ol className="mt-10 max-w-2xl">
        {TOPICS.map((topic, i) => (
          <li key={topic} className="relative">
            {i < TOPICS.length - 1 && <span aria-hidden="true" className="absolute left-[17px] top-8 h-full w-1.5 bg-line" />}
            <Link href={`/learn/${topic}`} className="group relative flex items-center gap-4 rounded-sign py-2.5 pr-3 hover:bg-panel">
              <span className="relative z-10 size-10 shrink-0 rounded-full border-[4px] border-ink bg-ground group-hover:bg-line" />
              <span className="text-xl font-extrabold">{t(`topics.${topic}`)}</span>
              <ChevronRight aria-hidden="true" className="ml-auto text-ink-3 group-hover:text-ink" />
            </Link>
          </li>
        ))}
      </ol>
    </RequireProfile>
  );
}
