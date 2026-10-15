# Rooted: pitch script for 5 speakers

About 9½ minutes, leaving a little buffer inside the 10-minute slot. Follows `rooted_slides.pdf` (5 slides), with a live demo between slides 2 and 3, because the demo is where most of the "prompt accuracy" points are won.

| # | Speaker | Covers | Time |
|---|---|---|---|
| 1 | Speaker 1 | Slide 1: opening | 1:00 |
| 2 | Speaker 2 | Slide 2: the problem | 1:30 |
| 3 | Speaker 3 | Live demo | 3:00 |
| 4 | Speaker 4 | Slides 3 and 4: architecture, security, data flow | 2:30 |
| 5 | Speaker 5 | Slide 5: scaling, the wellness store, then the close | 1:30 |

Lines in *italics* are stage directions, not spoken.

---

## Speaker 1: Slide 1, opening (1:00)

*Slide 1 on screen: "Rooted".*

"Good morning. We created Rooted, a financial education platform that speaks your language, and knows your world.

Here's the idea in one sentence. Money skills are universal, but money itself is local. A savings account, a scam, a pension, even the word 'interest' look different in New York, Bengaluru and Berlin.

So we built one learning line, the green line you see here, that every learner travels: **Context, Learn, Practice, Decide, Compare, Replay.** The line is the same for everyone. What changes is everything on it: the country, the language and the stage of life."

---

## Speaker 2: Slide 2, the problem (1:30)

*Slide 2: "Money decisions are local."*

"Most financial education is written once, for one imaginary person, and then translated. Translation isn't localization. Three things get lost.

**First, country.** Products, protections, interest rates and scams are different everywhere. In the US your deposits are insured up to $250,000 by the FDIC. In India it's 5 lakh rupees through DICGC. The scams people actually fall for are different too: unpaid-toll texts in the US, fake UPI collect requests in India, the 'Enkeltrick' grandchild call in Germany.

**Second, language.** The same idea has to stay clear across scripts and currencies. We support English, German, Spanish and Hindi, and money is written the local way: dollars with commas, rupees in lakhs, euros with a decimal comma.

**Third, life stage.** A 24-year-old with a first paycheck and a 68-year-old living on a pension need completely different starting points. In German we even switch formalities to address senior learners.

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

"What you just saw is a working MVP. This slide is how we'd run it inside a bank. It's a plan, not something we've built yet. It's designed for Google Cloud in Frankfurt: one region first, with a second EU region for failover as demand grows.

Read it left to right. **Learners** are anonymous by default; their profile stays in the browser. The **edge**, Cloud CDN and Cloud Armor, caches approved lessons and gives us a firewall, DDoS protection and rate limits. Behind it, **Cloud Run** runs the same Next.js code as the MVP, in containers: stateless and autoscaling. Learners stay anonymous; sign-in through the bank's own identity provider comes later, with roles for learners, editors, reviewers and admins.

On the right: **Vertex AI on an EU endpoint**, with personal data stripped out before anything reaches a model. Our AI layer is provider-agnostic, so Claude or Gemini sit behind the same adapter. Below that: **Cloud Storage** holds the shared, versioned lesson catalog with a **Redis** cache in front of it, **Cloud Tasks** queues AI drafts so no learner ever waits on a live model call, and **BigQuery** gets anonymized analytics only.

On the left are the rules it's built to meet: **GDPR, DORA and the EU AI Act**. And one rule of our own: education, not advice. We never recommend a specific product.

Along the bottom: a **zero-trust** perimeter with customer-managed keys; **content released separately from code**, going draft, expert review, compliance, published, with four eyes on every change; and a DevSecOps pipeline with secret scanning, signed images and canary releases.

*Slide 4: "How data moves through Rooted".*

This slide shows how data moves, in four lanes.

**A, onboarding**, never leaves the browser.

**B, lessons**: the only thing that reaches our server is the topic, country, language and age group. No personal data. If an approved lesson already exists, it's returned immediately. If not, the AI writes one using only that country's vetted facts, the output is checked against a strict schema, and it's saved for human review.

**C, the game**, runs entirely in the browser in TypeScript. Every decision has its own random stream, so changing one choice never changes the events that follow, which is what makes the 'what if' comparison fair.

**D, content**: facts are edited with a source and a 'verified' date, AI drafts the translations, automated checks run, then a native speaker and compliance review it. More than 80 automated tests run on every change before anything ships.

[Speaker 5] will explain how this scales."

---

## Speaker 5: Slide 5, scaling, the wellness store and the close (1:30)

*Slide 5: "Scale content once. Serve learners everywhere."*

"So how does this scale? Simple: we make each piece of content once, and every learner reuses it.

Look at the top row. The game, your budget and your progress all run on your own device, so there's no game server to pay for. Approved lessons sit in the CDN cache, which soaks up most of the traffic. Behind that, a small stateless API on Cloud Run scales up and down on its own, with a cost cap. And all the content lives in one shared, versioned catalog.

The bottom row is how that content gets made. Nobody ever waits for an AI to answer live. We start from verified facts, an EU-hosted model drafts the lesson in the background, an expert checks it, and we publish it once for everyone.

We'd launch in one EU region, with tight access controls, cost alerts and safe rollbacks, and only add a second region and bank sign-in when demand calls for it.

One idea on our roadmap: a **wellness store** inside the game. You could spend your in-game money on a gym membership or a weekend away to lift your wellbeing, but it comes out of the same budget as your savings. That's the lesson: treating yourself is fine, it just has a price. It's simply more content in the same catalog, so it scales the same way. Later it could link to real partner offers, always opt-in and never advice.

*Back to slide 1, or stay on slide 5.*

To wrap up: a new country is one data file, and a new language is an AI draft plus a native speaker's check. Same learning line, any local reality.

That's Rooted. Thank you, and we'd love your questions."

---

## Notes for the team

- **Slides 3 and 4 are up to date** in `rooted_slides.pptx`: correct numbers (up to 46,656 paths, 80+ tests), American spelling, the new Age +1 game flow, and the same production plan as slide 5 (Cloud Storage + Redis, Cloud Tasks, one region first, SSO later). If the deck is re-exported, use `docs/diagrams/architecture-production.svg` and `docs/diagrams/data-flow.svg`.
- **Likely questions and who answers:**
  - "Is the AI making up numbers?" (Speaker 4: lessons only use sourced facts, a test checks that every cited fact exists, and every product links to its regulator.)
  - "How do you add a country?" (Speaker 5.)
  - "Is this financial advice?" (Speaker 2: no. We explain trade-offs and never recommend products.)
  - "What if the AI service is down?" (Speaker 3: saved lessons. The demo runs fully offline.)
  - "Isn't a store at odds with financial education?" (Speaker 5: purchases use in-game money from the player's simulated budget, so every item is a visible trade-off against saving. Real partner offers would be opt-in and never advice.)
- **The wellness store is a roadmap idea, not built and not on slide 5.** Speaker 5 should say "on our roadmap" so nobody expects it in the demo. If the team wants it on the slide, add one line under the content row.
