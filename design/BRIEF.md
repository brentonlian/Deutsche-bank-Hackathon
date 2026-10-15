# Surface brief: Rooted app (onboarding → Life Path → lessons)

Development-only. Never copy into source or anything served to the browser.

- **Scope / mode:** the whole app shell, onboarding, Life Path game, results, lessons. Mode is **Operate**, so the build is code-led.
- **Audience:** age groups young (18–30), middle (31–54) and senior (55+), using phones in daylight. A judges' demo runs on a projector in a bright room.
- **Job:** choose your context, live through about 10 decisions, then see where your line went, where the express (optimal) line went, and what one change would do.
- **Proof:**
  - Region-pack facts with sources.
  - The deterministic engine; no invented stats.
- **Memorable moment:** the end screen. Your life is a metro line in your country's color, with the green express line running beside it. Tapping a station where they split shows the what-if.

## Direction contract

**THESIS:** Life as a transit line. Every decision is a station, alternatives are branches, and the optimal path is the express line. This replaces the category's default stack of rounded white cards, gradient hero and progress ring.

**OWN-WORLD:**
- **Ground:** cool off-white #F2F3F0. Ink is deep navy #0F1B2D.
- **Line colors:**
  - Each country's line color fills the header rail and the player's line: DE U-Bahn blue #1F5FBF, IN metro yellow #F2B705 (with navy text), MX Metro rosa #D6006F.
  - Express green #127A4B.
  - What-if branches are dashed slate #6B7686.
- **Type:** Atkinson Hyperlegible Next only, in a heavy weight for station names and money. Signage-style sentence case.
- **Stations:** circles on thick 6px lines.
- **Corners:** buttons are square-ish (4px). No shadows at rest, no gradients. Pictograms come from one icon library inside station discs.

**STORY:** "This is my country's money system. My choices moved my line. Here's the faster line, and why."

**FIRST VIEWPORT:**
- **Onboarding:** a full-width country-colored rail with the wordmark. The onboarding steps run as stations along the rail, and the current question sits large below it with big tap targets.
- **Play:** a vertical line of stations on the left (horizontal strip on mobile), the current life event on the right with a pictogram, situation and 2–4 option buttons naming real local products. A slim money panel shows savings, investments, debt and wellbeing in local currency.

**FORM:** Transit line map, position 1 of 7 (assigned by roll, also the top pick). Raises from the banknote challenger: each country commits its own color at shell scale, and money figures are set huge in tabular numerals. Seed: none (unavailable). The launcher scripts aren't vendored, and the roll was done by hand.

**FINISH:** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.
