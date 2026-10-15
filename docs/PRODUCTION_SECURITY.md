# Productionizing in a Bank: Security, Compliance and Operations

> Status: **plan only.** The hackathon MVP does not implement this. It describes how we would take the app into a regulated bank environment, so we can present it as our roadmap.

## 1. Starting principles
- **Privacy by design.** The MVP keeps the onboarding profile (age, country, budget) in the browser only. In production we keep that rule: users learn anonymously by default and sign-in is optional. Personal data reaches the server only when someone opts in.
- **Education, not advice.** The app never recommends specific products or securities. This keeps it outside investment-advice regulation (MiFID II suitability) and is enforced in content rules and output checks.
- **Zero trust.** Every request is authenticated, authorized and logged, and no network is treated as trusted.
- **Four-eyes principle.** No code, content or AI prompt reaches production without a second reviewer.

## 2. Regulatory map (EU / Germany)
| Regulation | Why it applies | How we address it |
|---|---|---|
| **GDPR** | Profile data, progress, optional account | Data minimization, local-first storage, EU data residency, DPIA, consent management, data-subject request endpoints (export/delete) |
| **DORA** (EU Digital Operational Resilience Act, applies from Jan 2025) | ICT risk management for financial entities | Resilience testing, incident reporting process, ICT third-party register (cloud and LLM provider), exit strategy |
| **BaFin MaRisk / EBA outsourcing guidelines** | Cloud and AI providers are outsourcing arrangements | Provider risk assessment, contractual audit rights, documented exit plan |
| **EU AI Act** | AI-generated educational content | Likely limited risk: transparency labels ("AI-generated, reviewed on …"), human oversight, logging, model documentation |
| **European Accessibility Act** (applies from June 2025) / BITV 2.0 / WCAG 2.1 AA | Banking-related digital services must be accessible | WCAG 2.1 AA as a release gate, automated axe tests plus manual screen-reader testing |
| **Consumer protection** | Financial education must not be misleading | Compliance sign-off on region packs, disclaimers, citations on every fact |

## 3. Target architecture (Google Cloud, EU regions)
Deutsche Bank has a strategic multi-year cloud partnership with Google Cloud (announced 2020), so we design for GCP in EU regions (e.g. `europe-west3`, Frankfurt).

```
Users ─► Cloud CDN + Cloud Armor (WAF, DDoS, rate limits, geo rules)
           └─► Global HTTPS Load Balancer
                 └─► Cloud Run / GKE Autopilot  (Next.js web + BFF API, containerised)
                       ├─► Content service ── Cloud SQL (PostgreSQL)  [region packs, lessons, versions]
                       ├─► Cache ──────────── Memorystore (Redis)      [rendered lessons, open-data responses]
                       ├─► AI gateway ─────── Vertex AI (Claude and/or Gemini, EU endpoint)
                       │                       + Sensitive Data Protection (PII redaction)
                       ├─► Open-data fetcher ─ Cloud Scheduler job → World Bank / ECB APIs → Cloud SQL
                       └─► Analytics ──────── BigQuery (anonymized, aggregated events only)
Secrets: Secret Manager · Keys: Cloud KMS (CMEK) · Perimeter: VPC Service Controls
Identity: OIDC to the bank's identity provider (IAM / Workload Identity for services)
Observability: Cloud Logging + Monitoring + OpenTelemetry traces, alerting to on-call
IaC: Terraform · Images: Artifact Registry (signed) · Deploy: Cloud Deploy / GitHub Actions
```

**Why these choices:**
- **Cloud Run first:** stateless containers, autoscaling to zero, nothing to patch on the host. We move to GKE only if bank platform standards require it.
- **Vertex AI as the AI gateway:** model traffic stays inside the bank's existing cloud contract, EU region and audit setup, with no direct calls to a third-party API. Claude models are available on Vertex AI, and Gemini is an alternative behind the same interface.
- **Bank core systems:** if the app later integrates with them (e.g. "open a savings account" handoff), that integration goes through a separate backend service. Java/Spring Boot is a common standard in large banks.

## 4. Security controls and packages

### Application layer (TypeScript / Next.js)
| Concern | Package / approach |
|---|---|
| Input validation | `zod` schemas on every API route and region pack |
| Auth (optional accounts, admin/editor roles) | `next-auth` (Auth.js) with OIDC to the bank IdP; RBAC roles: learner, content editor, compliance reviewer, admin |
| Security headers / CSP | Strict Content-Security-Policy with nonces, HSTS, `X-Frame-Options`, `Referrer-Policy`, set in Next.js middleware |
| Rendering AI output safely | Markdown → sanitised HTML via `isomorphic-dompurify`; AI output is never injected as raw HTML |
| Rate limiting / abuse | Cloud Armor rules + app-level limiter (`rate-limiter-flexible` on Redis) |
| CSRF | SameSite cookies + Auth.js CSRF tokens |
| Logging | `pino` with redaction of PII fields; structured JSON to Cloud Logging |
| Tracing | `@opentelemetry/sdk-node` |
| Feature flags | OpenFeature SDK (provider-agnostic) for staged rollouts |

### AI-specific controls
- **Grounding only:** prompts include only the vetted region pack, and the model is told to refuse anything not in it.
- **Prompt-injection defence:**
  - User text is kept separate from system instructions.
  - Tutor chat is limited to education topics.
  - Tools/function-calling are not exposed to user-controlled input.
- **Output checks:**
  - Schema-validated JSON output (`zod`).
  - Numbers must come from data fields.
  - Banned-phrase and "no product recommendation" checks.
  - Required disclaimer present.
- **PII redaction:** user free text passes through Sensitive Data Protection before reaching the model, and prompts and responses are logged without PII.
- **Human-in-the-loop:** generated lessons are cached per (topic, region, language, reading level). Each cached lesson goes through **compliance review once** before publishing, so learners see approved content and the model is not called live for every view.
- **Model risk management:**
  - Model inventory entry.
  - Evaluation set (accuracy, tone, bias across languages).
  - Regression evals run in CI whenever prompts or models change.

### Supply chain and CI/CD (DevSecOps)
| Stage | Tool |
|---|---|
| Secrets in code | `gitleaks` pre-commit hook + CI |
| SAST / code quality | CodeQL or Semgrep; SonarQube quality gate (coverage, code smells) |
| Dependencies (SCA) | Dependabot/Renovate, `npm audit`, Snyk or OWASP Dependency-Check; licence allow-list |
| SBOM | CycloneDX (`@cyclonedx/cyclonedx-npm`), stored with each release |
| Container scanning | Trivy / Artifact Registry scanning; distroless base image, non-root user |
| Image signing | Sigstore `cosign` + Binary Authorization (only signed images deploy) |
| DAST | OWASP ZAP baseline scan against the staging environment |
| Accessibility gate | `@axe-core/playwright` in CI; build fails on serious violations |
| CI auth to cloud | Workload Identity Federation (no long-lived service-account keys) |

## 5. Path to production (SDLC)
1. **Environments:** `dev` → `test` → `UAT` → `prod`, each a separate GCP project defined in Terraform.
2. **Branching:** trunk-based with short-lived feature branches. Protected `main` requires 2 approvals (four-eyes), all checks green and signed commits.
3. **Release:**
   - Semantic versioning with a changelog.
   - Change ticket linked to each production release.
   - Canary rollout (5% → 50% → 100%) with automatic rollback on SLO breach.
4. **Content release:** a separate lifecycle from code.
   - Region pack edits go draft → subject-matter review → compliance approval → published.
   - Each edit is versioned and the full history is auditable.
5. **Operations:**
   - **SLOs:** 99.9% availability, p95 page load < 2.5s on 3G.
   - **On-call:** runbooks for incidents, with incident classification aligned to DORA reporting.
6. **Resilience:**
   - Multi-zone by default and a secondary EU region for DR.
   - Backups with tested restores.
   - Chaos and failover tests at least yearly.
7. **Security testing:** annual penetration test before go-live and after major changes; a vulnerability disclosure process.
8. **Data lifecycle:** retention schedule, anonymized analytics only, deletion on request.

## 6. One-slide summary for the presentation
- **Secure by design:** local-first privacy, zero trust, OIDC, strict CSP, WAF.
- **Compliant:** GDPR, DORA, EU AI Act transparency, European Accessibility Act / WCAG 2.1 AA.
- **Responsible AI:** grounded on vetted data, compliance-reviewed before publishing, PII-redacted, evaluated in CI.
- **Bank-grade delivery:**
  - Terraform on Google Cloud (EU).
  - DevSecOps pipeline with signed images and SBOMs.
  - Four-eyes reviews and canary releases.
