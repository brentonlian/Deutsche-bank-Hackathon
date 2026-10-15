import type { RegionPack } from "@/lib/regions/schema";
import type { GameState } from "./types";

/**
 * Values interpolated into stage text. Every product, rate and institution comes from the
 * (localized) region pack, so the same sentence reads differently in each country.
 */
export function stageVars(
  region: RegionPack,
  s: GameState,
  money: (v: number) => string,
  percent: (v: number) => string,
): Record<string, string> {
  const p = region.products;
  return {
    country: region.name,
    countryIn: region.nameIn,
    income: money(s.income),
    cash: money(s.cash),
    cashName: p.cashAtHome.name,
    cashRate: percent(p.cashAtHome.ratePct),
    everydayName: p.everydayAccount.name,
    everydayRate: percent(p.everydayAccount.ratePct),
    savingsName: p.savingsAccount.name,
    savingsRate: percent(p.savingsAccount.ratePct),
    savingsInsured: p.savingsAccount.insured ? region.institutions.depositInsurance.value : p.savingsAccount.note,
    informalName: region.informalSavings?.name ?? "",
    informalRate: percent(region.informalSavings?.ratePct ?? 0),
    creditApr: percent(p.expensiveCreditApr),
    lenderApr: percent(p.informalLenderApr),
    loanApr: percent(region.economy.policyRatePct + 5),
    indexName: p.indexFund.name,
    indexRate: percent(p.indexFund.ratePct),
    retirementSystem: region.institutions.retirementSystem,
    retirementName: p.retirementProduct.name,
    retirementRate: percent(p.retirementProduct.ratePct),
    bigEvent: region.culture.bigLifeEvent.name,
    bigEventNote: region.culture.bigLifeEvent.note,
    familySupport: region.culture.familySupport,
    unemploymentNote: region.institutions.unemploymentNote,
    grandchildMilestone: region.culture.grandchildMilestone,
  };
}

export interface ProductSource {
  name: string;
  source: string;
  verified: string;
}

/** Official sources for the products a stage's options name, shown under the choices. */
export function stageSources(region: RegionPack, stageId: string, borrowLabels: { card: string; lender: string }): ProductSource[] {
  const p = region.products;
  const v = (x: RegionPack["products"]["savingsAccount"]) => ({ name: x.name, source: x.source, verified: x.verified });
  const verified = region.economy.verified;
  switch (stageId) {
    case "where-to-save":
      return [v(p.cashAtHome), v(p.everydayAccount), v(p.savingsAccount)];
    case "invest":
      return [v(p.indexFund)];
    case "pension":
      return [v(p.retirementProduct)];
    case "emergency":
      return [
        { name: borrowLabels.card, source: p.expensiveCreditSource, verified },
        { name: borrowLabels.lender, source: p.informalLenderSource, verified },
      ];
    default:
      return [];
  }
}
