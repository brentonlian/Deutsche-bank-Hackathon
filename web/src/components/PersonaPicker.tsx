"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PERSONAS, type Persona } from "@/content/personas";
import { LANGUAGES, localizeRegion } from "@/lib/i18n";
import { REGIONS } from "@/lib/regions";
import { useApp } from "./AppState";

/**
 * The demo's front door: three people, each a line in their own country's colour.
 * One tap loads their profile, language and fixed life events, then starts the Life Path.
 */
export function PersonaPicker() {
  const app = useApp();
  const { t, lang } = app;
  const router = useRouter();

  function start(p: Persona) {
    app.setProfile({ regionId: p.regionId, lang: p.lang, group: p.group, age: p.age, income: p.income, free: p.free, city: p.city, personaId: p.id });
    app.setGame({ seed: p.seed, choices: [] });
    router.push("/play");
  }

  return (
    <div>
      <h1 className="max-w-[16ch] text-[clamp(2.5rem,7vw,5rem)] font-extrabold leading-[0.98] tracking-[-0.035em]">{t("home.title")}</h1>
      <p className="mt-5 max-w-[56ch] text-xl text-ink-2">{t("home.intro")}</p>

      <ol className="mt-12 divide-y-[3px] divide-panel-strong border-y-[3px] border-panel-strong">
        {PERSONAS.map((p) => {
          const region = localizeRegion(REGIONS[p.regionId], lang);
          const name = t(`personas.${p.id}.name`);
          return (
            <li key={p.id} data-region={p.regionId} className="grid gap-x-8 gap-y-4 py-8 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
              {/* Their line: a short run of track with a station, in the country's colour. */}
              <span aria-hidden="true" className="relative hidden h-24 w-12 md:block">
                <span className="absolute left-1/2 top-0 h-full w-2 -translate-x-1/2 rounded-full bg-line" />
                <span className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-[5px] border-ink bg-line" />
              </span>
              <div>
                <p className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <span className="text-4xl font-extrabold tracking-[-0.02em]">{name}</span>
                  <span className="font-bold text-ink-2">{t(`personas.${p.id}.where`)}</span>
                </p>
                <p className="mt-2 max-w-[60ch] text-lg">{t(`personas.${p.id}.about`)}</p>
                <p className="mt-3 flex flex-wrap items-center gap-2 text-sm font-bold">
                  <span className="rounded-sign bg-line px-2 py-1 text-line-ink">{region.name}</span>
                  <span className="rounded-sign bg-panel px-2 py-1">{LANGUAGES[p.lang].label}</span>
                  <span className="rounded-sign bg-panel px-2 py-1">{t(`onboarding.groups.${p.group}.label`)}</span>
                  <span className="text-ink-2">{t("home.lessons", { topics: p.topics.map((topic) => t(`topics.${topic}`)).join(" · ") })}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => start(p)}
                className="flex items-center justify-center gap-2 rounded-sign bg-line px-6 py-4 text-lg font-extrabold text-line-ink ring-[3px] ring-ink hover:brightness-95"
              >
                {t("home.play", { name })} <ArrowRight aria-hidden="true" size={20} />
              </button>
            </li>
          );
        })}
      </ol>

      <Link href="/" className="mt-8 inline-block font-bold text-ink-2 underline hover:text-ink">
        {t("home.custom")}
      </Link>
    </div>
  );
}
