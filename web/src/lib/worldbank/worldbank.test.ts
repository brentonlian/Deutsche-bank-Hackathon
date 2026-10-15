import { describe, expect, it } from "vitest";
import { REGIONS, REGION_IDS } from "@/lib/regions";
import { worldBankFor } from ".";

// Packs carry the latest central-bank figure; the World Bank lags by a year or more. A big gap
// means a pack figure may be a typo or out of date and needs a human to re-check it.
const MAX_INFLATION_GAP = 4;

describe("World Bank snapshot", () => {
  it.each(REGION_IDS)("%s has inflation and account ownership", (id) => {
    const wb = worldBankFor(id);
    expect(wb.inflation).toBeDefined();
    expect(wb.accountOwnership?.value).toBeGreaterThan(0);
    expect(wb.accountOwnership?.value).toBeLessThanOrEqual(100);
  });

  it.each(REGION_IDS)("%s pack inflation is close to the World Bank figure", (id) => {
    const gap = Math.abs(REGIONS[id].economy.inflationPct - (worldBankFor(id).inflation?.value ?? NaN));
    expect(gap, `${id} pack vs World Bank inflation`).toBeLessThanOrEqual(MAX_INFLATION_GAP);
  });
});
