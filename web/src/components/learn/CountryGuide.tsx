"use client";

import { ArrowLeft, Check, ExternalLink, ShieldAlert, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useApp } from "../AppState";
import { RequireProfile } from "../RequireProfile";

function Source({ href, date }: { href?: string; date?: string }) {
  const { t } = useApp();
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-1 text-sm text-ink-2 underline">
      {t("game.source")} <ExternalLink aria-hidden="true" size={13} />
      {date && <span> · {t("game.verified", { date })}</span>}
    </a>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="border-t-[3px] border-panel-strong py-8">
      <h2 id={id} className="text-2xl font-extrabold tracking-[-0.02em]">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-lg leading-relaxed">{children}</div>
    </section>
  );
}

/**
 * "How money works in <country>": the region pack rendered as a readable guide. Nothing here is
 * generated; every figure is a vetted fact with its source.
 */
export function CountryGuide() {
  const { t, region, percent, progress, markDone } = useApp();
  if (!region) return <RequireProfile>{null}</RequireProfile>;
  const p = region.products;
  const e = region.economy;

  const accounts = [p.everydayAccount, p.savingsAccount, p.indexFund, p.retirementProduct, p.cashAtHome];

  return (
    <RequireProfile>
      <Link href="/learn" className="inline-flex items-center gap-2 font-bold text-ink-2 underline hover:text-ink">
        <ArrowLeft aria-hidden="true" size={18} /> {t("guide.back")}
      </Link>
      <h1 className="mt-6 max-w-[22ch] text-[clamp(2.25rem,5vw,3.75rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">
        {t("hub.guideTitle", { countryIn: region.nameIn })}
      </h1>
      <p className="mt-4 max-w-[60ch] text-xl text-ink-2">{t("guide.intro")}</p>

      <div className="mt-10 max-w-3xl">
        <Section id="g-prices" title={t("guide.pricesTitle")}>
          <p>
            {t("guide.inflation", { rate: percent(e.inflationPct) })} <Source href={e.sources[1]} date={e.verified} />
          </p>
          <p>
            {t("guide.policyRate", { bank: region.institutions.centralBank, rate: percent(e.policyRatePct) })} <Source href={e.sources[0]} date={e.verified} />
          </p>
          <p className="rounded-sign bg-line-soft px-5 py-4 font-bold">{t("guide.pricesWhy")}</p>
        </Section>

        <Section id="g-keep" title={t("guide.keepTitle")}>
          <table className="w-full text-left text-base">
            <thead>
              <tr className="text-sm text-ink-2">
                <th scope="col" className="py-2 pr-3 font-bold">{t("guide.colProduct")}</th>
                <th scope="col" className="py-2 pr-3 font-bold">{t("guide.colRate")}</th>
                <th scope="col" className="py-2 pr-3 font-bold">{t("guide.colAccess")}</th>
                <th scope="col" className="py-2 font-bold">{t("guide.colRisk")}</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a) => (
                <tr key={a.id} className="border-t-2 border-panel-strong align-top">
                  <th scope="row" className="py-3 pr-3">
                    <span className="block font-extrabold">{a.name}</span>
                    <span className="block font-normal text-ink-2">{a.note}</span>
                  </th>
                  <td className="py-3 pr-3 font-extrabold tabular-nums">{percent(a.ratePct)}</td>
                  <td className="py-3 pr-3">{t(`guide.access.${a.liquidity}`)}</td>
                  <td className="py-3">{t(`guide.risk.${a.risk}`)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>
            <strong>{t("guide.depositInsurance")}</strong> {region.institutions.depositInsurance.value}
            <Source href={region.institutions.depositInsurance.source} date={region.institutions.depositInsurance.verified} />
          </p>
          {region.informalSavings && (
            <p>
              <strong>{region.informalSavings.name}:</strong> {region.informalSavings.description}
            </p>
          )}
        </Section>

        <Section id="g-borrow" title={t("guide.borrowTitle")}>
          <p>{t("guide.creditBureau", { bureau: region.institutions.creditBureau })}</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            <li className="rounded-sign bg-panel px-5 py-4">
              <span className="block text-ink-2">{t("guide.cardApr")}</span>
              <span className="text-3xl font-extrabold tabular-nums">{t("market.value.perYear", { rate: percent(p.expensiveCreditApr) })}</span>
            </li>
            <li className="rounded-sign bg-panel px-5 py-4">
              <span className="block text-ink-2">{t("guide.lenderApr")}</span>
              <span className="text-3xl font-extrabold tabular-nums text-danger">{t("market.value.perYear", { rate: percent(p.informalLenderApr) })}</span>
            </li>
          </ul>
          {region.culture.notes.map((n) => (
            <p key={n}>{n}</p>
          ))}
        </Section>

        <Section id="g-pay" title={t("guide.payTitle")}>
          <ul className="flex flex-wrap gap-2">
            {region.institutions.paymentRails.map((r) => (
              <li key={r} className="rounded-sign bg-panel px-3 py-1.5 font-bold">
                {r}
              </li>
            ))}
          </ul>
          <p>{t("guide.regulator", { regulator: region.institutions.regulator })}</p>
        </Section>

        <Section id="g-safety" title={t("guide.safetyTitle")}>
          <p>
            <strong>{t("guide.retirement")}</strong> {region.institutions.retirementSystem}.
          </p>
          <p>
            <strong>{t("guide.unemployment")}</strong> {region.institutions.unemploymentNote}
          </p>
        </Section>

        <Section id="g-scams" title={t("guide.scamsTitle")}>
          <ul className="space-y-4">
            {region.scams.map((s) => (
              <li key={s.id} className="flex gap-4">
                {s.isScam ? (
                  <ShieldAlert aria-label={t("scam.scam")} className="mt-1 shrink-0 text-danger" size={24} />
                ) : (
                  <ShieldCheck aria-label={t("scam.legit")} className="mt-1 shrink-0 text-express" size={24} />
                )}
                <span>
                  <span className="block italic">“{s.message}”</span>
                  <span className="block text-ink-2">{s.tell}</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>

        <button
          type="button"
          onClick={() => markDone("guide")}
          disabled={Boolean(progress.guide)}
          className="mt-4 flex items-center gap-2 rounded-sign bg-ink px-6 py-3 text-lg font-bold text-ground hover:bg-ink-2 disabled:bg-express disabled:text-white"
        >
          <Check aria-hidden="true" size={20} strokeWidth={3} /> {progress.guide ? t("guide.done") : t("guide.markDone")}
        </button>
      </div>
    </RequireProfile>
  );
}
