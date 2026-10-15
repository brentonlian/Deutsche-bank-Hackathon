"use client";

import { ArrowRight, Check, Newspaper } from "lucide-react";
import { useState } from "react";
import type { RegionPack } from "@/lib/regions/schema";
import { useApp } from "../AppState";
import { SourceLink } from "../SourceLink";

type CardId = "index" | "keep-saving" | "single-stock" | "crypto-tip";

interface Metric {
  label: string;
  value: string;
  tone?: "good" | "bad";
}

/**
 * The investing life event as a small practice market. The fund and savings figures come from the
 * country's data; the hyped stock and coin are fictional and labelled as such.
 */
export function MarketPick({ region, onDone }: { region: RegionPack; onDone: (optionId: CardId) => void }) {
  const { t, percent } = useApp();
  const [picked, setPicked] = useState<CardId | null>(null);
  const p = region.products;

  const cards: { id: CardId; name: string; kind: string; news: string; metrics: Metric[]; fictional?: boolean }[] = [
    {
      id: "index",
      name: p.indexFund.name,
      kind: t("market.index.kind"),
      news: t("market.index.news"),
      metrics: [
        { label: t("market.metric.longRun"), value: t("market.value.perYear", { rate: percent(p.indexFund.ratePct) }), tone: "good" },
        { label: t("market.metric.holds"), value: t("market.value.hundreds") },
        { label: t("market.metric.swings"), value: t("market.value.medium") },
        { label: t("market.metric.fees"), value: t("market.value.low"), tone: "good" },
      ],
    },
    {
      id: "keep-saving",
      name: p.savingsAccount.name,
      kind: t("market.savings.kind"),
      news: t("market.savings.news", { rate: percent(region.economy.policyRatePct) }),
      metrics: [
        { label: t("market.metric.rate"), value: t("market.value.perYear", { rate: percent(p.savingsAccount.ratePct) }) },
        { label: t("market.metric.inflation"), value: t("market.value.perYear", { rate: percent(region.economy.inflationPct) }) },
        { label: t("market.metric.swings"), value: t("market.value.none"), tone: "good" },
        { label: t("market.metric.protection"), value: p.savingsAccount.insured ? t("market.value.protected") : t("market.value.none") },
      ],
    },
    {
      id: "single-stock",
      name: t("market.stock.name"),
      kind: t("market.stock.kind"),
      news: t("market.stock.news"),
      fictional: true,
      metrics: [
        { label: t("market.metric.lastYear"), value: "+84%", tone: "good" },
        { label: t("market.metric.biggestDrop"), value: "−48%", tone: "bad" },
        { label: t("market.metric.holds"), value: t("market.value.oneCompany"), tone: "bad" },
        { label: t("market.metric.profit"), value: t("market.value.notYet"), tone: "bad" },
      ],
    },
    {
      id: "crypto-tip",
      name: t("market.coin.name"),
      kind: t("market.coin.kind"),
      news: t("market.coin.news"),
      fictional: true,
      metrics: [
        { label: t("market.metric.lastMonth"), value: "+310%", tone: "good" },
        { label: t("market.metric.biggestDrop"), value: "−92%", tone: "bad" },
        { label: t("market.metric.business"), value: t("market.value.noBusiness"), tone: "bad" },
        { label: t("market.metric.protection"), value: t("market.value.none"), tone: "bad" },
      ],
    },
  ];

  return (
    <div>
      <p className="max-w-[62ch] text-lg">{t("market.intro")}</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2" role="radiogroup" aria-label={t("market.title")}>
        {cards.map((c) => {
          const isPicked = picked === c.id;
          const isBest = picked !== null && c.id === "index";
          return (
            <button
              key={c.id}
              type="button"
              role="radio"
              aria-checked={isPicked}
              disabled={picked !== null}
              onClick={() => setPicked(c.id)}
              className={`flex flex-col rounded-sign border-[3px] p-5 text-left transition-colors ${
                isBest ? "border-express bg-express-soft" : isPicked ? "border-ink bg-panel" : "border-panel-strong bg-panel enabled:hover:border-ink"
              } disabled:cursor-default`}
            >
              <span className="flex items-start justify-between gap-3">
                <span>
                  <span className="block text-xl font-extrabold leading-tight">{c.name}</span>
                  <span className="block text-sm text-ink-2">{c.kind}</span>
                </span>
                {isBest && (
                  <span className="flex shrink-0 items-center gap-1 rounded-sign bg-express px-2 py-1 text-sm font-bold text-white">
                    <Check aria-hidden="true" size={16} strokeWidth={3} /> {t("market.bestBadge")}
                  </span>
                )}
              </span>
              <span className="mt-3 flex gap-2 text-ink-2">
                <Newspaper aria-hidden="true" size={18} className="mt-0.5 shrink-0" />
                <span className="italic">{c.news}</span>
              </span>
              <span className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
                {c.metrics.map((m) => (
                  <span key={m.label}>
                    <span className="block text-sm text-ink-2">{m.label}</span>
                    <span className={`font-extrabold tabular-nums ${m.tone === "good" ? "text-express" : m.tone === "bad" ? "text-danger" : ""}`}>{m.value}</span>
                  </span>
                ))}
              </span>
              {c.fictional && <span className="mt-3 text-xs text-ink-3">{t("market.fictional")}</span>}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="rise mt-8 max-w-[65ch]" role="status">
          <p className="text-2xl font-extrabold">{picked === "index" ? t("market.youPickedBest") : t("market.bestIs", { name: p.indexFund.name })}</p>
          <p className="mt-2 text-lg">{t("market.whyIndex")}</p>
          {picked !== "index" && <p className="mt-2 text-lg text-ink-2">{t(`market.why.${picked}`)}</p>}
          <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            <SourceLink href={p.indexFund.source} date={p.indexFund.verified} label={p.indexFund.name} />
            <SourceLink href={p.savingsAccount.source} date={p.savingsAccount.verified} label={p.savingsAccount.name} />
          </p>
          <button
            type="button"
            autoFocus
            onClick={() => onDone(picked)}
            className="mt-6 flex items-center gap-2 rounded-sign bg-ink px-6 py-3 text-lg font-bold text-ground hover:bg-ink-2"
          >
            {t("market.seeResult")} <ArrowRight aria-hidden="true" size={20} />
          </button>
        </div>
      )}
      <p className="mt-6 text-sm text-ink-2">{t("market.note", { countryIn: region.nameIn })}</p>
    </div>
  );
}
