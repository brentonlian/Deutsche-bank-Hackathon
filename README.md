# Rooted: Localized Financial Education (Innovate with DB 2026)

Rooted teaches money skills adapted to your **country, language and stage of life**.

**Demo script:** go through the normal onboarding and pick one of these. The app recognizes the combination and loads that persona's fixed life events and saved lessons. `/demo` has one-tap buttons as a backup.

| Persona | Pick in onboarding | Language | Lessons |
|---|---|---|---|
| Maya | United States · New York · Young adult · 24 | English | Credit and debt · Saving vs investing |
| Ananya | India · Bengaluru · Middle age · 42 | English | Budgeting · Scams and fraud |
| Brigitte | Germany · Köln · Senior · 68 | Deutsch | Retirement · Scams and fraud |

Each persona has fixed life events, so the demo plays the same every time.

1. **Onboarding:** country and city, language, age group and monthly budget. Everything stays in the browser.
2. **Learning line (home):** 6 stations.
   - **Country guide:** how money works in your country, every figure sourced.
   - **Lessons with quizzes:** two lessons, each followed by a short quiz.
   - **Calculators:** budget planner, savings growth, debt payoff, using your numbers and your country's real rates.
   - **Life Path game:** the last station, for practice.
3. **Life Path game**, played like BitLife: tap **Age +1** to live one year at a time and read what happened in your life log; life events pop up as you reach them. 10–11 decisions, no spoilers about what's coming.
   - **Stats:** wellbeing, credit, cash cushion and know-how bars; **Assets** shows the real local products behind your money; **Activities** links to lessons and calculators.
   - **Money story:** for each stretch of years, where every unit of money went (pay, spending, savings, interest, market years, debt interest).
   - **Mini-games:** *Scam or Legit?* and an investing pick with news and metrics.
4. **Results:** your line beside the green **express line** (the optimal path). Tap any station for the better choice, a what-if on the chart, or a replay from there.
5. **Colors:** Light, Dark, High contrast or Calm, from the top-right button.

Countries: United States, India, Germany and Mexico. Languages: English, Deutsch, Español and हिन्दी; any language works with any country.

## Run it

```bash
cd web
npm install
cp .env.example .env.local   # add GEMINI_API_KEY (optional: saved lessons work offline)
npm run dev                  # http://localhost:3000
```

| Script | What it does |
|---|---|
| `npm test` | Engine, region-pack and translation tests (Vitest) |
| `npm run typecheck` / `npm run lint` | TypeScript and ESLint |
| `npm run localize` | AI-drafts de/es/hi translations of the UI and region packs, protecting placeholders and glossary terms |
| `npm run lessons` | Pre-generates lessons into `web/src/content/lessons` (paced for free-tier quotas) |
| `npm run worldbank` | Snapshots World Bank indicators (inflation, account ownership) into `web/src/content/worldbank.json` |

## How it's built
- `web/src/content/regions/*.json`: **region packs**, schema-validated country data with sources and "verified" dates. Adding a country means adding a file.
- `web/src/lib/game`: deterministic Life Path engine (seeded events, exhaustive optimal-path search, what-if).
- `web/src/lib/ai/provider.ts`: provider-agnostic LLM layer (Gemini default with model fallback, Ollama, OpenAI).
- `web/src/lib/ai/tracing.ts`: optional Langfuse tracing of every generation (set `LANGFUSE_*` keys to turn it on).
- `web/src/lib/lessons`: grounded lesson prompts, schema validation, file cache.
- `web/src/content/i18n`: UI strings (en source, AI-drafted de/es/hi) plus region-pack overlays.

## Docs
- [Presentation material](docs/PRESENTATION.md): diagrams, technologies, scalability, adding countries and languages, security, challenges
- [Approach and concept](docs/APPROACH.md): the challenge, scoring strategy, concept, MVP scope, pitch outline
- [Decision log](docs/DECISIONS.md): every idea and decision so far, plus parked ideas and open questions
- [Productionizing in a bank](docs/PRODUCTION_SECURITY.md): security, compliance, architecture, DevSecOps, SDLC
- [Tailoring to Deutsche Bank](docs/DEUTSCHE_BANK_ALIGNMENT.md): values mapping, technology fit, existing DB programs
- [Product record](PRODUCT.md) and [design brief](design/BRIEF.md)

The original hackathon prompt is internal-use and kept locally in `reference/`, which git ignores.
