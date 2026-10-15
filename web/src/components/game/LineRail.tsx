"use client";

import { Check } from "lucide-react";
import { useEffect, useRef } from "react";
import type { StageDef } from "@/lib/game/types";
import { useApp } from "../AppState";
import { StageIcon } from "./StageIcon";

/**
 * The player's line while playing: stations passed are filled in the country colour,
 * the current one pulses, the rest wait in grey. Vertical on desktop, a scrolling strip on phones.
 */
export function LineRail(props: { stages: StageDef[]; choices: string[]; current: number; vars: Record<string, string> }) {
  const { stages, choices, current, vars } = props;
  const { t } = useApp();
  const currentRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    // Only the phone strip scrolls sideways; on desktop the whole line is visible.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      currentRef.current?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    }
  }, [current]);

  return (
    <nav aria-label={t("results.yourLine")} className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0">
      <ol className="flex min-w-max lg:min-w-0 lg:flex-col">
        {stages.map((stage, i) => {
          const done = i < current;
          const here = i === current;
          const isLast = i === stages.length - 1;
          return (
            <li
              key={stage.id}
              ref={here ? currentRef : undefined}
              aria-current={here ? "step" : undefined}
              className="relative flex w-24 flex-col items-center gap-2 lg:w-auto lg:flex-row lg:items-start lg:gap-3 lg:pb-5"
            >
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-[18px] h-1.5 w-full lg:left-[17px] lg:top-9 lg:h-full lg:w-1.5 ${done ? "bg-line" : "bg-panel-strong"}`}
                />
              )}
              <span
                className={`relative z-10 grid size-10 shrink-0 place-items-center rounded-full border-[4px] ${
                  done ? "border-ink bg-line text-line-ink" : here ? "station-here border-ink bg-ground text-ink" : "border-panel-strong bg-ground text-ink-3"
                }`}
              >
                {done ? <Check aria-hidden="true" size={18} strokeWidth={3} /> : <StageIcon id={stage.id} size={18} />}
              </span>
              <span className="px-1 text-center text-xs leading-tight lg:pt-1 lg:text-left lg:text-sm">
                <span className={`block ${here ? "font-extrabold text-ink" : done ? "font-bold text-ink" : "text-ink-3"}`}>
                  {t(`stages.${stage.id}.title`, vars)}
                </span>
                {done && <span className="hidden text-ink-2 lg:block">{t(`stages.${stage.id}.options.${choices[i]}.label`, vars)}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
