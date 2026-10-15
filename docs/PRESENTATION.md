# Presentation material

Slide content for the 10-minute pitch. Nothing here is shown in the app. Each section is meant to become one slide; the bullets are the speaker's points.

## Diagrams
| Slide | File | Size |
|---|---|---|
| MVP architecture | [diagrams/architecture-mvp.svg](diagrams/architecture-mvp.svg) | 1600×900 |
| Production target (Google Cloud, EU) | [diagrams/architecture-production.svg](diagrams/architecture-production.svg) | 1600×900 |
| How data moves | [diagrams/data-flow.svg](diagrams/data-flow.svg) | 1700×1060 |

All three use the app's own palette and font, so they match the demo. Open them in a browser and screenshot, or drop the SVG straight into Google Slides / PowerPoint.

---

## 1. How we approached the problem
- **Read the rubric first.** Prompt accuracy is 50 of 100 points, so every feature had to map to one of the prompt's three key considerations: dynamic localization, AI adapted to regulation, economy and culture, and multilingual access. Anything that didn't map was cut ([APPROACH.md](APPROACH.md)).
- **"Write once, localize everywhere."** Universal lessons and life events, filled in by per-country **region packs**: real products, institutions, deposit insurance, scams, informal savings groups, unemployment cover and rates, each with a source and a "verified" month.
- **Learn first, then practice.** A learning line (country guide, lessons with quizzes, calculators) leads into the Life Path game, where people live through about 10 decisions and see the consequences in their country's money.
- **AI only where it helps.** The model writes lessons and drafts translations from the vetted facts. It is never the source of a number, and the demo runs offline from saved, reviewed output.
- **Every decision is logged** with its reason ([DECISIONS.md](DECISIONS.md)), so this deck is a summary of that log.

## 2. Technologies and why
| Technology | Why we chose it |
|---|---|
| **Next.js 16 (App Router) + React 19** | One codebase for pages and the lesson API. Most pages pre-render to static HTML, so they can be served from a CDN |
| **TypeScript** | One language from the game engine to the API to the build scripts. Region packs and lessons are typed end to end |
| **Zod** | Validates region packs at load, API requests, AI output and the World Bank snapshot. Bad data fails loudly instead of reaching a learner |
| **Vitest** | 78 fast unit tests: engine maths, calculators, every pack has sources, every translation has every key and placeholder, lessons cite only real facts, tracing, World Bank drift |
| **Tailwind CSS v4** | Design tokens (country line colors, themes) as CSS variables; four color themes without duplicated styles |
| **Provider-agnostic LLM layer** | Gemini by default with model fallback, Ollama for on-premises, OpenAI optional. Production swaps in Vertex AI (EU) by config, not a rewrite |
| **Langfuse (optional)** | Open-source LLM tracing that can be self-hosted in the EU. Records model, prompt version, latency, tokens, fallback, schema pass or fail and the facts cited. Off when no keys are set |
| **JSON region packs in Git** | Content is reviewable in pull requests, versioned, and needs no database for the MVP |
| **World Bank Indicators API** | Free, keyless, official open data. A script snapshots it so the app still works offline |
| **localStorage** | The profile never leaves the device: privacy by design with no backend to secure |
| **GitHub Actions** | Lint, typecheck, tests and production build on every push |
| **Atkinson Hyperlegible** | A typeface designed for low-vision readers |

## 3. Scalability
- **Static first.** The shell, guide, calculators and lesson pages pre-render at build time and can sit on a CDN. Serving a million learners costs about the same as serving one.
- **The game runs in the browser.** The Life Path engine is pure TypeScript on the learner's device, including the optimal-path search (up to 46,656 paths). No server cost per game.
- **Lessons are generated once, then cached.** One lesson per country × language × age group × topic × reading level. The model is called once per combination, never per view, and the result is reviewed before it ships.
- **Stateless API.** `/api/lesson` holds no session state, so it scales horizontally (Cloud Run in production).
- **Content path to a database.** JSON files in Git work for 4 countries. In production the same schemas move to Cloud SQL with versioning and an approval workflow; Redis caches rendered lessons.
- **Open data is batched.** World Bank figures are fetched by a scheduled job, not on every page view.

## 4. Adding a country or a language
**A new country** is mostly data:
1. Add one region-pack JSON in `web/src/content/regions/` (rates, products with their official source links, institutions, scams, culture). The Zod schema rejects anything missing.
2. List it in `web/src/lib/regions/index.ts` and give it a line color: one CSS block in `globals.css`.
3. Run `npm run worldbank` to add its open-data figures, and `npm run localize` to draft its text in the other languages.
4. Tests then check it: sources on every product, scam and legit examples, local currency formatting, translation overlays, World Bank drift.

**A new language:**
1. Add it to `LANGUAGES` in `web/src/lib/i18n/index.ts` (with its writing direction) and to the targets in `scripts/localize.ts`, with a tone note (formal or informal address).
2. Run `npm run localize`. The AI drafts every UI string and region text while protecting placeholders and glossary terms such as Schufa or UPI.
3. A native speaker reviews the draft in a pull request. Tests fail if any key or placeholder is missing.

## 5. Long-term security
Built on [PRODUCTION_SECURITY.md](PRODUCTION_SECURITY.md); shown in the production diagram.
- **Privacy by design:** anonymous by default, the profile stays in the browser, lesson requests carry no personal data, and tracing sends none either.
- **Regulation:** GDPR (EU residency, minimization, export and delete), DORA (ICT risk, incident reporting, provider exit plan), EU AI Act (AI labels, human oversight, logging), European Accessibility Act (WCAG 2.1 AA as a release gate), BaFin MaRisk for cloud and LLM outsourcing.
- **Responsible AI:** grounded only in vetted facts, schema-validated output, PII redaction before the model (Sensitive Data Protection), compliance review before a lesson is published, every generation traced.
- **Platform:** Google Cloud in Frankfurt, Vertex AI EU endpoint, zero trust (VPC Service Controls, Secret Manager, customer-managed keys, Workload Identity), Cloud Armor WAF.
- **Delivery:** Terraform environments, four-eyes review on code and content, gitleaks, CodeQL, dependency scanning, SBOM, signed images, OWASP ZAP, axe accessibility checks, canary releases.
- **Education, not advice:** no product recommendations; product links go to regulators and deposit insurers, not to sellers.

## 6. Problems we hit and how we solved them
| Problem | What we did |
|---|---|
| Gemini free tier: 20 requests a day per model, plus 503 "high demand" errors | Fallback across models, pacing and retries, saved lessons so the demo never depends on quota, and the 6 demo lessons hand-written from pack facts |
| The optimizer taught the wrong lesson ("save everything, skip every celebration") | Diminishing returns on wealth plus wellbeing, cushion, debt and credit in the score. The optimum now differs by country |
| A lucky gamble could look optimal with a fixed seed | Gambles are flagged speculative and never picked by the express line |
| Next.js 16 changes | Params read inside Suspense; storage read via `useSyncExternalStore`; route types generated before typecheck in CI |
| Grammar across languages ("in Vereinigte Staaten") | A `nameIn` field per country and language |
| A fallback English lesson read aloud with a German voice | The API returns the language it actually served |
| Spoilers: the list of upcoming events showed an emergency coming | Removed; only a progress bar |
| Open data lags: World Bank inflation is a year or more behind central-bank figures | Show both, each with its date, and test that they don't drift too far apart |
| Third-party design-skill scripts download binaries | Vendored the instructions only and applied the rules by hand |

## 7. What's next (roadmap slide)
From the parked ideas in [DECISIONS.md](DECISIONS.md): a remittance navigator, community-sourced region packs with reviewer approval, SMS and WhatsApp micro-lessons, a tutor chat grounded in the region pack, an admin page with a compliance workflow, and native review of the Hindi and Spanish translations.
