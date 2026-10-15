import { z } from "zod";

/** A fact the app shows to users must carry where it came from and when we checked it. */
export const sourcedFact = z.object({
  value: z.string(),
  source: z.url(),
  verified: z.string(), // ISO month, e.g. "2026-10"
});

const savingsVehicle = z.object({
  id: z.string(),
  name: z.string(),
  /** Expected nominal annual return in percent. */
  ratePct: z.number(),
  liquidity: z.enum(["instant", "days", "locked"]),
  risk: z.enum(["none", "low", "medium", "high"]),
  insured: z.boolean(),
  note: z.string(),
});

const scamCard = z.object({
  id: z.string(),
  channel: z.enum(["sms", "call", "app", "email", "social", "in-person"]),
  sender: z.string(),
  message: z.string(),
  isScam: z.boolean(),
  /** What gives it away (or why it is legitimate). */
  tell: z.string(),
});

export const regionPackSchema = z.object({
  id: z.string().regex(/^[A-Z]{2}$/),
  name: z.string(),
  flag: z.string(),
  locale: z.string(), // BCP 47 for number/currency formatting
  currency: z.string().length(3),
  languages: z.array(z.string()).min(1),
  /** Cities offered in onboarding (proper nouns, not translated). */
  cities: z.array(z.string()).min(1),
  /** Typical monthly take-home pay for a young adult, used as the onboarding default. */
  typicalMonthlyIncome: z.number().positive(),
  economy: z.object({
    inflationPct: z.number(),
    policyRatePct: z.number(),
    worldBankCode: z.string(),
    sources: z.array(z.url()),
    verified: z.string(),
  }),
  institutions: z.object({
    centralBank: z.string(),
    regulator: z.string(),
    depositInsurance: sourcedFact,
    creditBureau: z.string(),
    paymentRails: z.array(z.string()),
    retirementSystem: z.string(),
    /** Share of take-home pay replaced by unemployment benefits (0 if none for most workers). */
    unemploymentCover: z.number().min(0).max(1),
    unemploymentNote: z.string(),
  }),
  products: z.object({
    cashAtHome: savingsVehicle,
    everydayAccount: savingsVehicle,
    savingsAccount: savingsVehicle,
    indexFund: savingsVehicle,
    retirementProduct: savingsVehicle,
    /** Annual percentage rate on expensive consumer credit (card, overdraft, BNPL arrears). */
    expensiveCreditApr: z.number(),
    /** Informal / predatory lender APR. */
    informalLenderApr: z.number(),
  }),
  informalSavings: z
    .object({
      name: z.string(),
      description: z.string(),
      ratePct: z.number(),
    })
    .nullable(),
  culture: z.object({
    bigLifeEvent: z.object({ name: z.string(), typicalCostMonths: z.number(), note: z.string() }),
    /** A grandchild's milestone families celebrate, used in the senior game. */
    grandchildMilestone: z.string(),
    familySupport: z.string(),
    notes: z.array(z.string()),
  }),
  scams: z.array(scamCard).min(4),
  /** Terms that must never be translated (product and institution names). */
  glossaryKeep: z.array(z.string()),
});

export type RegionPack = z.infer<typeof regionPackSchema>;
export type SavingsVehicle = z.infer<typeof savingsVehicle>;
export type ScamCard = z.infer<typeof scamCard>;
