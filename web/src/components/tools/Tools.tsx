"use client";

import { ArrowLeft, ArrowRight, Calculator } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { TOOLS, type ToolId } from "@/lib/learning";
import { budgetSplit, futureValue, growthPath, inTodaysMoney, payoff } from "@/lib/tools";
import { useApp } from "../AppState";
import { NetWorthChart } from "../game/NetWorthChart";
import { RequireProfile } from "../RequireProfile";
import { SourceLink } from "../SourceLink";

function NumberField(props: { label: string; value: number; onChange: (v: number) => void; suffix?: string; min?: number; max?: number; step?: number }) {
  return (
    <label className="block">
      <span className="block font-bold">{props.label}</span>
      <span className="mt-2 flex items-center rounded-sign border-[3px] border-panel-strong bg-ground focus-within:border-ink">
        <input
          type="number"
          inputMode="decimal"
          min={props.min ?? 0}
          max={props.max}
          step={props.step ?? 1}
          value={Number.isFinite(props.value) ? props.value : ""}
          onChange={(e) => props.onChange(Math.max(props.min ?? 0, Number(e.target.value) || 0))}
          className="w-full bg-transparent px-3 py-2.5 text-2xl font-extrabold tabular-nums outline-none"
        />
        {props.suffix && <span className="pr-3 font-bold text-ink-2">{props.suffix}</span>}
      </span>
    </label>
  );
}

function Big({ label, value, tone, note }: { label: string; value: string; tone?: "good" | "bad"; note?: string }) {
  return (
    <div className="rounded-sign bg-panel px-5 py-4">
      <span className="block text-ink-2">{label}</span>
      <span className={`block text-3xl font-extrabold tabular-nums ${tone === "good" ? "text-express" : tone === "bad" ? "text-danger" : ""}`}>{value}</span>
      {note && <span className="mt-1 block text-sm text-ink-2">{note}</span>}
    </div>
  );
}

function ToolFrame({ tool, children }: { tool: ToolId; children: ReactNode }) {
  const { t, markDone } = useApp();
  // Opening a tool and seeing your own numbers counts as practising it.
  useEffect(() => {
    const id = window.setTimeout(() => markDone(`tool:${tool}`), 4000);
    return () => window.clearTimeout(id);
  }, [tool, markDone]);
  return (
    <RequireProfile>
      <Link href="/learn" className="inline-flex items-center gap-2 font-bold text-ink-2 underline hover:text-ink">
        <ArrowLeft aria-hidden="true" size={18} /> {t("guide.back")}
      </Link>
      <h1 className="mt-6 text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">{t(`tools.${tool}.title`)}</h1>
      <p className="mt-3 max-w-[60ch] text-xl text-ink-2">{t(`tools.${tool}.about`)}</p>
      <div className="mt-8 max-w-4xl">{children}</div>
    </RequireProfile>
  );
}

function BudgetTool() {
  const { t, money, percent, profile, region } = useApp();
  const [income, setIncome] = useState(profile?.income ?? 0);
  if (!region) return null;
  const split = budgetSplit(income);
  const rate = region.products.savingsAccount.ratePct;
  return (
    <ToolFrame tool="budget">
      <div className="max-w-sm">
        <NumberField label={t("tools.budget.income")} value={income} onChange={setIncome} suffix={region.currency} />
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Big label={t("tools.budget.needs")} value={money(split.needs)} note={t("tools.budget.needsNote")} />
        <Big label={t("tools.budget.wants")} value={money(split.wants)} note={t("tools.budget.wantsNote")} />
        <Big label={t("tools.budget.save")} value={money(split.save)} tone="good" note={t("tools.budget.saveNote")} />
      </div>
      <h2 className="mt-10 text-2xl font-extrabold">{t("tools.budget.cushionTitle")}</h2>
      <p className="mt-2 max-w-[62ch] text-lg">{t("tools.budget.cushionBody", { low: money(split.needs * 3), high: money(split.needs * 6) })}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Big
          label={t("tools.budget.afterYear", { name: region.products.savingsAccount.name, rate: percent(rate) })}
          value={money(futureValue(split.save, rate, 1))}
          tone="good"
        />
        <Big label={t("tools.budget.monthsToCushion")} value={t("tools.months", { n: Math.ceil((split.needs * 3) / Math.max(split.save, 1)) })} />
      </div>
      <p className="mt-3">
        <SourceLink href={region.products.savingsAccount.source} date={region.products.savingsAccount.verified} label={region.products.savingsAccount.name} />
      </p>
    </ToolFrame>
  );
}

function GrowthTool() {
  const { t, money, percent, profile, region } = useApp();
  const [monthly, setMonthly] = useState(Math.max(profile?.free ?? 0, 1));
  const [years, setYears] = useState(20);
  if (!region) return null;
  const p = region.products;
  const infl = region.economy.inflationPct;
  const rows = [
    { id: "cash", name: p.cashAtHome.name, rate: p.cashAtHome.ratePct, color: "var(--danger)", product: p.cashAtHome },
    { id: "savings", name: p.savingsAccount.name, rate: p.savingsAccount.ratePct, color: "var(--line)", product: p.savingsAccount },
    { id: "index", name: p.indexFund.name, rate: p.indexFund.ratePct, color: "var(--express)", product: p.indexFund },
  ];
  return (
    <ToolFrame tool="growth">
      <div className="grid max-w-xl gap-4 sm:grid-cols-2">
        <NumberField label={t("tools.growth.monthly")} value={monthly} onChange={setMonthly} suffix={region.currency} />
        <NumberField label={t("tools.growth.years")} value={years} onChange={(v) => setYears(Math.min(50, Math.max(1, Math.round(v))))} min={1} max={50} />
      </div>
      <p className="mt-4 text-lg text-ink-2">{t("tools.growth.paidIn", { total: money(monthly * 12 * years) })}</p>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {rows.map((r) => {
          const fv = futureValue(monthly, r.rate, years);
          return (
            <Big
              key={r.id}
              label={`${r.name} · ${percent(r.rate)}`}
              value={money(fv)}
              tone={r.id === "index" ? "good" : r.id === "cash" ? "bad" : undefined}
              note={t("tools.growth.today", { value: money(inTodaysMoney(fv, infl, years)), rate: percent(infl) })}
            />
          );
        })}
      </div>
      <div className="mt-8">
        <NetWorthChart
          title={t("tools.growth.chart")}
          series={rows.map((r) => ({ id: r.id, label: r.name, color: r.color, points: growthPath(monthly, r.rate, years).map((pt) => ({ age: pt.year, value: pt.value })) }))}
        />
      </div>
      <p className="mt-4 max-w-[65ch] text-ink-2">{t("tools.growth.note")}</p>
      <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        {rows.map((r) => (
          <li key={r.id}>
            <SourceLink href={r.product.source} date={r.product.verified} label={r.name} />
          </li>
        ))}
      </ul>
    </ToolFrame>
  );
}

function DebtTool() {
  const { t, money, percent, profile, region } = useApp();
  const income = profile?.income ?? 1000;
  const [balance, setBalance] = useState(Math.round(income * 0.6));
  const [payment, setPayment] = useState(Math.round(income * 0.05));
  if (!region) return null;
  const card = region.products.expensiveCreditApr;
  const lender = region.products.informalLenderApr;
  const scenarios = [
    { id: "card", label: t("tools.debt.card", { rate: percent(card) }), apr: card, pay: payment },
    { id: "card-double", label: t("tools.debt.cardDouble", { rate: percent(card) }), apr: card, pay: payment * 2 },
    { id: "lender", label: t("tools.debt.lender", { rate: percent(lender) }), apr: lender, pay: payment },
  ];
  return (
    <ToolFrame tool="debt">
      <div className="grid max-w-xl gap-4 sm:grid-cols-2">
        <NumberField label={t("tools.debt.balance")} value={balance} onChange={setBalance} suffix={region.currency} />
        <NumberField label={t("tools.debt.payment")} value={payment} onChange={setPayment} suffix={region.currency} />
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {scenarios.map((s) => {
          const r = payoff(balance, s.apr, s.pay);
          return (
            <div key={s.id} className="rounded-sign bg-panel px-5 py-4">
              <span className="block font-bold">{s.label}</span>
              {r ? (
                <>
                  <span className="mt-2 block text-3xl font-extrabold tabular-nums">{t("tools.months", { n: r.months })}</span>
                  <span className="block text-ink-2">
                    {t("tools.debt.interest")} <strong className="tabular-nums text-danger">{money(r.totalInterest)}</strong>
                  </span>
                </>
              ) : (
                <span className="mt-2 block text-xl font-extrabold text-danger">{t("tools.debt.never")}</span>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-6 max-w-[65ch] text-lg">{t("tools.debt.note")}</p>
      <p className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
        <SourceLink href={region.products.expensiveCreditSource} date={region.economy.verified} label={t("guide.cardApr")} />
        <SourceLink href={region.products.informalLenderSource} date={region.economy.verified} label={t("guide.lenderApr")} />
      </p>
    </ToolFrame>
  );
}

export function ToolView({ tool }: { tool: ToolId }) {
  // Mount the tool only once the profile is loaded, so its starting numbers are the player's own.
  const { profile, region } = useApp();
  if (!profile || !region) return <RequireProfile>{null}</RequireProfile>;
  if (tool === "budget") return <BudgetTool />;
  if (tool === "growth") return <GrowthTool />;
  return <DebtTool />;
}

export function ToolsIndex() {
  const { t } = useApp();
  return (
    <RequireProfile>
      <h1 className="text-[clamp(2.25rem,5vw,3.5rem)] font-extrabold leading-[1.02] tracking-[-0.03em]">{t("tools.title")}</h1>
      <p className="mt-3 max-w-[60ch] text-xl text-ink-2">{t("tools.intro")}</p>
      <ul className="mt-8 grid max-w-4xl gap-4 md:grid-cols-3">
        {TOOLS.map((id) => (
          <li key={id}>
            <Link href={`/tools/${id}`} className="group flex h-full flex-col rounded-sign border-[3px] border-panel-strong bg-panel p-5 hover:border-ink">
              <Calculator aria-hidden="true" size={26} />
              <span className="mt-3 text-xl font-extrabold">{t(`tools.${id}.title`)}</span>
              <span className="mt-1 flex-1 text-ink-2">{t(`tools.${id}.about`)}</span>
              <span className="mt-4 flex items-center gap-1 font-bold">
                {t("hub.start")} <ArrowRight aria-hidden="true" size={18} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </RequireProfile>
  );
}
