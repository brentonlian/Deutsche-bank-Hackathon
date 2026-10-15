# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
People who want practical money skills that fit the country they live in. At onboarding they pick an **age group**, and the experience adapts to it:
- **Young adults (18–30):** first job or studies, often on a phone, possibly new to banking.
- **Middle age (31–54):** family budgets, car or home, children's education, ageing parents, catching up on retirement.
- **Seniors (55+):** living on a pension, drawing down savings, health costs, being targeted by scams, family requests, estate planning.

Secondary audiences:
- Hackathon judges (Deutsche Bank) watching a projected demo.
- Volunteers teaching money lessons in schools, as in Deutsche Bank's *So geht Geld* programme.

## Product Purpose
Rooted teaches financial literacy adapted to local languages, financial systems, regulations and cultural norms. Users:
1. Onboard with age group, language, country and budget.
2. Play **Life Path**, a Game-of-Life-style series of decisions where mini-games appear as life events.
3. Learn from lessons generated from vetted country data.

Success means the user understands why a decision matters in their country and can see a better path.

## Positioning
"Write once, localize everywhere." Universal lessons and life events are rendered with per-country **region packs**: real products, institutions, deposit insurance, scams, informal savings groups, unemployment cover and interest rates. After a game, users can rewind any decision, run a what-if and see the optimal path, all computed by a fair, deterministic simulation.

## Operating Context
- Demoed live on a projector in a 10-minute pitch.
- Must also work on a phone (mobile-first users).
- Demo countries: Germany (DE/EN), India (EN/HI), Mexico (ES/EN).
- Hackathon MVP: no accounts, and the profile lives in the browser.

## Capabilities and Constraints
- Next.js 16 + TypeScript + Tailwind v4 + Zod + Vitest, in `web/`.
- Game engine is pure and deterministic (`web/src/lib/game`). Region packs are in `web/src/content/regions/*.json`.
- LLM calls are provider-agnostic (Gemini by default) and used only to pre-generate and cache lessons and translations. The demo must work offline.
- Education, not advice: no product recommendations or investment advice.

## Brand Commitments
- Name: **Rooted**.
- Its own identity that's friendly to Deutsche Bank: calm and trustworthy, suited to a bank's partner programme.
- No Deutsche Bank logo or brand assets.

## Evidence on Hand
- Region pack facts with sources and "verified" dates (DE, IN, MX, verified 2026-10).
- No testimonials, user numbers or impact statistics exist. Never invent them.

## Product Principles
1. Local truth over generic advice: every number, product and scam comes from a region pack with a source.
2. Show, don't preach: consequences are simulated, and users rewind to see the difference.
3. Respect cultural practices (tandas, chit funds, family support). Explain trade-offs; don't shame anyone.
4. Accessible to everyone: low literacy, screen readers, multiple languages, low-end phones.

## Accessibility & Inclusion
- WCAG 2.1 AA (European Accessibility Act).
- Read-aloud, simple-language mode, keyboard and screen-reader support.
- Right-to-left support planned.
- Number, currency and date formats follow the locale.
