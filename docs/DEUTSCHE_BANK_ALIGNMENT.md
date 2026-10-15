# How We Tailored the Solution to Deutsche Bank

This doc explains the decisions we made so the concept fits Deutsche Bank's values, technology direction, regulatory environment and existing financial-education work. It is a **hackathon concept**, not an official Deutsche Bank product, and it doesn't use any Deutsche Bank logos or trademarks.

## 1. Building on what Deutsche Bank already does
Deutsche Bank already invests in financial literacy:
- **Born to Be:** a youth engagement umbrella that lists financial literacy as an education priority.
- **"So geht Geld" ("How money works"):** employees volunteer to teach money basics in German schools.
- **"Modern Finance" in the US:** a curriculum run with the nonprofit W!se.

**Our fit:** we designed the app as a **digital companion to these programmes**, not a replacement.
- Volunteers can run the Life Path game in a classroom and let students rewind decisions together.
- Lessons can be exported for a teacher-led session.
- A programme can reach students in other countries and languages without rewriting its curriculum. Adding a new region pack is enough.

## 2. Mapping to Deutsche Bank's values
Deutsche Bank's code of conduct names six values. Here is how each one shaped a product decision.

| DB value | Product decision |
|---|---|
| **Integrity** | Education only, never product sales or advice. Every fact cites a source and shows a "verified on" date, and AI-generated content is labelled. |
| **Client centricity** | Onboarding starts from the user's real situation (age, country, language, budget), and lessons build on financial habits people already use, such as savings groups. |
| **Innovation** | AI localization grounded in vetted data, plus a Game-of-Life-style simulator with rewind, what-if and optimal-path views. Risk is managed through compliance review and output checks. |
| **Sustainable performance** | Long-term thinking is built into the game: compounding, inflation, resilience and retirement are scored, not just short-term cash. |
| **Discipline** | Four-eyes review on code and content, schema-validated data, automated tests, documented SDLC (see [PRODUCTION_SECURITY.md](PRODUCTION_SECURITY.md)). |
| **Partnership** | Region packs are designed to be contributed and verified by local partners (NGOs, schools, DB country teams). The open structure is easy to extend. |

## 3. Technology choices aligned with Deutsche Bank's direction
- **Google Cloud, EU regions.** Deutsche Bank and Google Cloud announced a strategic multi-year partnership in 2020 to move the bank's systems to the cloud. Our production design targets GCP in Frankfurt (`europe-west3`) using Cloud Run, Cloud SQL, Secret Manager, Cloud KMS and Cloud Armor.
- **AI through Vertex AI.** Model calls go through the bank's existing cloud platform instead of a separate vendor contract. This keeps data residency, auditing and outsourcing oversight in one place. Claude and Gemini are both available there behind the same interface.
- **Containerised and stateless.** This matches the bank's stated approach of lifting and shifting container-based apps.
- **Enterprise integration path.** If the app ever hands off to banking services, that layer is a separate backend service. Java/Spring Boot is a common enterprise standard for it. The learning app stays decoupled.
- **Regulation-first architecture.** It is designed against GDPR, DORA, the EU AI Act, BaFin/EBA outsourcing rules and the European Accessibility Act.

## 4. Market and content choices
- **Germany first.** Demo region packs start with Germany (Deutsche Bank's home market): Tagesgeld, Einlagensicherung (€100k), Schufa, Riester/ETF-Sparplan concepts and German-language UI. India and Mexico or Kenya show how the same platform adapts elsewhere.
- **Bilingual by default.** German and English are first-class languages. Other languages are added through the glossary-controlled localization pipeline.
- **Migrants and cross-border users.** The remittance and "two financial systems" content reflects Deutsche Bank's global footprint.

## 5. Format and presentation conventions
- **Documentation:** architecture decision records, a regulatory mapping table and a security controls catalogue. These are the formats risk, compliance and architecture review boards expect.
- **Visual design:** clean, corporate and accessible.
  - Restrained blue-and-white palette with high contrast (WCAG AA).
  - No DB logo or brand assets unless the brand team approves.
- **Measurable outcomes:**
  - Quiz score uplift before and after.
  - Lesson completion.
  - Game "resilience score" improvement on replay.
  - Reach by country and language.

  These can feed into Deutsche Bank's social-impact reporting.

## 6. Talking points for the presentation
1. "We didn't build a new programme. We built a **digital multiplier for Born to Be and So geht Geld**."
2. "Every value in Deutsche Bank's code of conduct maps to a feature."
3. "Production-ready path: **Google Cloud in Frankfurt, Vertex AI, DORA- and AI-Act-aware**, four-eyes reviews on code and content."
4. "Germany first, then any country: adding a region is a reviewed data file, not a rewrite."

## Sources
- Deutsche Bank × Google Cloud partnership (2020): <https://www.db.com/news/detail/20200707-deutsche-bank-and-google-to-form-strategic-global-multi-year-partnership-to-drive-a-fundamental-transformation-of-banking>
- Deutsche Bank cloud migration approach: <https://www.cio.de/article/3693459/vorstand-leukert-raeumt-die-it-auf.html>
- Values (Code of Conduct): <https://developer.db.com/assets/data/Code_of_Conduct_EN.pdf>
- Born to Be: <https://www.db.com/borntobe>
- So geht Geld / employee school lessons: <https://flow.db.com/topics/community/it-s-never-too-early>
- Modern Finance with W!se: <https://country.db.com/usa/responsibility/born-to-be/modern-finance>

Before the presentation, check these sources for the latest wording and status, since some are from 2019 to 2022.
