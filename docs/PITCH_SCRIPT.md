# Rooted: pitch script for 5 speakers

About 9½ minutes, leaving a little buffer inside the 10-minute slot. Follows `rooted_slides.pdf` (5 slides), with a live demo between slides 2 and 3, because the demo is where most of the "prompt accuracy" points are won.

| # | Speaker | Covers | Time |
|---|---|---|---|
| 1 | Speaker 1 | Slide 1: opening | 1:00 |
| 2 | Speaker 2 | Slide 2: the problem | 1:30 |
| 3 | Speaker 3 | Live demo | 3:00 |
| 4 | Speaker 4 | Slides 3 and 4: architecture, security, data flow | 2:30 |
| 5 | Speaker 5 | Slide 5: scaling, then the close | 1:30 |

Lines in *italics* are stage directions, not spoken.

---

## Speaker 1: Slide 1, opening (1:00)

*Slide 1 on screen: "Rooted".*

"Good morning. We're Rooted: financial education that speaks your language, and knows your world.

Here's the idea in one sentence. Money skills are universal, but money itself is local. A savings account, a scam, a pension, even the word 'interest' look different in New York, Bengaluru and Cologne.

So we built one learning line, the green line you see here, that every learner travels: **Context, Learn, Practice, Decide, Compare, Replay.** The line is the same for everyone. What changes is everything on it: the country, the language and the stage of life.

One learning line, many local realities. [Speaker 2] will show you why that matters."

---

## Speaker 2: Slide 2, the problem (1:30)

*Slide 2: "Money decisions are local."*

"Most financial education is written once, for one imaginary person, and then translated. Translation isn't localization. Three things get lost.

**First, country.** Products, protections, interest rates and scams are different everywhere. In the US your deposits are insured up to $250,000 by the FDIC. In India it's 5 lakh rupees through DICGC. The scams people actually fall for are different too: unpaid-toll texts in the US, fake UPI collect requests in India, the 'Enkeltrick' grandchild call in Germany.

**Second, language.** The same idea has to stay clear across scripts and currencies. We support English, German, Spanish and Hindi, and money is written the local way: dollars with commas, rupees in lakhs, euros with a decimal comma.

**Third, life stage.** A 24-year-old with a first paycheck and a 68-year-old living on a pension need completely different starting points. In German we even switch to the formal 'Sie' for our senior learner.

Rooted answers with two things: **localized facts**, every one with a source and a date, and **decisions you can practice and revisit**. Let's show you. [Speaker 3]."

---

## Speaker 3: Live demo (3:00)

*Switch to the app. Have it open at the onboarding screen beforehand. Fallback if anything goes wrong: `/demo` loads each persona in one tap.*

"Meet Maya. She's 24, lives in New York, and just started her first full-time job.

*Onboarding: United States, New York, English, young adult, 24.*

Everything Maya enters stays in her browser. Nothing goes to a server.

*Learning line appears.*

Her learning line has six stations. The first is a **country guide**: how money actually works in the United States. Every number has a source link and the date we checked it, and we show the World Bank's figure next to the central bank's, each with its year.

*Open the lesson and quiz briefly.*

Her lessons, credit and debt, then saving versus investing, are written only from those vetted facts, with a three-question quiz at the end. The calculators then use her own paycheck and real US rates.

*Open the Life Path game.*

Now the fun part. The Life Path game plays like BitLife. *Tap Start your life.* Maya gets her first paycheck: how much does she save? *Pick 'Save 15%'.* *Tap Age +1 two or three times.* Every year writes a line into her life story: what she earned, what she put aside, what her savings account paid in interest at the real US rate, whether the market went up or down.

*Skip to the Scam or Legit? event if time allows, and read one message aloud for a laugh, e.g. the Hot Tub Emporium fraud alert or the 'favorite grandson' call.*

Each message is funny, but it teaches a real red flag.

*Open the results.*

At the end Maya sees her life as a metro line, next to the green **express line**: the best path, found by checking every safe sequence of choices. That's up to about 47,000 possible lives. She can tap any station, see what would have happened if she'd chosen differently, and replay from there. The same game in India or Germany uses that country's products, rates, safety nets and scams.

[Speaker 4] will show you what's underneath."

---

## Speaker 4: Slides 3 and 4, architecture, security, data flow (2:30)

*Slide 3: "Rooted: production target on Google Cloud (EU)".*

"What you just saw is a working MVP. This slide is how we'd run it inside a bank. It's a plan, not something we've built yet. It's designed for Google Cloud in Frankfurt, with a second EU region for disaster recovery.

Read it left to right. **Learners** are anonymous by default; their profile stays in the browser. The **edge**, Cloud CDN and Cloud Armor, gives us a firewall, DDoS protection and rate limits. Behind it, **Cloud Run** runs the same Next.js code as the MVP, in containers: stateless and autoscaling. It signs people in through the bank's own identity provider, with roles for learners, editors and compliance reviewers.

On the right: **Vertex AI on an EU endpoint**, with personal data stripped out before anything reaches a model. Our AI layer is provider-agnostic, so Claude or Gemini sit behind the same adapter. Below that are the content database, a cache and anonymized analytics only.

On the left are the rules it's built to meet: **GDPR, DORA, the EU AI Act, the European Accessibility Act and MaRisk**. And one rule of our own: education, not advice. We never recommend a specific product.

Along the bottom: a **zero-trust** perimeter with customer-managed keys; **content released separately from code**, going draft, expert review, compliance, published, with four eyes on every change; and a DevSecOps pipeline with secret scanning, signed images and canary releases.

*Slide 4: "How data moves through Rooted".*

This slide shows how data moves, in four lanes.

**A, onboarding**, never leaves the browser.

**B, lessons**: the only thing that reaches our server is the topic, country, language and age group. No personal data. If an approved lesson already exists, it's returned immediately. If not, the AI writes one using only that country's vetted facts, the output is checked against a strict schema, and it's saved for human review.

**C, the game**, runs entirely in the browser in TypeScript. Every decision has its own random stream, so changing one choice never changes the events that follow, which is what makes the 'what if' comparison fair.

**D, content**: facts are edited with a source and a 'verified' date, AI drafts the translations, automated checks run, then a native speaker and compliance review it. Our 84 automated tests run on every change before anything ships.

[Speaker 5] will explain how this scales."

---

## Speaker 5: Slide 5, scaling and the close (1:30)

*Slide 5: "Scale content once. Serve learners everywhere."*

"The key idea for scale: **we generate content once and serve it to everyone.**

The top row is learner delivery, and it's cache-first. **Browser**: the game, budget and progress run on the learner's device, so there's no game server to pay for. **Edge**: approved lessons are cached at the CDN, which absorbs most traffic, and API requests are rate-limited. **Application**: a stateless API on Cloud Run that autoscales, with cost limits. **Content**: one shared, versioned, reviewed lesson catalog, with regional data controls.

The bottom row is how content gets made, and it's asynchronous. **No learner ever waits on a live AI call.** We start from verified country facts with sources and dates, queue AI drafts on an EU model, validate them against our schema and get expert approval, then publish one version that's reused by every learner.

The guardrails: EU data residency and least-privilege access, service-level objectives with logs and cost alerts, and review gates with safe rollbacks.

The rollout is deliberately modest: launch in one region, then add regional failover and enterprise single sign-on when demand justifies it.

*Back to slide 1, or stay on slide 5.*

To close: adding a new country is one data file, checked against a schema, plus a line color. A new language is an AI draft plus a native speaker's review. Same learning line, any local reality.

That's Rooted. Thank you. We'd love your questions."

---

## Notes for the team

- **Slide 4 needs updating before the pitch:** it's an old export that says "~140k" paths (the correct figure is up to 46,656) and "64 tests" (now 84), and its title is cut off at the top. Re-export it from `docs/diagrams/data-flow.svg`. The production slide has a current version too: `docs/diagrams/architecture-production.svg`.
- **Slides 3 and 4 use British spellings** (containerised, anonymised, minimisation); the current SVGs use American spelling.
- **Slides 3 and 5 name different databases:** Cloud SQL and Redis on slide 3, Cloud Storage and Firestore on slide 5. The script says "content database" and "lesson catalog" to avoid the clash, but pick one before the judges ask.
- **Likely questions and who answers:**
  - "Is the AI making up numbers?" (Speaker 4: lessons only use sourced facts, a test checks that every cited fact exists, and every product links to its regulator.)
  - "How do you add a country?" (Speaker 5.)
  - "Is this financial advice?" (Speaker 2: no. We explain trade-offs and never recommend products.)
  - "What if the AI service is down?" (Speaker 3: saved lessons. The demo runs fully offline.)
