# Rooted design system

**World:** life as a transit line. Each decision is a station, alternatives are branches, and the optimal path is the express line. The look borrows from metro maps and Olympic wayfinding pictograms (Mexico 1968, Munich 1972). That signage was built for people who don't share a language, which is this product's audience.

## Color
Tokens live in `web/src/app/globals.css` and are exposed to Tailwind as `bg-*` / `text-*`.

| Token | Value | Use |
|---|---|---|
| `ground` | #F2F3F0 | Page ground (cool off-white, never cream) |
| `panel` / `panel-strong` | #E6E8E3 / #D9DCD5 | Surfaces separated by tone, not shadow; unvisited line segments |
| `ink` / `ink-2` / `ink-3` | #0F1B2D / #3B4656 / #5A6474 | Text; ink-2 for secondary text; ink-3 only for hints |
| `line` / `line-ink` / `line-soft` | per country | The country's line: header rail, the player's line, primary action, local-fact callouts |
| `express` / `express-soft` | #127A4B / #D6EBDF | The optimal path and "better choice" text |
| `whatif` | #6B7686 | Dashed what-if line |
| `danger` | #B42318 | Debt, scams, errors |

**Country lines** (`[data-region]` on `<body>`):

| Country | Line | Text on line |
|---|---|---|
| DE | #1F5FBF (U-Bahn blue) | white |
| IN | #F2B705 (metro yellow) | navy |
| MX | #D6006F (Metro rosa) | white |

A new country adds one block of these three variables.

## Type
- **Font:** Atkinson Hyperlegible Next (Braille Institute, designed for low vision), with Noto Sans Devanagari for Hindi. One family.
- **Weights:** 800 for station names, money and headings; 400/700 for text.
- **Tracking:** display tracking -0.02 to -0.03em.
- **Numbers:** tabular numerals throughout (`font-feature-settings: "tnum"`).
- **Headings:** sentence case, balanced. Display sizes are `clamp()`, at most about 4.5rem.

## Shapes and depth
- **Lines:** stations are circles with 4–5px ink borders on 6px lines. Interchanges (where you chose the express option) are capsules spanning both lines.
- **Corners:** 4px (`rounded-sign`) on buttons and panels.
- **Depth:** no shadows at rest and no gradients. Tone steps separate surfaces.
- **Icons:** pictograms from lucide-react at stroke 2.25, one per life event (`StageIcon`).

## Components
- `AppShell`: country-colored header rail with wordmark (two stations on a line), nav, language select, simple-language toggle.
- `StationSteps`: horizontal onboarding progress as stations.
- `LineRail`: the player's line during play. Vertical on desktop, a scrolling strip on phones.
- `MoneyPanel`: money figures in local currency with green or red change from the last decision; net worth on an ink tile.
- `ScamGame`: message card on ink, red Scam and green Legitimate buttons, keyboard S/L.
- `Results`: twin lines with interchanges, station detail with what-if and replay, `NetWorthChart` (hand-drawn SVG, dashed what-if).
- `LessonView`: lesson with local-example callout in `line-soft`, ink takeaway bar, facts with sources, compare grid where each column uses its own country's line.

## Motion
- **`station-here`:** a slow pulse on the current station.
- **`rise`:** a 12px entrance per screen.
- **`draw-line`:** the chart lines draw in.
- **Easing:** exponential ease-out throughout.
- **Reduced motion:** `prefers-reduced-motion` turns all three off.

## Accessibility
- Skip link and themed focus ring (3px ink).
- Every interactive item is a native control; radio-like choices use `role="radio"` with `aria-checked`.
- Read-aloud uses the browser's speech engine in the selected language.
- Simple-language mode lowers the reading level of lessons.
- Contrast: ink on ground is about 16:1; white on DE and MX lines is at least 4.5:1; navy on IN yellow is about 10:1.
