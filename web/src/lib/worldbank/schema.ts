import { z } from "zod";

/** World Bank indicator ids we show. Lending and deposit rates are too sparse across our countries. */
export const INDICATORS = {
  inflation: "FP.CPI.TOTL.ZG",
  accountOwnership: "FX.OWN.TOTL.ZS",
} as const;

const observation = z.object({ value: z.number(), year: z.number().int(), source: z.url() });

export const worldBankSnapshotSchema = z.object({
  /** ISO date the snapshot was taken. */
  fetched: z.string(),
  countries: z.record(z.string(), z.partialRecord(z.enum(Object.keys(INDICATORS) as [keyof typeof INDICATORS]), observation)),
});

export type WorldBankSnapshot = z.infer<typeof worldBankSnapshotSchema>;
export type WorldBankObservation = z.infer<typeof observation>;
