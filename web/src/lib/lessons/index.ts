import { z } from "zod";
import type { AgeGroup } from "@/lib/game/types";
import type { Lang } from "@/lib/i18n";
import type { RegionPack } from "@/lib/regions/schema";

export const TOPICS = [
  "budgeting",
  "emergency-fund",
  "banking-basics",
  "saving-vs-investing",
  "inflation",
  "credit-and-debt",
  "scams-and-fraud",
  "insurance",
  "retirement",
  "digital-payments",
  "informal-savings",
  "taxes",
  "remittances",
] as const;

export type Topic = (typeof TOPICS)[number];
export const isTopic = (v: string): v is Topic => (TOPICS as readonly string[]).includes(v);

export const lessonSchema = z.object({
  title: z.string(),
  summary: z.string(),
  sections: z.array(z.object({ heading: z.string(), body: z.string() })).min(2).max(5),
  example: z.object({ title: z.string(), body: z.string() }),
  takeaway: z.string(),
  /** Keys of the facts the lesson relied on, so the page can show sources. */
  factsUsed: z.array(z.string()),
  /** A short check for understanding, written in the lesson's language. */
  quiz: z
    .array(
      z.object({
        question: z.string(),
        options: z.array(z.string()).min(2).max(4),
        answer: z.number().int().min(0),
        why: z.string(),
      }),
    )
    .optional(),
});

export type Lesson = z.infer<typeof lessonSchema>;

export interface Fact {
  key: string;
  text: string;
  source?: string;
  verified?: string;
}

/** The only facts a lesson may use. Everything comes from the vetted region pack. */
export function regionFacts(r: RegionPack): Fact[] {
  const econ = { source: r.economy.sources[0], verified: r.economy.verified };
  const p = r.products;
  const product = (key: string, v: RegionPack["products"]["savingsAccount"]) => ({
    key,
    text: `${v.name}: about ${v.ratePct}% a year, ${v.liquidity === "locked" ? "locked until retirement" : `access ${v.liquidity}`}, risk ${v.risk}${v.insured ? ", protected" : ""}. ${v.note}`,
    source: v.source,
    verified: v.verified,
  });
  return [
    { key: "currency", text: `Currency: ${r.currency}.` },
    { key: "deposit-insurance", text: `Deposit insurance: ${r.institutions.depositInsurance.value}.`, source: r.institutions.depositInsurance.source, verified: r.institutions.depositInsurance.verified },
    { key: "inflation", text: `Inflation is about ${r.economy.inflationPct}% a year.`, source: r.economy.sources[1], verified: r.economy.verified },
    { key: "policy-rate", text: `The central bank (${r.institutions.centralBank}) policy rate is ${r.economy.policyRatePct}%.`, ...econ },
    { key: "regulator", text: `Financial regulator: ${r.institutions.regulator}.` },
    { key: "credit-bureau", text: `Credit scores come from: ${r.institutions.creditBureau}.` },
    { key: "payment-rails", text: `Common ways to pay: ${r.institutions.paymentRails.join(", ")}.` },
    { key: "retirement-system", text: `Retirement system: ${r.institutions.retirementSystem}.` },
    { key: "unemployment", text: r.institutions.unemploymentNote },
    product("cash", p.cashAtHome),
    product("everyday-account", p.everydayAccount),
    product("savings-account", p.savingsAccount),
    product("index-fund", p.indexFund),
    product("retirement-product", p.retirementProduct),
    { key: "expensive-credit", text: `Credit cards and overdrafts cost about ${p.expensiveCreditApr}% a year.`, source: p.expensiveCreditSource, verified: r.economy.verified },
    { key: "informal-lender", text: `Informal money lenders can charge about ${p.informalLenderApr}% a year or more.`, source: p.informalLenderSource, verified: r.economy.verified },
    ...(r.informalSavings ? [{ key: "informal-savings", text: `${r.informalSavings.name}: ${r.informalSavings.description}` }] : []),
    { key: "big-life-event", text: `${r.culture.bigLifeEvent.name}: ${r.culture.bigLifeEvent.note}` },
    { key: "family-support", text: `Family support: ${r.culture.familySupport}.` },
    ...r.culture.notes.map((n, i) => ({ key: `culture-${i + 1}`, text: n })),
    ...r.scams.map((s) => ({ key: `scam-${s.id}`, text: `${s.isScam ? "Common scam" : "Legitimate message"} (${s.channel}): "${s.message}" ${s.tell}` })),
  ];
}

const GROUP_CONTEXT: Record<AgeGroup, string> = {
  young: "a young adult aged 18-30 with a first job or studying, possibly new to banking",
  middle: "an adult aged 31-54 managing a family budget, children, maybe a car and ageing parents",
  senior: "a senior aged 55+ living mainly on a pension, careful with savings and often targeted by scams",
};

const LANG_NAMES: Record<Lang, string> = { en: "English", de: "German (informal du)", es: "Mexican Spanish (tú)", hi: "Hindi in Devanagari (respectful आप)" };

export function lessonPrompt(opts: { topic: Topic; region: RegionPack; lang: Lang; group: AgeGroup; simple: boolean }) {
  const facts = regionFacts(opts.region);
  const system = `You write short financial-education lessons. Rules:
- Use ONLY the numbered facts provided for any number, rate, law, product, institution or scam. Never invent figures, brand names or rules.
- Do not recommend specific companies or products, and do not give personal investment advice. Explain trade-offs.
- Respect local and cultural practices; never shame people for informal savings, family obligations or celebrations.
- Write for ${GROUP_CONTEXT[opts.group]} who lives in ${opts.region.name}.
- ${opts.simple ? "Use very simple language: short sentences of at most 12 words, everyday words, no jargon. Reading level of a 10-year-old." : "Use plain language a 14-year-old could follow."}
- Keep these terms untranslated: ${opts.region.glossaryKeep.join(", ")}.
- Write everything in ${LANG_NAMES[opts.lang]}.
- Return JSON: {"title": string, "summary": string (1-2 sentences), "sections": [{"heading": string, "body": string (2-4 sentences)}] (3 sections), "example": {"title": string, "body": string (a short story with a local name and amounts in ${opts.region.currency})}, "takeaway": string (one sentence), "factsUsed": [fact keys you used]}`;
  const prompt = `Topic: ${opts.topic}\n\nFacts for ${opts.region.name}:\n${facts.map((f) => `[${f.key}] ${f.text}`).join("\n")}`;
  return { system, prompt };
}

export const lessonCachePath = (o: { regionId: string; lang: Lang; group: AgeGroup; topic: Topic; simple: boolean }) =>
  `${o.regionId}/${o.lang}/${o.group}-${o.topic}${o.simple ? "-simple" : ""}.json`;
