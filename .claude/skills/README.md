# Project design skills

These are third-party Claude Code skills, vendored into the repo so every teammate's Claude sessions use the same design rules. **Only the instruction files (Markdown/JSON/CSS) were copied.** The bundled scripts (Impeccable's launcher, which downloads a binary, and taste-skill's Node scripts) were deliberately left out.

| Skill | Source | Version | License | Role in our workflow |
|---|---|---|---|---|
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | 4.5.2 (commit `db0f2df`) | Apache 2.0 | Quality layer: critique, audit, polish, anti-patterns for app UI ("Operate" mode) |
| `design-taste-frontend` | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | v2 (commit `f624f37`) | MIT | House style and anti-slop rules. Built for landing pages, so we use it for the home/landing page; its rules inform the rest |
| `image-to-code` | Leonxlnx/taste-skill | same | MIT | Turns reference screenshots (e.g. from Google Stitch) into design rules and code |
| `redesign-existing-projects` | Leonxlnx/taste-skill | same | MIT | Upgrading existing screens |

Anthropic's `frontend-design` skill is installed as a plugin from the Anthropic directory, not vendored here.

**Effects of leaving the scripts out:**
- Impeccable runs in its documented "launcher unavailable" mode, reading `PRODUCT.md` / `DESIGN.md` at the repo root directly.
- taste-skill's `draw`, `lint` and `inspect` steps are done by hand: directions are chosen from `library/`, and the house rules are checked via screenshots.

Put reference screenshots in `design/references/` for `image-to-code`.
