# Decision Log

This file is a running log of ideas and decisions, so we can reference them in the final presentation. Newest entries go at the bottom. Each entry says what we decided, why, and where the details are.

| # | Date | Decision | Why | Details |
|---|---|---|---|---|
| 1 | 2026-10-15 | Concept: "write once, localize everywhere." Universal lesson templates plus per-country **region packs**, rendered by an AI grounded only in region-pack facts | Covers all three key considerations in the prompt, which make up 50 of the 100 points | [APPROACH.md](APPROACH.md#core-concept-recommended) |
| 2 | 2026-10-15 | Hackathon prompt PDF kept local in `reference/` and git-ignored | The PDF is marked "For internal use only" | [.gitignore](../.gitignore) |
| 3 | 2026-10-15 | App structure: **Onboarding → Life Path game → Lessons** | Agreed with the team | [APPROACH.md](APPROACH.md#product-structure-agreed-with-the-team) |
| 4 | 2026-10-15 | Onboarding collects age, language, location, budget and amount free to invest; it is stored in the browser only | Personalization without storing personal data on a server | [APPROACH.md](APPROACH.md#1-onboarding) |
| 5 | 2026-10-15 | Life Path game: Game-of-Life-style choices with **rewind any decision**, **what-if compare** and **optimal path**; seeded random events | Team idea; the seeded events make what-if comparisons fair | [APPROACH.md](APPROACH.md#2-life-path-game-game-of-life-style) |
| 6 | 2026-10-15 | **Mini-games are built into Life Path as life events**; *Scam or Legit?* is built first | One engine, one score; Scam or Legit? shows localization most clearly | [APPROACH.md](APPROACH.md#3-mini-games-as-life-events) |
| 7 | 2026-10-15 | Topic list: budgeting, emergency funds, banking basics, credit, debt, interest and inflation, saving vs. investing, retirement, insurance, taxes, scams, digital payments and mobile money, remittances, informal savings, interest-free mode | Covers the team's topics plus local financial systems | [APPROACH.md](APPROACH.md#4-topics-covered-lessons) |
| 8 | 2026-10-15 | **No Google Translate for core content.** UI via `next-intl` plus human check; lessons written directly in each language using a glossary; numbers and currency via the `Intl` API | Machine translation mangles financial terms and tone | [APPROACH.md](APPROACH.md#languages-strategy) |
| 9 | 2026-10-15 | **Provider-agnostic LLM layer.** Gemini (free tier) is the default, Ollama (Qwen) the offline fallback, OpenAI and Claude optional adapters. Lessons are pre-generated and cached | Demo can't fail on an API outage; matches the DB × Google / Vertex AI production path; on-premises option for privacy | [APPROACH.md](APPROACH.md#ai-model-strategy) |
| 10 | 2026-10-15 | Stack: Next.js + TypeScript + Tailwind + Zod + Vitest + Playwright/axe + GitHub Actions | One language end-to-end; strong testing and accessibility tooling | [APPROACH.md](APPROACH.md#suggested-architecture) |
| 11 | 2026-10-15 | Production path: Google Cloud (Frankfurt), Vertex AI, zero trust, DevSecOps pipeline, four-eyes reviews; mapped to GDPR, DORA, EU AI Act and the European Accessibility Act | Bank-grade security story for the presentation | [PRODUCTION_SECURITY.md](PRODUCTION_SECURITY.md) |
| 12 | 2026-10-15 | Tailored to Deutsche Bank: values mapping, positioned as a digital companion to Born to Be and So geht Geld, Germany-first, DE/EN | Fits the judges' organisation and its existing programmes | [DEUTSCHE_BANK_ALIGNMENT.md](DEUTSCHE_BANK_ALIGNMENT.md) |

| 13 | 2026-10-15 | Product name: **Rooted** | Works in every language; ties to "start from where you live" | [PRODUCT.md](../PRODUCT.md) |
| 14 | 2026-10-15 | **Age groups** (young 18–30, middle 31–54, senior 55+) each get their own life stages; seniors draw down savings instead of saving | Team request: results must differ by age group | `web/src/lib/game/stages.ts` |
| 15 | 2026-10-15 | Visual direction: **transit line map**. Life is a metro line, each decision a station, and the optimal path is a green express line. Each country has its own line colour (DE blue, IN yellow, MX pink). Font: Atkinson Hyperlegible, designed for low-vision readers | Chosen through Impeccable's direction round; the signage tradition (Mexico 1968, Munich 1972 Olympic pictograms) was made for low-literacy and multilingual audiences | [design/BRIEF.md](../design/BRIEF.md) |
| 16 | 2026-10-15 | Design skills vendored into `.claude/skills` (Impeccable, taste-skill) as instruction files only. Their scripts aren't included, and Anthropic's frontend-design plugin is offered separately | Same design rules for every teammate's Claude; no untrusted binaries | [.claude/skills/README.md](../.claude/skills/README.md) |
| 17 | 2026-10-15 | Scoring uses **diminishing returns on wealth** plus cushion, debt, credit and average wellbeing. The optimal path is found by exhaustive search; seeded randomness keeps what-ifs fair | Without this, "save everything, skip every celebration" wins. Now the optimum differs by country: balanced in Germany (low rates), saving more in India and Mexico (high rates) | `web/src/lib/game/engine.ts` |
| 18 | 2026-10-15 | **Localized rules inside the game:** unemployment cover (Germany's Arbeitslosengeld vs none in India and Mexico), deposit insurance, local scams, informal savings groups, big life events | This is the core of prompt accuracy: the same decision plays out differently by country | `web/src/content/regions/*.json` |
| 19 | 2026-10-15 | i18n: our own small `t()` instead of next-intl. The language is chosen in onboarding, not in the URL | Fewer moving parts on Next 16; tests check every language has every key and placeholder | `web/src/lib/i18n` |
| 20 | 2026-10-15 | Gemini's free tier allows only **20 requests/day per model**. The provider now falls back across models (`gemini-2.5-flash` → `gemini-2.5-flash-lite`), and the generator paces and retries | Found while pre-generating lessons. Saved lessons mean the demo never depends on quota | `web/src/lib/ai/provider.ts` |
| 21 | 2026-10-15 | CI on GitHub Actions: lint, typecheck, unit tests, build | SDLC points in the rubric | [.github/workflows/ci.yml](../.github/workflows/ci.yml) |

## Parked ideas (not in MVP, keep for roadmap slide)
- Remittance Navigator: a migrant-focused tool for comparing home and host financial systems
- Community-sourced region packs (a "Wikipedia for local finance" with reviewer approval)
- Story-mode episodic lessons with characters adapted to each region
- SMS/WhatsApp micro-lessons for low-bandwidth users
- Adaptive quizzes and a tutor chat grounded in the region pack
- Admin page for editing region packs, with a compliance approval workflow
- Mini-games marked as stretch: Credit Pet, Send Money Home, Market Stall

## Open questions
- How long is the build window, and when is the demo?
- Which demo countries? Proposed: Germany, India, Mexico or Kenya
- Which LLM keys does the team have, and which GPU or how much RAM can run Ollama?
- Will teammates push code at the same time? If so, we work on branches with pull requests
