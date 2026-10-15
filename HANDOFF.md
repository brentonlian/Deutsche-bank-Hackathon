# Claude handoff: Rooted (Innovate with DB 2026)

Read this first, then `docs/DECISIONS.md` (the full decision log, rows 1–39). Last updated 2026-10-15. Section 7 (tasks A–D) is done; see rows 34–38.

## 1. What this is
**Rooted** is a hackathon MVP for the prompt "Localized Financial Education". It adapts financial education to a user's country, language and stage of life.

**Rubric (100 points):**

| Criterion | Points |
|---|---|
| Prompt accuracy | 50 |
| Technical acumen | 15 |
| Usability and accessibility | 15 |
| Presentation | 10 |
| Originality | 10 |

The demo is 10 minutes plus 5 minutes of feedback. The original prompt PDF is git-ignored in `reference/` because it's marked internal-only.

## 2. Working rules (from the user)
- **No Claude attribution.** No `Co-Authored-By: Claude` or "Generated with Claude" in commits or PRs.
- **Log decisions.** Every idea or decision goes into `docs/DECISIONS.md` (or its "Parked ideas" section).
- **Ask before pushing.** Commit locally, then ask before pushing to `main`. Teammates may have clones.
- **Default demo paths only.** Don't add more lessons or languages unless asked; the demo uses the default paths in section 4.
- **Don't start the next tasks** in section 7 until the user says go.

## 3. How to run
```bash
cd web
npm install
cp .env.example .env.local   # GEMINI_API_KEY (optional: saved lessons work offline)
npm run dev                  # http://localhost:3000
npm test                     # 84 tests
npm run typecheck && npm run lint
```
Other scripts:
- `npm run localize` drafts de/es/hi translations with Gemini.
- `npm run lessons` pre-generates lessons (paced and retried).
- `npm run worldbank` refreshes the World Bank snapshot (no key needed).
- Optional AI tracing: set `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` and `LANGFUSE_BASE_URL` in `.env.local`.

**Dev server gotcha:** don't run `next build` while `next dev` is running, because it corrupts the dev cache and serves stale CSS. Stop dev first, or let CI build.

## 4. Demo script (default paths)
Go through the normal onboarding. The app recognizes these combinations and loads a fixed persona: a fixed random seed, pre-filled money and 2 saved lessons with quizzes. `/demo` has one-tap buttons as a backup.

| Persona | Pick in onboarding | Language | Lessons | Tools |
|---|---|---|---|---|
| Maya | United States · New York · Young adult · 24 | English | Credit and debt · Saving vs investing | Debt payoff · Savings growth |
| Ananya | India · Bengaluru · Middle age · 42 | English | Budgeting · Scams and fraud | Budget · Savings growth |
| Brigitte | Germany · Köln · Senior · 68 | Deutsch | Retirement · Scams and fraud (formal "Sie") | Savings growth · Budget |

Any other combination still works: random events, and the nearest saved lesson as a fallback.

## 5. What's built (all on `main`)
**Product flow:**
1. **Onboarding:** country, then city, language, age group and money.
2. **Learning line:** 6 stations with progress tracking:
   1. Country guide
   2. Lesson and quiz
   3. Calculator
   4. Lesson and quiz
   5. Calculator
   6. Life Path game
3. **Country guide** (`/learn/guide`): built entirely from region-pack facts, with a source link and "verified" date on every figure and product, plus World Bank figures (inflation, account ownership) shown beside the pack's figures with their own year.
4. **Lessons** (`/learn/[topic]`): grounded in country facts, with sources, read-aloud, a 3-question quiz, and a compare view across personas who share a topic.
5. **Calculators** (`/tools/...`): budget (50/30/20 plus emergency cushion), savings growth (cash vs savings vs index fund, inflation-adjusted) and debt payoff (card vs double payment vs lender). The math is tested in `web/src/lib/tools.ts`.
6. **Life Path game** (`/play`), played like BitLife: 10–11 life events per age group.
   - **Life screen:** character card (name, age, city, net worth), a life log grouped by age, and four stat bars (wellbeing, credit, cash cushion, know-how from the learning line).
   - **Age +1:** each tap lives one year and adds that year's real ledger lines to the log (pay and savings, interest at the real rate, market year, pension growth, debt interest, theft, inflation). "Skip to next event" jumps ahead. A part-year at the end of a stretch is folded into the step before it and labeled "Age 59–60".
   - **Life events** pop up as locked dialogs when their age arrives (same choices, local facts, sources and mini-games as before), followed by a short "what changed right away" pop-up.
   - **Assets** sheet: balances plus the real product behind each one, with rates and source links. **Activities** sheet: country guide, lessons, calculators, and the full money story for each finished stretch of years.
   - **No spoilers:** only a progress bar; the log never shows years you haven't lived.
   - **Money story:** the full ledger for each stretch (earned, spent, saved, interest, market years, debt interest, inflation), opened from the log or Activities.
   - **Mini-games:** *Scam or Legit?* uses local scams. The investing pick shows 4 cards: the index fund and savings use real figures, NovaGrid and ZapCoin are labeled fictional, and the reveal explains why the index fund is the best long-term pick.
7. **Results:** your line beside the green express line (the optimal path from exhaustive search, which never picks gambles), what-if on a chart, and replay from any station.

**Options available on every screen:**
- **Colors:** Light, Dark, High contrast or Calm (top-right button).
- **Simple-language toggle:** falls back to the saved lesson if no simple version exists.
- **Languages:** en, de, es, hi.
- **Countries:** US, IN, DE, MX.

**Engineering:**
- Next.js 16 (App Router, cacheComponents), TypeScript, Tailwind v4, Zod, Vitest.
- GitHub Actions CI: lint, typecheck (runs `next typegen` first), tests, build.
- Optional Langfuse tracing of lesson generation (`web/src/lib/ai/tracing.ts`), off without keys.
- Every product links to an official regulator or insurer page (`SourceLink.tsx`), in the guide, game choices, investing pick and calculators.

**Key files:**
- `web/src/content/regions/*.json`: region packs (facts, sources, products, scams, culture, cities, `nameIn`).
- `web/src/lib/game/`: engine (`engine.ts`, `money.ts` with the ledger, `stages.ts` per age group).
- `web/src/lib/lessons/`: grounded prompts, schema with quizzes, `server.ts` with cache and fallback.
- `web/src/lib/ai/provider.ts`: LLM adapter (Gemini Flash → Flash-Lite fallback, Ollama, OpenAI).
- `web/src/lib/learning.ts`: the learning line. `web/src/content/personas.ts`: demo personas.
- `web/src/content/i18n/`: UI strings and region overlays. Tests enforce every key and placeholder in all 4 languages.

**Design:** transit-line world (life as a metro line, express line = optimal path), Atkinson Hyperlegible font, one line color per country. See `PRODUCT.md`, `DESIGN.md` and `design/BRIEF.md`. The design skills (Impeccable, taste-skill) are vendored as instruction files only, in `.claude/skills/`.

**Docs:** `docs/PRESENTATION.md` (slide material), `docs/APPROACH.md`, `docs/PRODUCTION_SECURITY.md`, `docs/DEUTSCHE_BANK_ALIGNMENT.md`, `docs/DECISIONS.md`. Diagrams in `docs/diagrams/`: MVP architecture, production architecture, data flow.

## 6. Problems we hit (useful for the "challenges" slide)
- **Gemini free-tier limits:** only 20 requests a day per model, and 503 "high demand" errors. Fixed with model fallback (Flash → Flash-Lite), pacing and retries, saved lessons so the demo never depends on quota, and the 6 demo lessons hand-written and grounded in pack facts.
- **The optimizer taught the wrong lesson:**
  - At first the "optimal" life was "save everything, skip every celebration". Fixed with diminishing returns on wealth plus wellbeing, cushion, debt and credit in the score. As a result the optimum differs by country: balanced in Germany, more saving in India and Mexico.
  - With a fixed seed, a lucky gamble could look optimal. Fixed by flagging gambles `speculative` and excluding them from the express line.
- **Next.js 16 changes:** params must be read inside `<Suspense>`; React lint forbids setState in effects, so storage is read via `useSyncExternalStore`; running build during dev served stale CSS.
- **Localization bugs:**
  - "In Vereinigte Staaten" / "In United States": fixed with a `nameIn` field per country and language.
  - Picking a language reset the previewed country color.
  - A fallback English lesson was read aloud with a German voice: the API now returns the language it served.
- **Mobile overflow:** the station strip widened the grid. Fixed with `min-w-0`.
- **Spoilers:** the side list of upcoming events let players see an emergency coming. Removed.
- **Data freshness:** the World Bank API's latest inflation (US 2.9% for 2024, India 2.4% for 2025) lags behind the central-bank figures in our packs (US 3.4% Aug 2026, India 5.2% RBI projection). Show both with their dates instead of silently swapping.
- **Security choice:** third-party skill scripts weren't vendored (Impeccable's launcher downloads a binary), so design rules were applied manually.

## 7. Tasks A–D (done 2026-10-15)
Kept for reference. What was built: A → `docs/PRESENTATION.md` and the three diagrams; B → `web/src/lib/ai/tracing.ts`; C → `scripts/worldbank.ts` + `web/src/lib/worldbank/`; D → product `source`/`verified` fields + `SourceLink`. Details in decision rows 34–38.

**A. Presentation materials** (separate from the website, for slides; not shown in the app)
1. **Architecture diagram** for the MVP and the production target (Google Cloud, EU): `docs/diagrams/architecture-mvp.svg` and `architecture-production.svg`, both 1600×900, rendered and checked.
2. **Technical flow / data-flow diagram:** `docs/diagrams/data-flow.svg`, rendered and checked.
3. **Technologies used and why** (Next.js, TypeScript, Zod, Vitest, Tailwind, the provider-agnostic LLM layer, JSON region packs, localStorage).
4. **Scalability** of what we used: static pre-rendering and CDN, stateless API, lessons generated once and cached, a client-side engine (no server cost per game), and a JSON → database path in production.
5. **Ease of adding languages and countries:** a new country is one region-pack JSON (schema-checked) plus a line color. A new language is `npm run localize` plus native review. Tests catch missing keys and placeholders.
6. **Long-term security:** build on `docs/PRODUCTION_SECURITY.md` (GDPR, DORA, EU AI Act, European Accessibility Act, Vertex AI in the EU, zero trust, DevSecOps, four-eyes review).
7. **How we approached the problem** and **problems we had**: use section 6 above and `docs/DECISIONS.md`.

**B. Langfuse for AI observability**
- Langfuse is open-source (MIT core) LLM tracing, prompt management and evals, and it can be self-hosted (fits EU data residency).
- TypeScript SDK v4 is OpenTelemetry-based: `@langfuse/tracing` (`startObservation`) and `@langfuse/otel` (`LangfuseSpanProcessor`). It needs Node 20+ and the env vars `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY` and `LANGFUSE_BASE_URL`.
- **Plan:** wrap `LLMProvider.generateJson` in `web/src/lib/ai/provider.ts` to trace model, prompt version, latency, tokens, fallback used, schema-validation pass or fail, and which facts were cited. Optionally move prompts into Langfuse prompt management.
- **Data rule:** keep it optional when no keys are set, and send no personal data (requests already contain none).
- **Unverified:** one 2026 source claims Langfuse was acquired by ClickHouse; confirm on langfuse.com before mentioning it.
- **Not yet tried against a real Langfuse project** (no keys here). The span attributes are checked in `tracing.test.ts`.
- Docs: https://langfuse.com/docs/observability/sdk/typescript/overview

**C. World Bank Indicators API**
- Verified working on 2026-10-15, no key needed: `https://api.worldbank.org/v2/country/{USA|IND|DEU|MEX}/indicator/{ID}?format=json&mrnev=1`
- **Useful indicators:**
  - `FP.CPI.TOTL.ZG`: inflation
  - `FX.OWN.TOTL.ZS`: account ownership, Global Findex (India 89% in 2024)
  - `FR.INR.LEND` / `FR.INR.DPST`: lending and deposit rates
- **Plan:**
  - A server route or build script that fetches the indicators and caches them with revalidation.
  - Show them in the country guide as "World Bank, {year}" next to the pack's current central-bank figures. The years differ, so show both and don't overwrite.
  - Optionally a test that flags packs drifting far from the World Bank figure.

**D. Direct source links on product suggestions** (e.g. "open a CD")
- Wherever the app suggests or names a product (game options, market cards, calculators, country guide table, lessons), add a direct link to where the information came from.
- **Schema change:** add `source` (and `verified`) to each product in `regionPackSchema.products`.
- **Render it:** show the link next to every product mention and fact chip.
- **US example:** if we add a certificate of deposit (CD) product, link the FDIC consumer guide "Shopping for a Certificate of Deposit?" (https://www.fdic.gov/resources/consumers/consumer-news/2023-11.html), and FDIC BankFind to check a bank is insured.
- **Other countries:** use the official regulator or deposit-insurer pages (BaFin/EdB, RBI/DICGC, CONDUSEF/IPAB).
- **Check:** add a test that every product has a source.

## 8. Known gaps
- **Translations:** de/es/hi strings are AI-drafted or hand-written and need native review. Hindi and Spanish are least reviewed.
- **Lesson coverage:** only the 6 persona lessons have quizzes. Other saved lessons have no quiz (they show a "mark as read" button).
- **Approximate figures:** some product rates in the packs are approximations dated "2026-10"; verify before the demo. The Fed rate is shown as "about 3.9%" (actual range 3.75–4.00%).
- **Production build:** passes locally (2026-10-15). CI status couldn't be read from here (private repo, no `gh`).
- **Product source links** point to regulator and insurer pages, often a home or section page rather than a page about that exact product. Deeper links would be better where they're stable.
- **World Bank snapshot** is from 2026-10-15; rerun `npm run worldbank` before the demo if it's much later.
- **Not done:** Impeccable's final design review (critique and audit pass) hasn't been run.
