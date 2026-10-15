# Rooted: Localized Financial Education (Innovate with DB 2026)

Rooted teaches money skills adapted to your **country, language and stage of life**:

1. **Onboarding:** country, language, age group and monthly budget. Everything stays in the browser.
2. **Life Path:** a Game-of-Life-style series of 10–11 decisions drawn as a metro line. Each country's real products, rates, scams, savings groups and safety nets change the outcome. A *Scam or Legit?* mini-game appears as a life event.
3. **Results:** your line beside the green **express line** (the optimal path). Tap any station to see the best choice from where you stood, show the what-if on the chart, or replay from there.
4. **Lessons:** 13 topics written by AI **only from vetted country facts**, with sources. *Compare countries* shows the same lesson for Germany, India and Mexico side by side.

Demo countries: Germany (Deutsch/English), India (हिन्दी/English) and Mexico (Español/English). Any of the four languages works with any country.

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

## How it's built
- `web/src/content/regions/*.json`: **region packs**, schema-validated country data with sources and "verified" dates. Adding a country means adding a file.
- `web/src/lib/game`: deterministic Life Path engine (seeded events, exhaustive optimal-path search, what-if).
- `web/src/lib/ai/provider.ts`: provider-agnostic LLM layer (Gemini default with model fallback, Ollama, OpenAI).
- `web/src/lib/lessons`: grounded lesson prompts, schema validation, file cache.
- `web/src/content/i18n`: UI strings (en source, AI-drafted de/es/hi) plus region-pack overlays.

## Docs
- [Approach and concept](docs/APPROACH.md): the challenge, scoring strategy, concept, MVP scope, pitch outline
- [Decision log](docs/DECISIONS.md): every idea and decision so far, plus parked ideas and open questions
- [Productionizing in a bank](docs/PRODUCTION_SECURITY.md): security, compliance, architecture, DevSecOps, SDLC
- [Tailoring to Deutsche Bank](docs/DEUTSCHE_BANK_ALIGNMENT.md): values mapping, technology fit, existing DB programmes
- [Product record](PRODUCT.md) and [design brief](design/BRIEF.md)

The original hackathon prompt is internal-use and kept locally in `reference/`, which git ignores.
