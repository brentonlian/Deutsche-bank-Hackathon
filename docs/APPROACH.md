# Approach: Localized Financial Education (Innovate with DB 2026)

The original prompt PDF is in `reference/`. It's marked "For internal use only", so `.gitignore` keeps it out of the repo.

## The challenge in one line
Build a scalable platform that adapts financial education to local **languages, regulations, banking systems, economic conditions and cultural norms**, with personalized, region-specific guidance that's accessible to everyone.

## What the score is weighted toward

| Criterion | Pts | What it means for us |
|---|---|---|
| Prompt accuracy | **50** | Each of the 3 key considerations needs to show up clearly in the demo: (1) dynamic localization, (2) AI adapting content to regulation, economy and culture, (3) multilingual support and accessibility |
| Technical acumen | 15 | Clean architecture, schema-validated data, tests, CI, a README. Use AI where it actually helps |
| Usability | 15 | WCAG basics, voice, low-literacy mode, mobile-first, easy to extend to new regions |
| Presentation | 10 | A 10-minute story with one standout demo moment |
| Originality | 10 | A memorable name and a concept that goes beyond "chatbot + Google Translate" |

**Strategy:** Prompt accuracy is half the grade, so every feature should map to one of the three key considerations. Anything that doesn't map gets cut.

---

## Core concept (recommended)

### Working name ideas
- **Rooted** — "financial education that grows from where you are"
- **Common Cents** / **Local Ledger** / **Mosaic** / **Kaleido** (one lesson, many views)

### The big idea: "Write once, localize everywhere"
Most localization stops at translation. We split a lesson into two layers:

1. **Lesson templates (universal concepts)**, e.g. *emergency funds, budgeting, credit scores, interest and inflation, avoiding scams, sending remittances, retirement*. Each template defines learning goals plus **slots**.
2. **Region packs (local facts)**: versioned JSON per country holding currency, central bank rate, inflation, tax-advantaged accounts, credit bureau, deposit insurance limit, regulator, common scams, ID needed to open an account, dominant payment rails, and **cultural practices**. Every fact has a source URL and a `last_verified` date.

An **AI localization engine** (provider-agnostic LLM; see [AI model strategy](#ai-model-strategy)) combines template + region pack + user profile into a lesson. It is **grounded only in the region pack** (no invented regulations), cites its sources, and uses a culturally appropriate tone and examples.

> Same lesson "Build an emergency fund":
> - 🇮🇳 India: ₹, UPI, sweep-in FDs, DICGC ₹5 lakh insurance, chit funds as a familiar starting point
> - 🇲🇽 Mexico: MXN, SPEI/CoDi, IPAB coverage, *tandas*
> - 🇩🇪 Germany: €, Tagesgeld, Einlagensicherung €100k, *Bausparen*
> - 🇰🇪 Kenya: KES, M-Pesa/M-Shwari, *chamas*
> - 🇸🇦 / 🇲🇾 Islamic finance mode: profit-sharing accounts, no interest (riba-free) framing

**Demo moment:** a side-by-side view where one click re-renders the same lesson for 3 countries live.

### Originality hooks (pick 2–3)
1. **"Bridge from what you already do"**: map informal practices people already trust (tandas, chamas, susu, chit funds, hawala) to formal products, presented respectfully rather than as "you're doing it wrong".
2. **Real-number simulators**: "Save 2,000 KES/month: mattress vs. M-Shwari vs. a chama, after inflation". This uses **live open data** (World Bank inflation, central bank rates).
3. **Freshness guardrail**: each region-pack fact shows a "verified on" date, and the AI flags stale facts when it uses them. This builds trust and suits a bank audience.
4. **Life-event entry points**: "I just got my first job / moved countries / am sending money home" instead of a course catalogue. Migrants are a strong persona because they straddle two financial systems.
5. **Low-bandwidth mode**: PWA offline caching, plus an optional SMS/WhatsApp-style "micro-lesson" view.

### Personalization
A short onboarding (country, language, life stage, income pattern such as salaried/gig/seasonal/remittance-dependent, banked status, literacy preference) produces the lesson path and tone.

### Multilingual and accessibility (key consideration #3)
- UI strings via i18n library; lesson content generated in the target language with a **per-language financial glossary** so terms stay consistent (e.g. keep "UPI" and "SIP" untranslated)
- **Read aloud and voice input** (Web Speech API), **simple-language toggle** (reading-level control in the prompt), icon-led navigation
- WCAG 2.1 AA: contrast, keyboard navigation, ARIA, screen-reader-tested, RTL support (Arabic/Urdu), and adjustable text size
- Mobile-first, works on low-end Android

### Responsible AI (good for a bank audience)
- "Education, not financial advice" framing throughout
- Grounded generation only from region packs, with citations shown inline
- Output checks: required disclaimers present, no product endorsements, numbers come from data and not the model
- Cache generated lessons per (template, region, language, level). This cuts cost and latency and lets a human review a lesson once.

---

## Product structure (agreed with the team)

### 1. Onboarding
- **Required:** age, language, country/region, monthly income or budget, amount free to save or invest per month.
- **Optional:** employment type (salaried, gig, seasonal, student), whether they have a bank account, main goal, accessibility preferences (read-aloud, simple language, text size).
- **Storage:** the profile is stored in the browser only, with no account needed.
- **What it drives:** game starting point, currency, amounts, lesson order and language.

### 2. Life Path game (Game-of-Life style)
- **Setup:** the player starts at their real age with their real budget, in local currency.
- **Stages:** about 10–12 life stages, such as first job, unexpected expense, loan offer, family, investing, scam attempt, job loss, retirement.
- **Choices:** each stage offers 2–4 choices that affect **savings, debt, credit score, emergency fund, wellbeing and net worth**.
- **Localized choices** come from the region pack, e.g. "join a chama" (KE), "open a Tagesgeld" (DE), "start a SIP / chit fund" (IN).
- **Seeded randomness:** random events use a fixed seed, so rewinding is a fair comparison. Only the changed choice changes the outcome.
- **End screen:**
  - **Timeline:** click any decision to **rewind and replay** from there.
  - **What-if compare:** your path vs. the alternative on a net-worth chart.
  - **Optimal path:** the deterministic engine tries every combination of choices and ranks them by a weighted score (net worth, resilience, debt, wellbeing). It also shows the best choice at each step given the earlier choices, with a one-line "why".
  - **"Learn why"** links from each decision to the matching lesson.
- **Engine:** pure, unit-tested TypeScript, no AI needed. AI is optional for writing scenario text in local style.

### 3. Mini-games as life events
Mini-games are **built into Life Path as life events**. They share one engine, one score and the same rewind and what-if features. Each has a local twist.

| Mini-game | Triggered by life event | Teaches | Localization twist | Priority |
|---|---|---|---|---|
| **Scam or Legit?** (swipe cards) | "You receive a suspicious message" | Fraud awareness | Local scams: fake UPI payment requests (IN), Enkeltrick (DE), M-Pesa SIM swap (KE) | **1st (cheapest, most visible)** |
| **Savings Circle** (classroom multiplayer) | "Friends invite you to a savings group" | Informal vs. formal saving, trust, liquidity | Tanda (MX), chama (KE), chit fund (IN), vs. Tagesgeld/FD | 2nd |
| **Envelope Budget** (drag and drop) | "First salary arrives" | Budgeting, 50/30/20 | Realistic local prices for rent, food, transport | 3rd |
| **Time Machine** (slider) | "Should you start saving now or later?" | Compounding, inflation | Real local inflation and rates (World Bank, central banks) | 4th |
| **Credit Pet** (Tamagotchi) | "Credit card offer" | Credit scores, repayment | Schufa (DE), CIBIL (IN), Buró de Crédito (MX) | Stretch |
| **Send Money Home** | "Family abroad needs support" | Remittance fees, FX markups | Real ECB exchange rates, local transfer methods | Stretch |
| **Market Stall** | "Start a side business" | Business vs. personal money, microloans vs. loan sharks | Local lenders and regulation | Stretch |

### 4. Topics covered (lessons)
Budgeting · emergency funds · banking basics and account types · credit and credit scores · borrowing and debt · interest and inflation · saving vs. investing · retirement · insurance · taxes basics · scams and fraud · digital payments and mobile money · remittances · informal savings groups · interest-free (Islamic finance) mode.

---

## Languages strategy
We don't use Google Translate for the core content, because machine translation handles financial terms and cultural tone poorly. For example, "Tagesgeld" becomes "day money", and "chit fund" or "SIP" get translated literally.

| Layer | Approach | When |
|---|---|---|
| **Interface text** | `next-intl` with one JSON file per language. The LLM drafts translations and a native-speaking teammate checks them. | Build time, saved in the repo |
| **Lessons and game scenarios** | The LLM **writes directly in the target language** from region-pack facts (no translate-after step). A **per-language glossary** fixes terms, e.g. "UPI" and "Schufa" stay as-is, and "emergency fund" = "Notgroschen". | Generated once per (topic, region, language, reading level) and cached, so the demo works offline |
| **Numbers, currency, dates** | The browser's built-in `Intl` API: `1.234,56 €` (de-DE) vs. `₹1,23,456` (en-IN lakh grouping) | Live, no API |
| **Read-aloud** | Web Speech API (MVP) → Google Cloud Text-to-Speech (production) | Live |
| **Right-to-left** | `dir="rtl"` layout for Arabic/Urdu if time allows | Live |

In production, Google Cloud Translation with glossaries is acceptable for interface text (it fits the DB × Google partnership). Lessons are still generated per language and compliance-reviewed.

---

## AI model strategy
**Key point:** the AI is used mainly to **pre-generate and cache** lessons and scenario text, not on every page view. The game engine needs no AI. So the live demo never depends on an API being up, and **output quality matters more than speed or cost**.

**Decision:** build a **provider-agnostic `LLMProvider` interface** with swappable adapters, selected via `.env` (`LLM_PROVIDER=gemini|ollama|openai`).

| Option | Pros | Cons | Role |
|---|---|---|---|
| **Gemini API (Google AI Studio key)** | Free tier, strong multilingual quality, JSON output mode. Same model family as **Vertex AI**, which matches the DB × Google Cloud production story. | Rate limits on the free tier. Free-tier prompts may be used by Google to improve products, so we send only synthetic, non-personal data. | **Default for the hackathon** |
| **Ollama (local, e.g. Qwen 2.5 32B or a newer Qwen release)** | Free, offline, no data leaves the machine: a strong "can run on-premises" privacy story. | Qwen 2.5 32B at 4-bit needs ~20 GB VRAM (a 24 GB GPU or a 32 GB+ Apple Silicon Mac), and it's slow on CPU. Weaker in some languages (e.g. Hindi) than frontier models. Smaller models (7B/14B) fit more machines but lower quality. | **Offline fallback and privacy demo** |
| **OpenAI (GPT-4o-class)** | Good quality, easy SDK | Free credits for new accounts aren't guaranteed (check the account). It's another vendor outside the DB/Google story. | Optional adapter, testing only |
| **Claude (direct API or on Vertex AI)** | Strong multilingual writing and instruction-following, available on Vertex AI | Needs a paid key | Optional adapter |

**Safety net:** pre-generated lessons are committed as JSON. If every provider fails during the demo, the app still runs fully.

**Pitch line:** "Model-agnostic by design: Gemini today, Vertex AI in production, or fully on-premises with an open model. Each runs behind the same interface and the same evaluation tests."

---

## Suggested architecture

```
[React/Next.js PWA] --(i18n, a11y, voice)--> [API layer]
                                              ├─ Lesson service ── templates/*.md
                                              ├─ Region service ── regions/*.json (schema-validated)
                                              ├─ Data service ──── World Bank / FX / central bank APIs (cached)
                                              ├─ AI engine ─────── LLM adapter: Gemini | Ollama | OpenAI (grounded prompt + citations)
                                              └─ Cache/DB ──────── SQLite/Postgres (generated lessons, user progress)
```

**Stack options:**
- **A (one language, fastest):** Next.js + TypeScript + API routes + Zod schemas + Tailwind + next-intl, deployed on Vercel.
- **B (if the team is Python-heavy):** React (Vite) frontend + FastAPI backend + Pydantic schemas.

**SDLC signals for judges:** GitHub Actions CI (lint, typecheck, tests), JSON-schema validation of every region pack in CI, PR reviews, a small ADR doc ("why region packs + grounded LLM"), README with setup steps, and `.env.example`.

**"Add a new country in 10 minutes":** a region pack is just a JSON file. A contributor guide (or an AI-assisted drafting script with human review) addresses *scalability* and *augmented for future use*.

## Open datasets and sources
- **World Bank Indicators API**: inflation (`FP.CPI.TOTL.ZG`), lending/deposit rates, GDP per capita
- **World Bank Global Findex**: account ownership, mobile money and borrowing behavior by country (good for the "why this matters" slide and for personalization defaults)
- **S&P Global FinLit Survey / OECD INFE**: financial literacy rates by country
- **ECB / Frankfurter API**: exchange rates (remittance lessons)
- **Central bank and regulator sites** (RBI, Banxico, CBK, BaFin, CFPB): facts for region packs
- **CFPB educational materials** (US public domain): base content for templates

---

## MVP scope (what to actually build)
**Must have**
1. Onboarding (age, language, location, budget) → personalized lesson path
2. Life Path game with rewind, what-if compare and optimal path
3. At least one mini-game as a life event (Scam or Legit? first)
4. 3 lesson templates × 3–4 region packs × 3+ languages (incl. one RTL if time allows)
5. AI-rendered lessons with citations and side-by-side compare view, cached, with an offline fallback
6. Read-aloud + simple-language toggle + keyboard/screen-reader pass

**Nice to have:** quiz with adaptive difficulty, chat tutor grounded in the region pack, offline PWA, progress tracking, admin page to edit region packs.

## Team split (4–5 people)
| Role | Owns |
|---|---|
| Frontend / a11y lead | UI, i18n, voice, WCAG pass |
| Backend / AI lead | API, prompt design, grounding, caching |
| Content + data | Lesson templates, region packs, sources, glossary |
| DevOps / QA | Repo setup, CI, tests, schema validation, deploy |
| Pitch lead (can overlap) | Story, slides, demo script, rehearsals |

## 10-minute pitch outline
1. **Hook (1 min):** a persona, e.g. a gig worker in Nairobi or a migrant in Frankfurt sending money home, and why generic advice fails them. Use one Findex stat.
2. **Solution + name (1 min)**
3. **Live demo (4 min):** onboarding → lesson → **switch country/language live** → simulator → accessibility (read-aloud, simple mode)
4. **How it works (2 min):** architecture, grounding/citations, adding a region is just a JSON file
5. **Impact + roadmap (1.5 min):** scaling to more regions, partner banks, SMS channel, human review loop
6. **Close (0.5 min)**

## Alternative concepts (if we want a different angle)
- **Remittance Navigator:** narrow focus on migrants, comparing two financial systems (home vs. host country). Very original, but a narrower match to the prompt.
- **Community-sourced region packs:** local NGOs and educators contribute and verify content, with AI translating and reviewers approving (a "Wikipedia for local finance").
- **Story-mode learning:** culturally adapted narrative episodes, with characters and scenarios that change per region, instead of articles.

## Open questions for the team
- How long is the build window? This determines MVP size.
- Which LLM key do we have? Current plan: a Gemini free-tier key, with Ollama as the offline fallback (see [AI model strategy](#ai-model-strategy)).
- What GPU or RAM does the machine running Ollama have? This decides the model size.
- Which regions do we demo? Recommendation: Germany (DB home market) + India + Mexico or Kenya.
- Is there a preferred stack the team knows best?
