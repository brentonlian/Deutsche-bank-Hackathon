"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PERSONAS } from "@/content/personas";
import { AGE_GROUPS } from "@/lib/game/engine";
import type { AgeGroup } from "@/lib/game/types";
import { LANGUAGES, LANG_IDS, localizeRegion, translate, type Lang } from "@/lib/i18n";
import { REGIONS, REGION_IDS, type RegionId } from "@/lib/regions";
import { useApp } from "./AppState";
import { StationSteps } from "./StationSteps";

const GROUPS = Object.keys(AGE_GROUPS) as AgeGroup[];

const choiceClass = (selected: boolean) =>
  `group w-full rounded-sign border-[3px] p-5 text-left transition-colors ${
    selected ? "border-ink bg-ink text-ground" : "border-panel-strong bg-panel hover:border-ink"
  }`;

export function Onboarding() {
  const app = useApp();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [regionId, setRegionId] = useState<RegionId | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [lang, setLangLocal] = useState<Lang | null>(null);
  const [group, setGroup] = useState<AgeGroup | null>(null);
  const [ageText, setAgeText] = useState("23");
  const [income, setIncome] = useState<string>("");
  const [free, setFree] = useState<string>("");

  const uiLang = lang ?? app.lang;
  const t = (key: string, vars?: Record<string, string | number>) => translate(uiLang, key, vars);

  // Preview the chosen country's line color across the whole shell.
  useEffect(() => {
    if (regionId) document.body.dataset.region = regionId;
  }, [regionId]);

  useEffect(() => {
    if (app.ready && app.profile && app.game) router.replace("/learn");
  }, [app.ready, app.profile, app.game, router]);

  const region = regionId ? localizeRegion(REGIONS[regionId], uiLang) : null;
  const money = (v: number) =>
    new Intl.NumberFormat(`${LANGUAGES[uiLang].bcp47}-${regionId}`, {
      style: "currency",
      currency: region?.currency ?? "EUR",
      maximumFractionDigits: 0,
    }).format(v);

  const canNext = [regionId !== null && city !== null, lang !== null, group !== null, Number(income) > 0][step];
  // Choices that match a prepared demo persona reuse its fixed life events and saved lessons.
  const persona = PERSONAS.find((p) => p.regionId === regionId && p.group === group);

  function start() {
    if (!regionId || !lang || !group) return;
    const incomeValue = Number(income);
    const { min, max, defaultAge } = AGE_GROUPS[group];
    const age = Math.min(max, Math.max(min, Number(ageText) || defaultAge));
    app.setProfile({
      regionId,
      lang,
      group,
      age,
      income: incomeValue,
      free: Math.max(0, Number(free) || 0),
      city: city ?? undefined,
      personaId: persona?.id,
    });
    app.setGame({ seed: persona?.seed ?? Math.floor(Math.random() * 2 ** 31), choices: [] });
    router.push("/learn");
  }

  const labels = [t("onboarding.stationCountry"), t("onboarding.stationLanguage"), t("onboarding.stationAge"), t("onboarding.stationMoney")];
  const languages = regionId ? [...REGIONS[regionId].languages, ...LANG_IDS.filter((l) => !REGIONS[regionId].languages.includes(l))] : LANG_IDS;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-[clamp(2.25rem,6vw,4rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">{t("app.tagline")}</h1>
      <div className="mt-10">
        <StationSteps labels={labels} current={step} />
      </div>

      <section className="rise mt-12" key={step} aria-live="polite">
        {step === 0 && (
          <>
            <h2 className="text-3xl font-extrabold tracking-[-0.02em]">{t("onboarding.countryQuestion")}</h2>
            <p className="mt-2 text-lg text-ink-2">{t("onboarding.countryHelp")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("onboarding.countryQuestion")}>
              {REGION_IDS.map((id) => {
                const r = localizeRegion(REGIONS[id], uiLang);
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={regionId === id}
                    onClick={() => {
                      setRegionId(id);
                      setCity(null);
                      setIncome(String(REGIONS[id].typicalMonthlyIncome));
                    }}
                    className={choiceClass(regionId === id)}
                    data-region={id}
                  >
                    <span aria-hidden="true" className="mb-4 block h-2.5 w-16 rounded-full bg-line" />
                    <span className="block text-2xl font-extrabold">{r.name}</span>
                    <span className="mt-1 block text-sm opacity-80">
                      {r.currency} · {r.languages.map((l) => LANGUAGES[l as Lang]?.label ?? l).join(", ")}
                    </span>
                  </button>
                );
              })}
            </div>
            {region && (
              <fieldset className="mt-6">
                <legend className="font-bold">{t("onboarding.cityLabel")}</legend>
                <div className="mt-3 flex flex-wrap gap-2">
                  {region.cities.map((c) => (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={city === c}
                      onClick={() => setCity(c)}
                      className={`rounded-sign border-[3px] px-4 py-2 font-bold ${city === c ? "border-ink bg-ink text-ground" : "border-panel-strong bg-panel hover:border-ink"}`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="text-3xl font-extrabold tracking-[-0.02em]">{t("onboarding.languageQuestion")}</h2>
            <p className="mt-2 text-lg text-ink-2">{t("onboarding.languageHelp")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label={t("onboarding.languageQuestion")}>
              {languages.map((l) => (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={lang === l}
                  lang={LANGUAGES[l as Lang].bcp47}
                  onClick={() => {
                    setLangLocal(l as Lang);
                    app.setLang(l as Lang);
                  }}
                  className={choiceClass(lang === l)}
                >
                  <span className="text-2xl font-extrabold">{LANGUAGES[l as Lang].label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-3xl font-extrabold tracking-[-0.02em]">{t("onboarding.ageQuestion")}</h2>
            <p className="mt-2 text-lg text-ink-2">{t("onboarding.ageHelp")}</p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label={t("onboarding.ageQuestion")}>
              {GROUPS.map((g) => (
                <button
                  key={g}
                  type="button"
                  role="radio"
                  aria-checked={group === g}
                  onClick={() => {
                    setGroup(g);
                    const match = PERSONAS.find((p) => p.regionId === regionId && p.group === g);
                    setAgeText(String(match?.age ?? AGE_GROUPS[g].defaultAge));
                    if (match) {
                      setIncome(String(match.income));
                      setFree(String(match.free));
                    }
                  }}
                  className={choiceClass(group === g)}
                >
                  <span className="block text-2xl font-extrabold">{t(`onboarding.groups.${g}.label`)}</span>
                  <span className="block font-bold">{t(`onboarding.groups.${g}.range`)}</span>
                  <span className="mt-2 block text-sm opacity-80">{t(`onboarding.groups.${g}.about`)}</span>
                </button>
              ))}
            </div>
            {group && (
              <label className="mt-6 flex items-center gap-4 text-lg font-bold">
                {t("onboarding.ageExact")}
                <input
                  type="number"
                  inputMode="numeric"
                  min={AGE_GROUPS[group].min}
                  max={AGE_GROUPS[group].max}
                  value={ageText}
                  onChange={(e) => setAgeText(e.target.value)}
                  onBlur={() => {
                    const { min, max, defaultAge } = AGE_GROUPS[group];
                    setAgeText(String(Math.min(max, Math.max(min, Number(ageText) || defaultAge))));
                  }}
                  className="w-24 rounded-sign border-[3px] border-panel-strong bg-ground px-3 py-2 text-2xl font-extrabold focus:border-ink"
                />
              </label>
            )}
          </>
        )}

        {step === 3 && region && (
          <>
            <h2 className="text-3xl font-extrabold tracking-[-0.02em]">{t("onboarding.moneyQuestion")}</h2>
            <p className="mt-2 text-lg text-ink-2">{t("onboarding.moneyHelp")}</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <MoneyField
                label={t(group === "senior" ? "onboarding.incomeLabelSenior" : "onboarding.incomeLabel")}
                currency={region.currency}
                value={income}
                onChange={setIncome}
                hint={t("onboarding.typical", { amount: money(region.typicalMonthlyIncome) })}
              />
              <MoneyField label={t("onboarding.freeLabel")} currency={region.currency} value={free} onChange={setFree} />
            </div>
            <p className="mt-6 text-ink-2">{t("onboarding.privacy")}</p>
          </>
        )}
      </section>

      <div className="mt-10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="flex items-center gap-2 rounded-sign px-4 py-3 text-lg font-bold text-ink-2 hover:bg-panel disabled:invisible"
        >
          <ArrowLeft aria-hidden="true" size={20} /> {t("onboarding.back")}
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext}
            className="flex items-center gap-2 rounded-sign bg-ink px-6 py-3 text-lg font-bold text-ground hover:bg-ink-2 disabled:bg-panel-strong disabled:text-ink-3"
          >
            {t("onboarding.next")} <ArrowRight aria-hidden="true" size={20} />
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            disabled={!canNext}
            className="flex items-center gap-2 rounded-sign bg-line px-6 py-3 text-lg font-extrabold text-line-ink ring-[3px] ring-ink hover:brightness-95 disabled:bg-panel-strong disabled:text-ink-3 disabled:ring-0"
          >
            {t("onboarding.start")} <ArrowRight aria-hidden="true" size={20} />
          </button>
        )}
      </div>
    </div>
  );
}

function MoneyField(props: { label: string; currency: string; value: string; onChange: (v: string) => void; hint?: string }) {
  return (
    <label className="block">
      <span className="block font-bold">{props.label}</span>
      <span className="mt-2 flex items-center rounded-sign border-[3px] border-panel-strong bg-ground focus-within:border-ink">
        <span className="pl-3 font-bold text-ink-2">{props.currency}</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          value={props.value}
          onChange={(e) => props.onChange(e.target.value)}
          className="w-full bg-transparent px-3 py-2.5 text-2xl font-extrabold outline-none"
        />
      </span>
      {props.hint && <span className="mt-1.5 block text-sm text-ink-2">{props.hint}</span>}
    </label>
  );
}
